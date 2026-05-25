"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Trash2, Star, Copy, FileText } from "lucide-react";
import { Button } from "@notoflow/ui/components/button";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

interface Page {
  id: string;
  title: string;
  icon?: string | null;
  parentId: string | null;
  workspaceId: string;
}

export function PageTree({ pages }: { pages: Page[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (parentId?: string | null) => api.pages.create(parentId),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
      toast.success("Page créée !");
      if (newPage) {
        router.push(`/app/page/${newPage.id}`);
      }
    },
    onError: () => {
      toast.error("Erreur lors de la création.");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.pages.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
      toast.success("Page mise à la corbeille.");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.pages.duplicate(id),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
      toast.success("Page dupliquée !");
      if (newPage) {
        router.push(`/app/page/${newPage.id}`);
      }
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => api.pages.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Favoris mis à jour.");
    },
  });

  // Group pages by parentId
  const pagesByParent = pages.reduce<Record<string, Page[]>>((acc, page) => {
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
          }`}
          style={{ paddingLeft: `${depth * 10 + 6}px` }}
        >
          {/* Collapse/Expand Arrow */}
          <button
            onClick={(e) => toggleExpand(page.id, e)}
            className={`h-4.5 w-4.5 flex shrink-0 items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 transition-colors text-muted-foreground/80 hover:text-foreground cursor-pointer focus:outline-none ${
              !hasChildren ? "opacity-0 pointer-events-none" : ""
            }`}
            type="button"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0 stroke-[2]" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 stroke-[2]" />
            )}
          </button>

          {/* Page link */}
          <Link
            href={`/app/page/${page.id}`}
            className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden py-0.5 cursor-pointer"
            title={page.title || "Sans titre"}
          >
            <span className="shrink-0 text-[13px]">{page.icon ?? "📄"}</span>
            <span className="min-w-0 flex-1 truncate tracking-tight text-foreground/80">{page.title || "Sans titre"}</span>
          </Link>

          {/* Inline Hover Action Buttons */}
          <div className="hidden shrink-0 items-center justify-end gap-0.5 transition-opacity duration-100 group-hover:flex group-hover/item:flex">
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer focus:outline-none"
              onClick={() => favoriteMutation.mutate(page.id)}
              title="Ajouter aux favoris"
              type="button"
            >
              <Star className="h-3 w-3 stroke-[1.8]" />
            </button>
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer focus:outline-none"
              onClick={() => createMutation.mutate(page.id)}
              title="Ajouter une sous-page"
              type="button"
            >
              <Plus className="h-3 w-3 stroke-[1.8]" />
            </button>
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer focus:outline-none"
              onClick={() => duplicateMutation.mutate(page.id)}
              title="Dupliquer"
              type="button"
            >
              <Copy className="h-3 w-3 stroke-[1.8]" />
            </button>
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-neutral-500/10 dark:hover:bg-neutral-100/10 text-muted-foreground/75 hover:text-destructive transition-colors cursor-pointer focus:outline-none"
              onClick={() => archiveMutation.mutate(page.id)}
              title="Mettre à la corbeille"
              type="button"
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

  if (!pages.length) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed rounded-xl bg-card/30 border-border/60 mx-2">
        <FileText className="h-5 w-5 text-muted-foreground/60 mb-1" />
        <p className="text-xs text-muted-foreground font-medium">Aucune page</p>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-auto p-0 mt-1"
          onClick={() => createMutation.mutate(null)}
          type="button"
        >
          Créer une page
        </Button>
      </div>
    );
  }

  return <div className="w-full min-w-0 space-y-0.5 px-1">{rootNodes.map((node) => renderNode(node, 0))}</div>;
}
