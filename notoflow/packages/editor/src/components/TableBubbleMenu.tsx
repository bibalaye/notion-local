"use client";

import { Editor } from "@tiptap/react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Palette,
  Merge,
  Split,
  Check,
  ChevronsLeftRight,
  ChevronsUpDown,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface TableBubbleMenuProps {
  editor: Editor;
}

/* ─── Palette de couleurs Notion ────────────────────────────────── */
const TABLE_COLORS = [
  { label: "Défaut", value: "", cssColor: "transparent" },
  { label: "Gris clair", value: "gray-light", cssColor: "#f9fafb" },
  { label: "Gris", value: "gray", cssColor: "#f3f4f6" },
  { label: "Bleu clair", value: "blue-light", cssColor: "#eff6ff" },
  { label: "Bleu", value: "blue", cssColor: "#dbeafe" },
  { label: "Vert clair", value: "green-light", cssColor: "#f0fdf4" },
  { label: "Vert", value: "green", cssColor: "#dcfce7" },
  { label: "Jaune clair", value: "yellow-light", cssColor: "#fefce8" },
  { label: "Jaune", value: "yellow", cssColor: "#fef9c3" },
  { label: "Orange clair", value: "orange-light", cssColor: "#fff7ed" },
  { label: "Orange", value: "orange", cssColor: "#fed7aa" },
  { label: "Rouge clair", value: "red-light", cssColor: "#fef2f2" },
  { label: "Rouge", value: "red", cssColor: "#fee2e2" },
  { label: "Violet clair", value: "purple-light", cssColor: "#faf5ff" },
  { label: "Violet", value: "purple", cssColor: "#f3e8ff" },
  { label: "Rose clair", value: "pink-light", cssColor: "#fdf2f8" },
  { label: "Rose", value: "pink", cssColor: "#fce7f3" },
];

/* ─── Types internes ────────────────────────────────────────────── */
interface ColumnRect {
  left: number;
  width: number;
}
interface RowRect {
  top: number;
  height: number;
}

