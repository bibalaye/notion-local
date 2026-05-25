# 📝 @notoflow/editor

> Éditeur WYSIWYG premium basé sur TipTap 2, avec support avancé des tableaux, blocs personnalisés et collaboration temps réel.

---

## 🎯 Fonctionnalités

### Éditeur de Base
- ✅ **Rich Text** : Gras, italique, souligné, barré, code inline
- ✅ **Titres** : H1 à H6 avec styles personnalisés
- ✅ **Listes** : Puces, numérotées, tâches (checkboxes)
- ✅ **Liens** : Insertion et édition avec aperçu
- ✅ **Images** : Upload et redimensionnement
- ✅ **Vidéos** : Intégration YouTube
- ✅ **Code** : Blocs de code avec coloration syntaxique
- ✅ **Citations** : Blocs de citation stylisés
- ✅ **Alignement** : Gauche, centre, droite, justifié
- ✅ **Couleurs** : Texte et surlignage multicolore

### Tableaux Avancés 🆕
- ✅ **Insertion** : Création rapide avec en-têtes optionnels
- ✅ **Colonnes** : Ajout, suppression, redimensionnement
- ✅ **Lignes** : Ajout, suppression, redimensionnement
- ✅ **Fusion/Division** : Cellules fusionnables et divisibles
- ✅ **Colorisation** : 17 couleurs avec support mode sombre
- ✅ **Redimensionnement** : Largeur/hauteur ajustables
- ✅ **En-têtes** : Ligne et colonne d'en-tête
- ✅ **Réparation** : Correction automatique de structure

### Blocs Personnalisés
- ✅ **Callout** : Blocs d'information avec icônes et couleurs
- ✅ **Database** : Intégration de bases de données Notion-like

### Collaboration (via @notoflow/realtime)
- ✅ **Présence** : Voir qui édite en temps réel
- ✅ **Curseurs** : Curseurs collaboratifs colorés
- ✅ **Synchronisation** : Mise à jour en temps réel

---

## 📦 Installation

```bash
# Dans le monorepo
pnpm install

# Générer le client Prisma (requis)
pnpm db:generate
```

---

## 🚀 Utilisation

### Import de Base

```typescript
import { NotionEditor } from "@notoflow/editor";
import "@notoflow/editor/styles.css";

function MyEditor() {
  const [content, setContent] = useState("");

  return (
    <NotionEditor
      content={content}
      onChange={setContent}
      placeholder="Commencez à écrire..."
    />
  );
}
```

### Avec Options Avancées

```typescript
import { NotionEditor } from "@notoflow/editor";
import { getExtensions } from "@notoflow/editor/extensions";

function AdvancedEditor() {
  const extensions = getExtensions({
    renderDatabase: (id) => <DatabaseView id={id} />,
  });

  return (
    <NotionEditor
      content={initialContent}
      onChange={handleChange}
      extensions={extensions}
      editable={true}
      placeholder="Tapez '/' pour les commandes…"
    />
  );
}
```

### Utilisation Programmatique

```typescript
import { useEditor } from "@tiptap/react";
import { getExtensions } from "@notoflow/editor/extensions";

function ProgrammaticEditor() {
  const editor = useEditor({
    extensions: getExtensions(),
    content: "<p>Hello World!</p>",
  });

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const colorizeCell = () => {
    editor
      ?.chain()
      .focus()
      .setCellAttribute("backgroundColor", "#eff6ff")
      .run();
  };

  return (
    <div>
      <button onClick={insertTable}>Insérer un tableau</button>
      <button onClick={colorizeCell}>Coloriser la cellule</button>
      <EditorContent editor={editor} />
    </div>
  );
}
```

---

## 🎨 Tableaux — Guide Complet

### Créer un Tableau

```typescript
// Via l'API
editor.chain().focus().insertTable({ 
  rows: 3, 
  cols: 3, 
  withHeaderRow: true 
}).run();

// Via le menu slash
// Tapez "/" dans l'éditeur → Sélectionnez "Tableau"
```

### Redimensionner une Colonne

```typescript
// Programmatique (via les boutons du menu)
// 1. Ouvrir le menu de la colonne
// 2. Cliquer sur + ou − dans la section "Largeur"

// Ou via drag-to-resize (si activé)
// Table.configure({ resizable: true })
```

### Coloriser une Cellule

```typescript
// Via l'API
editor
  .chain()
  .focus()
  .setCellAttribute("backgroundColor", "#dcfce7") // Vert clair
  .run();

// Via le menu
// 1. Cliquer dans la cellule
// 2. Ouvrir le menu colonne ou ligne
// 3. Sélectionner une couleur dans la palette
```

### Fusionner des Cellules

```typescript
// Via l'API
editor.chain().focus().mergeCells().run();

// Via le menu
// 1. Sélectionner plusieurs cellules adjacentes
// 2. Ouvrir le menu colonne ou ligne
// 3. Cliquer sur "Fusionner les cellules"
```

### Palette de Couleurs

