# Skill: Authentification Supabase

## Quand utiliser
Quand l'utilisateur veut ajouter/modifier l'authentification, protéger des routes, ou gérer les sessions.

## Architecture Auth

```
apps/web/src/
├── lib/supabase/
│   ├── client.ts          # Client Supabase (browser — "use client")
│   ├── server.ts          # Client Supabase (server — Server Components, Actions)
│   ├── middleware.ts       # Rafraîchissement automatique des sessions
│   └── auth-helper.ts     # Helpers : getUser, requireAuth, etc.
├── middleware.ts           # Next.js middleware → updateSession()
└── app/
    ├── (auth)/
    │   ├── actions.ts      # Server Actions login/signup
    │   ├── login/page.tsx
    │   └── signup/page.tsx
    └── auth/
        └── callback/route.ts  # OAuth callback
```

## Clients Supabase

### Client côté serveur (Server Components, Server Actions, API Routes)
```ts
import { createSupabaseServer } from "@/lib/supabase/server";

const supabase = await createSupabaseServer();
const { data: { user } } = await supabase.auth.getUser();
```

### Client côté client (composants "use client")
```ts
import { createSupabaseBrowser } from "@/lib/supabase/client";

const supabase = createSupabaseBrowser();
const { data: { user } } = await supabase.auth.getUser();
```

## Protéger une route

### Dans un Server Component
```tsx
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");
  
  // ... rendu de la page
}
```

### Dans une Server Action
```ts
"use server";

import { createSupabaseServer } from "@/lib/supabase/server";

export async function protectedAction() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  
  // ... logique
}
```

## Middleware

Le middleware (`apps/web/src/middleware.ts`) appelle `updateSession()` sur toutes les routes (sauf statiques) pour maintenir les cookies de session Supabase à jour.

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## Auth Actions existantes

Le fichier `apps/web/src/app/(auth)/actions.ts` contient :
- **Login** avec email/password
- **Signup** avec email/password
- **OAuth** (Google, GitHub si configuré)
- **Logout**

## Synchronisation User Prisma

Après l'authentification Supabase, l'utilisateur est synchronisé avec le modèle `User` Prisma :
- L'ID Supabase est utilisé comme `userId` dans le schéma Prisma
- Les données de profil sont dupliquées/synchronisées

## Variables d'environnement

| Variable | Côté | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Serveur | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Serveur | Clé publique anonyme |

## Bonnes pratiques
1. **Toujours utiliser `getUser()`** côté serveur (pas `getSession()` qui peut être falsifié)
2. **Ne pas faire confiance aux cookies** sans vérification serveur
3. **Toujours vérifier l'accès workspace** en plus de l'auth (via `WorkspaceMember`)
4. **Utiliser `redirect()`** dans les Server Components pour les redirections auth
