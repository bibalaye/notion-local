"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDatabases, createDatabase } from "@/app/app/actions/database";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { DatabaseView } from "@/components/database/DatabaseView";
import { Button } from "@notoflow/ui/components/button";
import { Plus, Database, ChevronRight, ChevronDown, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@notoflow/ui/components/dialog";
import { toast } from "sonner";

export default function DatabasesPage() {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dbName, setDbName] = useState("");
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);

  // Get databases
  const { data: databases, isLoading } = useQuery({
    queryKey: ["databases", activeWorkspaceId],
    queryFn: () => getDatabases(activeWorkspaceId || ""),
    enabled: !!activeWorkspaceId,
  });

  // Create database
  const createDbMutation = useMutation({
    mutationFn: (name: string) => createDatabase(activeWorkspaceId || "", name),
    onSuccess: (newDb) => {
      queryClient.invalidateQueries({ queryKey: ["databases", activeWorkspaceId] });
      toast.success(`Base de données "${newDb.name}" créée !`);
      setIsDialogOpen(false);
      setDbName("");
      setSelectedDbId(newDb.id);
    },
    onError: () => {
      toast.error("Erreur lors de la création.");
    },
  });

  const handleCreateDb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim()) return;
    createDbMutation.mutate(dbName);
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
        <Database className="h-10 w-10 text-muted-foreground/60 mb-2" />
        <h3 className="text-sm font-semibold">Aucun espace de travail actif</h3>
        <p className="text-xs text-muted-foreground">Sélectionnez un espace de travail dans la barre latérale.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-500" />
            Bases de données
          </h1>
          <p className="text-xs text-muted-foreground">
            Gérez vos collections de données structurées, tableaux Kanban et calendriers.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)} type="button">
          <Plus className="h-4 w-4" /> Nouvelle base
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted/30 border border-border/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : databases?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/50 rounded-2xl bg-card/20 min-h-[220px]">
          <Database className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <h3 className="text-sm font-semibold">Aucune base de données</h3>
          <p className="text-xs text-muted-foreground mb-3">Créez votre premier tableau pour structurer votre travail.</p>
          <Button size="sm" onClick={() => setIsDialogOpen(true)} type="button">
            Créer un tableau
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {databases?.map((db) => {
            const isSelected = selectedDbId === db.id;
            return (
              <div key={db.id} className="space-y-3">
                {/* List trigger bar */}
                <button
                  onClick={() => setSelectedDbId(isSelected ? null : db.id)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/45 hover:bg-card/90 shadow-sm transition-all duration-150 text-left"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{db.icon || "📊"}</span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{db.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Modifié le {new Date(db.updatedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {isSelected ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {/* Embedded dynamic DatabaseView rendering */}
                {isSelected && (
                  <div className="pl-2">
                    <DatabaseView databaseId={db.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-popover rounded-xl border">
          <DialogTitle className="text-lg font-bold">Créer une base de données</DialogTitle>
          <form onSubmit={handleCreateDb} className="space-y-4 mt-3">
            <div className="space-y-2">
              <label htmlFor="db-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nom du tableau
              </label>
              <input
                id="db-name"
                required
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="ex: Projets Q2, Tâches Équipe, CRM..."
                className="w-full rounded-lg border border-border/80 bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="ghost" type="button">Annuler</Button>
              </DialogClose>
              <Button type="submit" disabled={createDbMutation.isPending}>
                {createDbMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
