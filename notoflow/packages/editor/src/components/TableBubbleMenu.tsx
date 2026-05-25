"use client";

import { Editor } from "@tiptap/react";
import {
  Table,
  Plus,
  Trash2,
  Columns,
  Rows,
  Merge,
  Split,
  ChevronDown,
  Check,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Settings,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface TableBubbleMenuProps {
  editor: Editor;
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const [showSubmenu, setShowSubmenu] = useState<"none" | "insert" | "delete" | "merge" | "header">("none");
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const isInTable = editor.isActive("table");
      
      if (!isInTable) {
        setIsVisible(false);
        return;
      }

      // Calculer la position du menu
      try {
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        const editorRect = editor.view.dom.getBoundingClientRect();
        
        setPosition({
          top: coords.top - editorRect.top - 50, // 50px au-dessus du curseur
          left: coords.left - editorRect.left,
        });
        setIsVisible(true);
      } catch (e) {
        setIsVisible(false);
      }
    };

    // Mettre à jour à chaque changement de sélection
    editor.on("selectionUpdate", updateMenu);
    editor.on("update", updateMenu);
    
    // Vérification initiale
    updateMenu();

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("update", updateMenu);
    };
  }, [editor]);

  // Fermer les sous-menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSubmenu("none");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor || !isVisible) return null;

  const safeExecute = (action: () => void) => {
    try {
      action();
      // Fermer les sous-menus après l'action
      setShowSubmenu("none");
    } catch (error) {
      console.error("Erreur lors de l'exécution de l'action table:", error);
    }
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }}
      className="flex flex-col rounded-lg border border-border/30 bg-popover/95 p-0.5 shadow-[0_12px_30px_-4px_rgba(0,0,0,0.1),0_8px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.4),0_8px_16px_-4px_rgba(0,0,0,0.3)] backdrop-blur-xl"
    >
      {/* Main Toolbar */}
      <div className="flex items-center gap-0.5 px-0.5 py-0.5 select-none">
        {/* Insert Menu */}
        <button
          type="button"
          onClick={() => setShowSubmenu(showSubmenu === "insert" ? "none" : "insert")}
          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs font-bold transition-colors shrink-0 cursor-pointer focus:outline-none ${
            showSubmenu === "insert" ? "bg-accent text-foreground" : "text-foreground/80"
          }`}
          title="Insérer"
        >
          <Plus className="h-3.5 w-3.5 stroke-[1.8]" />
          <span>Insérer</span>
          <ChevronDown className="h-3 w-3 opacity-40 shrink-0 stroke-[1.8]" />
        </button>

        <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

        {/* Delete Menu */}
        <button
          type="button"
          onClick={() => setShowSubmenu(showSubmenu === "delete" ? "none" : "delete")}
          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs font-bold transition-colors shrink-0 cursor-pointer focus:outline-none ${
            showSubmenu === "delete" ? "bg-accent text-foreground" : "text-foreground/80"
          }`}
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5 stroke-[1.8]" />
          <span>Supprimer</span>
          <ChevronDown className="h-3 w-3 opacity-40 shrink-0 stroke-[1.8]" />
        </button>

        <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

        {/* Merge/Split Menu */}
        <button
          type="button"
          onClick={() => setShowSubmenu(showSubmenu === "merge" ? "none" : "merge")}
          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs font-bold transition-colors shrink-0 cursor-pointer focus:outline-none ${
            showSubmenu === "merge" ? "bg-accent text-foreground" : "text-foreground/80"
          }`}
          title="Fusionner/Diviser"
        >
          <Merge className="h-3.5 w-3.5 stroke-[1.8]" />
          <span>Cellules</span>
          <ChevronDown className="h-3 w-3 opacity-40 shrink-0 stroke-[1.8]" />
        </button>

        <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

        {/* Header Menu */}
        <button
          type="button"
          onClick={() => setShowSubmenu(showSubmenu === "header" ? "none" : "header")}
          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs font-bold transition-colors shrink-0 cursor-pointer focus:outline-none ${
            showSubmenu === "header" ? "bg-accent text-foreground" : "text-foreground/80"
          }`}
          title="En-têtes"
        >
          <Settings className="h-3.5 w-3.5 stroke-[1.8]" />
          <span>En-têtes</span>
          <ChevronDown className="h-3 w-3 opacity-40 shrink-0 stroke-[1.8]" />
        </button>

        <div className="h-3.5 w-[1px] bg-border/40 mx-0.5 shrink-0" />

        {/* Delete entire table */}
        <button
          type="button"
          onClick={() => safeExecute(() => {
            editor.chain().focus().deleteTable().run();
            setIsVisible(false);
          })}
          className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 text-foreground/70 cursor-pointer focus:outline-none"
          title="Supprimer le tableau"
        >
          <Table className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
      </div>

      {/* Submenus */}
      {showSubmenu === "insert" && (
        <div className="border-t border-border/30 mt-0.5 pt-0.5 w-full space-y-0.5 animate-fade-in p-1 select-none min-w-[200px]">
          <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
            Insérer
          </div>
          
          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().addColumnBefore().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-500 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Colonne avant</span>
          </button>

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().addColumnAfter().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Colonne après</span>
          </button>

          <div className="h-[1px] bg-border/30 my-1" />

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().addRowBefore().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <ArrowUp className="h-3.5 w-3.5 text-green-500 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Ligne avant</span>
          </button>

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().addRowAfter().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <ArrowDown className="h-3.5 w-3.5 text-green-500 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Ligne après</span>
          </button>
        </div>
      )}

      {showSubmenu === "delete" && (
        <div className="border-t border-border/30 mt-0.5 pt-0.5 w-full space-y-0.5 animate-fade-in p-1 select-none min-w-[200px]">
          <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
            Supprimer
          </div>
          
          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().deleteColumn().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-destructive/10 hover:text-destructive text-foreground/80 cursor-pointer transition-colors"
          >
            <Columns className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Supprimer la colonne</span>
          </button>

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().deleteRow().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-destructive/10 hover:text-destructive text-foreground/80 cursor-pointer transition-colors"
          >
            <Rows className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Supprimer la ligne</span>
          </button>

          <div className="h-[1px] bg-border/30 my-1" />

          <button
            type="button"
            onClick={() => safeExecute(() => {
              editor.chain().focus().deleteTable().run();
              setIsVisible(false);
            })}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-destructive/10 hover:text-destructive text-foreground/80 cursor-pointer transition-colors font-semibold"
          >
            <Table className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Supprimer le tableau</span>
          </button>
        </div>
      )}

      {showSubmenu === "merge" && (
        <div className="border-t border-border/30 mt-0.5 pt-0.5 w-full space-y-0.5 animate-fade-in p-1 select-none min-w-[200px]">
          <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
            Cellules
          </div>
          
          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().mergeCells().run())}
            disabled={!editor.can().mergeCells()}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Merge className="h-3.5 w-3.5 text-violet-500 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Fusionner les cellules</span>
          </button>

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().splitCell().run())}
            disabled={!editor.can().splitCell()}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Split className="h-3.5 w-3.5 text-violet-500 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Diviser la cellule</span>
          </button>

          <div className="h-[1px] bg-border/30 my-1" />

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().goToNextCell().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 stroke-[1.8]" />
            <span className="font-medium">Cellule suivante</span>
            <kbd className="ml-auto text-[9px] text-muted-foreground/60 font-mono">Tab</kbd>
          </button>

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().goToPreviousCell().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0 stroke-[1.8]" />
            <span className="font-medium">Cellule précédente</span>
            <kbd className="ml-auto text-[9px] text-muted-foreground/60 font-mono">⇧Tab</kbd>
          </button>
        </div>
      )}

      {showSubmenu === "header" && (
        <div className="border-t border-border/30 mt-0.5 pt-0.5 w-full space-y-0.5 animate-fade-in p-1 select-none min-w-[220px]">
          <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
            En-têtes
          </div>
          
          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().toggleHeaderColumn().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <div className="h-3.5 w-3.5 flex items-center justify-center shrink-0">
              {editor.isActive("table", { headerColumn: true }) && (
                <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2]" />
              )}
            </div>
            <span className="font-medium">Colonne d'en-tête</span>
          </button>

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().toggleHeaderRow().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <div className="h-3.5 w-3.5 flex items-center justify-center shrink-0">
              {editor.isActive("table", { headerRow: true }) && (
                <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2]" />
              )}
            </div>
            <span className="font-medium">Ligne d'en-tête</span>
          </button>

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().toggleHeaderCell().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <div className="h-3.5 w-3.5 flex items-center justify-center shrink-0">
              {editor.isActive("tableHeader") && (
                <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2]" />
              )}
            </div>
            <span className="font-medium">Cellule d'en-tête</span>
          </button>

          <div className="h-[1px] bg-border/30 my-1" />

          <button
            type="button"
            onClick={() => safeExecute(() => editor.chain().focus().fixTables().run())}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent/50 text-foreground/80 cursor-pointer transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-amber-500 shrink-0 stroke-[1.8]" />
            <span className="font-medium">Réparer le tableau</span>
          </button>
        </div>
      )}
    </div>
  );
}
