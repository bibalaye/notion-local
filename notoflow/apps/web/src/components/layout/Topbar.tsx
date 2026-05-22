"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@notoflow/ui/components/button";

export function Topbar() {
  return (
    <header className="flex h-12 items-center justify-between border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/app" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
        <Image
          src="/logo.png"
          alt="NotoFlow Logo"
          width={24}
          height={24}
          className="rounded object-contain"
        />
        <span className="font-semibold text-sm tracking-tight">
          NotoFlow
        </span>
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          Déconnexion
        </Button>
      </form>
    </header>
  );
}
