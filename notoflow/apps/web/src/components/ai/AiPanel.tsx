"use client";

import { useEffect, useState } from "react";
import { Button } from "@notoflow/ui/components/button";

export function AiPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-ai-panel", handler);
    return () => window.removeEventListener("open-ai-panel", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-xl border bg-popover p-4 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Assistant IA</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Branchez <code className="rounded bg-muted px-1">/api/ai</code> et le package{" "}
        <code className="rounded bg-muted px-1">@notoflow/ai</code>.
      </p>
    </div>
  );
}
