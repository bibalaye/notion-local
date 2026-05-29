import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useCallback } from "react";

// ─── Couleurs par type ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { emoji: string; borderColor: string; bgColor: string; badgeBg: string; badgeText: string }
> = {
  pdf:   { emoji: "📄", borderColor: "#ef444440", bgColor: "#ef44440d", badgeBg: "#ef444420", badgeText: "#ef4444" },
  docx:  { emoji: "📝", borderColor: "#3b82f640", bgColor: "#3b82f60d", badgeBg: "#3b82f620", badgeText: "#3b82f6" },
  xlsx:  { emoji: "📊", borderColor: "#10b98140", bgColor: "#10b9810d", badgeBg: "#10b98120", badgeText: "#10b981" },
  pptx:  { emoji: "📑", borderColor: "#f9731640", bgColor: "#f973160d", badgeBg: "#f9731620", badgeText: "#f97316" },
  image: { emoji: "🖼️", borderColor: "#8b5cf640", bgColor: "#8b5cf60d", badgeBg: "#8b5cf620", badgeText: "#8b5cf6" },
  text:  { emoji: "📃", borderColor: "#6b728040", bgColor: "#6b72800d", badgeBg: "#6b728020", badgeText: "#6b7280" },
  csv:   { emoji: "📋", borderColor: "#14b8a640", bgColor: "#14b8a60d", badgeBg: "#14b8a620", badgeText: "#14b8a6" },
  other: { emoji: "📎", borderColor: "#6b728040", bgColor: "#6b72800d", badgeBg: "#6b728020", badgeText: "#6b7280" },
};

// ─── React Node View ──────────────────────────────────────────────────────────

function DocumentChipView({ node, editor }: any) {
  const { docId, docName, docType, docUrl, docTags } = node.attrs;
  const cfg = TYPE_CONFIG[docType] ?? TYPE_CONFIG.other;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Déclencher l'événement custom capté par PageEditorClient
      try {
        const tags = JSON.parse(decodeURIComponent(docTags ?? "[]"));
        window.dispatchEvent(
          new CustomEvent("open-document-viewer", {
            detail: {
              id: docId,
              name: decodeURIComponent(docName ?? ""),
              fileType: docType,
              publicUrl: decodeURIComponent(docUrl ?? ""),
              tags,
            },
          }),
        );
      } catch {
        // ignore
      }
    },
    [docId, docName, docType, docUrl, docTags],
  );

  return (
    <NodeViewWrapper
      as="span"
      style={{ display: "inline" }}
      contentEditable={false}
    >
      <span
        onClick={handleClick}
        title={`Cliquer pour visualiser : ${decodeURIComponent(docName ?? "")}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "2px 8px 2px 6px",
          borderRadius: "6px",
          border: `1px solid ${cfg.borderColor}`,
          background: cfg.bgColor,
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          color: "inherit",
          verticalAlign: "middle",
          margin: "0 2px",
          userSelect: "none",
          transition: "background 0.15s, box-shadow 0.15s, border-color 0.15s",
          lineHeight: "1.5",
          whiteSpace: "nowrap",
          maxWidth: "280px",
          overflow: "hidden",
        }}
        className="doc-chip-node"
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = cfg.badgeBg;
          el.style.borderColor = cfg.badgeText + "60";
          el.style.boxShadow = `0 1px 6px ${cfg.badgeText}20`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = cfg.bgColor;
          el.style.borderColor = cfg.borderColor;
          el.style.boxShadow = "none";
        }}
      >
        {/* Emoji type */}
        <span style={{ fontSize: "13px", lineHeight: 1, flexShrink: 0 }}>{cfg.emoji}</span>

        {/* Nom du document */}
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "180px",
          }}
        >
          {decodeURIComponent(docName ?? "")}
        </span>

        {/* Badge type */}
        <span
          style={{
            borderRadius: "4px",
            padding: "1px 5px",
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: cfg.badgeBg,
            color: cfg.badgeText,
            flexShrink: 0,
          }}
        >
          {docType}
        </span>

        {/* Icône œil */}
        <span
          style={{
            fontSize: "10px",
            opacity: 0.5,
            flexShrink: 0,
          }}
        >
          👁
        </span>
      </span>
    </NodeViewWrapper>
  );
}

// ─── TipTap Node ──────────────────────────────────────────────────────────────

export const DocumentChipNode = Node.create({
  name: "documentChip",

  // Inline atom — se comporte comme un caractère unique dans le flux de texte
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      docId:   { default: null },
      docName: { default: null },
      docType: { default: "other" },
      docUrl:  { default: null },
      docTags: { default: "[]" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-doc-chip]",
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return {
            docId:   e.getAttribute("data-doc-id"),
            docName: e.getAttribute("data-doc-name"),
            docType: e.getAttribute("data-doc-type"),
            docUrl:  e.getAttribute("data-doc-url"),
            docTags: e.getAttribute("data-doc-tags"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-doc-chip": "true",
        "data-doc-id":   HTMLAttributes.docId,
        "data-doc-name": HTMLAttributes.docName,
        "data-doc-type": HTMLAttributes.docType,
        "data-doc-url":  HTMLAttributes.docUrl,
        "data-doc-tags": HTMLAttributes.docTags,
        class: "doc-chip-node",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentChipView);
  },
});

export default DocumentChipNode;
