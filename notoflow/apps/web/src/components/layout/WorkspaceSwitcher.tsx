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
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between border-border/50 bg-background/50 hover:bg-accent/40 shadow-sm transition-all duration-200"
        type="button"
      >
        <span className="truncate text-sm font-semibold flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-extrabold text-primary-foreground shadow">
            {activeWorkspace?.name?.charAt(0) || "N"}
          </span>
          {activeWorkspace?.name || "Espace de travail"}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>

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
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-[42px] z-50 rounded-xl border border-border bg-popover p-1.5 shadow-xl"
            >
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                Espaces de travail
              </div>

              <div className="space-y-0.5 max-h-[220px] overflow-y-auto">
                {workspaces?.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-accent text-left transition-colors duration-150"
                    type="button"
                  >
                    <span className="truncate flex items-center gap-2 font-medium">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold">
                        {ws.name.charAt(0)}
                      </span>
                      {ws.name}
                    </span>
                    {activeWorkspace?.id === ws.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-border/50 my-1" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDialogOpen(true);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent text-left text-muted-foreground hover:text-foreground font-medium transition-colors duration-150"
                type="button"
              >
                <Plus className="h-4 w-4 shrink-0" />
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
