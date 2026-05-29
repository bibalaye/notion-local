"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Search,
  Tag,
  Trash2,
  Eye,
  Filter,
  X,
  Plus,
  Download,
  MoreHorizontal,
  FileImage,
  FileSpreadsheet,
  Presentation,
  File,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@notoflow/ui/components/button";
import { toast } from "sonner";
import { uploadDocument, deleteDocument, updateDocumentTags, renameDocument } from "@/app/app/actions/documents";
import { DocumentViewer } from "./DocumentViewer";
import { TagEditor } from "./TagEditor";
import { cn } from "@notoflow/ui/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentItem {
  id: string;
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  publicUrl: string;
  tags: string[];
  createdAt: string;
  uploader?: { id: string; name: string | null; avatarUrl: string | null } | null;
}

interface Props {
  workspaceId: string;
  initialDocuments: DocumentItem[];
  allTags: string[];
  userRole: string;
  currentUserId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  docx: <FileText className="h-5 w-5 text-blue-500" />,
  xlsx: <FileSpreadsheet className="h-5 w-5 text-emerald-500" />,
  pptx: <Presentation className="h-5 w-5 text-orange-500" />,
  image: <FileImage className="h-5 w-5 text-violet-500" />,
  text: <FileText className="h-5 w-5 text-muted-foreground" />,
  csv: <FileSpreadsheet className="h-5 w-5 text-teal-500" />,
  other: <File className="h-5 w-5 text-muted-foreground" />,
};

