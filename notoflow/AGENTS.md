# NotoFlow — Agent Instructions

> Clone Notion premium, production-ready. Monorepo pnpm + Turborepo, Next.js 15 App Router, Tailwind 3, Prisma, Supabase, Mistral AI.

---

## Architecture du Monorepo

```
notoflow/
├── apps/
│   └── web/                  # Next.js 15 App Router (Tailwind 3, Server Actions)
├── packages/
│   ├── ai/                   # Client Mistral streaming (SSE)
│   ├── config/               # ESLint + TypeScript partagés
│   ├── database/             # Prisma schema + client (PostgreSQL)
│   ├── database-engine/      # Filtrage, tri, groupement, formules côté client
│   ├── editor/               # Éditeur TipTap custom (WYSIWYG)
│   ├── realtime/             # Supabase Realtime (présence, curseurs)
│   ├── types/                # IDs typés + types partagés
│   └── ui/                   # Composants Radix UI + CVA (Button, Dialog, Sidebar, ScrollArea)
├── docker/                   # Docker Compose (Postgres 16 + Redis 7 + web)
└── docs/                     # ARCHITECTURE.md, VERCEL.md
```

### Dépendances entre packages

L'app `@notoflow/web` importe **tous** les packages workspace :
- `@notoflow/ai`, `@notoflow/database`, `@notoflow/database-engine`, `@notoflow/editor`, `@notoflow/realtime`, `@notoflow/types`, `@notoflow/ui`

Tous les packages workspace sont transpilés via `next.config.ts` → `transpilePackages`.

---

## Stack Technique

| Catégorie | Technologies |
|-----------|-------------|
| **Framework** | Next.js 15 (App Router, Turbopack dev) |
| **Langage** | TypeScript 5.8+ (strict) |
| **Style** | Tailwind CSS 3.4 + `tailwindcss-animate` + `@tailwindcss/typography` |
| **Composants UI** | Radix UI primitives + `class-variance-authority` + `clsx` + `tailwind-merge` |
| **Éditeur** | TipTap 2 (StarterKit, tables, tâches, liens, images, YouTube, couleurs) |
| **State** | Zustand 5 (stores) + TanStack React Query 5 (server state) |
| **Formulaires** | React Hook Form + Zod |
| **Animations** | Framer Motion 11 |
| **BDD** | PostgreSQL via Prisma 6 (client généré dans `packages/database/src/generated/client`) |
| **Auth** | Supabase Auth (SSR via `@supabase/ssr`) |
| **IA** | Mistral API (streaming SSE via `@notoflow/ai`) |
| **Paiements** | Stripe (Checkout-ready) |
| **Recherche** | `cmdk` (palette CMD+K) + full-text PostgreSQL |
| **DnD** | `@dnd-kit/core` + `@dnd-kit/sortable` |
| **URL state** | `nuqs` |
| **Monorepo** | pnpm 9 workspaces + Turborepo |
| **Formatage** | Prettier (semi, double quotes, trailing comma all, 100 cols) |
| **Node** | >= 20 |

---

## Conventions de Code

### Général
- **Langue du code** : noms de variables/fonctions en anglais, commentaires et messages UI en **français**.
- **TypeScript strict** : pas de `any` sauf nécessité absolue (ESLint `@typescript-eslint/no-explicit-any: off`).
- **Imports** : paths relatifs dans les packages, `@/` alias dans `apps/web` (pointe vers `src/`).
- **Exports** : chaque package exporte via `src/index.ts` (ou `src/index.tsx`).
- **Formatage** : `pnpm format` — Prettier avec semi, double quotes, trailing commas, 100 cols.

### Next.js 15 (App Router)
- Routes sous `apps/web/src/app/`.
- Route groups : `(auth)` pour login/signup, `app/` pour l'espace connecté.
- Server Actions dans `apps/web/src/app/app/actions/` (pages, database, workspace, billing, search).
- API Routes dans `apps/web/src/app/api/` (ai, health, webhooks).
- Middleware Supabase dans `apps/web/src/middleware.ts`.
- Layout racine utilise les polices Geist (sans + mono) via `next/font/google`.

### Tailwind CSS
- Design system via CSS custom properties HSL (`globals.css`) — inspiré shadcn/ui.
- Tokens : `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`.
- Mode sombre via classe `.dark` (switchable avec `next-themes`).
- Classe utilitaire `.glass` pour glassmorphism (backdrop-blur).