/* ─── Composant principal ───────────────────────────────────────── */
export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  // Référence au <table> DOM survolé
  const [hoveredTable, setHoveredTable] = useState<HTMLTableElement | null>(null);
  const [tableRect, setTableRect] = useState<DOMRect | null>(null);
  const [editorRect, setEditorRect] = useState<DOMRect | null>(null);

  // Géométrie précise des colonnes et lignes
  const [columnRects, setColumnRects] = useState<ColumnRect[]>([]);
  const [rowRects, setRowRects] = useState<RowRect[]>([]);

  // Colonnes/lignes survolées
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Menus contextuels ouverts
  const [activeColumnMenu, setActiveColumnMenu] = useState<number | null>(null);
  const [activeRowMenu, setActiveRowMenu] = useState<number | null>(null);
  const [showTableMenu, setShowTableMenu] = useState(false);

  // Refs pour le click-outside
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Timer anti-scintillement
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Helpers ───────────────────────────────────────────────────── */

  /** Calculer la géométrie exacte des colonnes et lignes d'un <table> */
  const computeTableGeometry = useCallback(
    (table: HTMLTableElement) => {
      const tRect = table.getBoundingClientRect();
      const eRect = editor.view.dom.getBoundingClientRect();

      setTableRect(tRect);
      setEditorRect(eRect);

      // Colonnes : on utilise la première ligne pour obtenir les positions exactes
      const firstRow = table.querySelector("tr");
      const cols: ColumnRect[] = [];
      if (firstRow) {
        const cells = firstRow.querySelectorAll("th, td");
        cells.forEach((cell) => {
          const r = cell.getBoundingClientRect();
          cols.push({
            left: r.left - tRect.left,
            width: r.width,
          });
        });
      }
      setColumnRects(cols);

      // Lignes : getBoundingClientRect de chaque <tr>
      const rows: RowRect[] = [];
      const trs = table.querySelectorAll("tr");
      trs.forEach((tr) => {
        const r = tr.getBoundingClientRect();
        rows.push({
          top: r.top - tRect.top,
          height: r.height,
        });
      });
      setRowRects(rows);
    },
    [editor],
  );

  /** Placer la sélection dans la cellule à la colonne/ligne donnée pour que les commandes TipTap s'y appliquent */
  const focusCellAt = useCallback(
    (rowIdx: number, colIdx: number) => {
      if (!hoveredTable) return;
      const rows = hoveredTable.querySelectorAll("tr");
      const row = rows[rowIdx];
      if (!row) return;
      const cells = row.querySelectorAll("th, td");
      const cell = cells[colIdx];
      if (!cell) return;

      try {
        const pos = editor.view.posAtDOM(cell, 0);
        editor.chain().focus(pos).run();
      } catch {
        // Fallback silencieux
      }
    },
    [editor, hoveredTable],
  );

  /** Focus sur la première cellule de la colonne donnée */
  const focusColumn = useCallback(
    (colIdx: number) => {
      focusCellAt(0, colIdx);
    },
    [focusCellAt],
  );

  /** Focus sur la première cellule de la ligne donnée */
  const focusRow = useCallback(
    (rowIdx: number) => {
      focusCellAt(rowIdx, 0);
    },
    [focusCellAt],
  );

  /** Annuler le timer de masquage */
  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  /** Programmer le masquage des contrôles après un délai */
  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimeoutRef.current = setTimeout(() => {
      // Ne pas masquer si un menu est ouvert
      if (activeColumnMenu !== null || activeRowMenu !== null || showTableMenu) return;
      setHoveredTable(null);
      setHoveredColumn(null);
      setHoveredRow(null);
      hideTimeoutRef.current = null;
    }, 300);
  }, [cancelHide, activeColumnMenu, activeRowMenu, showTableMenu]);

  /* ─── Écoute du survol au niveau du DOM de l'éditeur ──────────── */
  useEffect(() => {
    if (!editor) return;

    const editorDom = editor.view.dom;

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tableEl = target.closest("table") as HTMLTableElement | null;

      if (tableEl && editorDom.contains(tableEl)) {
        cancelHide();
        setHoveredTable(tableEl);
        computeTableGeometry(tableEl);

        // Détecter la colonne et la ligne survolée
        const cell = target.closest("td, th") as HTMLElement | null;
        if (cell) {
          const row = cell.closest("tr");
          if (row) {
            const trs = tableEl.querySelectorAll("tr");
            const rowIdx = Array.from(trs).indexOf(row);
            setHoveredRow(rowIdx >= 0 ? rowIdx : null);

            const cells = row.querySelectorAll("th, td");
            const colIdx = Array.from(cells).indexOf(cell);
            setHoveredColumn(colIdx >= 0 ? colIdx : null);
          }
        }
      } else {
        // Vérifier si on est dans la zone des contrôles
        if (controlsRef.current && controlsRef.current.contains(target)) {
          cancelHide();
          return;
        }
        scheduleHide();
      }
    };

    const handleMouseLeave = () => {
      scheduleHide();
    };

    editorDom.addEventListener("mousemove", handleMouseMove);
    editorDom.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      editorDom.removeEventListener("mousemove", handleMouseMove);
      editorDom.removeEventListener("mouseleave", handleMouseLeave);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [editor, cancelHide, scheduleHide, computeTableGeometry]);

  /* ─── Fermer les menus au clic extérieur ─────────────────────── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideColumn = columnMenuRef.current?.contains(target);
      const isInsideRow = rowMenuRef.current?.contains(target);
      const isInsideTable = tableMenuRef.current?.contains(target);
      const isInsideControls = controlsRef.current?.contains(target);

      if (!isInsideColumn && !isInsideRow && !isInsideTable && !isInsideControls) {
        setActiveColumnMenu(null);
        setActiveRowMenu(null);
        setShowTableMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ─── Recalcul de la géométrie sur les mises à jour de l'éditeur */
  useEffect(() => {
    if (!editor || !hoveredTable) return;

    const refresh = () => {
      if (hoveredTable && document.body.contains(hoveredTable)) {
        computeTableGeometry(hoveredTable);
      } else {
        setHoveredTable(null);
      }
    };

    editor.on("update", refresh);
    return () => {
      editor.off("update", refresh);
    };
  }, [editor, hoveredTable, computeTableGeometry]);

  /* ─── Early exit ─────────────────────────────────────────────── */
  if (!editor || !hoveredTable || !tableRect || !editorRect) return null;

  /* ─── Actions ────────────────────────────────────────────────── */
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

  const relativeTop = tableRect.top - editorRect.top;
  const relativeLeft = tableRect.left - editorRect.left;

  /* ─── Couleur : cellule, ligne, colonne, tableau ─────────────── */
  const resolveColor = (colorValue: string) => {
    const color = TABLE_COLORS.find((c) => c.value === colorValue);
    return color?.cssColor === "transparent" ? null : (color?.cssColor ?? null);
  };

  const applyColumnColor = (colIdx: number, colorValue: string) => {
    const backgroundColor = resolveColor(colorValue);
    focusColumn(colIdx);

    // Attendre le focus puis appliquer via transaction ProseMirror
    requestAnimationFrame(() => {
      try {
        const { state, view } = editor;
        const tableEl = hoveredTable;
        if (!tableEl) return;

        // Trouver le nœud table dans le document ProseMirror
        const firstCell = tableEl.querySelector("td, th");
        if (!firstCell) return;
        const pos = editor.view.posAtDOM(firstCell, 0);
        const $pos = state.doc.resolve(pos);

        // Remonter jusqu'au nœud table
        let tableDepth = $pos.depth;
        while (tableDepth > 0 && $pos.node(tableDepth).type.name !== "table") {
          tableDepth--;
        }
        if (tableDepth === 0) return;

        const tablePos = $pos.before(tableDepth);
        const tableNode = state.doc.nodeAt(tablePos);
        if (!tableNode) return;

        let tr = state.tr;
        let currentRowPos = tablePos + 1;

        tableNode.forEach((rowNode) => {
          if (rowNode.type.name === "tableRow") {
            let currentColIndex = 0;
            let currentCellPos = currentRowPos + 1;

            rowNode.forEach((cellNode) => {
              if (currentColIndex === colIdx) {
                tr = tr.setNodeAttribute(currentCellPos, "backgroundColor", backgroundColor);
              }
              currentCellPos += cellNode.nodeSize;
              currentColIndex++;
            });
          }
          currentRowPos += rowNode.nodeSize;
        });

        view.dispatch(tr);
      } catch (error) {
        console.error("Erreur lors de l'application de la couleur sur la colonne:", error);
      }
    });
  };

  const applyRowColor = (rowIdx: number, colorValue: string) => {
    const backgroundColor = resolveColor(colorValue);
    focusRow(rowIdx);

    requestAnimationFrame(() => {
      try {
        const { state, view } = editor;
        const tableEl = hoveredTable;
        if (!tableEl) return;

        const firstCell = tableEl.querySelector("td, th");
        if (!firstCell) return;
        const pos = editor.view.posAtDOM(firstCell, 0);
        const $pos = state.doc.resolve(pos);

        let tableDepth = $pos.depth;
        while (tableDepth > 0 && $pos.node(tableDepth).type.name !== "table") {
          tableDepth--;
        }
        if (tableDepth === 0) return;

        const tablePos = $pos.before(tableDepth);
        const tableNode = state.doc.nodeAt(tablePos);
        if (!tableNode) return;

        let tr = state.tr;
        let currentRowPos = tablePos + 1;
        let currentRowIdx = 0;

        tableNode.forEach((rowNode) => {
          if (rowNode.type.name === "tableRow" && currentRowIdx === rowIdx) {
            let currentCellPos = currentRowPos + 1;
            rowNode.forEach((cellNode) => {
              tr = tr.setNodeAttribute(currentCellPos, "backgroundColor", backgroundColor);
              currentCellPos += cellNode.nodeSize;
            });
          }
          currentRowPos += rowNode.nodeSize;
          currentRowIdx++;
        });

        view.dispatch(tr);
      } catch (error) {
        console.error("Erreur lors de l'application de la couleur sur la ligne:", error);
      }
    });
  };

  const applyTableColor = (colorValue: string) => {
    const backgroundColor = resolveColor(colorValue);

    try {
      const { state, view } = editor;
      const tableEl = hoveredTable;
      if (!tableEl) return;

      const firstCell = tableEl.querySelector("td, th");
      if (!firstCell) return;
      const pos = editor.view.posAtDOM(firstCell, 0);
      const $pos = state.doc.resolve(pos);

      let tableDepth = $pos.depth;
      while (tableDepth > 0 && $pos.node(tableDepth).type.name !== "table") {
        tableDepth--;
      }
      if (tableDepth === 0) return;

      const tablePos = $pos.before(tableDepth);
      const tableNode = state.doc.nodeAt(tablePos);
      if (!tableNode) return;

      let tr = state.tr;
      let currentRowPos = tablePos + 1;

      tableNode.forEach((rowNode) => {
        if (rowNode.type.name === "tableRow") {
          let currentCellPos = currentRowPos + 1;
          rowNode.forEach((cellNode) => {
            tr = tr.setNodeAttribute(currentCellPos, "backgroundColor", backgroundColor);
            currentCellPos += cellNode.nodeSize;
          });
        }
        currentRowPos += rowNode.nodeSize;
      });

      view.dispatch(tr);
      setShowTableMenu(false);
    } catch (error) {
      console.error("Erreur lors de l'application de la couleur sur le tableau:", error);
    }
  };

  /** Redimensionner une colonne via colwidth */
  const resizeColumn = (colIdx: number, increase: boolean) => {
    focusColumn(colIdx);
    requestAnimationFrame(() => {
      try {
        const { state } = editor;
        const { selection } = state;

        let depth = selection.$anchor.depth;
        while (depth > 0) {
          const node = selection.$anchor.node(depth);
          if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
            break;
          }
          depth--;
        }
        if (depth === 0) return;

        const cellPos = selection.$anchor.before(depth);
        const cell = state.doc.nodeAt(cellPos);
        if (!cell) return;

        const currentColwidth = cell.attrs.colwidth?.[0] || 150;
        const newColwidth = increase ? currentColwidth + 20 : Math.max(80, currentColwidth - 20);

        editor.chain().focus().setCellAttribute("colwidth", [newColwidth]).run();
      } catch (error) {
        console.error("Erreur lors du redimensionnement:", error);
      }
    });
  };

  /** Redimensionner une ligne via style inline DOM */
  const resizeRow = (rowIdx: number, increase: boolean) => {
    try {
      const rows = hoveredTable.querySelectorAll("tr");
      const row = rows[rowIdx] as HTMLElement;
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

  /* ─── Rendu des grilles de couleurs ─────────────────────────── */
  const renderColorGrid = (onSelect: (value: string) => void) => (
    <div className="px-2 py-1">
      <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-2 flex items-center gap-1">
        <Palette className="h-3 w-3" />
        Couleur
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {TABLE_COLORS.slice(0, 12).map((color) => (
          <button
            key={color.value || "default"}
            type="button"
            onClick={() => onSelect(color.value)}
            className="h-6 rounded-md border border-border/60 hover:border-foreground/40 hover:scale-110 transition-all duration-150 cursor-pointer"
            style={{
              backgroundColor: color.cssColor === "transparent" ? undefined : color.cssColor,
            }}
            title={color.label}
          />
        ))}
      </div>
    </div>
  );

  /* ─── Rendu ──────────────────────────────────────────────────── */
  return (
    <div
      ref={controlsRef}
      className="absolute pointer-events-none z-10"
      style={{
        top: `${relativeTop}px`,
        left: `${relativeLeft}px`,
        width: `${tableRect.width}px`,
        height: `${tableRect.height}px`,
      }}
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
    >
      {/* ──────────────────────────────────────────────────────────
          Poignées de colonnes (en haut du tableau)
          ────────────────────────────────────────────────────────── */}
      <div
        className="absolute -top-9 left-0 right-0 pointer-events-auto"
        style={{ height: "32px" }}
        onMouseLeave={() => {
          if (activeColumnMenu === null) setHoveredColumn(null);
        }}
      >
        {columnRects.map((col, colIndex) => (
          <div
            key={colIndex}
            className="absolute flex items-center justify-center"
            style={{
              left: `${col.left}px`,
              width: `${col.width}px`,
              top: 0,
              height: "32px",
            }}
            onMouseEnter={() => {
              cancelHide();
              setHoveredColumn(colIndex);
            }}
          >
            <button
              type="button"
              onClick={() => {
                focusColumn(colIndex);
                setActiveColumnMenu(activeColumnMenu === colIndex ? null : colIndex);
              }}
              className="h-7 px-2 rounded-md transition-all duration-150 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
              style={{
                opacity: hoveredColumn === colIndex || activeColumnMenu === colIndex ? 1 : 0,
                transform:
                  hoveredColumn === colIndex || activeColumnMenu === colIndex
                    ? "scale(1)"
                    : "scale(0.9)",
                backgroundColor:
                  hoveredColumn === colIndex || activeColumnMenu === colIndex
                    ? "hsl(var(--accent))"
                    : "hsl(var(--accent) / 0.7)",
                color:
                  hoveredColumn === colIndex || activeColumnMenu === colIndex
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--foreground) / 0.6)",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Menu contextuel colonne */}
            {activeColumnMenu === colIndex && (
              <div
                ref={columnMenuRef}
                className="absolute top-9 left-1/2 -translate-x-1/2 z-50 w-56 rounded-xl border border-border bg-popover/98 backdrop-blur-md p-1.5 shadow-2xl animate-fade-in"
                onMouseEnter={cancelHide}
              >
                <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
                  Colonne {colIndex + 1}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusColumn(colIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().addColumnBefore().run(),
                      );
                    })
                  }
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">Insérer à gauche</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusColumn(colIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().addColumnAfter().run(),
                      );
                    })
                  }
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">Insérer à droite</span>
                </button>

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusColumn(colIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().mergeCells().run(),
                      );
                    })
                  }
                  disabled={!editor.can().mergeCells()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Merge className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium">Fusionner les cellules</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusColumn(colIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().splitCell().run(),
                      );
                    })
                  }
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
                      onClick={() => resizeColumn(colIndex, false)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsLeftRight className="h-3.5 w-3.5 rotate-180 scale-x-75" />
                      <span className="font-medium">−</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resizeColumn(colIndex, true)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsLeftRight className="h-3.5 w-3.5 scale-x-125" />
                      <span className="font-medium">+</span>
                    </button>
                  </div>
                </div>

                <div className="h-[1px] bg-border/30 my-1.5" />

                {/* Couleur de colonne */}
                {renderColorGrid((value) => {
                  applyColumnColor(colIndex, value);
                  setActiveColumnMenu(null);
                })}

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusColumn(colIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().deleteColumn().run(),
                      );
                    })
                  }
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

      {/* ──────────────────────────────────────────────────────────
          Poignées de lignes (à gauche du tableau)
          ────────────────────────────────────────────────────────── */}
      <div
        className="absolute -left-9 top-0 bottom-0 pointer-events-auto"
        style={{ width: "32px" }}
        onMouseLeave={() => {
          if (activeRowMenu === null) setHoveredRow(null);
        }}
      >
        {rowRects.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="absolute flex items-center justify-center"
            style={{
              top: `${row.top}px`,
              height: `${row.height}px`,
              left: 0,
              width: "32px",
            }}
            onMouseEnter={() => {
              cancelHide();
              setHoveredRow(rowIndex);
            }}
          >
            <button
              type="button"
              onClick={() => {
                focusRow(rowIndex);
                setActiveRowMenu(activeRowMenu === rowIndex ? null : rowIndex);
              }}
              className="w-7 py-2 rounded-md transition-all duration-150 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold cursor-pointer"
              style={{
                opacity: hoveredRow === rowIndex || activeRowMenu === rowIndex ? 1 : 0,
                transform:
                  hoveredRow === rowIndex || activeRowMenu === rowIndex
                    ? "scale(1)"
                    : "scale(0.9)",
                backgroundColor:
                  hoveredRow === rowIndex || activeRowMenu === rowIndex
                    ? "hsl(var(--accent))"
                    : "hsl(var(--accent) / 0.7)",
                color:
                  hoveredRow === rowIndex || activeRowMenu === rowIndex
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--foreground) / 0.6)",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3 rotate-90" />
            </button>

            {/* Menu contextuel ligne */}
            {activeRowMenu === rowIndex && (
              <div
                ref={rowMenuRef}
                className="absolute left-9 top-1/2 -translate-y-1/2 z-50 w-56 rounded-xl border border-border bg-popover/98 backdrop-blur-md p-1.5 shadow-2xl animate-fade-in"
                onMouseEnter={cancelHide}
              >
                <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1">
                  Ligne {rowIndex + 1}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusRow(rowIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().addRowBefore().run(),
                      );
                    })
                  }
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium">Insérer au-dessus</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusRow(rowIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().addRowAfter().run(),
                      );
                    })
                  }
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium">Insérer en-dessous</span>
                </button>

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusRow(rowIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().mergeCells().run(),
                      );
                    })
                  }
                  disabled={!editor.can().mergeCells()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Merge className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium">Fusionner les cellules</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusRow(rowIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().splitCell().run(),
                      );
                    })
                  }
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
                      onClick={() => resizeRow(rowIndex, false)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5 rotate-180 scale-y-75" />
                      <span className="font-medium">−</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resizeRow(rowIndex, true)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors border border-border/60"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5 scale-y-125" />
                      <span className="font-medium">+</span>
                    </button>
                  </div>
                </div>

                <div className="h-[1px] bg-border/30 my-1.5" />

                {/* Couleur de ligne */}
                {renderColorGrid((value) => {
                  applyRowColor(rowIndex, value);
                  setActiveRowMenu(null);
                })}

                <div className="h-[1px] bg-border/30 my-1.5" />

                <button
                  type="button"
                  onClick={() =>
                    safeExecute(() => {
                      focusRow(rowIndex);
                      requestAnimationFrame(() =>
                        editor.chain().focus().deleteRow().run(),
                      );
                    })
                  }
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

      {/* ──────────────────────────────────────────────────────────
          Menu global du tableau (coin supérieur gauche)
          ────────────────────────────────────────────────────────── */}
      <div className="absolute -top-9 -left-9 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            // Focus dans le tableau avant d'ouvrir le menu
            focusCellAt(0, 0);
            setShowTableMenu(!showTableMenu);
          }}
          className="h-7 w-7 rounded-md transition-all duration-150 flex items-center justify-center cursor-pointer"
          style={{
            opacity: showTableMenu ? 1 : 0.7,
            backgroundColor: showTableMenu
              ? "hsl(var(--accent))"
              : "hsl(var(--accent) / 0.7)",
            color: showTableMenu
              ? "hsl(var(--foreground))"
              : "hsl(var(--foreground) / 0.6)",
            boxShadow: showTableMenu
              ? "0 2px 8px rgba(0,0,0,0.12)"
              : "0 1px 3px rgba(0,0,0,0.08)",
          }}
          title="Options du tableau"
          onMouseEnter={cancelHide}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Menu contextuel du tableau */}
        {showTableMenu && (
          <div
            ref={tableMenuRef}
            className="absolute top-9 left-0 z-50 w-64 rounded-xl border border-border bg-popover/98 backdrop-blur-md p-1.5 shadow-2xl animate-fade-in"
            onMouseEnter={cancelHide}
          >
            <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest px-2 py-1.5">
              Options du tableau
            </div>

            {/* En-têtes */}
            <div className="space-y-0.5 mb-2">
              <button
                type="button"
                onClick={() =>
                  safeExecute(() => editor.chain().focus().toggleHeaderRow().run())
                }
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
              >
                <div className="h-4 w-4 flex items-center justify-center">
                  {editor.isActive("table", { headerRow: true }) && (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="font-medium">Ligne d&apos;en-tête</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  safeExecute(() => editor.chain().focus().toggleHeaderColumn().run())
                }
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
              >
                <div className="h-4 w-4 flex items-center justify-center">
                  {editor.isActive("table", { headerColumn: true }) && (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="font-medium">Colonne d&apos;en-tête</span>
              </button>
            </div>

            <div className="h-[1px] bg-border/30 my-1.5" />

            {/* Couleurs du tableau */}
            <div className="px-2 py-1.5">
              <div className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-2">
                Couleur de fond
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {TABLE_COLORS.slice(0, 12).map((color) => (
                  <button
                    key={color.value || "default"}
                    type="button"
                    onClick={() => applyTableColor(color.value)}
                    className="h-7 rounded-md border border-border/60 hover:border-foreground/40 hover:scale-110 transition-all duration-150 cursor-pointer"
                    style={{
                      backgroundColor:
                        color.cssColor === "transparent" ? undefined : color.cssColor,
                    }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-border/30 my-1.5" />

            {/* Réparer le tableau */}
            <button
              type="button"
              onClick={() =>
                safeExecute(() => editor.chain().focus().fixTables().run())
              }
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-accent text-foreground/90 cursor-pointer transition-colors"
            >
              <ChevronsLeftRight className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium">Réparer le tableau</span>
            </button>

            <div className="h-[1px] bg-border/30 my-1.5" />

            {/* Supprimer le tableau */}
            <button
              type="button"
              onClick={() =>
                safeExecute(() => editor.chain().focus().deleteTable().run())
              }
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-destructive/10 hover:text-destructive text-foreground/90 cursor-pointer transition-colors font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="font-medium">Supprimer le tableau</span>
            </button>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          Bouton d'ajout rapide en bas à droite du tableau
          ────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => {
          focusCellAt(rowRects.length - 1, columnRects.length - 1);
          requestAnimationFrame(() => editor.chain().focus().addRowAfter().run());
        }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-125 cursor-pointer opacity-0 hover:opacity-100"
        style={{
          backgroundColor: "hsl(var(--accent))",
          color: "hsl(var(--foreground) / 0.6)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        title="Ajouter une ligne"
        onMouseEnter={cancelHide}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {/* Bouton d'ajout rapide colonne à droite */}
      <button
        type="button"
        onClick={() => {
          focusCellAt(0, columnRects.length - 1);
          requestAnimationFrame(() => editor.chain().focus().addColumnAfter().run());
        }}
        className="absolute -right-4 top-1/2 -translate-y-1/2 pointer-events-auto h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-125 cursor-pointer opacity-0 hover:opacity-100"
        style={{
          backgroundColor: "hsl(var(--accent))",
          color: "hsl(var(--foreground) / 0.6)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        title="Ajouter une colonne"
        onMouseEnter={cancelHide}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
