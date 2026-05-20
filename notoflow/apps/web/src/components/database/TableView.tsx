"use client";

import { useState } from "react";
import type { DatabaseColumn, DatabaseRow } from "@notoflow/database-engine";
import { Button } from "@notoflow/ui/components/button";
import { Plus, Trash2, Check, X } from "lucide-react";

interface TableViewProps {
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  onAddRow: () => void;
  onUpdateRow: (rowId: string, values: Record<string, unknown>) => void;
  onDeleteRow: (rowId: string) => void;
}

export function TableView({ columns, rows, onAddRow, onUpdateRow, onDeleteRow }: TableViewProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const visibleColumns = columns.filter((c) => c.visible !== false);

  const startEdit = (rowId: string, colId: string, currentValue: unknown) => {
    setEditingCell({ rowId, colId });
    setEditValue(String(currentValue ?? ""));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const row = rows.find((r) => r.id === editingCell.rowId);
    if (row) {
      const col = columns.find((c) => c.id === editingCell.colId);
      let value: unknown = editValue;
      if (col?.type === "number") value = Number(editValue) || 0;
      if (col?.type === "checkbox") value = editValue === "true";
      onUpdateRow(editingCell.rowId, { ...row.values, [editingCell.colId]: value });
    }
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const renderCellValue = (col: DatabaseColumn, value: unknown) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground/40 italic text-xs">Vide</span>;

    switch (col.type) {
      case "checkbox":
        return (
          <div className={`h-4 w-4 rounded border ${value ? "bg-primary border-primary" : "border-border"} flex items-center justify-center`}>
            {!!value && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        );
      case "select":
      case "status": {
        const opt = col.config?.options?.find((o) => o.id === value || o.label === value);
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: (opt?.color || "#6366f1") + "20", color: opt?.color || "#6366f1" }}
          >
            {opt?.label || String(value)}
          </span>
        );
      }
      case "date":
        try {
          return <span className="text-xs">{new Date(String(value)).toLocaleDateString("fr-FR")}</span>;
        } catch {
          return <span className="text-xs">{String(value)}</span>;
        }
      case "url":
        return (
          <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate max-w-[180px] inline-block">
            {String(value)}
          </a>
        );
      default:
        return <span className="text-sm truncate">{String(value)}</span>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            {visibleColumns.map((col) => (
              <th
                key={col.id}
                className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ width: col.width || 180 }}
              >
                {col.name}
              </th>
            ))}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="group/row border-b border-border/20 hover:bg-accent/30 transition-colors duration-100">
              {visibleColumns.map((col) => {
                const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                return (
                  <td key={col.id} className="px-4 py-2 cursor-pointer" onClick={() => !isEditing && startEdit(row.id, col.id, row.values[col.id])}>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        {col.type === "select" || col.type === "status" ? (
                          <select
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            className="w-full rounded border border-primary bg-background px-2 py-1 text-sm outline-none"
                          >
                            <option value="">-- Choisir --</option>
                            {col.config?.options?.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                          </select>
                        ) : col.type === "date" ? (
                          <input
                            type="date"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                            className="w-full rounded border border-primary bg-background px-2 py-1 text-sm outline-none"
                          />
                        ) : col.type === "checkbox" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateRow(row.id, { ...row.values, [col.id]: !(row.values[col.id]) });
                              setEditingCell(null);
                            }}
                            className={`h-5 w-5 rounded border ${row.values[col.id] ? "bg-primary border-primary" : "border-border"} flex items-center justify-center`}
                          >
                            {!!row.values[col.id] && <Check className="h-3 w-3 text-primary-foreground" />}
                          </button>
                        ) : (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="w-full rounded border border-primary bg-background px-2 py-1 text-sm outline-none"
                          />
                        )}
                      </div>
                    ) : (
                      renderCellValue(col, row.values[col.id])
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover/row:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={() => onDeleteRow(row.id)}
                  type="button"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 border-t border-border/20">
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={onAddRow} type="button">
          <Plus className="h-3 w-3" /> Nouvelle ligne
        </Button>
      </div>
    </div>
  );
}
