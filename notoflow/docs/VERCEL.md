# Déploiement Vercel — NotoFlow

## Réglages obligatoires (Dashboard Vercel)

| Paramètre | Valeur |
|-----------|--------|
| **Root Directory** | `notoflow` (si repo = `notion-local`) ou `.` (si repo = `notoflow`) |
| **Framework Preset** | Next.js *(ou laisser vide : `notoflow/vercel.json` force Next.js)* |
| **Output Directory** | **VIDE** — si tu vois `public`, supprime-le et désactive l’override |
| **Install Command** | vide *(utilise `notoflow/vercel.json`)* |
| **Build Command** | vide *(utilise `notoflow/vercel.json`)* |
| **Include source files outside Root Directory** | Activé si Root Directory = `apps/web` |

> Le fichier `notoflow/vercel.json` à la racine du monorepo est lu par Vercel.  
> `apps/web/vercel.json` n’est lu **que** si Root Directory = `apps/web`.

## Variables d'environnement (Production)

- `DATABASE_URL` — URL **externe** Render Postgres (`?sslmode=require`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` — `https://votre-app.vercel.app`
- `MISTRAL_API_KEY` (optionnel)

## Base de données (une fois, en local)

```bash
cd notoflow
# .env.local avec DATABASE_URL Render
pnpm db:push
pnpm db:seed   # optionnel
```

Ne pas lancer `db:push` / `db:seed` dans la commande de build Vercel.

## Erreurs fréquentes

| Message | Cause | Solution |
|---------|--------|----------|
| `No Next.js version detected` | Root Directory = racine monorepo | Mettre `notoflow/apps/web` |
| `No Output Directory named "public"` | Output Directory = `public` dans le dashboard | **Settings → Build → Output Directory : effacer `public`** puis redeploy |
| `NEXT_PUBLIC_SUPABASE_* manquants` | Pré-rendu sans env | Ajouter les variables sur Vercel |
