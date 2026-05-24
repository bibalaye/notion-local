"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Check, Plus, Users, Settings } from "lucide-react";
import { Button } from "@notoflow/ui/components/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@notoflow/ui/components/dialog";
import { api } from "@/lib/api/client";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  // Queries
  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: api.workspaces.list,
  });

  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId) || workspaces?.[0];

  // Auto-resolve active workspace if null
  if (workspaces && workspaces.length > 0 && !activeWorkspaceId) {
    setActiveWorkspaceId(workspaces[0].id);
  }

  // Mutations
  const createWorkspaceMutation = useMutation({
    mutationFn: (name: string) => api.workspaces.create(name),
    onSuccess: (newWs) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
      if (newWs) {
        setActiveWorkspaceId(newWs.id);
        toast.success(`Espace "${newWs.name}" créé !`);
      }
      setIsDialogOpen(false);
      setNewWorkspaceName("");
      router.push("/app");
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'espace.");
    },
  });

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    setIsOpen(false);
    queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
    queryClient.invalidateQueries({ queryKey: ["favorites"] });
    toast.success("Espace de travail mis à jour");
    router.push("/app");
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createWorkspaceMutation.mutate(newWorkspaceName);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-semibold text-foreground/90 hover:bg-accent/60 transition-colors duration-150 cursor-pointer focus:outline-none"
        type="button"
      >
        <span className="truncate flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-[10px] font-extrabold shadow-sm border border-neutral-300/20">
            {activeWorkspace?.name?.charAt(0) || "N"}
          </span>
          <span className="truncate font-semibold tracking-tight text-foreground/90 text-sm">
            {activeWorkspace?.name || "Espace de travail"}
          </span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 shrink-0 stroke-[1.8]" />
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="absolute left-0 right-0 top-[38px] z-50 rounded-lg border border-border bg-popover/95 backdrop-blur-md p-1 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.5)]"
            >
              <div className="text-[9px] font-extrabold text-muted-foreground/75 uppercase tracking-widest px-2.5 py-1.5">
                Espaces de travail
              </div>

              <div className="space-y-0.5 max-h-[220px] overflow-y-auto px-0.5">
                {workspaces?.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-accent text-left transition-colors duration-100 cursor-pointer"
                    type="button"
                  >
                    <span className="truncate flex items-center gap-2 font-medium text-foreground/80">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 text-foreground text-[10px] font-bold border border-neutral-300/10">
                        {ws.name.charAt(0)}
                      </span>
                      <span className="truncate">{ws.name}</span>
                    </span>
                    {activeWorkspace?.id === ws.id && (
                      <Check className="h-3.5 w-3.5 text-foreground shrink-0 stroke-[2]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-border/40 my-1 mx-1" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDialogOpen(true);
                }}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent text-left text-muted-foreground hover:text-foreground font-medium transition-colors duration-100 cursor-pointer"
                type="button"
              >
                <Plus className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                <span>Créer un espace</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Workspace Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-popover rounded-xl border">
          <DialogTitle className="text-lg font-bold">Créer un espace de travail</DialogTitle>
          <form onSubmit={handleCreateWorkspace} className="space-y-4 mt-3">
            <div className="space-y-2">
              <label htmlFor="ws-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nom de l&apos;espace
              </label>
              <input
                id="ws-name"
                required
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="ex: Design, Marketing, Personnel..."
                className="w-full rounded-lg border border-border/80 bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="ghost" type="button">Annuler</Button>
              </DialogClose>
              <Button type="submit" disabled={createWorkspaceMutation.isPending}>
                {createWorkspaceMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
