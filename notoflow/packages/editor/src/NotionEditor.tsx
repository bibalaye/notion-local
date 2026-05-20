"use client";

import { useEffect, useState, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { getExtensions } from "./extensions/index";
import { Sparkles } from "lucide-react";
import "./styles.css";

export type NotionEditorProps = {
  initialContent?: unknown;
  onChange?: (json: unknown) => void;
  readOnly?: boolean;
  placeholder?: string;
  renderDatabase?: (databaseId: string) => React.ReactNode;
  onCursorChange?: (pos: number) => void;
  collaborativeCursors?: { id: string; name: string; color: string; pos: number }[];
  onTriggerAI?: (editorInstance: any) => void;
};

export function NotionEditor({
  initialContent,
  onChange,
  readOnly = false,
  renderDatabase,
  onCursorChange,
  collaborativeCursors = [],
  onTriggerAI,
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

  const containerRef = useRef<HTMLDivElement>(null);

  const commandItems = [
    {
      title: "Texte",
      description: "Écrire du texte simple",
      emoji: "✍️",
      action: (editor: any) => editor.chain().focus().setParagraph().run(),
    },
    {
      title: "Titre 1",
      description: "Grand titre de section",
      emoji: "❶",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Titre 2",
      description: "Titre moyen de section",
      emoji: "❷",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Titre 3",
      description: "Petit titre de section",
      emoji: "❸",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Liste de tâches",
      description: "Checklist interactive",
      emoji: "☑️",
      action: (editor: any) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Citation",
      description: "Insérer un bloc de citation",
      emoji: "💬",
      action: (editor: any) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Bloc de code",
      description: "Écrire du code informatique",
      emoji: "💻",
      action: (editor: any) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Séparateur",
      description: "Ligne de séparation horizontale",
      emoji: "➖",
      action: (editor: any) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: "Tableau",
      description: "Insérer un tableau simple",
      emoji: "📅",
      action: (editor: any) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "Vidéo Youtube",
      description: "Insérer une vidéo Youtube",
      emoji: "🎥",
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
    extensions: getExtensions({ renderDatabase }),
    content: initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "notion-editor prose prose-neutral dark:prose-invert max-w-none px-3 py-6 text-base leading-relaxed focus:outline-none min-h-[400px]",
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
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from } = editor.state.selection;
      
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
    if (editor && initialContent) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const incomingJSON = JSON.stringify(initialContent);
      if (currentJSON !== incomingJSON) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  if (!editor) return <div className="h-48 animate-pulse rounded-xl bg-muted/30 border border-border/50" />;

  return (
    <div ref={containerRef} className="relative w-full">
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
          className="absolute z-50 w-72 rounded-xl border border-border bg-popover p-1 shadow-2xl backdrop-blur-md max-h-[300px] overflow-y-auto"
          style={{ top: `${menuCoords.top}px`, left: `${menuCoords.left}px` }}
        >
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 py-2">
            Commandes de blocs
          </div>
          <div className="space-y-0.5">
            {filteredItems.map((item, idx) => (
              <button
                key={item.title}
                onClick={() => runCommand(item.action)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors duration-150 ${
                  idx === selectedIndex ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/40 text-foreground"
                }`}
                type="button"
              >
                <span className="text-lg shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-background border border-border/60 shadow-sm">
                  {item.title === "Assistant IA" ? (
                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  ) : (
                    item.emoji
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-none truncate">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 truncate leading-none">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
