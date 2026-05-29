"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  File,
  Tag,
} from "lucide-react";

// ─── Type minimal (indépendant de DocumentsClient) ────────────────────────────

export interface DocRef {
  id: string;
  name: string;
  fileType: string;
  publicUrl: string;
  tags: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRenderStrategy(
  fileType: string,
): "native-pdf" | "google" | "image" | "text" | "unsupported" {
  switch (fileType) {
    case "pdf":
      return "native-pdf";
    case "docx":
    case "xlsx":
    case "pptx":
      return "google";
    case "image":
      return "image";
    case "text":
    case "csv":
      return "text";
    default:
      return "unsupported";
  }
}

function googleViewerUrl(url: string) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  docx: <FileText className="h-4 w-4 text-blue-500" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-emerald-500" />,
  pptx: <Presentation className="h-4 w-4 text-orange-500" />,
  image: <FileImage className="h-4 w-4 text-violet-500" />,
  text: <FileText className="h-4 w-4 text-muted-foreground" />,
  csv: <FileSpreadsheet className="h-4 w-4 text-teal-500" />,
  other: <File className="h-4 w-4 text-muted-foreground" />,
};

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  doc: DocRef;
  onClose: () => void;
}

export function DocumentViewerModal({ doc, onClose }: Props) {
  const strategy = getRenderStrategy(doc.fileType);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background/96 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* ── Barre de titre ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.04, duration: 0.15 }}
        className="flex shrink-0 items-center gap-3 border-b border-border/30 bg-card/80 px-4 py-3 backdrop-blur-sm"
      >
        {/* Icône + nom */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {TYPE_ICONS[doc.fileType] ?? TYPE_ICONS.other}
          <span
            className="truncate text-sm font-semibold text-foreground/90"
            title={doc.name}
          >
            {doc.name}
          </span>

          {/* Tags inline */}
          {doc.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 ml-1">
              <Tag className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              {doc.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-600 dark:text-violet-400"
                >
                  #{tag}
                </span>
              ))}
              {doc.tags.length > 4 && (
                <span className="text-[9px] text-muted-foreground/60 font-semibold">
                  +{doc.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={doc.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 px-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ouvrir</span>
          </a>
          <a
            href={doc.publicUrl}
            download={doc.name}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 px-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Télécharger</span>
          </a>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus:outline-none"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07, duration: 0.18 }}
        className="flex-1 overflow-hidden"
      >
        {strategy === "native-pdf" && (
          <iframe
            src={`${doc.publicUrl}#toolbar=1&navpanes=0`}
            className="h-full w-full border-0"
            title={doc.name}
          />
        )}

        {strategy === "google" && (
          <iframe
            src={googleViewerUrl(doc.publicUrl)}
            className="h-full w-full border-0"
            title={doc.name}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}

        {strategy === "image" && (
          <div className="flex h-full items-center justify-center overflow-auto p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.publicUrl}
              alt={doc.name}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              style={{ maxHeight: "calc(100vh - 120px)" }}
            />
          </div>
        )}

        {strategy === "text" && (
          <iframe
            src={doc.publicUrl}
            className="h-full w-full border-0 bg-white dark:bg-neutral-900"
            title={doc.name}
          />
        )}

        {strategy === "unsupported" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/30 bg-card/50">
              <File className="h-9 w-9 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground/80">
                Aperçu non disponible
              </p>
              <p className="max-w-xs text-xs text-muted-foreground/60">
                Ce type de fichier ne peut pas être prévisualisé. Téléchargez-le
                pour l&apos;ouvrir avec l&apos;application appropriée.
              </p>
            </div>
            <a
              href={doc.publicUrl}
              download={doc.name}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Télécharger {doc.name}
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
