# Skill: Ajouter une extension TipTap à l'éditeur

## Quand utiliser
Quand l'utilisateur veut ajouter un nouveau bloc, une commande slash, ou une extension de l'éditeur WYSIWYG NotoFlow.

## Architecture de l'éditeur

```
packages/editor/src/
├── NotionEditor.tsx          # Composant principal (25Ko) — config TipTap, slash menu, toolbar
├── extensions/
│   ├── index.ts              # Registre de toutes les extensions
│   └── DatabaseBlockNode.tsx # Exemple : nœud custom pour bases de données imbriquées
├── styles.css                # Styles de l'éditeur (9Ko)
└── index.tsx                 # Export public
```

## Étapes pour ajouter une extension

### 1. Créer l'extension

Fichier : `packages/editor/src/extensions/MonExtension.tsx`

```tsx
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

// Composant React pour le rendu
function MonExtensionView(props: any) {
  return (
    <NodeViewWrapper className="mon-extension">
      {/* Contenu du bloc */}
    </NodeViewWrapper>
  );
}

// Extension TipTap
export const MonExtension = Node.create({
  name: "monExtension",
  group: "block",
  atom: true, // true = non-éditable inline

  addAttributes() {
    return {
      // Attributs custom
      data: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mon-extension"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mon-extension" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MonExtensionView);
  },
});
```

### 2. Enregistrer dans le registre

Modifier `packages/editor/src/extensions/index.ts` :

```ts
export { MonExtension } from "./MonExtension";
```

### 3. Activer dans NotionEditor

Modifier `packages/editor/src/NotionEditor.tsx` — ajouter l'extension dans la liste `extensions` du hook `useEditor()`.

### 4. Ajouter au Slash Menu (optionnel)

Dans `NotionEditor.tsx`, ajouter une entrée dans le tableau des commandes slash :

```ts
{
  title: "Mon Extension",
  description: "Description du bloc",
  icon: <MonIcon className="h-4 w-4" />,  // lucide-react
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setNode("monExtension").run();
  },
}
```

### 5. Styles (optionnel)

Ajouter les styles dans `packages/editor/src/styles.css` :

```css
.mon-extension {
  /* Styles du bloc */
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0.5rem 0;
}
```

## Extensions existantes activées

| Extension | Package |
|-----------|---------|
| StarterKit | `@tiptap/starter-kit` (paragraphs, headings, bold, italic, etc.) |
| Table | `@tiptap/extension-table` + cell + header + row |
| TaskList | `@tiptap/extension-task-list` + task-item |
| Link | `@tiptap/extension-link` |
| Image | `@tiptap/extension-image` |
| YouTube | `@tiptap/extension-youtube` |
| Placeholder | `@tiptap/extension-placeholder` |
| Underline | `@tiptap/extension-underline` |
| TextAlign | `@tiptap/extension-text-align` |
| Highlight | `@tiptap/extension-highlight` |
| Color | `@tiptap/extension-color` |
| TextStyle | `@tiptap/extension-text-style` |
| DatabaseBlockNode | Custom — rendu de bases de données dans l'éditeur |

## Icônes
Utiliser les icônes de `lucide-react` (déjà en dépendance du package editor).

## Side effects
Le fichier `styles.css` est déclaré comme side effect dans `package.json` :
```json
{ "sideEffects": ["./src/styles.css"] }
```
