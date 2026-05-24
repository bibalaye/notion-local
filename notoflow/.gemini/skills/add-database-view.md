# Skill: Ajouter une vue de base de données

## Quand utiliser
Quand l'utilisateur veut ajouter un nouveau type de vue pour les bases de données NotoFlow (ex : Gallery, List, Timeline).

## Architecture des vues

```
apps/web/src/components/database/
├── DatabaseView.tsx       # Composant orchestrateur — switch entre les vues
├── TableView.tsx          # Vue tableau (édition inline)
├── KanbanView.tsx         # Vue kanban (groupé par statut)
└── CalendarView.tsx       # Vue calendrier (groupé par date)
```

## Types dans le database-engine

Les types de vues sont définis dans `packages/database-engine/src/types.ts` :

```ts
export type ViewType = "table" | "kanban" | "calendar" | "gallery" | "list" | "timeline";
```

## Étapes

### 1. Créer le composant de vue

Fichier : `apps/web/src/components/database/NouvelleView.tsx`

```tsx
"use client";

import type { DatabaseColumn, DatabaseRow, DatabaseView } from "@notoflow/database-engine";

interface NouvelleViewProps {
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  view: DatabaseView;
  onUpdateRow: (rowId: string, values: Record<string, unknown>) => void;
  onDeleteRow: (rowId: string) => void;
}

export function NouvelleView({ columns, rows, view, onUpdateRow, onDeleteRow }: NouvelleViewProps) {
  return (
    <div className="p-4">
      {/* Rendu de la vue */}
    </div>
  );
}
```

### 2. Enregistrer dans DatabaseView.tsx

Modifier `apps/web/src/components/database/DatabaseView.tsx` pour ajouter le cas dans le switch :

```tsx
case "nouvelle":
  return <NouvelleView columns={columns} rows={rows} view={view} ... />;
```

### 3. Ajouter le type de vue (si nouveau)

Si le type n'existe pas dans `ViewType`, modifier `packages/database-engine/src/types.ts` :

```ts
export type ViewType = "table" | "kanban" | "calendar" | "gallery" | "list" | "timeline" | "nouvelle";
```

### 4. Utiliser le DatabaseEngine

Le moteur `packages/database-engine/src/engine.ts` fournit les opérations :

```ts
import { DatabaseEngine } from "@notoflow/database-engine";

// Filtrer les lignes
const filtered = DatabaseEngine.filter(rows, view.filters, columns);

// Trier les lignes  
const sorted = DatabaseEngine.sort(filtered, view.sorts);

// Grouper les lignes (kanban, calendrier)
const grouped = DatabaseEngine.group(sorted, "statusColumnId");
```

## Props communes des vues

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `DatabaseColumn[]` | Colonnes du schéma |
| `rows` | `DatabaseRow[]` | Lignes (déjà filtrées/triées) |
| `view` | `DatabaseView` | Configuration de la vue active |
| `onUpdateRow` | `(id, values) => void` | Callback pour édition inline |
| `onDeleteRow` | `(id) => void` | Callback pour suppression |

## Types de colonnes supportés

`text`, `number`, `select`, `multi-select`, `date`, `checkbox`, `url`, `email`, `phone`, `people`, `files`, `relation`, `formula`, `status`, `tags`

## Bonnes pratiques
- Utiliser `@dnd-kit/core` et `@dnd-kit/sortable` pour le drag & drop
- Animations avec Framer Motion
- Édition inline des cellules (pas de modal)
- Tokens Tailwind du design system pour la cohérence visuelle
