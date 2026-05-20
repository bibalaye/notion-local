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
      <DialogContent className="max-w-xl bg-popover/85 backdrop-blur-xl border border-border/60 shadow-2xl p-0 overflow-hidden rounded-xl">
        <DialogTitle className="sr-only">Recherche Globale</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/20">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 border-none p-0"
            placeholder="Rechercher une page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-1.5 py-0.5 rounded bg-accent"
              type="button"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Results */}
        <div className="p-2 max-h-[350px] overflow-y-auto min-h-[150px]">
          <AnimatePresence mode="wait">
            {debouncedQuery.length < 2 ? (
              <motion.div
                key="empty-query"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 text-center text-xs text-muted-foreground"
              >
                <Clock className="h-5 w-5 mx-auto text-muted-foreground/50 mb-2" />
                <p>Saisissez au moins 2 caractères pour lancer la recherche.</p>
                <div className="flex justify-center gap-2 mt-4 text-[10px] text-muted-foreground/60 font-mono">
                  <span>Cmd+K pour ouvrir</span>
                  <span>•</span>
                  <span>Esc pour fermer</span>
                </div>
              </motion.div>
            ) : isFetching ? (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 text-center text-xs text-muted-foreground"
              >
                <Sparkles className="h-5 w-5 mx-auto text-violet-500 animate-spin mb-2" />
                <p>Recherche en cours...</p>
              </motion.div>
            ) : !searchResults || searchResults.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 text-center text-xs text-muted-foreground"
              >
                <File className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                <p>Aucun résultat trouvé pour &quot;{debouncedQuery}&quot;</p>
              </motion.div>
            ) : (
              <motion.div
                key="results-list"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-0.5"
              >
                {searchResults.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handleSelectPage(page.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-left transition-colors duration-150"
                    type="button"
                  >
                    <span className="text-base shrink-0">{page.icon || "📄"}</span>
                    <span className="text-sm font-semibold truncate flex-1">{page.title || "Sans titre"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono bg-accent/60 px-1.5 py-0.5 rounded uppercase">
                      Aller à
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
