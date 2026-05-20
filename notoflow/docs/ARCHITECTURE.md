# NotoFlow — architecture

Monorepo **pnpm** + **Turborepo** : domaine (packages) séparé de l’infra (Prisma, Supabase, Stripe) et de l’UI (`apps/web`).

## Couches

| Zone | Rôle |
|------|------|
| `apps/web` | Next.js 15 **App Router** sous `src/`, Tailwind 3 + tokens shadcn-like, middleware Supabase, routes API (`/api/ai`, `/api/webhooks/stripe`, santé DB). |
| `packages/ui` | `cn`, `Button`, `Dialog`, `ScrollArea`, sidebar minimal (`SidebarProvider`). |
| `packages/editor` | TipTap (`NotionEditor`, extensions : StarterKit, tables, tâches, liens, etc.). |
| `packages/database-engine` | Types colonnes / vues + `DatabaseEngine` (filtre, tri, groupe, formule — à sandboxer côté serveur). |
| `packages/database` | **Prisma** schéma complet (auth-like, workspaces, pages, DB Notion-like, présence, notifications, audit). Export `db` + `Plan`. |
| `packages/realtime` | Abstraction channels + **PresenceChannel** Supabase. |
| `packages/ai` | `runAI` / `streamAI` + prompts typés. |
| `packages/types` | IDs typés + auth partagés. |
| `packages/config` | ESLint Next + bases TypeScript. |

## Auth & données

- **Supabase Auth** : `src/lib/supabase/{server,client,middleware}.ts`, callback `src/app/auth/callback/route.ts`, actions serveur `(auth)/actions.ts`.
- **Prisma** : `DATABASE_URL` PostgreSQL ; `pnpm db:generate`, `pnpm db:push`, `pnpm db:seed`.

## Déploiement

- **Docker** : `docker/docker-compose.yml` (Postgres + Redis + image `web` multi-stage **pnpm**).
- **Vercel** : `vercel.json` à la racine `notoflow/` (build filtré sur `@notoflow/web`).

## Suite recommandée

RLS Supabase aligné sur le schéma Prisma, routes CRUD pages/bases, slash menu TipTap complet (Yjs + collab), tests Vitest/Playwright, rate limiting API.
