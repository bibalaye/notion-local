# Skill: Ajouter une nouvelle fonctionnalité de page

## Quand utiliser
Quand l'utilisateur veut ajouter une nouvelle page, route, ou fonctionnalité CRUD dans NotoFlow.

## Étapes

### 1. Schéma Prisma (si nouveau modèle)
- Modifier `packages/database/prisma/schema.prisma`
- Ajouter le modèle avec les index appropriés (`@@index`)
- Exporter les types depuis `packages/database/src/index.ts`
- Exécuter : `pnpm db:generate` puis `pnpm db:push`

### 2. Server Actions
- Créer/modifier un fichier dans `apps/web/src/app/app/actions/`
- Marquer le fichier avec `"use server"` en première ligne
- Importer le client Prisma : `import { db } from "@notoflow/database"`
- Valider les inputs avec Zod
- Toujours vérifier l'authentification via Supabase
- Appeler `revalidatePath()` ou `revalidateTag()` après mutation

### 3. React Query (optionnel, pour le cache client)
- Ajouter les hooks dans `apps/web/src/lib/react-query/`
- Utiliser `useQuery` pour les lectures, `useMutation` pour les écritures
- Invalider le cache après mutation avec `queryClient.invalidateQueries()`

### 4. Composant UI
- Créer le composant dans `apps/web/src/components/<feature>/`
- Utiliser les composants de `@notoflow/ui` (Button, Dialog, ScrollArea)
- Appliquer les tokens Tailwind du design system (`bg-background`, `text-foreground`, etc.)
- Utiliser `cn()` de `@notoflow/ui/lib/utils` pour les classes conditionnelles
- Ajouter des animations Framer Motion pour le polish

### 5. Route Next.js
- Créer la route dans `apps/web/src/app/app/<feature>/`
- Utiliser un `page.tsx` (Server Component par défaut)
- Ajouter `"use client"` uniquement si nécessaire (interactivité)
- Layout partagé via `layout.tsx` si besoin

### 6. Navigation
- Mettre à jour `apps/web/src/components/layout/AppSidebar.tsx` si la feature doit apparaître dans la sidebar
- Ajouter à la palette de commandes `CommandPalette.tsx` si pertinent

## Exemple de structure pour une feature "Tasks"
```
apps/web/src/
├── app/app/
│   ├── actions/tasks.ts          # Server Actions CRUD
│   └── tasks/
│       └── page.tsx              # Page route
├── components/
│   └── tasks/
│       ├── TaskList.tsx           # Liste des tâches
│       └── TaskForm.tsx           # Formulaire d'ajout
└── lib/react-query/
    └── useTasks.ts               # Hooks React Query
```

## Checklist
- [ ] Schéma Prisma mis à jour et client régénéré
- [ ] Server Actions créées avec validation Zod
- [ ] Composants UI avec design system tokens
- [ ] Route Next.js créée
- [ ] Navigation mise à jour (sidebar / CMD+K)
- [ ] `pnpm typecheck` passe sans erreur
