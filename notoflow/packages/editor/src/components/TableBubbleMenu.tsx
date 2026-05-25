"use client";

import { Editor } from "@tiptap/react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Palette,
  ArrowLeftRight,
  Merge,
  Split,
  Check,
  ChevronsLeftRight,
  ChevronsUpDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface TableBubbleMenuProps {
  editor: Editor;
}

const TABLE_COLORS = [
  { label: "Défaut", value: "", bg: "bg-transparent", cssColor: "transparent" },
  { label: "Gris clair", value: "gray-light", bg: "bg-gray-50 dark:bg-gray-900/30", cssColor: "#f9fafb" },
  { label: "Gris", value: "gray", bg: "bg-gray-100 dark:bg-gray-800", cssColor: "#f3f4f6" },
  { label: "Bleu clair", value: "blue-light", bg: "bg-blue-50 dark:bg-blue-900/20", cssColor: "#eff6ff" },
  { label: "Bleu", value: "blue", bg: "bg-blue-100 dark:bg-blue-900/40", cssColor: "#dbeafe" },
  { label: "Vert clair", value: "green-light", bg: "bg-green-50 dark:bg-green-900/20", cssColor: "#f0fdf4" },
  { label: "Vert", value: "green", bg: "bg-green-100 dark:bg-green-900/40", cssColor: "#dcfce7" },
  { label: "Jaune clair", value: "yellow-light", bg: "bg-yellow-50 dark:bg-yellow-900/20", cssColor: "#fefce8" },
  { label: "Jaune", value: "yellow", bg: "bg-yellow-100 dark:bg-yellow-900/40", cssColor: "#fef9c3" },
  { label: "Orange clair", value: "orange-light", bg: "bg-orange-50 dark:bg-orange-900/20", cssColor: "#fff7ed" },
  { label: "Orange", value: "orange", bg: "bg-orange-100 dark:bg-orange-900/40", cssColor: "#fed7aa" },
  { label: "Rouge clair", value: "red-light", bg: "bg-red-50 dark:bg-red-900/20", cssColor: "#fef2f2" },
  { label: "Rouge", value: "red", bg: "bg-red-100 dark:bg-red-900/40", cssColor: "#fee2e2" },
  { label: "Violet clair", value: "purple-light", bg: "bg-purple-50 dark:bg-purple-900/20", cssColor: "#faf5ff" },
  { label: "Violet", value: "purple", bg: "bg-purple-100 dark:bg-purple-900/40", cssColor: "#f3e8ff" },
  { label: "Rose clair", value: "pink-light", bg: "bg-pink-50 dark:bg-pink-900/20", cssColor: "#fdf2f8" },
  { label: "Rose", value: "pink", bg: "bg-pink-100 dark:bg-pink-900/40", cssColor: "#fce7f3" },
];

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const [isInTable, setIsInTable] = useState(false);
  const [tableRect, setTableRect] = useState<DOMRect | null>(null);
  const [numColumns, setNumColumns] = useState(0);
  const [numRows, setNumRows] = useState(0);
  const [activeColumnMenu, setActiveColumnMenu] = useState<number | null>(null);
  const [activeRowMenu, setActiveRowMenu] = useState<number | null>(null);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updateTableInfo = () => {
      const active = editor.isActive("table");
      setIsInTable(active);

      if (!active) {
        setTableRect(null);
        return;
      }

      try {
        const { from } = editor.state.selection;
        const domAtPos = editor.view.domAtPos(from);
        const tableEl = (domAtPos.node as HTMLElement)?.closest("table");

        if (tableEl) {
          setTableRect(tableEl.getBoundingClientRect());
          const rows = tableEl.querySelectorAll("tr");
          setNumRows(rows.length);
          if (rows.length > 0) {
            setNumColumns(rows[0].querySelectorAll("th, td").length);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    editor.on("selectionUpdate", updateTableInfo);
    editor.on("update", updateTableInfo);
    updateTableInfo();

    return () => {
      editor.off("selectionUpdate", updateTableInfo);
      editor.off("update", updateTableInfo);
    };
  }, [editor]);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node) &&
        rowMenuRef.current &&
        !rowMenuRef.current.contains(event.target as Node) &&
        tableMenuRef.current &&
        !tableMenuRef.current.contains(event.target as Node)
      ) {
        setActiveColumnMenu(null);
        setActiveRowMenu(null);
        setShowTableMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor || !isInTable || !tableRect) return null;

  const safeExecute = (action: () => void) => {
    try {
      action();
      setActiveColumnMenu(null);
      setActiveRowMenu(null);
      setShowTableMenu(false);
    } catch (error) {
      console.error("Erreur lors de l'exécution de l'action table:", error);
    }
  };

  // Fonction pour appliquer une couleur à une cellule (méthode TipTap officielle)
  const applyCellColor = (colorValue: string) => {
    try {
      const color = TABLE_COLORS.find((c) => c.value === colorValue);
      const backgroundColor = color?.cssColor === "transparent" ? null : color?.cssColor;

      if (!editor.can().setCellAttribute("backgroundColor", backgroundColor)) {
        console.warn("Cannot set cell attribute - not in a table cell");
        return;
      }

      editor
        .chain()
        .focus()
        .setCellAttribute("backgroundColor", backgroundColor)
        .run();
    } catch (error) {
      console.error("Erreur lors de l'application de la couleur:", error);
    }
  };

  // Fonction pour redimensionner une colonne (via colwidth)
  const resizeColumn = (increase: boolean) => {
    try {
      const { state } = editor;
      const { selection } = state;
      
      // Trouver la position de la cellule
      let cellPos = selection.$anchor.pos;
      let depth = selection.$anchor.depth;
      
      // Remonter jusqu'à trouver une cellule de tableau
      while (depth > 0) {
        const node = selection.$anchor.node(depth);
        if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
          cellPos = selection.$anchor.before(depth);
          break;
        }
        depth--;
      }
      
      const cell = state.doc.nodeAt(cellPos);
      
      if (!cell || (cell.type.name !== "tableCell" && cell.type.name !== "tableHeader")) {
        console.warn("Pas dans une cellule de tableau");
        return;
      }

      // Récupérer la largeur actuelle
      const currentColwidth = cell.attrs.colwidth?.[0] || 150;
      const newColwidth = increase 
        ? currentColwidth + 20 
        : Math.max(80, currentColwidth - 20);

      // Vérifier si on peut appliquer
      if (!editor.can().setCellAttribute("colwidth", [newColwidth])) {
        console.warn("Cannot set colwidth");
        return;
      }

      // Appliquer la nouvelle largeur
      editor
        .chain()
        .focus()
        .setCellAttribute("colwidth", [newColwidth])
        .run();
        
      console.log(`✅ Colonne redimensionnée: ${currentColwidth}px → ${newColwidth}px`);
    } catch (error) {
      console.error("Erreur lors du redimensionnement:", error);
    }
  };

  // Fonction pour redimensionner une ligne (via style inline)
  const resizeRow = (increase: boolean) => {
    try {
      const { from } = editor.state.selection;
      const domAtPos = editor.view.domAtPos(from);
      const row = (domAtPos.node as HTMLElement)?.closest("tr") as HTMLElement;
      
      if (row) {
        const cells = row.querySelectorAll("td, th");
        cells.forEach((cell: Element) => {
          const htmlCell = cell as HTMLElement;
          const currentHeight = htmlCell.style.height || "40px";
          const currentValue = parseInt(currentHeight);
          const newValue = increase ? currentValue + 10 : Math.max(30, currentValue - 10);
          htmlCell.style.height = `${newValue}px`;
        });
      }
    } catch (error) {
      console.error("Erreur lors du redimensionnement:", error);
    }
  };

  const editorRect = editor.view.dom.getBoundingClientRect();
  const relativeTop = tableRect.top - editorRect.top;
  const relativeLeft = tableRect.left - editorRect.left;

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        top: `${relativeTop}px`,
        left: `${relativeLeft}px`,
        width: `${tableRect.width}px`,
        height: `${tableRect.height}px`,
      }}
    >
      {/* Contrôles de colonnes */}
      <div
        className="absolute -top-9 left-0 right-0 flex gap-0.5 pointer-events-auto"
        style={{ height: "32px" }}
        onMouseLeave={() => {
          if (activeColumnMenu === null) setHoveredColumn(null);
        }}
      >
        {Array.from({ length: numColumns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="flex-1 flex items-center justify-center relative"
            onMouseEnter={() => setHoveredColumn(colIndex)}
          >
            <button
              type="button"
              onClick={() => setActiveColumnMenu(activeColumnMenu === colIndex ? null : colIndex)}
              className={`h-7 px-2.5 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold shadow-sm ${
                hoveredColumn === colIndex || activeColumnMenu === colIndex
                  ? "bg-accent text-foreground opacity-100"
                  : "bg-accent/70 text-foreground/60 opacity-0 group-hover:opacity-100"
              }`}
              style={{
                opacity: hoveredColumn === colIndex || activeColumnMenu === colIndex ? 1 : 0,
              }}
              onMouseEnter={() => setHoveredColumn(colIndex)}
            >
              <Plus className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Menu contextuel colonne */}
            {activeColumnMenu === colIndex && (
              <div
                ref={columnMenuRef}
                className="absolute top-9 left-1/2 -translate-x-1/2 z-50 w-56 rounded-xl border border-border bg-popover/98 backdrop-blur-md p-1.5 shadow-2xl"
                onMouseEnter={() => setHoveredColumn(colIndex)}
              >
                <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
                  Colonne {colIndex + 1}
                </div>

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().addColumnBefore().run())}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">Insérer à gauche</span>
                </button>

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().addColumnAfter().run())}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">Insérer à droite</span>
                </button>

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().mergeCells().run())}
                  disabled={!editor.can().mergeCells()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Merge className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium">Fusionner les cellules</span>
                </button>

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().splitCell().run())}
                  disabled={!editor.can().splitCell()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Split className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium">Diviser la cellule</span>
                </button>

                <div className="h-[1px] bg-border/30 my-1.5" />

                {/* Redimensionnement de colonne */}
                <div className="px-2 py-1">
                  <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-2">
                    Largeur
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resizeColumn(false)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsLeftRight className="h-3.5 w-3.5 rotate-180 scale-x-75" />
                      <span className="font-medium">−</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resizeColumn(true)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsLeftRight className="h-3.5 w-3.5 scale-x-125" />
                      <span className="font-medium">+</span>
                    </button>
                  </div>
                </div>

                <div className="h-[1px] bg-border/30 my-1.5" />

                {/* Couleur de colonne */}
                <div className="px-2 py-1">
                  <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Couleur
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {TABLE_COLORS.slice(0, 12).map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          applyCellColor(color.value);
                          setActiveColumnMenu(null);
                        }}
                        className={`h-6 rounded-md border border-border/60 hover:border-foreground/40 hover:scale-110 transition ${color.bg}`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().deleteColumn().run())}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-destructive/10 hover:text-destructive text-foreground/90 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Supprimer la colonne</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contrôles de lignes */}
      <div
        className="absolute -left-9 top-0 bottom-0 flex flex-col gap-0.5 pointer-events-auto"
        style={{ width: "32px" }}
        onMouseLeave={() => {
          if (activeRowMenu === null) setHoveredRow(null);
        }}
      >
        {Array.from({ length: numRows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex-1 flex items-center justify-center relative"
            onMouseEnter={() => setHoveredRow(rowIndex)}
          >
            <button
              type="button"
              onClick={() => setActiveRowMenu(activeRowMenu === rowIndex ? null : rowIndex)}
              className={`w-7 py-2.5 rounded-md transition-all flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold shadow-sm ${
                hoveredRow === rowIndex || activeRowMenu === rowIndex
                  ? "bg-accent text-foreground opacity-100"
                  : "bg-accent/70 text-foreground/60 opacity-0"
              }`}
              style={{
                opacity: hoveredRow === rowIndex || activeRowMenu === rowIndex ? 1 : 0,
              }}
              onMouseEnter={() => setHoveredRow(rowIndex)}
            >
              <Plus className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3 rotate-90" />
            </button>

            {/* Menu contextuel ligne */}
            {activeRowMenu === rowIndex && (
              <div
                ref={rowMenuRef}
                className="absolute left-9 top-1/2 -translate-y-1/2 z-50 w-56 rounded-xl border border-border bg-popover/98 backdrop-blur-md p-1.5 shadow-2xl"
                onMouseEnter={() => setHoveredRow(rowIndex)}
              >
                <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
                  Ligne {rowIndex + 1}
                </div>

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().addRowBefore().run())}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium">Insérer au-dessus</span>
                </button>

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().addRowAfter().run())}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium">Insérer en-dessous</span>
                </button>

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().mergeCells().run())}
                  disabled={!editor.can().mergeCells()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Merge className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium">Fusionner les cellules</span>
                </button>

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().splitCell().run())}
                  disabled={!editor.can().splitCell()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Split className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium">Diviser la cellule</span>
                </button>

                <div className="h-[1px] bg-border/30 my-1.5" />

                {/* Redimensionnement de ligne */}
                <div className="px-2 py-1">
                  <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-2">
                    Hauteur
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resizeRow(false)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5 rotate-180 scale-y-75" />
                      <span className="font-medium">−</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resizeRow(true)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5 scale-y-125" />
                      <span className="font-medium">+</span>
                    </button>
                  </div>
                </div>

                <div className="h-[1px] bg-border/30 my-1.5" />

                {/* Couleur de ligne */}
                <div className="px-2 py-1">
                  <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Couleur
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {TABLE_COLORS.slice(0, 12).map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          applyCellColor(color.value);
                          setActiveRowMenu(null);
                        }}
                        className={`h-6 rounded-md border border-border/60 hover:border-foreground/40 hover:scale-110 transition ${color.bg}`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() => safeExecute(() => editor.chain().focus().deleteRow().run())}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-destructive/10 hover:text-destructive text-foreground/90 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Supprimer la ligne</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton menu du tableau (coin supérieur gauche) */}
      <div className="absolute -top-9 -left-9 pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowTableMenu(!showTableMenu)}
          className={`h-7 w-7 rounded-md transition-all flex items-center justify-center shadow-sm ${
            showTableMenu
              ? "bg-accent text-foreground opacity-100"
              : "bg-accent/70 text-foreground/60 opacity-0 hover:opacity-100"
          }`}
          title="Options du tableau"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Menu contextuel du tableau */}
        {showTableMenu && (
          <div
            ref={tableMenuRef}
            className="absolute top-9 left-0 z-50 w-64 rounded-xl border border-border bg-popover/98 backdrop-blur-md p-1.5 shadow-2xl"
          >
            <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1.5">
              Options du tableau
            </div>

            {/* En-têtes */}
            <div className="space-y-0.5 mb-2">
              <button
                type="button"
                onClick={() => safeExecute(() => editor.chain().focus().toggleHeaderRow().run())}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
              >
                <div className="h-4 w-4 flex items-center justify-center">
                  {editor.isActive("table", { headerRow: true }) && (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="font-medium">Ligne d'en-tête</span>
              </button>

              <button
                type="button"
                onClick={() => safeExecute(() => editor.chain().focus().toggleHeaderColumn().run())}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
              >
                <div className="h-4 w-4 flex items-center justify-center">
                  {editor.isActive("table", { headerColumn: true }) && (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="font-medium">Colonne d'en-tête</span>
              </button>
            </div>

            <div className="h-[1px] bg-border/30 my-1.5" />

            {/* Couleurs du tableau */}
            <div className="px-2 py-1.5">
              <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-2">
                Couleur de fond
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {TABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => {
                      // Note: Cette fonctionnalité nécessiterait une extension TipTap custom
                      // Pour l'instant, on peut juste fermer le menu
                      setShowTableMenu(false);
                    }}
                    className={`h-7 rounded-md border border-border/60 hover:border-foreground/40 transition ${color.bg}`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-border/30 my-1.5" />

            {/* Actions avancées */}
            <button
              type="button"
              onClick={() => safeExecute(() => editor.chain().focus().fixTables().run())}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium">Réparer le tableau</span>
            </button>

            <div className="h-[1px] bg-border/30 my-1.5" />

            <button
              type="button"
              onClick={() => safeExecute(() => editor.chain().focus().deleteTable().run())}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-destructive/10 hover:text-destructive text-foreground/90 cursor-pointer transition-colors font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="font-medium">Supprimer le tableau</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
