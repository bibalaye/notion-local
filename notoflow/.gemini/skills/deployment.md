# Skill: Déploiement

## Quand utiliser
Quand l'utilisateur veut déployer NotoFlow, configurer Vercel, ou utiliser Docker.

---

## Vercel (Recommandé pour la production)

### Configuration

Deux fichiers `vercel.json` :

**Racine** (`notoflow/vercel.json`) :
```json
{
  "buildCommand": "pnpm --filter @notoflow/web... build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

**App** (`apps/web/vercel.json`) :
```json
{
  "installCommand": "cd ../.. && pnpm install",
  "buildCommand": "cd ../.. && pnpm --filter @notoflow/web... build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Variables d'environnement Vercel
Configurer dans le dashboard Vercel :
- `DATABASE_URL` — PostgreSQL (Supabase, Neon, etc.)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` — URL de production
- `MISTRAL_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Spécificités monorepo
- Le build utilise `--filter @notoflow/web...` (les `...` incluent toutes les dépendances)
- Le plugin `@prisma/nextjs-monorepo-workaround-plugin` est nécessaire dans le webpack config
- Sur Vercel, le mode `standalone` est désactivé (détection `process.env.VERCEL`)

---

## Docker (Self-hosted)

### Fichiers
```
docker/
├── Dockerfile              # Multi-stage build (pnpm)
├── docker-compose.yml      # Postgres 16 + Redis 7 + web
└── init.sql                # Script d'initialisation BDD
```

### Lancer avec Docker Compose
```bash
cd docker
docker compose up -d
```

### Services
| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `db` | `postgres:16-alpine` | 5432 | Base de données principale |
| `redis` | `redis:7-alpine` | 6379 | Cache / sessions |
| `web` | Build custom | 3000 | Application Next.js |

### Variables Docker
Le `DATABASE_URL` dans Docker Compose pointe vers le service interne :
```
postgresql://notoflow:notoflow@db:5432/notoflow?schema=public
```

### Next.js Standalone
En mode Docker, l'app utilise `output: "standalone"` avec `outputFileTracingRoot` pointant vers la racine du monorepo pour inclure les packages workspace.

---

## Build de production

```bash
# Build complet
pnpm build

# Build uniquement l'app web et ses dépendances
pnpm --filter @notoflow/web... build
```

### Prérequis avant le build
1. `pnpm db:generate` — Le client Prisma doit être généré
2. Toutes les variables d'environnement doivent être définies
3. Le cache `.next` ne doit pas être corrompu (supprimer si nécessaire)

---

## Checklist de déploiement
- [ ] Variables d'environnement configurées
- [ ] Client Prisma généré (`pnpm db:generate`)
- [ ] Schéma BDD à jour (`pnpm db:push`)
- [ ] Build réussi (`pnpm build`)
- [ ] Seed de données (si premier déploiement)
