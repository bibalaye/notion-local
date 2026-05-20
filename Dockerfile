# Dockerfile pour application Node.js / Frontend

# ─── Étape 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# ─── Étape 2: Serveur de production ─────────────────────────────────────────
FROM nginx:alpine AS runner

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Config nginx pour SPA (évite les 404 sur les routes)
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
