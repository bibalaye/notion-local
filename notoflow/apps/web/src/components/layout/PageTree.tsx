"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Trash2, Star, Copy, FileText } from "lucide-react";
import { Button } from "@notoflow/ui/components/button";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/navigation/TransitionLink";

interface Page {
  id: string;
  title: string;
  icon?: string | null;
  parentId: string | null;
  workspaceId: string;
  pending?: boolean;
  optimisticAction?: "create" | "archive" | "favorite";
}

export function PageTree({ pages }: { pages: Page[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Optimistic state pour les pages
  const [optimisticPages, updateOptimisticPages] = useOptimistic(
    pages,
    (state: Page[], action: { type: string; page?: Page; id?: string }): Page[] => {
      switch (action.type) {
        case "add":
          return action.page ? [...state, { ...action.page, pending: true, optimisticAction: "create" as const }] : state;
        case "remove":
          return state.filter((p) => p.id !== action.id);
        case "favorite":
          return state; // Les favoris sont gérés séparément
        default:
          return state;
      }
    }
  );

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Création de page avec optimistic update
  const handleCreatePage = (parentId?: string | null) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const newPage: Page = {
      id: tempId,
      title: "Sans titre",
      icon: "📄",
      parentId: parentId || null,
      workspaceId: "",
      pending: true,
    };

    startTransition(async () => {
      // Mise à jour optimiste immédiate
      updateOptimisticPages({ type: "add", page: newPage });

      try {
        const createdPage = await api.pages.create(parentId);
        queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
        toast.success("Page créée !");
        // Note: La navigation se fera via le TransitionLink
      } catch (error) {
        toast.error("Erreur lors de la création.");
      }
    });
  };

  // Archivage avec optimistic update
  const handleArchive = (id: string) => {
    startTransition(async () => {
      // Mise à jour optimiste immédiate
      updateOptimisticPages({ type: "remove", id });

      try {
        await api.pages.archive(id);
        queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
        toast.success("Page mise à la corbeille.");
      } catch (error) {
        toast.error("Erreur lors de l'archivage.");
      }
    });
  };

  // Duplication avec optimistic update
  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      try {
        const newPage = await api.pages.duplicate(id);
        queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
        toast.success("Page dupliquée !");
        // Note: La navigation se fera via le TransitionLink
      } catch (error) {
        toast.error("Erreur lors de la duplication.");
      }
    });
  };

  // Toggle favori avec optimistic update
  const handleToggleFavorite = (id: string) => {
    startTransition(async () => {
      try {
        await api.pages.toggleFavorite(id);
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
        toast.success("Favoris mis à jour.");
      } catch (error) {
        toast.error("Erreur.");
      }
    });
  };

  // Group pages by parentId
  const pagesByParent = optimisticPages.reduce<Record<string, Page[]>>((acc, page) => {
    const parentId = page.parentId || "root";
    (acc[parentId] ??= []).push(page);
    return acc;
  }, {});

  const renderNode = (page: Page, depth: number = 0) => {
    const hasChildren = !!pagesByParent[page.id]?.length;
    const isExpanded = expanded[page.id];
    const isActive = pathname === `/app/page/${page.id}`;

    return (
      <div key={page.id} className="group group/item min-w-0 select-none">
        <div
          className={`flex w-full min-w-0 max-w-full items-center gap-1 overflow-hidden rounded-md px-2.5 py-1 text-xs transition-colors duration-100 ${
            isActive
              ? "bg-accent text-foreground font-semibold"
              : "text-foreground/75 hover:bg-accent/50 hover:text-foreground"
          } ${page.pending ? "opacity-60" : ""}`}
          style={{ paddingLeft: `${depth * 10 + 6}px` }}
        >
          {/* Collapse/Expand Arrow */}
          <button
            onClick={(e) => toggleExpand(page.id, e)}
            className={`h-4.5 w-4.5 flex shrink-0 items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 transition-colors text-muted-foreground/80 hover:text-foreground cursor-pointer focus:outline-none ${
              !hasChildren ? "opacity-0 pointer-events-none" : ""
            }`}
            type="button"
            disabled={isPending}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0 stroke-[2]" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 stroke-[2]" />
            )}
          </button>

          {/* Page link */}
          <TransitionLink
            href={`/app/page/${page.id}`}
            className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden py-0.5 cursor-pointer"
            title={page.title || "Sans titre"}
            showLoader
          >
            <span className="shrink-0 text-[13px]">{page.icon ?? "📄"}</span>
            <span className="min-w-0 flex-1 truncate tracking-tight text-foreground/80">
              {page.title || "Sans titre"}
              {page.pending && " ⏳"}
            </span>
          </TransitionLink>

          {/* Inline Hover Action Buttons */}
          <div className="hidden shrink-0 items-center justify-end gap-0.5 transition-opacity duration-100 group-hover:flex group-hover/item:flex">
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleToggleFavorite(page.id)}
              title="Ajouter aux favoris"
              type="button"
              disabled={isPending || page.pending}
            >
              <Star className="h-3 w-3 stroke-[1.8]" />
            </button>
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleCreatePage(page.id)}
              title="Ajouter une sous-page"
              type="button"
              disabled={isPending || page.pending}
            >
              <Plus className="h-3 w-3 stroke-[1.8]" />
            </button>
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleDuplicate(page.id)}
              title="Dupliquer"
              type="button"
              disabled={isPending || page.pending}
            >
              <Copy className="h-3 w-3 stroke-[1.8]" />
            </button>
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-destructive transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleArchive(page.id)}
              title="Mettre à la corbeille"
              type="button"
              disabled={isPending || page.pending}
            >
              <Trash2 className="h-3 w-3 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Child nodes recursive rendering */}
        <AnimatePresence initial={false}>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {pagesByParent[page.id].map((child) => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const rootNodes = pagesByParent["root"] || [];

  if (!optimisticPages.length) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed rounded-xl bg-card/30 border-border/60 mx-2">
        <FileText className="h-5 w-5 text-muted-foreground/60 mb-1" />
        <p className="text-xs text-muted-foreground font-medium">Aucune page</p>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-auto p-0 mt-1"
          onClick={() => handleCreatePage(null)}
          type="button"
          disabled={isPending}
        >
          {isPending ? "Création..." : "Créer une page"}
        </Button>
      </div>
    );
  }

  return <div className="w-full min-w-0 space-y-0.5 px-1">{rootNodes.map((node) => renderNode(node, 0))}</div>;
}
