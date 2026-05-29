"use client";

/**
 * InlineDocumentChip — utilitaires pour insérer un chip de document dans TipTap.
 *
 * On utilise le node TipTap `documentChip` (DocumentChipNode) qui est un node inline atom.
 * L'insertion se fait via `editor.commands.insertContent(buildDocumentChipNode(doc))`
 * qui insère le node JSON directement — pas de HTML inline sanitisé.
 *
 * Le clic sur le chip est géré par le NodeView React (DocumentChipView) qui dispatche
 * l'événement custom "open-document-viewer" capté par PageEditorClient.
 */

import type { DocRef } from "./DocumentViewerModal";

/**
 * Construit le JSON TipTap pour insérer un chip de document inline.
 * À passer à `editor.commands.insertContent(buildDocumentChipNode(doc))`.
 */
export function buildDocumentChipNode(doc: DocRef): object {
  return {
    type: "documentChip",
    attrs: {
      docId:   doc.id,
      docName: encodeURIComponent(doc.name),
      docType: doc.fileType,
      docUrl:  encodeURIComponent(doc.publicUrl),
      docTags: encodeURIComponent(JSON.stringify(doc.tags)),
    },
  };
}

/**
 * @deprecated Utiliser buildDocumentChipNode() à la place.
 * Conservé pour compatibilité avec l'ancien code.
 */
export function buildDocumentChipHtml(doc: DocRef): object {
  return buildDocumentChipNode(doc);
}
