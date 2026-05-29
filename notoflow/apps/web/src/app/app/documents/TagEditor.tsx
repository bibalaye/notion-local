"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { X, Tag, Plus, Check } from "lucide-react";
import { Button } from "@notoflow/ui/components/button";
import { cn } from "@notoflow/ui/lib/utils";
import type { DocumentItem } from "./DocumentsClient";

interface Props {
  doc: DocumentItem;
  allTags: string[];
  onSave: (tags: string[]) => Promise<void>;
  onClose: () => void;
}

export function TagEditor({ doc, allTags, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([...doc.tags]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus auto
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const suggestions = allTags.filter(
    (t) => t.includes(input.toLowerCase()) && !selected.includes(t),
  );

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (!clean || selected.includes(clean)) return;
    setSelected((prev) => [...prev, clean]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    setSelected((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && selected.length > 0) {
      removeTag(selected[selected.length - 1]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panneau */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/40 bg-popover shadow-2xl"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-bold text-foreground/90">Gérer les tags</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nom du document */}
        <div className="border-b border-border/20 px-5 py-2.5">
          <p className="truncate text-xs text-muted-foreground/70 font-medium" title={doc.name}>
            📄 {doc.name}
          </p>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-4">
          {/* Tags sélectionnés */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Tags actifs
            </p>
            <div className="flex min-h-[36px] flex-wrap gap-1.5 rounded-lg border border-border/40 bg-background/50 p-2">
              {selected.length === 0 && (
                <span className="text-xs text-muted-foreground/50 self-center px-1">
                  Aucun tag — tapez pour en ajouter
                </span>
              )}
              {selected.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 rounded-full hover:bg-violet-500/20 p-0.5 transition-colors focus:outline-none"
                    aria-label={`Retirer ${tag}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Saisie */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Ajouter un tag
            </p>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/,/g, ""))}
                onKeyDown={handleKeyDown}
                placeholder="Nom du tag… (Entrée pour valider)"
                className="h-9 w-full rounded-lg border border-border/40 bg-background/50 px-3 pr-10 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
              {input.trim() && (
                <button
                  onClick={() => addTag(input)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md bg-violet-500 text-white hover:bg-violet-600 transition-colors focus:outline-none"
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Tags existants
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="flex items-center gap-1 rounded-full border border-border/40 bg-card/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-500/30 transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center justify-end gap-2 border-t border-border/30 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 gap-1.5 text-xs"
          >
            {saving ? (
              "Enregistrement…"
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
