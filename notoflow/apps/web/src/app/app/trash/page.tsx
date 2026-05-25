"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimistic, useTransition } from "react";
import { getArchivedPages, restorePage, deletePagePermanently } from "@/app/app/actions/pages";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { Button } from "@notoflow/ui/components/button";
import { Trash2, RotateCcw, AlertTriangle, Inbox } from "lucide-react";
import { toast } from "sonner";

type ArchivedPage = {
  id: string;
  title: string;
  icon?: string | null;
  archivedAt?: Date | null;
  updatedAt?: Date | string;
  pending?: boolean;
};

export default function TrashPage() {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [isPending, startTransition] = useTransition();

  const { data: archivedPages = [], isLoading } = useQuery({
    queryKey: ["archived-pages", activeWorkspaceId],
    queryFn: () => getArchivedPages(activeWorkspaceId || ""),
    enabled: !!activeWorkspaceId,
  });

  // Optimistic state pour les pages archivées
  const [optimisticPages, updateOptimisticPages] = useOptimistic(
    archivedPages,
    (state: ArchivedPage[], action: { type: string; id: string }) => {
      return state.filter((p) => p.id !== action.id);
    }
  );

  const handleRestore = (pageId: string) => {
    startTransition(async () => {
      // Mise à jour optimiste immédiate
      updateOptimisticPages({ type: "restore", id: pageId });

      try {
        await restorePage(pageId);
        queryClient.invalidateQueries({ queryKey: ["archived-pages", activeWorkspaceId] });
        queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
        toast.success("Page restaurée avec succès");
      } catch (error) {
        toast.error("Erreur lors de la restauration");
      }
    });
  };

  const handleDelete = (pageId: string) => {
    if (!confirm("Supprimer définitivement cette page ? Cette action est irréversible.")) {
      return;
    }

    startTransition(async () => {
      // Mise à jour optimiste immédiate
      updateOptimisticPages({ type: "delete", id: pageId });

      try {
        await deletePagePermanently(pageId);
        queryClient.invalidateQueries({ queryKey: ["archived-pages", activeWorkspaceId] });
        toast.success("Page supprimée définitivement");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  if (!activeWorkspaceId) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1 border-b border-border/30 pb-4">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-2">
          <Trash2 className="h-6 w-6 text-red-500" />
          Corbeille
        </h1>
        <p className="text-xs text-muted-foreground">
          Consultez et restaurez les pages archivées ou supprimez-les définitivement.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-muted/20 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : optimisticPages?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/50 rounded-2xl bg-card/20 min-h-[220px]">
          <Inbox className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <h3 className="text-sm font-semibold">Corbeille vide</h3>
          <p className="text-xs text-muted-foreground">Aucune page archivée dans cet espace de travail.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-500" /> Les pages supprimées définitivement ne pourront pas être récupérées.
          </div>
          <div className="divide-y divide-border/30 border rounded-xl overflow-hidden bg-card/45 backdrop-blur-sm">
            {optimisticPages?.map((page) => (
              <div 
                key={page.id} 
                className={`flex items-center justify-between p-4 hover:bg-accent/20 transition-colors ${page.pending ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base shrink-0">{page.icon || "📄"}</span>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      {page.title || "Sans titre"}
                      {page.pending && " ⏳"}
                    </h4>
                    <p className="text-[9px] text-muted-foreground">
                      Archivé le {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString("fr-FR") : "Date inconnue"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Restaurer la page"
                    onClick={() => handleRestore(page.id)}
                    disabled={isPending || page.pending}
                    type="button"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Supprimer définitivement"
                    onClick={() => handleDelete(page.id)}
                    disabled={isPending || page.pending}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
