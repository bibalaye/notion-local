"use client";

import { signOut } from "@/app/(auth)/actions";
import { Button } from "@notoflow/ui/components/button";

export function Topbar() {
  return (
    <header className="flex h-12 items-center justify-between border-b px-4">
      <span className="text-sm text-muted-foreground">NotoFlow</span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Déconnexion
        </Button>
      </form>
    </header>
  );
}
