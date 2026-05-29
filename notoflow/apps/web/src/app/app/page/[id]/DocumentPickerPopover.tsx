"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  File,
  Tag,
  Loader2,
  Paperclip,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import { getDocuments, uploadDocument } from "@/app/app/actions/documents";
import { toast } from "sonner";
import type { DocRef } from "./DocumentViewerModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />,
  docx: <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />,
  xlsx: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500 shrink-0" />,
  pptx: <Presentation className="h-3.5 w-3.5 text-orange-500 shrink-0" />,
  image: <FileImage className="h-3.5 w-3.5 text-violet-500 shrink-0" />,
  text: <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
  csv: <FileSpreadsheet className="h-3.5 w-3.5 text-teal-500 shrink-0" />,
  other: <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
};

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.md,.csv";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string;
  /** Position d'ancrage (bouton toolbar ou coordonnées du curseur @) */
  anchorRect?: DOMRect | null;
  /** Filtre initial (texte tapé après @) */
  initialQuery?: string;
  onSelect: (doc: DocRef) => void;
  onClose: () => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function DocumentPickerPopover({
  workspaceId,
  anchorRect,
  initialQuery = "",
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [docs, setDocs] = useState<DocRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Synchroniser la query quand initialQuery change (cas @ mention live)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Charger les documents du workspace
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDocuments(workspaceId, { search: query || undefined })
      .then((data) => {
        if (!cancelled) {
          setDocs(
            data.map((d) => ({
              id: d.id,
              name: d.name,
              fileType: d.fileType,
              publicUrl: d.publicUrl,
              tags: d.tags,
            })),
          );
          setActiveIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, query]);

  // Focus auto sur l'input de recherche
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Navigation clavier dans la liste
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, docs.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && docs[activeIndex]) {
        e.preventDefault();
        onSelect(docs[activeIndex]);
      }
    },
    [docs, activeIndex, onSelect],
  );

  // Scroll automatique vers l'item actif
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Upload direct ──────────────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(file.name);
    try {
      const fd = new FormData();
      fd.append("workspaceId", workspaceId);
      fd.append("file", file);
      const doc = await uploadDocument(fd);
      const docRef: DocRef = {
        id: doc.id,
        name: doc.name,
        fileType: doc.fileType,
        publicUrl: doc.publicUrl,
        tags: doc.tags,
      };
      toast.success(`"${doc.name}" importé avec succès.`);
      // Sélectionner directement le doc uploadé
      onSelect(docRef);
    } catch (err: any) {
      toast.error(`Erreur d'import : ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  // Drag & drop sur le popover
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // ── Position du popover ────────────────────────────────────────────────────

  const style: React.CSSProperties = anchorRect
    ? {
        position: "fixed",
        top: Math.min(anchorRect.bottom + 6, window.innerHeight - 380),
        left: Math.min(anchorRect.left, window.innerWidth - 320),
        zIndex: 9999,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      };

  return (
    <>
      {/* Overlay transparent pour fermer au clic extérieur */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -4 }}
        transition={{ duration: 0.12 }}
        style={style}
        className="w-80 rounded-xl border border-border/50 bg-popover shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border/30 px-3 py-2.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Paperclip className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] font-bold text-foreground/80">
              Attacher un document
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* ── Recherche ────────────────────────────────────────────────────── */}
        <div className="relative border-b border-border/20 px-3 py-2">
          <Search className="absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un document…"
            className="h-7 w-full rounded-md bg-background/50 pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>

        {/* ── Liste des documents ───────────────────────────────────────────── */}
        <div ref={listRef} className="max-h-52 overflow-y-auto py-1">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
            </div>
          )}

          {!loading && docs.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground/60">
                {query ? "Aucun document trouvé" : "Aucun document dans ce workspace"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/40">
                Importez un fichier ci-dessous
              </p>
            </div>
          )}

          {!loading &&
            docs.map((doc, i) => (
              <button
                key={doc.id}
                data-index={i}
                onClick={() => onSelect(doc)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === activeIndex
                    ? "bg-indigo-500/10 text-foreground"
                    : "text-foreground/80 hover:bg-accent/50"
                }`}
              >
                {TYPE_ICONS[doc.fileType] ?? TYPE_ICONS.other}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{doc.name}</p>
                  {doc.tags.length > 0 && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                      <span className="truncate text-[9px] text-muted-foreground/60">
                        {doc.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                      </span>
                    </div>
                  )}
                </div>
                <span className="shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground/60">
                  {doc.fileType}
                </span>
              </button>
            ))}
        </div>

        {/* ── Zone d'upload ─────────────────────────────────────────────────── */}
        <div className="border-t border-border/30 p-2">
          {uploading ? (
            /* Progression de l'upload */
            <div className="flex items-center gap-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Import en cours…
                </p>
                {uploadProgress && (
                  <p className="truncate text-[9px] text-muted-foreground/60">
                    {uploadProgress}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Bouton d'upload + zone de drop */
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group flex w-full items-center gap-2.5 rounded-lg border border-dashed border-border/50 bg-muted/10 px-3 py-2.5 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                <Upload className="h-3.5 w-3.5 text-indigo-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                  Importer un fichier
                </p>
                <p className="text-[9px] text-muted-foreground/50">
                  PDF, Word, Excel, image… ou glisser-déposer
                </p>
              </div>
            </button>
          )}
        </div>

        {/* ── Pied ─────────────────────────────────────────────────────────── */}
        <div className="border-t border-border/20 px-3 py-1.5 bg-muted/10">
          <p className="text-[9px] text-muted-foreground/50">
            ↑↓ naviguer · Entrée sélectionner · Échap fermer
          </p>
        </div>
      </motion.div>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleFileInputChange}
      />
    </>
  );
}
