export const dynamic = "force-dynamic";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/search/CommandPalette";
import { AiPanel } from "@/components/ai/AiPanel";
import { QueryProvider } from "@/lib/react-query/provider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { SidebarProvider } from "@notoflow/ui/components/sidebar";
import { Toaster } from "sonner";
import { SubtlePageTransition } from "@/components/navigation/PageTransition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SidebarProvider>
          <div className="flex h-screen w-screen overflow-hidden bg-background">
            <AppSidebar />
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <Topbar />
              <SubtlePageTransition className="flex-1 overflow-y-auto">
                {children}
              </SubtlePageTransition>
            </main>
          </div>
          <CommandPalette />
          <AiPanel />
          <Toaster richColors position="bottom-right" />
        </SidebarProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
