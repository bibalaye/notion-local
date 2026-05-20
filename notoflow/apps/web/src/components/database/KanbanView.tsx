"use client";

import type { DatabaseColumn, DatabaseRow } from "@notoflow/database-engine";
import { Button } from "@notoflow/ui/components/button";
import { Plus, GripVertical, MoreHorizontal } from "lucide-react";
import { DatabaseEngine } from "@notoflow/database-engine";

interface KanbanViewProps {
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  kanbanColumnId: string;
  onAddRow: (values: Record<string, unknown>) => void;
  onUpdateRow: (rowId: string, values: Record<string, unknown>) => void;
}

export function KanbanView({
  columns,
  rows,
  kanbanColumnId,
  onAddRow,
  onUpdateRow,
}: KanbanViewProps) {
  const col = columns.find((c) => c.id === kanbanColumnId);
  const options = col?.config?.options || [];

  // Group rows
  const grouped = DatabaseEngine.group(rows, kanbanColumnId);

  // Fallback title column
  const titleCol = columns.find((c) => c.type === "text") || columns[0];

  const handleCardTitleChange = (row: DatabaseRow, newTitle: string) => {
    if (!titleCol) return;
    onUpdateRow(row.id, {
      ...row.values,
      [titleCol.id]: newTitle,
    });
  };

  return (
    <div className="flex gap-4 p-5 overflow-x-auto min-h-[450px]">
      {/* Dynamic Columns */}
      {options.map((opt) => {
        const columnRows = grouped[opt.id] || grouped[opt.label] || [];
        return (
          <div
            key={opt.id}
            className="flex-1 min-w-[280px] max-w-[320px] rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
                <h4 className="text-xs font-bold tracking-tight text-foreground truncate">
                  {opt.label}
                </h4>
                <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded-full text-muted-foreground font-semibold">
                  {columnRows.length}
                </span>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-2 overflow-y-auto mb-3">
              {columnRows.map((row) => {
                const cardTitle = String(row.values[titleCol.id] || "Sans nom");
                return (
                  <div
                    key={row.id}
                    className="group relative rounded-xl border border-border/50 bg-card p-3.5 shadow-sm hover:shadow-md hover:border-border transition-all duration-150 flex flex-col gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0 cursor-move mt-0.5">
                        <GripVertical className="h-3 w-3" />
                      </span>
                      <input
                        className="text-xs font-semibold bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full resize-none leading-normal"
                        value={cardTitle}
                        onChange={(e) => handleCardTitleChange(row, e.target.value)}
                        onBlur={() => onUpdateRow(row.id, row.values)}
                      />
                    </div>

                    {/* Meta properties display */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {columns
                        .filter((c) => c.id !== titleCol.id && c.id !== kanbanColumnId && c.visible !== false)
                        .map((c) => {
                          const val = row.values[c.id];
                          if (val === null || val === undefined || val === "") return null;
                          return (
                            <span
                              key={c.id}
                              className="text-[9px] bg-accent/60 text-muted-foreground font-semibold px-2 py-0.5 rounded truncate max-w-[120px]"
                              title={`${c.name}: ${val}`}
                            >
                              {String(val)}
                            </span>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
              {columnRows.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card/20 min-h-[80px]">
                  <p className="text-[10px]">Déposez des cartes ici</p>
                </div>
              )}
            </div>

            {/* Add Card Button */}
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-xs text-muted-foreground gap-1.5 h-8 hover:bg-accent/40"
              onClick={() => onAddRow({ [kanbanColumnId]: opt.id })}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une carte
            </Button>
          </div>
        );
      })}
    </div>
  );
}
