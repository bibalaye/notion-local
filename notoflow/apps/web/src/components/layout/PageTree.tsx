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
      <div key={page.id} className="group/item select-none">
        <div
          className={`flex items-center gap-1 py-1 px-2 rounded-lg text-sm transition-colors duration-150 relative ${
            isActive
              ? "bg-accent/80 text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {/* Collapse/Expand Arrow */}
          <button
            onClick={(e) => toggleExpand(page.id, e)}
            className={`h-5 w-5 flex items-center justify-center rounded hover:bg-accent-foreground/10 transition-colors ${
              !hasChildren ? "opacity-0 pointer-events-none" : ""
            }`}
            type="button"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}
          </button>

          {/* Page link */}
          <Link href={`/app/page/${page.id}`} className="flex-1 flex items-center gap-1.5 min-w-0 py-0.5">
            <span className="shrink-0">{page.icon ?? "📄"}</span>
            <span className="truncate">{page.title || "Sans titre"}</span>
          </Link>

          {/* Inline Hover Action Buttons */}
          <div className="absolute right-2 opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 bg-gradient-to-l from-accent/90 via-accent/80 to-transparent pl-4 rounded-r-lg">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => favoriteMutation.mutate(page.id)}
              title="Ajouter aux favoris"
              type="button"
            >
              <Star className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => createMutation.mutate(page.id)}
              title="Ajouter une sous-page"
              type="button"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => duplicateMutation.mutate(page.id)}
              title="Dupliquer"
              type="button"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => archiveMutation.mutate(page.id)}
              title="Mettre à la corbeille"
              type="button"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
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

  return <div className="space-y-0.5 px-1">{rootNodes.map((node) => renderNode(node, 0))}</div>;
}
