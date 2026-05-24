"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { usePathname } from "next/navigation";
import { ChevronRight, Cloud, Check, Share2, LogOut, Menu, FileText } from "lucide-react";

interface PageNode {
  id: string;
  title: string;
  icon?: string | null;
  parentId: string | null;
  workspaceId: string;
}

export function Topbar() {
  const pathname = usePathname() || "";
  
  // 1. Extraire l'ID de la page du chemin /app/page/[id]
  const pageMatch = pathname.match(/\/app\/page\/([a-zA-Z0-9_-]+)/);
  const activePageId = pageMatch ? pageMatch[1] : null;

  // 2. Récupérer l'arbre des pages depuis le cache React Query
  const { data: pages } = useQuery<PageNode[]>({
    queryKey: ["pages", "tree"],
    queryFn: api.pages.getTree,
    enabled: !!activePageId,
  });

  // 3. Reconstruire le fil d'Ariane de manière performante
  const buildBreadcrumbs = () => {
    if (!activePageId || !pages) return [];
    
    const crumbs: PageNode[] = [];
    let currentPage = pages.find((p) => p.id === activePageId);
    
    while (currentPage) {
      crumbs.unshift(currentPage); // Ajouter au début pour préserver l'ordre parent -> enfant
      const parentId = currentPage.parentId;
      currentPage = parentId ? pages.find((p) => p.id === parentId) : undefined;
    }
    
    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <header className="flex h-11 items-center justify-between border-b border-border/30 px-3 bg-background/80 backdrop-blur-md select-none shrink-0">
      {/* Partie gauche : Toggle Sidebar + Breadcrumbs */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors duration-100 cursor-pointer focus:outline-none shrink-0"
          title="Masquer/Afficher la barre latérale"
          type="button"
        >
          <Menu className="h-4 w-4 stroke-[1.8]" />
        </button>

        <div className="h-4 w-px bg-border/40 mx-0.5 shrink-0" />

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground truncate px-1">
          <Link
            href="/app"
            className="hover:bg-accent/50 hover:text-foreground px-1.5 py-0.5 rounded transition-colors duration-100 shrink-0 font-semibold"
          >
            NotoFlow
          </Link>
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, idx) => (
              <div key={crumb.id} className="flex items-center gap-1 min-w-0">
                <ChevronRight className="h-3 w-3 opacity-40 shrink-0 stroke-[2]" />
                <Link
                  href={`/app/page/${crumb.id}`}
                  className={`hover:bg-accent/50 hover:text-foreground px-1.5 py-0.5 rounded transition-colors duration-100 truncate flex items-center gap-1 ${
                    idx === breadcrumbs.length - 1
                      ? "text-foreground font-semibold"
                      : ""
                  }`}
                >
                  <span className="shrink-0 text-sm">{crumb.icon ?? "📄"}</span>
                  <span className="truncate">{crumb.title || "Sans titre"}</span>
                </Link>
              </div>
            ))
          ) : (
            <>
              <ChevronRight className="h-3 w-3 opacity-40 shrink-0 stroke-[2]" />
              <span className="px-1.5 py-0.5 text-foreground font-semibold">Tableau de bord</span>
            </>
          )}
        </nav>
      </div>

      {/* Partie droite : Actions contextuelles */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Indicateur de sauvegarde Cloud */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 px-2 py-1 rounded bg-neutral-100/50 dark:bg-neutral-800/30 border border-neutral-200/10 shrink-0">
          <Cloud className="h-3.5 w-3.5 text-emerald-500 stroke-[1.8]" />
          <span className="font-semibold hidden sm:inline">Sauvegardé</span>
        </div>

        {/* Bouton de Partage */}
        <button
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.2 rounded hover:bg-accent/60 text-foreground/80 hover:text-foreground transition-all duration-100 cursor-pointer focus:outline-none"
          type="button"
        >
          <Share2 className="h-3.5 w-3.5 stroke-[1.8]" />
          <span className="hidden sm:inline">Partager</span>
        </button>

        <div className="h-4 w-px bg-border/40 mx-1 shrink-0" />

        {/* Formulaire de Déconnexion */}
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center justify-center h-7 w-7 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-150 cursor-pointer focus:outline-none"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4 stroke-[1.8]" />
          </button>
        </form>
      </div>
    </header>
    )
}