const FILE_TYPE_LABELS: Record<string, string> = {
  all: "Tous",
  pdf: "PDF",
  docx: "Word",
  xlsx: "Excel",
  pptx: "PowerPoint",
  image: "Images",
  text: "Texte",
  csv: "CSV",
  other: "Autres",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.md,.csv";

const canEdit = (role: string) => ["OWNER", "ADMIN", "EDITOR"].includes(role);

// ─── Composant principal ──────────────────────────────────────────────────────

export function DocumentsClient({
  workspaceId,
  initialDocuments,
  allTags,
  userRole,
  currentUserId,
}: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [tags, setTags] = useState<string[]>(allTags);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<DocumentItem | null>(null);
  const [tagEditorDoc, setTagEditorDoc] = useState<DocumentItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Filtrage ────────────────────────────────────────────────────────────────

  const filtered = documents.filter((doc) => {
    if (activeType !== "all" && doc.fileType !== activeType) return false;
    if (activeTag && !doc.tags.includes(activeTag)) return false;
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Types présents dans les documents actuels
  const presentTypes = ["all", ...new Set(documents.map((d) => d.fileType))];

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;

    for (const file of arr) {
      setUploadingFiles((prev) => [...prev, file.name]);
      try {
        const fd = new FormData();
        fd.append("workspaceId", workspaceId);
        fd.append("file", file);

        const doc = await uploadDocument(fd);
        const serialized = JSON.parse(JSON.stringify(doc)) as DocumentItem;
        setDocuments((prev) => [serialized, ...prev]);

        // Mettre à jour les tags disponibles
        const newTags = serialized.tags.filter((t) => !tags.includes(t));
        if (newTags.length) setTags((prev) => [...new Set([...prev, ...newTags])].sort());

        toast.success(`"${file.name}" importé avec succès.`);
      } catch (err: any) {
        toast.error(`Erreur : ${err.message}`);
      } finally {
        setUploadingFiles((prev) => prev.filter((n) => n !== file.name));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  // ── Suppression ─────────────────────────────────────────────────────────────

  const handleDelete = (doc: DocumentItem) => {
    startTransition(async () => {
      try {
        await deleteDocument(doc.id);
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        toast.success(`"${doc.name}" supprimé.`);
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  // ── Mise à jour des tags ─────────────────────────────────────────────────────

  const handleTagsSave = async (docId: string, newTags: string[]) => {
    try {
      await updateDocumentTags(docId, newTags);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, tags: newTags } : d)),
      );
      const allNew = [...new Set([...tags, ...newTags])].sort();
      setTags(allNew);
      setTagEditorDoc(null);
      toast.success("Tags mis à jour.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-full flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        if (canEdit(userRole)) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={canEdit(userRole) ? handleDrop : undefined}
    >
      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-border/30 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
              <FolderOpen className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground/90">Documents</h1>
              <p className="text-[10px] text-muted-foreground font-medium">
                {documents.length} fichier{documents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {canEdit(userRole) && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFiles.length > 0}
            >
              {uploadingFiles.length > 0 ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Importer
            </Button>
          )}
        </div>

        {/* Barre de recherche + filtres */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-border/40 bg-card/50 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filtre par type */}
          <div className="flex items-center gap-1 flex-wrap">
            {presentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  "h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors",
                  activeType === type
                    ? "bg-indigo-500 text-white"
                    : "bg-card/50 border border-border/40 text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {FILE_TYPE_LABELS[type] ?? type}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre par tag */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  "h-5 rounded-full px-2 text-[10px] font-semibold transition-colors",
                  activeTag === tag
                    ? "bg-violet-500 text-white"
                    : "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20",
                )}
              >
                #{tag}
              </button>
            ))}
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="h-5 rounded-full px-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Zone de drop + liste ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Indicateur de drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-500/10 backdrop-blur-sm border-2 border-dashed border-indigo-500/50 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-3 text-indigo-500">
                <Upload className="h-12 w-12" />
                <p className="text-lg font-bold">Déposer les fichiers ici</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload en cours */}
        {uploadingFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            {uploadingFiles.map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/40 px-4 py-2.5"
              >
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  Import de <strong className="text-foreground/80">{name}</strong>…
                </span>
              </div>
            ))}
          </div>
        )}

        {/* État vide */}
        {filtered.length === 0 && uploadingFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card/50 border border-border/30">
              <FolderOpen className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-foreground/70">
              {search || activeTag || activeType !== "all"
                ? "Aucun document ne correspond aux filtres"
                : "Aucun document importé"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {canEdit(userRole)
                ? "Glissez-déposez des fichiers ou cliquez sur « Importer »"
                : "Les documents importés par votre équipe apparaîtront ici"}
            </p>
            {canEdit(userRole) && !search && !activeTag && activeType === "all" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Importer un document
              </Button>
            )}
          </div>
        )}

        {/* Grille de documents */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {filtered.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  onView={() => setViewerDoc(doc)}
                  onDelete={() => handleDelete(doc)}
                  onEditTags={() => setTagEditorDoc(doc)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleInputChange}
      />

      {/* ── Viewer ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewerDoc && (
          <DocumentViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />
        )}
      </AnimatePresence>

      {/* ── Éditeur de tags ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {tagEditorDoc && (
          <TagEditor
            doc={tagEditorDoc}
            allTags={tags}
            onSave={(newTags) => handleTagsSave(tagEditorDoc.id, newTags)}
            onClose={() => setTagEditorDoc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Carte document ───────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  userRole,
  currentUserId,
  onView,
  onDelete,
  onEditTags,
}: {
  doc: DocumentItem;
  userRole: string;
  currentUserId: string;
  onView: () => void;
  onDelete: () => void;
  onEditTags: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = doc.uploader?.id === currentUserId;
  const canDel = canEdit(userRole) && (isOwner || ["OWNER", "ADMIN"].includes(userRole));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="group relative flex flex-col rounded-xl border border-border/30 bg-card/40 p-4 shadow-sm transition-all duration-150 hover:border-border/60 hover:bg-card/70 hover:shadow-md"
    >
      {/* Icône + nom */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 shrink-0">
          {FILE_TYPE_ICONS[doc.fileType] ?? FILE_TYPE_ICONS.other}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-xs font-semibold text-foreground/90 leading-tight cursor-pointer hover:text-indigo-500 transition-colors"
            title={doc.name}
            onClick={onView}
          >
            {doc.name}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/60 font-medium">
            {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {/* Menu contextuel */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent/80 hover:text-foreground focus:outline-none"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-7 z-20 min-w-[160px] rounded-xl border border-border/40 bg-popover shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => { onView(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground/80 hover:bg-accent/60 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Visualiser
                  </button>
                  <a
                    href={doc.publicUrl}
                    download={doc.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground/80 hover:bg-accent/60 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Télécharger
                  </a>
                  {canEdit(userRole) && (
                    <button
                      onClick={() => { onEditTags(); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground/80 hover:bg-accent/60 transition-colors"
                    >
                      <Tag className="h-3.5 w-3.5" /> Gérer les tags
                    </button>
                  )}
                  {canDel && (
                    <>
                      <div className="mx-2 my-1 border-t border-border/30" />
                      <button
                        onClick={() => { onDelete(); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {doc.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-600 dark:text-violet-400"
            >
              #{tag}
            </span>
          ))}
          {doc.tags.length > 4 && (
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
              +{doc.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Bouton visualiser au survol */}
      <button
        onClick={onView}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/30 bg-background/50 py-1.5 text-[11px] font-semibold text-muted-foreground opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-accent/60 hover:text-foreground"
      >
        <Eye className="h-3 w-3" /> Visualiser
      </button>
    </motion.div>
  );
}