### Composants UI (`packages/ui`)
- Pattern shadcn-like : Radix primitives wrappés avec CVA (class-variance-authority).
- Utilitaire `cn()` = `clsx` + `tailwind-merge` dans `packages/ui/src/lib/utils.ts`.
- Exports nommés dans `package.json` → `exports`.

### Éditeur (`packages/editor`)
- Composant principal : `NotionEditor` dans `packages/editor/src/NotionEditor.tsx`.
- Extensions custom dans `packages/editor/src/extensions/`.
- Styles dédiés dans `packages/editor/src/styles.css` (side effect).

### Base de données
- **Prisma schema** : `packages/database/prisma/schema.prisma`.
- **Client généré** dans `packages/database/src/generated/client`.
- Modèles principaux : `User`, `Workspace`, `WorkspaceMember`, `Page`, `Database`, `DatabaseRow`, `Comment`, `Notification`, `AuditLog`.
- Enums : `Plan` (FREE/PRO/TEAM/ENTERPRISE), `Role` (OWNER/ADMIN/EDITOR/VIEWER/GUEST), `PageRole`.
- Features preview : `fullTextSearchPostgres`.
- **⚠️ Commandes DB** (exécuter depuis la racine du monorepo) :
  - `pnpm db:generate` — Génère le client Prisma
  - `pnpm db:push` — Pousse le schéma vers la BDD
  - `pnpm db:seed` — Charge les données de test

### Database Engine (`packages/database-engine`)
- Classe `DatabaseEngine` avec méthodes statiques : `filter()`, `sort()`, `group()`, `computeFormula()`.
- Types exportés : `DatabaseColumn`, `DatabaseRow`, `Filter`, `Sort`, `DatabaseView`, `ColumnType`, `ViewType`.
- ⚠️ `computeFormula` utilise `new Function()` — à sandboxer en production.

### IA (`packages/ai`)
- `streamCompletion()` : streaming SSE via Mistral API.
- `generateText()` : completion non-streaming.
- Variables d'env : `MISTRAL_API_KEY`, `MISTRAL_API_BASE`, `MISTRAL_MODEL`.

### Realtime (`packages/realtime`)
- Channels Supabase pour présence et curseurs collaboratifs.
- Module `presence.ts` pour la gestion de la présence utilisateur.

---

## Commandes de Développement

| Commande | Description |
|----------|-------------|
| `pnpm install` | Installer les dépendances |
| `pnpm dev` | Lancer le dev server (Turbopack) |
| `pnpm build` | Build production complet |
| `pnpm lint` | Linter ESLint |
| `pnpm typecheck` | Vérification des types TypeScript |
| `pnpm format` | Formater avec Prettier |
| `pnpm db:generate` | Générer le client Prisma |
| `pnpm db:push` | Pousser le schéma vers PostgreSQL |
| `pnpm db:seed` | Seed des données de test |

---

## Variables d'Environnement Requises

Fichier `.env.local` à la racine :
- `DATABASE_URL` — URL PostgreSQL
- `NEXT_PUBLIC_SUPABASE_URL` — URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clé publique Supabase
- `NEXT_PUBLIC_APP_URL` — URL de l'app (default: `http://localhost:3000`)
- `MISTRAL_API_KEY` — Clé API Mistral
- `STRIPE_SECRET_KEY` — Clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` — Secret webhook Stripe

---

## Déploiement

- **Vercel** : config dans `vercel.json` (build filtré sur `@notoflow/web`).
- **Docker** : `docker/docker-compose.yml` — Postgres 16, Redis 7, image web multi-stage.
- **Prisma monorepo** : `@prisma/nextjs-monorepo-workaround-plugin` dans le webpack config.

---

## Troubleshooting

### `EPERM: operation not permitted` (Windows, Prisma)
Arrêter tous les serveurs de dev et terminaux avant de relancer `pnpm build` ou `prisma generate`.

### `SyntaxError: Unexpected end of JSON input` (Build)
Supprimer le cache Next.js : `Remove-Item -Path apps/web/.next -Recurse -Force` puis relancer le build.

### Prisma Client introuvable
Toujours exécuter `pnpm db:generate` après un `pnpm install` frais ou un changement de schéma.
