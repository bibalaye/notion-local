# Déploiement Vercel — NotoFlow

## Réglages obligatoires (Dashboard Vercel)

| Paramètre | Valeur |
|-----------|--------|
| **Root Directory** | `notoflow/apps/web` si le repo Git est `notion-local`, sinon `apps/web` |
| **Framework Preset** | Next.js |
| **Output Directory** | *(laisser vide — ne pas mettre `public`)* |
| **Install Command** | *(vide — utilise `apps/web/vercel.json`)* |
| **Build Command** | *(vide — utilise `apps/web/vercel.json`)* |
| **Include source files outside Root Directory** | Activé |

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
| `No Output Directory named "public"` | Output Directory = `public` ou mauvaise racine | Vider Output Directory + bon Root Directory |
| `NEXT_PUBLIC_SUPABASE_* manquants` | Pré-rendu sans env | Ajouter les variables sur Vercel |
