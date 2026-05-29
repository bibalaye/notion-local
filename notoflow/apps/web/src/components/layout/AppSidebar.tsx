"use client";

import { useQuery } from "@tanstack/react-query";
import { useTransition } from "react";
import {
  Clock,
  Database,
  Folder,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notoflow/ui/components/sidebar";
import { api } from "@/lib/api/client";
import { PageTree } from "./PageTree";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { CommandPalette } from "./CommandPalette";
import { toast } from "sonner";
import { TransitionLink } from "@/components/navigation/TransitionLink";

export function AppSidebar() {
  const [isPending, startTransition] = useTransition();

  const { data: pages } = useQuery({
    queryKey: ["pages", "tree"],
    queryFn: api.pages.getTree,
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: api.favorites.list,
  });

  const handleCreatePage = () => {
    startTransition(async () => {
      try {
        const newPage = await api.pages.create();
        toast.success("Page créée !");
        // Note: La navigation se fera via le TransitionLink
      } catch (error) {
        toast.error("Erreur lors de la création.");
      }
    });
  };

  return (
    <>
      <CommandPalette />
      <Sidebar collapsible="icon" className="border-r border-border/30 bg-card/90">
        <SidebarHeader className="gap-2.5 p-3">
          <WorkspaceSwitcher />
          <button
            className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg bg-neutral-200/50 px-2.5 py-1.5 text-left text-muted-foreground/80 transition-all duration-150 hover:bg-neutral-200/80 hover:text-foreground focus:outline-none dark:bg-neutral-800/40 dark:hover:bg-neutral-800/70"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            type="button"
          >
            <Search className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium">Recherche rapide</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-neutral-300/40 bg-neutral-100/70 px-1.5 font-mono text-[9px] font-medium text-muted-foreground/75 dark:border-neutral-700/40 dark:bg-neutral-900/70 shadow-sm">
              <span>⌘</span>K
            </kbd>
          </button>
        </SidebarHeader>

        <SidebarContent className="gap-1 px-1.5">
          <div className="w-full space-y-4 pb-4">
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.5 transition-colors duration-100">
                  <TransitionLink href="/app" className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground/80">
                    <Clock className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                    <span className="min-w-0 flex-1 truncate">Accueil</span>
                  </TransitionLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-ai-studio"))}
                  className="group/ai flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md border border-violet-500/10 bg-violet-500/5 px-2.5 py-1.5 text-left text-xs font-bold text-violet-500/90 transition-all duration-150 hover:bg-violet-500/10 hover:text-violet-600 focus:outline-none dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/15 dark:hover:text-violet-300"
                  type="button"
                >
                  <Sparkles className="h-3.5 w-3.5 text-violet-500 group-hover/ai:animate-pulse shrink-0 stroke-[1.8]" />
                  <span className="min-w-0 flex-1 truncate">Assistant IA</span>
                  <span className="ml-auto rounded-full bg-violet-500/10 dark:bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-extrabold text-violet-500 dark:text-violet-400 uppercase tracking-wider">
                    Studio
                  </span>
                </button>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.5 transition-colors duration-100">
                  <TransitionLink href="/app/favorites" className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground/80">
                    <Star className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                    <span className="min-w-0 flex-1 truncate">Favoris</span>
                  </TransitionLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.5 transition-colors duration-100">
                  <TransitionLink href="/app/databases" className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground/80 [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:truncate">
                    <Database className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                    <span>Bases de données</span>
                  </TransitionLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.5 transition-colors duration-100">
                  <TransitionLink href="/app/documents" className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground/80 [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:truncate">
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                    <span>Documents</span>
                  </TransitionLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.5 transition-colors duration-100">
                  <TransitionLink href="/app/templates" className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground/80 [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:truncate">
                    <Folder className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                    <span>Modèles</span>
                  </TransitionLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.5 transition-colors duration-100">
                  <TransitionLink href="/app/trash" className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground/80">
                    <Trash2 className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                    <span className="min-w-0 flex-1 truncate">Corbeille</span>
                  </TransitionLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {favorites && favorites.length > 0 && (
              <div className="min-w-0 space-y-1">
                <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/60">
                  Favoris
                </div>
                <SidebarMenu className="gap-0.5">
                  {favorites.map((p) => (
                    <SidebarMenuItem key={p.id}>
                      <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.2 transition-colors duration-100">
                        <TransitionLink
                          href={`/app/page/${p.id}`}
                          className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground/80"
                          title={p.title || "Sans titre"}
                        >
                          <span className="text-[13px] shrink-0">{p.icon ?? "📄"}</span>
                          <span className="min-w-0 flex-1 truncate">{p.title || "Sans titre"}</span>
                        </TransitionLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex items-center justify-between px-2.5 py-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/60">
                  Pages privées
                </span>
                <button
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  onClick={handleCreatePage}
                  title="Ajouter une page"
                  disabled={isPending}
                >
                  <Plus className="h-3.5 w-3.5 stroke-[1.8]" />
                </button>
              </div>
              <PageTree pages={pages ?? []} />
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/30 p-2 bg-card/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="rounded-md hover:bg-accent/60 px-2.5 py-1.5 transition-colors duration-100">
                <TransitionLink href="/app/settings" className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                  <Settings className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                  <span>Paramètres</span>
                </TransitionLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
