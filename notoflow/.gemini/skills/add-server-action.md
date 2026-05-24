# Skill: Créer une Server Action Next.js

## Quand utiliser
Quand l'utilisateur veut ajouter une opération serveur (CRUD, mutation, requête sécurisée) accessible depuis les composants React.

## Emplacement
`apps/web/src/app/app/actions/<feature>.ts`

## Template de base

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@notoflow/database";
import { createSupabaseServer } from "@/lib/supabase/server";

// ---------- Schéma de validation ----------
const createItemSchema = z.object({
  workspaceId: z.string().cuid(),
  title: z.string().min(1).max(255),
  // ... autres champs
});

// ---------- Helpers ----------
async function getAuthUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member) throw new Error("Accès refusé");
  return member;
}

// ---------- Actions ----------
export async function createItem(data: z.infer<typeof createItemSchema>) {
  const validated = createItemSchema.parse(data);
  const user = await getAuthUser();
  await checkWorkspaceAccess(user.id, validated.workspaceId);

  const item = await db.item.create({
    data: {
      ...validated,
      authorId: user.id,
    },
  });

  revalidatePath(`/app`);
  return item;
}

export async function getItems(workspaceId: string) {
  const user = await getAuthUser();
  await checkWorkspaceAccess(user.id, workspaceId);

  return db.item.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateItem(id: string, data: Partial<z.infer<typeof createItemSchema>>) {
  const user = await getAuthUser();
  // ... vérification d'accès
  
  const item = await db.item.update({
    where: { id },
    data,
  });

  revalidatePath(`/app`);
  return item;
}

export async function deleteItem(id: string) {
  const user = await getAuthUser();
  // ... vérification d'accès

  await db.item.delete({ where: { id } });
  revalidatePath(`/app`);
}
```

## Actions existantes

| Fichier | Responsabilité |
|---------|---------------|
| `pages.ts` | CRUD pages, archivage, favoris, duplication, partage public |
| `database.ts` | CRUD bases de données, lignes, schéma, vues |
| `workspace.ts` | Gestion workspace, membres, invitations, rôles |
| `billing.ts` | Changement de plan, simulation Stripe |
| `search.ts` | Recherche full-text PostgreSQL |

## Règles importantes

1. **Toujours `"use server"`** en première ligne du fichier
2. **Toujours valider** les inputs avec Zod avant toute opération
3. **Toujours vérifier l'authentification** via Supabase
4. **Toujours vérifier l'accès workspace** avant d'agir sur les données
5. **Appeler `revalidatePath()`** après chaque mutation pour rafraîchir le cache
6. **Ne pas exposer les erreurs internes** — utiliser des messages génériques
7. **Importer `db`** depuis `@notoflow/database` (pas directement depuis Prisma)

## Appel depuis un composant client

```tsx
"use client";

import { createItem } from "@/app/app/actions/items";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function CreateItemButton() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  return (
    <button onClick={() => mutation.mutate({ workspaceId: "...", title: "Nouveau" })}>
      Créer
    </button>
  );
}
```

## Appel depuis un Server Component

```tsx
// Dans un page.tsx (Server Component)
import { getItems } from "@/app/app/actions/items";

export default async function ItemsPage({ params }: { params: { workspaceId: string } }) {
  const items = await getItems(params.workspaceId);
  return <ItemList items={items} />;
}
```
