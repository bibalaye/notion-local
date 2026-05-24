# Skill: Créer un nouveau package workspace

## Quand utiliser
Quand l'utilisateur veut ajouter un nouveau module réutilisable au monorepo (ex : `@notoflow/analytics`, `@notoflow/notifications`).

## Structure d'un package

```
packages/<nom>/
├── src/
│   └── index.ts          # Point d'entrée principal
├── package.json
├── tsconfig.json
├── turbo.json
└── eslint.config.mjs
```

## Étapes

### 1. Créer le package.json

```json
{
  "name": "@notoflow/<nom>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "node -e \"process.exit(0)\"",
    "lint": "eslint .",
    "test": "node -e \"process.exit(0)\"",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "@notoflow/config": "workspace:*",
    "eslint": "^9.28.0",
    "typescript": "^5.8.3"
  }
}
```

### 2. Créer le tsconfig.json

```json
{
  "extends": "@notoflow/config/typescript/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### 3. Créer le turbo.json

```json
{
  "extends": ["//"],
  "tasks": {}
}
```

### 4. Créer eslint.config.mjs

```mjs
export { default } from "@notoflow/config/eslint-next.mjs";
```

### 5. Créer src/index.ts

```ts
// Exports publics du package
export {};
```

### 6. Intégrer dans l'app web

1. Ajouter la dépendance dans `apps/web/package.json` :
   ```json
   "@notoflow/<nom>": "workspace:*"
   ```

2. Ajouter dans `transpilePackages` de `apps/web/next.config.ts` :
   ```ts
   transpilePackages: [
     // ... existants
     "@notoflow/<nom>",
   ],
   ```

3. Exécuter `pnpm install` pour mettre à jour les liens

### 7. Si le package a des composants React

Ajouter les peer dependencies :
```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

Et ajouter le chemin dans le `content` de `apps/web/tailwind.config.ts` :
```ts
content: [
  // ... existants
  "../../packages/<nom>/src/**/*.{ts,tsx}",
],
```

## Packages existants

| Package | Exports | Rôle |
|---------|---------|------|
| `@notoflow/ai` | `streamCompletion`, `generateText` | Client Mistral streaming |
| `@notoflow/config` | ESLint, TypeScript configs | Configuration partagée |
| `@notoflow/database` | `db`, `Plan`, types Prisma | Client Prisma + schéma |
| `@notoflow/database-engine` | `DatabaseEngine`, types | Filtrage/tri/groupement |
| `@notoflow/editor` | `NotionEditor` | Éditeur TipTap |
| `@notoflow/realtime` | Hooks Supabase Realtime | Présence + curseurs |
| `@notoflow/types` | `AuthUser`, `WorkspaceMember`, IDs | Types partagés |
| `@notoflow/ui` | `Button`, `Dialog`, `ScrollArea`, `cn` | Composants UI |

## Convention de nommage
- Nom NPM : `@notoflow/<kebab-case>`
- Dossier : `packages/<kebab-case>/`
- Build : noop pour les packages source-only (transpilés par Next.js)
