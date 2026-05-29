"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import { getExtensions } from "./extensions/index";
import { TableBubbleMenu } from "./components/TableBubbleMenu";
import {
  Sparkles,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  ChevronDown,
  Palette,
  Copy,
  Trash,
  Plus,
  GripVertical,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import "./styles.css";

const colors = [
  { label: "Défaut", value: "inherit", color: "text-foreground" },
  { label: "Gris", value: "#8b949e", color: "text-[#8b949e]" },
  { label: "Marron", value: "#9f6b53", color: "text-[#9f6b53]" },
  { label: "Orange", value: "#d97706", color: "text-[#d97706]" },
  { label: "Jaune", value: "#dfab01", color: "text-[#dfab01]" },
  { label: "Vert", value: "#2ea043", color: "text-[#2ea043]" },
  { label: "Bleu", value: "#58a6ff", color: "text-[#58a6ff]" },
  { label: "Violet", value: "#bc8cff", color: "text-[#bc8cff]" },
  { label: "Rose", value: "#ff7b72", color: "text-[#ff7b72]" },
  { label: "Rouge", value: "#f85149", color: "text-[#f85149]" },
];

const highlights = [
  { label: "Aucun", value: "", color: "bg-transparent border border-border" },
  { label: "Gris", value: "#eff1f3", color: "bg-[#eff1f3] dark:bg-[#3c3f41]" },
  { label: "Marron", value: "#f4eeee", color: "bg-[#f4eeee] dark:bg-[#432d26]" },
  { label: "Orange", value: "#fbecdd", color: "bg-[#fbecdd] dark:bg-[#5c3b25]" },
  { label: "Jaune", value: "#fbf3db", color: "bg-[#fbf3db] dark:bg-[#564b2a]" },
  { label: "Vert", value: "#edf7ec", color: "bg-[#edf7ec] dark:bg-[#294a34]" },
  { label: "Bleu", value: "#e7f3f8", color: "bg-[#e7f3f8] dark:bg-[#283d54]" },
  { label: "Violet", value: "#f6f0fa", color: "bg-[#f6f0fa] dark:bg-[#492d58]" },
  { label: "Rose", value: "#faf0f5", color: "bg-[#faf0f5] dark:bg-[#582c4d]" },
  { label: "Rouge", value: "#fdebeb", color: "bg-[#fdebeb] dark:bg-[#582c2c]" },
];

type HoveredBlock = {
  pos: number;
  nodeSize: number;
  top: number;
  height: number;
};

function normalizeEditorContent(initialContent: unknown) {
  if (typeof initialContent === "string") {
    try {
      return normalizeEditorContent(JSON.parse(initialContent));
    } catch {
      return { type: "doc", content: [] };
    }
  }

  if (Array.isArray(initialContent)) {
    return { type: "doc", content: initialContent };
  }

  if (typeof initialContent === "object" && initialContent !== null) {
    const asObj = initialContent as Record<string, unknown>;
    if (asObj.type !== "doc") {
      return { type: "doc", content: Array.isArray(asObj.content) ? asObj.content : [] };
    }
  }

  return initialContent ?? { type: "doc", content: [] };
}

export type NotionEditorProps = {
  initialContent?: unknown;
  onChange?: (json: unknown) => void;
  readOnly?: boolean;
  placeholder?: string;
  renderDatabase?: (databaseId: string) => React.ReactNode;
  onCursorChange?: (pos: number) => void;
  collaborativeCursors?: { id: string; name: string; color: string; pos: number }[];
  onTriggerAI?: (editorInstance: any) => void;
  onEditorReady?: (editorInstance: any) => void;
  /**
   * Appelé quand l'utilisateur tape "@" dans l'éditeur.
   * Reçoit la query (texte après @), les coordonnées du curseur et un callback cancel.
   */
  onDocumentMentionQuery?: (params: {
    query: string;
    coords: { top: number; left: number; bottom: number; right: number };
    cancel: () => void;
  }) => void;
  /** Appelé quand le menu @ doit être fermé */
  onDocumentMentionClose?: () => void;
};

export function NotionEditor({
  initialContent,
  onChange,
  readOnly = false,
  renderDatabase,
  onCursorChange,
  collaborativeCursors = [],
  onTriggerAI,
  onEditorReady,
  onDocumentMentionQuery,
  onDocumentMentionClose,
}: NotionEditorProps) {
  // Slash menu state
  const [showMenu, setShowMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Custom cursor coords state
  const [cursorsCoords, setCursorsCoords] = useState<
    Record<string, { top: number; left: number; name: string; color: string }>
  >({});

  // Floating selection bubble menu states
  const [bubbleSubmenu, setBubbleSubmenu] = useState<"none" | "block" | "color" | "link">("none");
  const [linkUrl, setLinkUrl] = useState("");
  const [hoveredBlock, setHoveredBlock] = useState<HoveredBlock | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggedBlockRef = useRef<{ pos: number; nodeSize: number; json: any } | null>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHideBlockControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideBlockControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = setTimeout(() => {
      setHoveredBlock(null);
      hideControlsTimeoutRef.current = null;
    }, 220);
  }, []);

  const commandItems = [
    {
      title: "Texte",
      description: "Écrire du texte simple",
      emoji: "✍️",
      category: "Rédiger & Texte",
      shortcut: "Alt+0",
      action: (editor: any) => editor.chain().focus().setParagraph().run(),
    },
    {
      title: "Titre 1",
      description: "Grand titre de section",
      emoji: "❶",
      category: "Rédiger & Texte",
      shortcut: "Alt+1",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Titre 2",
      description: "Titre moyen de section",
      emoji: "❷",
      category: "Rédiger & Texte",
      shortcut: "Alt+2",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Titre 3",
      description: "Petit titre de section",
      emoji: "❸",
      category: "Rédiger & Texte",
      shortcut: "Alt+3",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Liste de tâches",
      description: "Checklist interactive",
      emoji: "☑️",
      category: "Rédiger & Texte",
      shortcut: "Alt+4",
      action: (editor: any) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Citation",
      description: "Insérer un bloc de citation",
      emoji: "💬",
      category: "Rédiger & Texte",
      shortcut: "Alt+5",
      action: (editor: any) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Bloc de code",
      description: "Écrire du code informatique",
      emoji: "💻",
      category: "Rédiger & Texte",
      shortcut: "Alt+6",
      action: (editor: any) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Encadre",
      description: "Bloc visuel avec icone et couleur",
      emoji: "[]",
      category: "Rédiger & Texte",
      shortcut: "Alt+7",
      action: (editor: any) =>
        editor
          .chain()
          .focus()
          .insertContent({
            type: "calloutBlock",
            attrs: { emoji: "!", tone: "blue" },
            content: [{ type: "paragraph" }],
          })
          .run(),
    },
    {
      title: "Séparateur",
      description: "Ligne de séparation horizontale",
      emoji: "➖",
      category: "Mises en page & Tableaux",
      shortcut: "Alt+-",
      action: (editor: any) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: "Tableau",
      description: "Insérer un tableau simple",
      emoji: "📅",
      category: "Mises en page & Tableaux",
      shortcut: "Alt+T",
      action: (editor: any) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "Vidéo Youtube",
      description: "Insérer une vidéo Youtube",
      emoji: "🎥",
      category: "Mises en page & Tableaux",
      shortcut: "Alt+Y",
      action: (editor: any) => {
        const url = prompt("URL de la vidéo Youtube :");
        if (url) {
          editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }
      },
    },
    {
      title: "Base de données",
      description: "Insérer une base de données interactive",
      emoji: "📊",
      category: "Bases de données & IA",
      shortcut: "Alt+D",
      action: (editor: any) => {
        const dbId = `db-${Date.now().toString().slice(-6)}`;
        editor.chain().focus().insertContent({
          type: "databaseBlock",
          attrs: { databaseId: dbId },
        }).run();
      },
    },
    {
      title: "Assistant IA",
      description: "Générer du texte avec l'IA",
      emoji: "✨",
      category: "Bases de données & IA",
      shortcut: "Alt+I",
      action: (editorInstance: any) => {
        if (onTriggerAI) {
          onTriggerAI(editorInstance);
        }
      },
    },
  ];

  const filteredItems = commandItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  const runCommand = (action: (editor: any) => void) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, "\n");
    const match = textBefore.match(/\/(\w*)$/);
    const queryLength = match ? match[0].length : 0;

    editor.chain().focus().deleteRange({ from: from - queryLength, to: from }).run();
    action(editor);
    setShowMenu(false);
  };

  // Keyboard navigation ref-capturer to avoid closures issues
  const menuStateRef = useRef({ showMenu, selectedIndex, filteredItems, runCommand });
  useEffect(() => {
    menuStateRef.current = { showMenu, selectedIndex, filteredItems, runCommand };
  }, [showMenu, selectedIndex, filteredItems]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false, // Réduit les re-renders React inutiles
    extensions: getExtensions({
      renderDatabase,
      documentMention: !readOnly && (onDocumentMentionQuery || onDocumentMentionClose)
        ? {
            onMentionQuery: onDocumentMentionQuery,
            onMentionClose: onDocumentMentionClose,
          }
        : undefined,
    }),
    content: normalizeEditorContent(initialContent) ?? { type: "doc", content: [{ type: "paragraph" }] },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "notion-editor max-w-none focus:outline-none min-h-[60vh] text-base leading-relaxed",
      },
      handleKeyDown: (view, event) => {
        const state = menuStateRef.current;
        if (state.showMenu) {
          if (event.key === "ArrowDown") {
            setSelectedIndex((prev) => (prev + 1) % state.filteredItems.length);
            return true;
          }
          if (event.key === "ArrowUp") {
            setSelectedIndex(
              (prev) => (prev - 1 + state.filteredItems.length) % state.filteredItems.length,
            );
            return true;
          }
          if (event.key === "Enter") {
            if (state.filteredItems[state.selectedIndex]) {
              state.runCommand(state.filteredItems[state.selectedIndex].action);
              return true;
            }
          }
          if (event.key === "Escape") {
            setShowMenu(false);
            return true;
          }
        }
        return false;
      },
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from } = editor.state.selection;
      
      // Reset bubble submenu when selection changes
      setBubbleSubmenu("none");

      // Cursor broadcast callback
      onCursorChange?.(from);

      // Slash command parsing
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, "\n");
      const match = textBefore.match(/\/(\w*)$/);
      
      if (match) {
        setQuery(match[1]);
        setShowMenu(true);
        setSelectedIndex(0);

        try {
          const coords = editor.view.coordsAtPos(from);
          const editorElement = editor.view.dom.getBoundingClientRect();
          setMenuCoords({
            top: coords.bottom - editorElement.top + window.scrollY,
            left: coords.left - editorElement.left,
          });
        } catch (e) {
          // ignore coordinates errors
        }
      } else {
        setShowMenu(false);
      }
    },
  });

  // Track and refresh collaborative presence cursors coords
  useEffect(() => {
    if (!editor || !collaborativeCursors.length) {
      setCursorsCoords({});
      return;
    }

    const updateCursors = () => {
      const updatedCoords: typeof cursorsCoords = {};
      collaborativeCursors.forEach((c) => {
        try {
          const docSize = editor.state.doc.content.size;
          const safePos = Math.min(Math.max(0, c.pos), docSize);
          const coords = editor.view.coordsAtPos(safePos);
          const editorElement = editor.view.dom.getBoundingClientRect();

          updatedCoords[c.id] = {
            top: coords.top - editorElement.top,
            left: coords.left - editorElement.left,
            name: c.name,
            color: c.color,
          };
        } catch (e) {
          // ignore coordinates calculations out of bounds
        }
      });
      setCursorsCoords(updatedCoords);
    };

    updateCursors();
    
    // Check every selection update or interval
    const interval = setInterval(updateCursors, 200);
    return () => clearInterval(interval);
  }, [editor, collaborativeCursors]);

  // Keep editor content in-sync when page changes
  useEffect(() => {
    if (!editor) return;

    const normalizedInitialContent = normalizeEditorContent(initialContent);
    const currentJSON = JSON.stringify(editor.getJSON());
    const incomingJSON = JSON.stringify(normalizedInitialContent);

    if (currentJSON !== incomingJSON) {
      editor.commands.setContent(normalizedInitialContent);
    }
  }, [editor, initialContent]);

  // Cleanup proper de l'éditeur pour éviter les erreurs removeChild
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, []);

  const resolveEditableBlock = useCallback(
    (clientX: number, clientY: number): HoveredBlock | null => {
      if (!editor || readOnly || !containerRef.current) return null;

      let result;
      try {
        result = editor.view.posAtCoords({ left: clientX, top: clientY });
      } catch (e) {
        return null;
      }
      if (!result) return null;

      const resolvedPos = editor.state.doc.resolve(result.pos);
      let depth = resolvedPos.depth;

      while (depth > 1) {
        const nodeName = resolvedPos.node(depth).type.name;
        if (nodeName === "listItem" || nodeName === "taskItem" || nodeName === "calloutBlock") break;
        depth -= 1;
      }

      const blockPos = depth > 0 ? resolvedPos.before(depth) : 0;
      const blockNode = editor.state.doc.nodeAt(blockPos);
      if (!blockNode || blockNode.type.name === "doc") return null;

      let coords;
      try {
        coords = editor.view.coordsAtPos(Math.min(blockPos + 1, editor.state.doc.content.size));
      } catch (e) {
        return null;
      }

      const containerBox = containerRef.current.getBoundingClientRect();
      const domNode = editor.view.nodeDOM(blockPos) as HTMLElement | null;
      const domBox = domNode?.getBoundingClientRect();

      return {
        pos: blockPos,
        nodeSize: blockNode.nodeSize,
        top: (domBox?.top ?? coords.top) - containerBox.top,
        height: Math.max(domBox?.height ?? (coords.bottom - coords.top), 28),
      };
    },
    [editor, readOnly],
  );

  const handleEditorMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      cancelHideBlockControls();

      if (editor && hoveredBlock) {
        const editorBox = editor.view.dom.getBoundingClientRect();
        const isInControlLane =
          event.clientX >= editorBox.left - 88 &&
          event.clientX <= editorBox.left &&
          event.clientY >= editorBox.top + hoveredBlock.top - 8 &&
          event.clientY <= editorBox.top + hoveredBlock.top + hoveredBlock.height + 8;

        if (isInControlLane) return;
      }

      const block = resolveEditableBlock(event.clientX, event.clientY);
      setHoveredBlock(block);
    },
    [cancelHideBlockControls, editor, hoveredBlock, resolveEditableBlock],
  );

  const insertBlockAfter = useCallback(() => {
    if (!editor || !hoveredBlock) return;
    const insertPos = hoveredBlock.pos + hoveredBlock.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, { type: "paragraph" })
      .setTextSelection(insertPos + 1)
      .run();
  }, [editor, hoveredBlock]);

  const moveDraggedBlock = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!editor || !draggedBlockRef.current) return;
      event.preventDefault();

      const targetBlock = resolveEditableBlock(event.clientX, event.clientY);
      const sourceBlock = draggedBlockRef.current;
      if (!targetBlock || targetBlock.pos === sourceBlock.pos) return;

      let insertPos = targetBlock.pos;
      const shouldInsertAfter = event.clientY > event.currentTarget.getBoundingClientRect().top + targetBlock.top + targetBlock.height / 2;
      if (shouldInsertAfter) insertPos = targetBlock.pos + targetBlock.nodeSize;

      let tr = editor.state.tr.delete(sourceBlock.pos, sourceBlock.pos + sourceBlock.nodeSize);
      if (sourceBlock.pos < insertPos) insertPos -= sourceBlock.nodeSize;
      tr = tr.insert(insertPos, editor.schema.nodeFromJSON(sourceBlock.json));
      editor.view.dispatch(tr);
      editor.commands.focus(insertPos + 1);
      draggedBlockRef.current = null;
      setIsDraggingBlock(false);
      setHoveredBlock(null);
    },
    [editor, resolveEditableBlock],
  );

  const blockTypes = [
    { label: "Texte", active: () => editor?.isActive("paragraph") ?? false, action: () => editor?.chain().focus().setParagraph().run(), icon: "✍️" },
    { label: "Titre 1", active: () => editor?.isActive("heading", { level: 1 }) ?? false, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), icon: "❶" },
    { label: "Titre 2", active: () => editor?.isActive("heading", { level: 2 }) ?? false, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), icon: "❷" },
    { label: "Titre 3", active: () => editor?.isActive("heading", { level: 3 }) ?? false, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), icon: "❸" },
    { label: "Liste à puces", active: () => editor?.isActive("bulletList") ?? false, action: () => editor?.chain().focus().toggleBulletList().run(), icon: "•" },
    { label: "Liste numérotée", active: () => editor?.isActive("orderedList") ?? false, action: () => editor?.chain().focus().toggleOrderedList().run(), icon: "1." },
    { label: "Liste de tâches", active: () => editor?.isActive("taskList") ?? false, action: () => editor?.chain().focus().toggleTaskList().run(), icon: "☑️" },
    { label: "Citation", active: () => editor?.isActive("blockquote") ?? false, action: () => editor?.chain().focus().toggleBlockquote().run(), icon: "💬" },
    { label: "Code", active: () => editor?.isActive("codeBlock") ?? false, action: () => editor?.chain().focus().toggleCodeBlock().run(), icon: "💻" },
    {
      label: "Encadre",
      active: () => editor?.isActive("calloutBlock") ?? false,
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: "calloutBlock",
            attrs: { emoji: "!", tone: "blue" },
            content: [{ type: "paragraph" }],
          })
          .run(),
      icon: "[]",
    },
  ];

  const getActiveBlockLabel = () => {
    if (!editor) return "Texte";
    const active = blockTypes.find((t) => t.active());
    return active ? active.label : "Texte";
  };

  const duplicateBlock = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedContent = editor.state.doc.slice(from, to).content;
    if (selectedContent.size > 0) {
      editor.chain().focus().insertContentAt(to, selectedContent.toJSON()).run();
    }
  };

  const deleteSelection = () => {
    if (!editor) return;
    editor.chain().focus().deleteSelection().run();
  };

  const copyText = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    navigator.clipboard.writeText(text);
  };

  if (!editor) return <div className="h-48 animate-pulse rounded-xl bg-muted/30 border border-border/50" />;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isDraggingBlock ? "notion-editor-dragging" : ""}`}
      onMouseMove={handleEditorMouseMove}
      onMouseEnter={cancelHideBlockControls}
      onMouseLeave={scheduleHideBlockControls}
      onDragOver={(event) => event.preventDefault()}
      onDrop={moveDraggedBlock}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 80 }}
          className="flex flex-col rounded-lg border border-border/30 bg-popover/90 p-0.5 shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1),0_8px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.4),0_8px_16px_-4px_rgba(0,0,0,0.3)] backdrop-blur-xl max-w-sm"
        >
          {/* Main Toolbar */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none px-0.5 py-0.5 select-none">
            {/* Block Type Transform Selector */}
            <button
              type="button"
              onClick={() => setBubbleSubmenu(bubbleSubmenu === "block" ? "none" : "block")}
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs font-bold transition-colors shrink-0 cursor-pointer focus:outline-none ${
                bubbleSubmenu === "block" ? "bg-accent text-foreground" : "text-foreground/80"
              }`}
            >
              <span>{getActiveBlockLabel()}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-40 shrink-0 stroke-[1.8]" />
            </button>

            <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

            {/* Standard Formatting buttons */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive("bold") ? "bg-accent text-foreground font-bold" : "text-foreground/70"
              }`}
              title="Gras"
            >
              <Bold className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive("italic") ? "bg-accent text-foreground" : "text-foreground/70"
              }`}
              title="Italique"
            >
              <Italic className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive("underline") ? "bg-accent text-foreground" : "text-foreground/70"
              }`}
              title="Souligné"
            >
              <UnderlineIcon className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive("strike") ? "bg-accent text-foreground" : "text-foreground/70"
              }`}
              title="Barré"
            >
              <Strikethrough className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive("code") ? "bg-accent text-foreground" : "text-foreground/70"
              }`}
              title="Code en ligne"
            >
              <Code className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setLinkUrl(editor.getAttributes("link").href || "");
                setBubbleSubmenu(bubbleSubmenu === "link" ? "none" : "link");
              }}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive("link") ? "bg-accent text-indigo-500 font-bold" : "text-foreground/70"
              }`}
              title="Lien hypertexte"
            >
              <LinkIcon className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive({ textAlign: "left" }) ? "bg-accent text-foreground font-bold" : "text-foreground/70"
              }`}
              title="Aligner à gauche"
            >
              <AlignLeft className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive({ textAlign: "center" }) ? "bg-accent text-foreground font-bold" : "text-foreground/70"
              }`}
              title="Aligner au centre"
            >
              <AlignCenter className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                editor.isActive({ textAlign: "right" }) ? "bg-accent text-foreground font-bold" : "text-foreground/70"
              }`}
              title="Aligner à droite"
            >
              <AlignRight className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

            {/* Color picker */}
            <button
              type="button"
              onClick={() => setBubbleSubmenu(bubbleSubmenu === "color" ? "none" : "color")}
              className={`p-1 rounded hover:bg-accent transition-colors shrink-0 cursor-pointer focus:outline-none ${
                bubbleSubmenu === "color" ? "bg-accent text-foreground" : "text-foreground/70"
              }`}
              title="Couleur"
            >
              <Palette className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            {/* AI Assistant selection command */}
            <button
              type="button"
              onClick={() => {
                if (onTriggerAI) onTriggerAI(editor);
              }}
              className="p-1 rounded text-violet-500 hover:bg-violet-500/10 transition-colors shrink-0 cursor-pointer focus:outline-none"
              title="Demander à l'IA"
            >
              <Sparkles className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

            {/* Copy link / Duplicate / Delete */}
            <button
              type="button"
              onClick={copyText}
              className="p-1 rounded hover:bg-accent transition-colors shrink-0 text-foreground/70 cursor-pointer focus:outline-none"
              title="Copier le texte"
            >
              <Copy className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={duplicateBlock}
              className="p-1 rounded hover:bg-accent transition-colors shrink-0 text-foreground/70 cursor-pointer focus:outline-none"
              title="Dupliquer"
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-180 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={deleteSelection}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 text-foreground/70 cursor-pointer focus:outline-none"
              title="Supprimer"
            >
              <Trash className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>
          </div>

          {/* Submenus Panels */}
          {bubbleSubmenu === "block" && (
            <div className="border-t border-border/30 mt-0.5 pt-0.5 max-h-[220px] overflow-y-auto w-full space-y-0.5 animate-fade-in p-1 select-none">
              <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
                Transformer en
              </div>
              {blockTypes.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    t.action();
                    setBubbleSubmenu("none");
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left text-xs transition-colors cursor-pointer ${
                    t.active() ? "bg-accent text-foreground font-semibold" : "hover:bg-accent/50 text-foreground/80"
                  }`}
                >
                  <span className="text-xs shrink-0 w-4 text-center">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {bubbleSubmenu === "color" && (
            <div className="border-t border-border/30 mt-0.5 pt-0.5 max-h-[250px] overflow-y-auto w-full grid grid-cols-2 gap-2 p-1.5 animate-fade-in select-none">
              {/* Text color column */}
              <div className="space-y-0.5">
                <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-1.5 py-1">
                  Texte
                </div>
                {colors.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      if (c.value === "inherit") {
                        editor.chain().focus().unsetColor().run();
                      } else {
                        editor.chain().focus().setColor(c.value).run();
                      }
                      setBubbleSubmenu("none");
                    }}
                    className="w-full flex items-center gap-2 px-1.5 py-1 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer"
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border border-neutral-300/20 flex items-center justify-center font-bold text-[8px] bg-neutral-100 dark:bg-neutral-800 ${c.color}`}>
                      A
                    </span>
                    <span className="font-medium text-[11px]">{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Background color column */}
              <div className="space-y-0.5">
                <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-1.5 py-1">
                  Surlignage
                </div>
                {highlights.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onClick={() => {
                      if (h.value === "") {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().toggleHighlight({ color: h.value }).run();
                      }
                      setBubbleSubmenu("none");
                    }}
                    className="w-full flex items-center gap-2 px-1.5 py-1 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer"
                  >
                    <span className={`w-3.5 h-3.5 rounded border border-neutral-300/20 ${h.color}`} />
                    <span className="font-medium text-[11px]">{h.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {bubbleSubmenu === "link" && (
            <div className="border-t border-border/30 mt-0.5 pt-1.5 pb-1 px-2.5 animate-fade-in w-full select-none">
              <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-0.5 mb-1.5">
                Lien hypertexte
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Coller ou saisir l'URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (linkUrl.trim()) {
                        editor.chain().focus().setLink({ href: linkUrl }).run();
                      } else {
                        editor.chain().focus().unsetLink().run();
                      }
                      setBubbleSubmenu("none");
                    }
                  }}
                  className="flex-1 bg-background text-xs px-2.5 py-1 rounded-md border border-border/60 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (linkUrl.trim()) {
                      editor.chain().focus().setLink({ href: linkUrl }).run();
                    } else {
                      editor.chain().focus().unsetLink().run();
                    }
                    setBubbleSubmenu("none");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer"
                >
                  Valider
                </button>
                {editor.isActive("link") && (
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setBubbleSubmenu("none");
                    }}
                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          )}
        </BubbleMenu>
      )}

      {/* Table Bubble Menu - Advanced table controls */}
      {editor && <TableBubbleMenu editor={editor} />}

      {hoveredBlock && !readOnly && (
        <div
          className="notion-block-controls"
          style={{ top: `${hoveredBlock.top}px` }}
          contentEditable={false}
          onMouseEnter={() => {
            cancelHideBlockControls();
            setHoveredBlock(hoveredBlock);
          }}
          onMouseLeave={scheduleHideBlockControls}
          onMouseMove={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="notion-block-control-button"
            onClick={insertBlockAfter}
            title="Ajouter un bloc"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="notion-block-control-button notion-block-drag-button"
            draggable
            onDragStart={(event) => {
              const node = editor.state.doc.nodeAt(hoveredBlock.pos);
              if (!node) return;
              draggedBlockRef.current = {
                pos: hoveredBlock.pos,
                nodeSize: hoveredBlock.nodeSize,
                json: node.toJSON(),
              };
              setIsDraggingBlock(true);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("application/x-notoflow-block", String(hoveredBlock.pos));
            }}
            onDragEnd={() => {
              draggedBlockRef.current = null;
              setIsDraggingBlock(false);
            }}
            title="Deplacer le bloc"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      {/* Floating Collaborative Cursors */}
      {Object.entries(cursorsCoords).map(([id, cursor]) => (
        <div
          key={id}
          className="absolute z-35 pointer-events-none transition-all duration-150"
          style={{ top: `${cursor.top}px`, left: `${cursor.left}px` }}
        >
          {/* Vertical blinking indicator */}
          <div className="h-5 w-[2px]" style={{ backgroundColor: cursor.color }} />
          {/* Floating name tooltip */}
          <div
            className="absolute left-1.5 top-0 text-[10px] text-white px-1.5 py-0.5 rounded font-semibold whitespace-nowrap shadow-md"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}

      {/* Command Slash Menu */}
      {showMenu && filteredItems.length > 0 && (
        <div
          className="absolute z-50 w-72 rounded-xl border border-border bg-popover/90 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl max-h-[300px] overflow-y-auto scrollbar-none"
          style={{ top: `${menuCoords.top}px`, left: `${menuCoords.left}px` }}
        >
          {Array.from(new Set(filteredItems.map(item => item.category))).map((category) => {
            const categoryItems = filteredItems.filter((item) => item.category === category);
            return (
              <div key={category} className="mb-2 last:mb-0">
                <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2.5 py-1 select-none">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {categoryItems.map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={item.title}
                        onClick={() => runCommand(item.action)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-100 cursor-pointer ${
                          isSelected ? "bg-accent text-foreground font-semibold shadow-sm scale-[0.99]" : "hover:bg-accent/40 text-foreground/80"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-base shrink-0 flex items-center justify-center h-7 w-7 rounded-md bg-background border border-border/60 shadow-sm">
                            {item.title === "Assistant IA" ? (
                              <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
                            ) : (
                              item.emoji
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-none truncate">{item.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 truncate leading-none">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        {item.shortcut && (
                          <span className="text-[9px] font-extrabold text-muted-foreground/40 bg-muted/65 px-1 rounded uppercase tracking-wider shrink-0 ml-2 border border-border/30">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
