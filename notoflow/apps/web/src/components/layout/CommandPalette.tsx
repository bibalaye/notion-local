"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, File, Sparkles, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@notoflow/ui/components/dialog";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();

  // Handle keyboard shortcut Cmd+K / Ctrl+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const handleCustomEvent = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomEvent);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomEvent);
    };
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data: searchResults, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => api.search.global(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelectPage = (pageId: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/app/page/${pageId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl bg-popover/90 backdrop-blur-xl border border-border/30 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-0 overflow-hidden rounded-lg">
        <DialogTitle className="sr-only">Recherche Globale</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4.5 py-3.5 border-b border-border/30 bg-transparent select-none">
          <Search className="h-4 w-4 text-muted-foreground/60 shrink-0 stroke-[1.8]" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 border-none p-0 font-medium"
            placeholder="Rechercher ou lancer une commande..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[10px] text-muted-foreground/80 hover:text-foreground font-semibold px-2 py-0.5 rounded bg-accent/60 transition-colors cursor-pointer focus:outline-none"
              type="button"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Results */}
        <div className="p-1.5 max-h-[350px] overflow-y-auto min-h-[140px] select-none">
          <AnimatePresence mode="wait">
            {debouncedQuery.length < 2 ? (
              <motion.div
                key="empty-query"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center text-xs text-muted-foreground/80 space-y-4"
              >
                <Clock className="h-6 w-6 mx-auto text-muted-foreground/40 stroke-[1.5]" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground/70">Recherche rapide Notion</p>
                  <p className="text-[11px] text-muted-foreground/60">Saisissez au moins 2 caractères pour explorer votre workspace.</p>
                </div>
                <div className="flex justify-center items-center gap-2 mt-4 text-[9px] text-muted-foreground/50 font-bold uppercase tracking-wider">
                  <kbd className="font-mono text-[9px] font-semibold text-muted-foreground/75 px-1.5 py-0.5 bg-neutral-200/50 dark:bg-neutral-800/40 border border-neutral-300/20 rounded shadow-sm">⌘K pour ouvrir</kbd>
                  <span>•</span>
                  <kbd className="font-mono text-[9px] font-semibold text-muted-foreground/75 px-1.5 py-0.5 bg-neutral-200/50 dark:bg-neutral-800/40 border border-neutral-300/20 rounded shadow-sm">Esc pour fermer</kbd>
                </div>
              </motion.div>
            ) : isFetching ? (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center text-xs text-muted-foreground/80 space-y-3"
              >
                <Sparkles className="h-6 w-6 mx-auto text-violet-500 animate-pulse stroke-[1.8]" />
                <p className="font-semibold text-foreground/70">Recherche dans vos documents...</p>
              </motion.div>
            ) : !searchResults || searchResults.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center text-xs text-muted-foreground/80 space-y-2"
              >
                <File className="h-6 w-6 mx-auto text-muted-foreground/30 stroke-[1.5]" />
                <p className="font-semibold text-foreground/70">Aucun résultat trouvé</p>
                <p className="text-[11px] text-muted-foreground/50">Aucun document ne correspond à &quot;{debouncedQuery}&quot;</p>
              </motion.div>
            ) : (
              <motion.div
                key="results-list"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-0.5 px-0.5"
              >
                <div className="text-[9px] font-extrabold text-muted-foreground/55 uppercase tracking-widest px-2.5 py-1">
                  Pages correspondantes
                </div>
                {searchResults.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handleSelectPage(page.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-accent text-left transition-colors duration-100 cursor-pointer focus:outline-none"
                    type="button"
                  >
                    <span className="text-[14px] shrink-0 w-5 text-center">{page.icon || "📄"}</span>
                    <span className="text-xs font-semibold truncate flex-1 text-foreground/80">{page.title || "Sans titre"}</span>
                    <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider bg-neutral-200/50 dark:bg-neutral-800/40 border border-neutral-300/10 px-2 py-0.5 rounded">
                      Ouvrir
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default CommandPalette;
