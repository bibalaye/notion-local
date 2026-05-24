# Skill: Ajouter un composant UI réutilisable

## Quand utiliser
Quand l'utilisateur veut créer un nouveau composant UI réutilisable (bouton, modal, dropdown, etc.) dans le package `@notoflow/ui`.

## Pattern (shadcn-like + CVA)

### 1. Créer le composant

Fichier : `packages/ui/src/components/<component-name>.tsx`

```tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const componentVariants = cva(
  // Classes de base
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      className={cn(componentVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Component.displayName = "Component";

export { Component, componentVariants };
```

### 2. Exporter le composant

Ajouter l'export dans `packages/ui/package.json` → `exports` :

```json
{
  "exports": {
    "./components/<component-name>": "./src/components/<component-name>.tsx"
  }
}
```

Et dans `packages/ui/src/index.ts` :

```ts
export { Component } from "./components/<component-name>";
```

### 3. Utiliser dans l'app web

```tsx
import { Component } from "@notoflow/ui/components/<component-name>";
// ou
import { Component } from "@notoflow/ui";
```

## Règles importantes

- **Toujours utiliser `cn()`** pour merger les classes (jamais de concaténation de strings)
- **Toujours utiliser `React.forwardRef`** pour les composants qui wrappent des éléments DOM
- **Tokens Tailwind** : utiliser `bg-background`, `text-foreground`, `border-border`, etc. (pas de couleurs en dur)
- **Mode sombre** : les tokens CSS custom gèrent automatiquement le dark mode via la classe `.dark`
- **Primitives Radix** : préférer les composants Radix UI (`@radix-ui/react-*`) pour l'accessibilité
- **Tailwind content** : le path `../../packages/ui/src/**/*.{ts,tsx}` est déjà dans le config Tailwind de `apps/web`

## Composants existants

| Composant | Fichier | Dépendance Radix |
|-----------|---------|-----------------|
| `Button` | `button.tsx` | `@radix-ui/react-slot` |
| `Dialog` | `dialog.tsx` | `@radix-ui/react-dialog` |
| `ScrollArea` | `scroll-area.tsx` | `@radix-ui/react-scroll-area` |
| `Sidebar` | `sidebar.tsx` | — (custom) |
