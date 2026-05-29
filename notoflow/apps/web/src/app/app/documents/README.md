# Système de Documents — NotoFlow

Visualisateur de documents avec tagging, inspiré de Notion.

## Architecture

```
/app/documents/
├── page.tsx              # Server component (pré-charge documents + tags)
├── DocumentsClient.tsx   # Client principal (liste, filtres, upload)
├── DocumentViewer.tsx    # Modal de visualisation (PDF, Word, images)
└── TagEditor.tsx         # Modal d'édition des tags
```

## Modèle Prisma

```prisma
model Document {
  id          String   @id @default(cuid())
  workspaceId String
  uploaderId  String
  name        String
  fileType    String   // "pdf" | "docx" | "xlsx" | "pptx" | "image" | "text" | "csv" | "other"
  mimeType    String
  size        Int      // bytes
  storageKey  String   // chemin dans Supabase Storage
  publicUrl   String   // URL publique
  tags        String[] @default([])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Server Actions (`actions/documents.ts`)

- `uploadDocument(formData)` — Upload vers Supabase Storage + création en base
- `getDocuments(workspaceId, filters?)` — Liste avec filtres (type, tag, search)
- `getDocument(documentId)` — Détails d'un document
- `getDocumentTags(workspaceId)` — Tous les tags distincts du workspace
- `updateDocumentTags(documentId, tags)` — Mise à jour des tags
- `renameDocument(documentId, name)` — Renommer
- `deleteDocument(documentId)` — Suppression (fichier + base)

## Stratégies de rendu

| Type | Méthode |
|------|---------|
| PDF | `<iframe>` natif navigateur |
| Word/Excel/PowerPoint | Google Docs Viewer (`https://docs.google.com/viewer?url=...`) |
| Images | `<img>` natif |
| Texte/CSV | `<iframe>` direct |
| Autres | Lien de téléchargement |

## Permissions

- **Upload** : OWNER, ADMIN, EDITOR
- **Suppression** : OWNER, ADMIN (+ propriétaire du fichier)
- **Lecture** : tous les membres du workspace

## Fonctionnalités

- ✅ Upload drag & drop + bouton
- ✅ Filtres par type de fichier
- ✅ Filtres par tags
- ✅ Recherche par nom
- ✅ Visualisation inline (PDF, Word, images)
- ✅ Gestion des tags (ajout, suppression, suggestions)
- ✅ Téléchargement
- ✅ Suppression
- ✅ Optimistic updates (Framer Motion)

## Setup Supabase

Voir `docs/DOCUMENTS_SETUP.md` pour créer le bucket `documents` et les politiques RLS.
