"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "../lib/utils";

type SidebarState = "expanded" | "collapsed";

type SidebarCtx = {
  state: SidebarState;
  setCollapsed: (v: boolean) => void;
};

const SidebarContext = React.createContext<SidebarCtx | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar doit être utilisé dans <SidebarProvider>.");
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const value = React.useMemo<SidebarCtx>(
    () => ({
      state: collapsed ? "collapsed" : "expanded",
      setCollapsed,
    }),
    [collapsed],
  );
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function Sidebar({
  className,
  collapsible,
  ...props
}: React.HTMLAttributes<HTMLElement> & { collapsible?: "icon" | "offcanvas" }) {
  void collapsible;
  return (
    <aside
      className={cn(
        "flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

export const SidebarHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2 p-3", className)} {...props} />
);
export const SidebarContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-y-auto", className)} {...props} />
);
export const SidebarFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-t p-2", className)} {...props} />
);

export const SidebarMenu = ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className={cn("flex flex-col gap-1", className)} {...props} />
);
export const SidebarMenuItem = ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
  <li className={cn("min-w-0 list-none", className)} {...props} />
);

export const SidebarMenuButton = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref as never}
      {...(!asChild ? { type: "button" as const } : {})}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";