```typescript
const TABLE_COLORS = [
  { label: "Défaut", cssColor: "transparent" },
  { label: "Gris clair", cssColor: "#f9fafb" },
  { label: "Gris", cssColor: "#f3f4f6" },
  { label: "Bleu clair", cssColor: "#eff6ff" },
  { label: "Bleu", cssColor: "#dbeafe" },
  { label: "Vert clair", cssColor: "#f0fdf4" },
  { label: "Vert", cssColor: "#dcfce7" },
  { label: "Jaune clair", cssColor: "#fefce8" },
  { label: "Jaune", cssColor: "#fef9c3" },
  { label: "Orange clair", cssColor: "#fff7ed" },
  { label: "Orange", cssColor: "#fed7aa" },
  { label: "Rouge clair", cssColor: "#fef2f2" },
  { label: "Rouge", cssColor: "#fee2e2" },
  { label: "Violet clair", cssColor: "#faf5ff" },
  { label: "Violet", cssColor: "#f3e8ff" },
  { label: "Rose clair", cssColor: "#fdf2f8" },
  { label: "Rose", cssColor: "#fce7f3" },
];
```

---

## 🏗️ Architecture

```
packages/editor/
├── src/
│   ├── components/
│   │   ├── NotionEditor.tsx          # Composant principal
│   │   ├── TableBubbleMenu.tsx       # Menu contextuel des tableaux
│   │   ├── TABLE_FEATURES.md         # Documentation des tableaux
│   │   └── TABLE_USAGE_EXAMPLE.md    # Exemples d'utilisation
│   ├── extensions/
│   │   ├── index.ts                  # Export des extensions
│   │   ├── CustomTableCell.ts        # Extension TableCell avec backgroundColor
│   │   ├── CalloutBlockNode.tsx      # Bloc Callout personnalisé
│   │   └── DatabaseBlockNode.tsx     # Bloc Database personnalisé
│   ├── styles.css                    # Styles de l'éditeur
│   └── index.ts                      # Export principal
├── CHANGELOG_TABLES.md               # Historique des modifications
├── package.json
└── tsconfig.json
```

---

## 🔧 Configuration

### Extensions Disponibles

```typescript
import { getExtensions } from "@notoflow/editor/extensions";

const extensions = getExtensions({
  // Optionnel : Rendu personnalisé pour les blocs Database
  renderDatabase: (id: string) => <DatabaseView id={id} />,
});
```

### Extensions Incluses

- **StarterKit** : Fonctionnalités de base (paragraphe, gras, italique, etc.)
- **Placeholder** : Texte d'aide "Tapez '/' pour les commandes…"
- **TextStyle** : Support des styles de texte
- **Color** : Couleurs de texte
- **Underline** : Soulignement
- **Highlight** : Surlignage multicolore
- **TextAlign** : Alignement du texte
- **Link** : Liens hypertexte
- **Image** : Images avec upload
- **Youtube** : Intégration vidéo
- **TaskList** : Listes de tâches
- **TaskItem** : Items de tâches avec checkboxes
- **Table** : Tableaux redimensionnables
- **TableRow** : Lignes de tableau
- **TableHeader** : En-têtes de tableau
- **CustomTableCell** : Cellules avec backgroundColor
- **CalloutBlockNode** : Blocs Callout
- **DatabaseBlockNode** : Blocs Database

---

## 📚 Documentation Complète

- **[TABLE_FEATURES.md](./src/components/TABLE_FEATURES.md)** : Fonctionnalités des tableaux
- **[TABLE_USAGE_EXAMPLE.md](./src/components/TABLE_USAGE_EXAMPLE.md)** : Exemples d'utilisation
- **[CHANGELOG_TABLES.md](./CHANGELOG_TABLES.md)** : Historique des modifications

---

## 🧪 Tests

```bash
# Lancer les tests
pnpm test

# Vérification des types
pnpm typecheck

# Linter
pnpm lint
```

---

## 🐛 Dépannage

### Le menu des tableaux ne s'affiche pas
**Cause :** Le curseur n'est pas dans le tableau  
**Solution :** Cliquez dans une cellule

### Les couleurs ne s'appliquent pas
**Cause :** L'extension `CustomTableCell` n'est pas chargée  
**Solution :** Vérifiez que `getExtensions()` inclut `CustomTableCell`

### Erreur "Cannot read property 'backgroundColor'"
**Cause :** Ancien contenu avec `TableCell` standard  
**Solution :** Les anciens tableaux continuent de fonctionner, seuls les nouveaux supportent les couleurs

---

## 🚀 Roadmap

### Court terme
- [ ] Drag-to-resize pour colonnes/lignes
- [ ] Sélection multiple avec Shift+Click
- [ ] Copier/coller avec formatage

### Moyen terme
- [ ] Tri et filtrage des tableaux
- [ ] Export CSV/Excel
- [ ] Recherche dans le tableau

### Long terme
- [ ] Formules dans les cellules
- [ ] Graphiques basés sur les données
- [ ] Import CSV/Excel

---

## 📄 Licence

MIT © NotoFlow Team

---

## 🙏 Remerciements

- **[TipTap](https://tiptap.dev/)** : Framework d'édition extensible
- **[Notion](https://notion.so/)** : Inspiration UX
- **[shadcn/ui](https://ui.shadcn.com/)** : Design system

---

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/notoflow/notoflow/issues)
- **Discussions** : [GitHub Discussions](https://github.com/notoflow/notoflow/discussions)
- **Email** : support@notoflow.com

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2026-05-25
