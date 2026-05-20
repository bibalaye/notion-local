"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Database,
  Folder,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
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
import { Button } from "@notoflow/ui/components/button";
import { ScrollArea } from "@notoflow/ui/components/scroll-area";
import { api } from "@/lib/api/client";
import { PageTree } from "./PageTree";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { CommandPalette } from "./CommandPalette";

export function AppSidebar() {
  const { data: pages } = useQuery({
    queryKey: ["pages", "tree"],
    queryFn: api.pages.getTree,
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: api.favorites.list,
  });

  return (
    <>
      <CommandPalette />
      <Sidebar collapsible="icon" className="border-r border-border/50">
        <SidebarHeader className="gap-2 p-3">
          <WorkspaceSwitcher />
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-border/50 bg-background/50 hover:bg-accent/40"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Rechercher</span>
            <kbd className="ml-auto text-[10px] text-muted-foreground">⌘K</kbd>
          </Button>
        </SidebarHeader>

      <SidebarContent className="gap-1">
        <ScrollArea className="h-full">
          <div className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/app/inbox">
                    <Clock className="h-4 w-4" />
                    <span>Récent</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/app/favorites">
                    <Star className="h-4 w-4" />
                    <span>Favoris</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/app/databases">
                    <Database className="h-4 w-4" />
                    <span>Bases de données</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/app/templates">
                    <Folder className="h-4 w-4" />
                    <span>Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/app/trash">
                    <Trash2 className="h-4 w-4" />
                    <span>Corbeille</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {favorites && favorites.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Favoris
                </div>
                <SidebarMenu>
                  {favorites.map((p) => (
                    <SidebarMenuItem key={p.id}>
                      <SidebarMenuButton asChild>
                        <Link href={`/app/page/${p.id}`}>
                          <span className="text-sm">{p.icon ?? "📄"}</span>
                          <span className="truncate">{p.title || "Sans titre"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pages
                </span>
                <Button size="icon" variant="ghost" className="h-7 w-7" type="button" onClick={() => void api.pages.create()}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <PageTree pages={pages ?? []} />
            </div>
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/app/settings">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </>
  );
}
