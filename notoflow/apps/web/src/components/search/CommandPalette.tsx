"use client";

import { useEffect, useState } from "react";
import "./cmdk.css";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { Dialog, DialogContent, DialogTitle } from "@notoflow/ui/components/dialog";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ArrowRight, Database, FileText, Settings, Sparkles } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: results } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search.global(query),
    enabled: query.length >= 2,
  });

  const runCommand = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl">
        <DialogTitle className="sr-only">Palette de commandes</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12">
          <CommandInput
            placeholder="Rechercher pages, bases, commandes…"
            value={query}
            onValueChange={setQuery}
            className="border-b px-3"
          />
          <CommandList className="max-h-[400px] overflow-y-auto py-2">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {query.length < 2 ? "Tapez au moins 2 caractères" : `Aucun résultat pour « ${query} »`}
            </CommandEmpty>

            <CommandGroup heading="Actions rapides">
              <CommandItem onSelect={() => runCommand("/app/new")} className="gap-2">
                <FileText className="h-4 w-4" />
                <span>Nouvelle page</span>
                <ArrowRight className="ml-auto h-3 w-3" />
              </CommandItem>
              <CommandItem onSelect={() => runCommand("/app/databases/new")} className="gap-2">
                <Database className="h-4 w-4" />
                <span>Nouvelle base</span>
              </CommandItem>
              <CommandItem
                onSelect={() => window.dispatchEvent(new CustomEvent("open-ai-panel"))}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Demander à l&apos;IA</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand("/app/settings")} className="gap-2">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </CommandItem>
            </CommandGroup>

            {results && results.length > 0 && (
              <CommandGroup heading="Pages">
                {results.map((r) => (
                  <CommandItem key={r.id} onSelect={() => runCommand(`/app/page/${r.id}`)} className="gap-2">
                    <span className="text-lg">{r.icon ?? "📄"}</span>
                    <span className="truncate">{r.title || "Sans titre"}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
