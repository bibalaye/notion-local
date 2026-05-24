# Skill: Modifier le schéma Prisma

## Quand utiliser
Quand l'utilisateur veut ajouter/modifier un modèle de données, une relation, un enum, ou un index dans la base de données.

## Fichiers concernés
- **Schéma** : `packages/database/prisma/schema.prisma`
- **Client généré** : `packages/database/src/generated/client/`
- **Exports** : `packages/database/src/index.ts`
- **Seed** : `packages/database/prisma/seed.ts`

## Workflow

### 1. Modifier le schéma
```prisma
// packages/database/prisma/schema.prisma

model NouveauModele {
  id        String   @id @default(cuid())
  // ... champs
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workspaceId String

  // Index pour les requêtes fréquentes
  @@index([workspaceId])
}
```

### 2. Régénérer le client Prisma
```bash
pnpm db:generate
```

### 3. Pousser vers la BDD (dev)
```bash
pnpm db:push
```

### 4. Mettre à jour les exports (si besoin)
Dans `packages/database/src/index.ts`, exporter les nouveaux types :
```ts
export { NouveauModele } from "./generated/client";
```

### 5. Mettre à jour le seed (optionnel)
Modifier `packages/database/prisma/seed.ts` pour ajouter des données de test.

## Conventions du schéma

### IDs
- Utiliser `@id @default(cuid())` pour tous les IDs
- Type `String` pour les IDs

### Timestamps
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### Relations
- Toujours spécifier `onDelete: Cascade` pour les relations enfant → parent
- Créer un index sur chaque clé étrangère (`@@index([foreignKeyField])`)

### Enums existants
- `Plan` : FREE, PRO, TEAM, ENTERPRISE
- `Role` : OWNER, ADMIN, EDITOR, VIEWER, GUEST
- `PageRole` : EDITOR, COMMENTER, VIEWER

### Index composites
```prisma
@@index([workspaceId, createdAt])  // Pour les requêtes triées par date dans un workspace
@@unique([userId, workspaceId])     // Pour les contraintes d'unicité
```

## ⚠️ Erreurs courantes (Windows)

### `EPERM: operation not permitted`
Le fichier `query_engine-windows.dll.node` est verrouillé.
**Solution** : fermer tous les terminaux et serveurs de dev, puis relancer.

### Client Prisma introuvable après install
Le client est généré dans `packages/database/src/generated/client`.
**Solution** : `pnpm db:generate` doit toujours être exécuté après `pnpm install`.

### Binary targets
Le schéma inclut `binaryTargets = ["native", "rhel-openssl-3.0.x"]` pour supporter à la fois le dev local et le déploiement Docker/Vercel.

## Modèles existants
| Modèle | Rôle |
|--------|------|
| `User` | Profil utilisateur (sync Supabase) |
| `Account` | Comptes OAuth liés |
| `Session` | Sessions utilisateur |
| `Workspace` | Espaces de travail (porte le plan de facturation) |
| `WorkspaceMember` | Liaison User ↔ Workspace avec rôle |
| `Invite` | Invitations par email + token |
| `Page` | Documents (hiérarchie parent/enfant, contenu JSON) |
| `PageEditor` | Droits par page |
| `PageVersion` | Historique des versions |
| `Favorite` | Pages épinglées |
| `Comment` | Commentaires sur pages (avec réponses imbriquées) |
| `Reaction` | Réactions emoji sur commentaires |
| `Mention` | Mentions d'utilisateurs dans les pages |
| `Database` | Bases de données (schéma JSON, vues JSON) |
| `DatabaseRow` | Lignes de base de données (valeurs JSON) |
| `RealtimePresence` | Présence et curseurs temps réel |
| `Notification` | Notifications utilisateur |
| `AuditLog` | Journal d'audit |
