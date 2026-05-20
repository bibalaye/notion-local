"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDatabase, createDatabaseRow, updateDatabaseRow, deleteDatabaseRow } from "@/app/app/actions/database";
import { DatabaseEngine } from "@notoflow/database-engine";
import type { DatabaseColumn, DatabaseView as DBView, Filter, Sort, DatabaseRow as DBRow } from "@notoflow/database-engine";
import { TableView } from "./TableView";
import { KanbanView } from "./KanbanView";
import { CalendarView } from "./CalendarView";
import { Button } from "@notoflow/ui/components/button";
import { Plus, Table, Columns3, CalendarDays, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface DatabaseViewProps {
  databaseId: string;
}

export function DatabaseView({ databaseId }: DatabaseViewProps) {
  const queryClient = useQueryClient();
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const { data: database, isLoading } = useQuery({
    queryKey: ["database", databaseId],
    queryFn: () => getDatabase(databaseId),
  });

  const addRowMutation = useMutation({
    mutationFn: (values?: Record<string, unknown>) => createDatabaseRow(databaseId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["database", databaseId] });
      toast.success("Ligne ajoutée");
    },
  });

  const updateRowMutation = useMutation({
    mutationFn: ({ rowId, values }: { rowId: string; values: Record<string, unknown> }) => updateDatabaseRow(rowId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["database", databaseId] }),
  });

  const deleteRowMutation = useMutation({
    mutationFn: (rowId: string) => deleteDatabaseRow(rowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["database", databaseId] });
      toast.success("Ligne supprimée");
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-lg mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (<div key={i} className="h-10 bg-muted/60 rounded-lg" />))}
        </div>
      </div>
    );
  }

  if (!database) return null;

  const columns: DatabaseColumn[] = (database.schema as any) || [];
  const views: DBView[] = (database.views as any) || [];
  const activeView = views.find((v) => v.id === activeViewId) || views[0];
  const rawRows: DBRow[] = (database.rows || []).map((r: any) => ({ id: r.id, databaseId: r.databaseId, values: r.values as Record<string, unknown>, position: r.position }));

  // Apply engine filters and sorts
  let processedRows = rawRows;
  if (activeView) {
    processedRows = DatabaseEngine.filter(processedRows, activeView.filters || [], columns);
    processedRows = DatabaseEngine.sort(processedRows, activeView.sorts || []);
  }

  const viewIcons: Record<string, React.ReactNode> = {
    table: <Table className="h-3.5 w-3.5" />,
    kanban: <Columns3 className="h-3.5 w-3.5" />,
    calendar: <CalendarDays className="h-3.5 w-3.5" />,
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3 bg-card/80">
        <div className="flex items-center gap-3">
          <span className="text-lg">{database.icon || "📊"}</span>
          <h3 className="text-sm font-bold tracking-tight">{database.name}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3 w-3" /> Filtres
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3 w-3" /> Tris
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-border/30 px-4 py-1.5 bg-muted/20">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveViewId(view.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeView?.id === view.id
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
            type="button"
          >
            {viewIcons[view.type] || <Table className="h-3.5 w-3.5" />}
            {view.name}
          </button>
        ))}
      </div>

      {/* View Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView?.id || "none"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {activeView?.type === "table" && (
            <TableView
              columns={columns}
              rows={processedRows}
              onAddRow={() => addRowMutation.mutate({})}
              onUpdateRow={(rowId, values) => updateRowMutation.mutate({ rowId, values })}
              onDeleteRow={(rowId) => deleteRowMutation.mutate(rowId)}
            />
          )}
          {activeView?.type === "kanban" && (
            <KanbanView
              columns={columns}
              rows={processedRows}
              kanbanColumnId={activeView.kanbanColumnId || columns.find((c) => c.type === "select")?.id || ""}
              onAddRow={(values) => addRowMutation.mutate(values)}
              onUpdateRow={(rowId, values) => updateRowMutation.mutate({ rowId, values })}
            />
          )}
          {activeView?.type === "calendar" && (
            <CalendarView
              columns={columns}
              rows={processedRows}
              dateColumnId={activeView.calendarDateId || columns.find((c) => c.type === "date")?.id || ""}
              onAddRow={(values) => addRowMutation.mutate(values)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
