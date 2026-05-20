"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { NotionEditor } from "@notoflow/editor";
import { usePageRealtime } from "@notoflow/realtime";
import { DatabaseView } from "@/components/database/DatabaseView";
import { updatePage, toggleFavorite, archivePage, duplicatePage } from "@/app/app/actions/pages";
import { Button } from "@notoflow/ui/components/button";
import {
  Star,
  Share2,
  Trash,
  Copy,
  Sparkles,
  RefreshCcw,
  Languages,
  BookOpen,
  Send,
  Loader2,
  Lock,
  Globe,
  Image as ImageIcon,
  Smile,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["📄", "✍️", "🚀", "💡", "📅", "📊", "🎯", "🌟", "🔥", "💻", "🎨", "📝", "📚", "🏠", "🧠", "🛠️", "📣", "👥", "🏆", "🍕", "🏖️", "✈️"];

const COVER_PRESETS = [
  { name: "Aurora Gradient", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop" },
  { name: "Glass Waves", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" },
  { name: "Pastel Marble", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1200&auto=format&fit=crop" },
  { name: "Ocean Sunset", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop" },
  { name: "Cosmic Nebula", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop" },
  { name: "Minimal Concrete", url: "https://images.unsplash.com/photo-1533038590840-1cde6b66b706?q=80&w=1200&auto=format&fit=crop" },
];

interface PageEditorClientProps {
  page: {
    id: string;
    title: string;
    icon: string | null;
    coverUrl: string | null;
    content: any;
    isPublic: boolean;
    workspaceId: string;
  };
  currentUser: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

const CURSOR_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

export function PageEditorClient({ page, currentUser }: PageEditorClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState<string | null>(page.icon);
  const [coverUrl, setCoverUrl] = useState<string | null>(page.coverUrl);
  const [isPublic, setIsPublic] = useState(page.isPublic);
  const [isFav, setIsFav] = useState(false);
  const [saving, setSaving] = useState(false);

  // Floating controls popovers
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // AI Assistant Sidebar state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);

  // Random cursor color
  const colorRef = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  // Supabase Env (fallback to mock values to prevent errors)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  // Realtime hook
  const { activeUsers, collaborativeCursors, broadcastCursorMove, broadcastDocUpdate } =
    usePageRealtime(
      supabaseUrl,
      supabaseKey,
      page.id,
      {
        id: currentUser.id,
        name: currentUser.name || currentUser.email,
        avatarUrl: currentUser.avatarUrl,
        color: colorRef.current,
      },
      () => {
        // Doc update refetch callback
        toast.info("Le document a été mis à jour par un autre utilisateur.");
        router.refresh();
      },
    );

  // Debounced auto-save logic
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback(
    async (updatedFields: Parameters<typeof updatePage>[1]) => {
      setSaving(true);
      try {
        await updatePage(page.id, updatedFields);
        broadcastDocUpdate();
      } catch (err: any) {
        toast.error("Erreur lors de la sauvegarde.");
      } finally {
        setSaving(false);
      }
    },
    [page.id, broadcastDocUpdate],
  );

  const debouncedSave = useCallback(
    (updatedFields: Parameters<typeof updatePage>[1]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        triggerSave(updatedFields);
      }, 1500);
    },
    [triggerSave],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    debouncedSave({ title: val });
  };

  const handleSelectCover = (url: string) => {
    setCoverUrl(url);
    triggerSave({ coverUrl: url });
    setShowCoverPicker(false);
  };

  const handleRemoveCover = () => {
    setCoverUrl(null);
    triggerSave({ coverUrl: null });
    setShowCoverPicker(false);
  };

  const handleSelectIcon = (selectedEmoji: string) => {
    setIcon(selectedEmoji);
    triggerSave({ icon: selectedEmoji });
    setShowIconPicker(false);
  };

  const handleRemoveIcon = () => {
    setIcon(null);
    triggerSave({ icon: null });
    setShowIconPicker(false);
  };

  const handleToggleFav = async () => {
    try {
      const favState = await toggleFavorite(page.id);
      setIsFav(favState);
      toast.success(favState ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch {
      toast.error("Impossible de modifier les favoris");
    }
  };

  const handleTogglePublic = async () => {
    const nextState = !isPublic;
    setIsPublic(nextState);
    await triggerSave({ isPublic: nextState });
    toast.success(nextState ? "Document public" : "Document privé");
  };

  const handleDuplicate = async () => {
    try {
      const dup = await duplicatePage(page.id);
      toast.success("Document dupliqué !");
      router.push(`/app/page/${dup.id}`);
    } catch {
      toast.error("Erreur de duplication");
    }
  };

  const handleArchive = async () => {
    try {
      await archivePage(page.id);
      toast.success("Page envoyée à la corbeille");
      router.push("/app");
    } catch {
      toast.error("Erreur d'archivage");
    }
  };

  // AI Prompt stream function
  const handleAiAction = async (type: string, options?: { lang?: string }) => {
    setIsAiStreaming(true);
    setAiResponse("");
    setIsAiOpen(true);

    try {
      const payload: any = {
        prompt: aiPrompt || "Améliore ce document",
        type,
      };
      if (options?.lang) payload.targetLang = options.lang;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erreur de l'API IA");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data: ")) {
            const dataStr = cleanLine.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const json = JSON.parse(dataStr);
              if (json.text) {
                setAiResponse((prev) => prev + json.text);
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      toast.error("Erreur de l'assistant IA");
    } finally {
      setIsAiStreaming(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Document Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-2.5 shrink-0 bg-background/95 backdrop-blur-md sticky top-0 z-20">
          {/* Left Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
            <span className="hover:text-foreground cursor-pointer transition">Espace</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
            <div className="flex items-center gap-1 hover:text-foreground cursor-pointer transition max-w-[180px] md:max-w-[260px] truncate">
              {icon && <span className="shrink-0">{icon}</span>}
              <span className="truncate font-semibold">{title || "Sans titre"}</span>
            </div>
            {saving && (
              <span className="text-[10px] bg-accent/60 text-muted-foreground px-1.5 py-0.5 rounded font-semibold ml-2 animate-pulse shrink-0">
                Sauvegarde...
              </span>
            )}
          </div>

          {/* Right collaborators & actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Presence Avatars */}
            <div className="flex -space-x-1.5 overflow-hidden items-center mr-1">
              {activeUsers.map((u) => (
                <div
                  key={u.id}
                  className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: u.color }}
                  title={u.name}
                >
                  {u.name[0].toUpperCase()}
                </div>
              ))}
            </div>

            {/* AI Assistant button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAiOpen(!isAiOpen)}
              className="h-8 gap-1.5 border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Assistant IA</span>
            </Button>

            {/* Sharing / Public toggle */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs"
              onClick={handleTogglePublic}
            >
              {isPublic ? (
                <>
                  <Globe className="h-3.5 w-3.5 text-green-500" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Privé</span>
                </>
              )}
            </Button>

            {/* Favorite button */}
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 ${isFav ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"}`}
              onClick={handleToggleFav}
            >
              <Star className="h-4 w-4 fill-current" />
            </Button>

            {/* Actions MenuDropdown */}
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="Plus d'actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 mt-1.5 z-50 w-52 rounded-xl border border-border bg-popover/95 p-1 shadow-2xl backdrop-blur-md">
                    <button
                      onClick={() => {
                        handleDuplicate();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-foreground/90 hover:bg-accent transition"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Dupliquer la page</span>
                    </button>
                    
                    {coverUrl ? (
                      <button
                        onClick={() => {
                          handleRemoveCover();
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-foreground/90 hover:bg-accent transition"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Supprimer la couverture</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleSelectCover(COVER_PRESETS[0].url);
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-foreground/90 hover:bg-accent transition"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Ajouter une couverture</span>
                      </button>
                    )}

                    <div className="h-[1px] bg-border/60 my-1" />

                    <button
                      onClick={() => {
                        handleArchive();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash className="h-3.5 w-3.5 text-destructive/80" />
                      <span>Envoyer à la Corbeille</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cover image container */}
        {coverUrl && (
          <div className="relative group/cover-image h-48 md:h-60 w-full overflow-hidden bg-muted shrink-0">
            <img
              src={coverUrl}
              alt="Page cover"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            
            {/* Cover controls on hover */}
            <div className="absolute bottom-4 right-6 flex items-center gap-2 opacity-0 group-hover/cover-image:opacity-100 transition-opacity duration-200 z-10">
              <button
                onClick={() => setShowCoverPicker(!showCoverPicker)}
                className="flex items-center gap-1.5 text-xs bg-background/90 hover:bg-background text-foreground font-semibold px-3 py-1.5 rounded-lg shadow-md border border-border/60 transition"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Changer de couverture
              </button>
              <button
                onClick={handleRemoveCover}
                className="flex items-center gap-1.5 text-xs bg-background/90 hover:bg-destructive hover:text-destructive-foreground text-destructive font-semibold px-3 py-1.5 rounded-lg shadow-md border border-border/60 transition"
              >
                <Trash className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>

            {/* Cover Picker Dropdown */}
            {showCoverPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCoverPicker(false)} />
                <div className="absolute right-6 bottom-14 z-50 w-80 rounded-xl border border-border bg-popover/95 p-3 shadow-2xl backdrop-blur-md max-h-72 overflow-y-auto">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Couvertures recommandées
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {COVER_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleSelectCover(preset.url)}
                        className="group/item relative h-16 rounded-lg overflow-hidden border border-border/60 hover:border-violet-500 transition"
                        title={preset.name}
                      >
                        <img src={preset.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                          <span className="text-[10px] text-white font-medium truncate w-full text-left">
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Editor Writing Board */}
        <div className="max-w-3xl w-full mx-auto px-12 py-8 flex-1">
          {/* Cover image button / area if no cover exists */}
          {!coverUrl && (
            <div className="group/cover h-8 flex items-center justify-start gap-3 opacity-0 hover:opacity-100 transition-opacity duration-200">
              {!icon && (
                <button
                  onClick={() => handleSelectIcon("📄")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/80 hover:text-foreground bg-accent/40 hover:bg-accent/80 px-2 py-1 rounded transition"
                >
                  <Smile className="h-3 w-3" />
                  Ajouter une icône
                </button>
              )}
              <button
                onClick={() => handleSelectCover(COVER_PRESETS[0].url)}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/80 hover:text-foreground bg-accent/40 hover:bg-accent/80 px-2 py-1 rounded transition"
              >
                <ImageIcon className="h-3 w-3" />
                Ajouter une couverture
              </button>
            </div>
          )}

          {/* Icon selector & Add cover button when cover exists but no icon exists */}
          {coverUrl && !icon && (
            <div className="h-6 flex items-center justify-start opacity-0 hover:opacity-100 transition-opacity duration-200 -mt-2 mb-4">
              <button
                onClick={() => handleSelectIcon("📄")}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/80 hover:text-foreground bg-accent/40 hover:bg-accent/80 px-2 py-1 rounded transition"
              >
                <Smile className="h-3 w-3" />
                Ajouter une icône
              </button>
            </div>
          )}

          {/* Large Page Icon */}
          {icon && (
            <div className={`relative z-10 w-24 h-24 ${coverUrl ? "-mt-16 mb-4" : "mt-8 mb-6"}`}>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-7xl hover:scale-105 active:scale-95 transition hover:bg-accent/30 rounded-2xl p-2 -ml-2 select-none"
                title="Changer d'icône"
              >
                {icon}
              </button>

              {/* Emoji Picker Popover */}
              {showIconPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowIconPicker(false)} />
                  <div className="absolute top-26 left-0 z-50 w-64 rounded-xl border border-border bg-popover/95 p-3 shadow-2xl backdrop-blur-md">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Choisir une icône
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleSelectIcon(emoji)}
                          className="text-2xl p-1.5 rounded-lg hover:bg-accent transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    {icon && (
                      <button
                        onClick={handleRemoveIcon}
                        className="w-full text-center text-xs text-destructive hover:bg-destructive/10 py-1.5 rounded-lg mt-3 border border-destructive/20 font-medium transition"
                      >
                        Supprimer l'icône
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Main Title Input inside the editor canvas */}
          <div className="relative group/title w-full mt-4">
            {/* If no icon exists and no cover exists, let user add icon/cover on title focus/hover */}
            {!coverUrl && !icon && (
              <div className="absolute -top-6 left-0 flex gap-2 opacity-0 group-hover/title:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleSelectIcon("📄")}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground bg-accent/40 px-2 py-0.5 rounded transition"
                >
                  <Smile className="h-3 w-3" /> Icône
                </button>
                <button
                  onClick={() => handleSelectCover(COVER_PRESETS[0].url)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground bg-accent/40 px-2 py-0.5 rounded transition"
                >
                  <ImageIcon className="h-3 w-3" /> Couverture
                </button>
              </div>
            )}

            <input
              value={title}
              onChange={handleTitleChange}
              className="text-4xl font-bold font-sans tracking-tight bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full placeholder:text-muted-foreground/20 text-foreground mb-6"
              placeholder="Sans titre"
            />
          </div>

          <NotionEditor
            initialContent={page.content}
            onChange={(json) => debouncedSave({ content: json })}
            renderDatabase={(dbId) => <DatabaseView databaseId={dbId} />}
            onCursorChange={(pos) => broadcastCursorMove(pos)}
            collaborativeCursors={collaborativeCursors}
            onTriggerAI={() => setIsAiOpen(true)}
          />
        </div>
      </div>

      {/* Floating AI Side Panel */}
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border/50 bg-card/90 backdrop-blur-xl h-full flex flex-col shadow-2xl shrink-0"
          >
            {/* AI Side Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-violet-500" />
                <h3 className="text-sm font-bold tracking-tight">Rédacteur IA</h3>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsAiOpen(false)}>
                ✕
              </Button>
            </div>

            {/* Quick Prompts Panel */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Instructions personnalisées
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="ex: Réécris ce paragraphe dans un ton plus professionnel..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full text-xs rounded-xl border border-border/80 bg-background/50 p-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  />
                  <button
                    onClick={() => handleAiAction("custom")}
                    disabled={isAiStreaming}
                    className="absolute bottom-2.5 right-2.5 h-6 w-6 rounded bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition disabled:opacity-50"
                  >
                    {isAiStreaming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Assistant Actions Grid */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Actions rapides
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAiAction("improve")}
                    disabled={isAiStreaming}
                    className="h-8 justify-start text-[11px] font-semibold gap-1.5"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Améliorer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAiAction("summarize")}
                    disabled={isAiStreaming}
                    className="h-8 justify-start text-[11px] font-semibold gap-1.5"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    Résumer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAiAction("expand")}
                    disabled={isAiStreaming}
                    className="h-8 justify-start text-[11px] font-semibold gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    Développer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAiAction("translate", { lang: "anglais" })}
                    disabled={isAiStreaming}
                    className="h-8 justify-start text-[11px] font-semibold gap-1.5"
                  >
                    <Languages className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    Tr. Anglais
                  </Button>
                </div>
              </div>

              {/* Streaming Output Result */}
              {aiResponse && (
                <div className="space-y-2 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                    <span>Résultat</span>
                    {isAiStreaming && <span className="animate-pulse text-violet-500 text-[9px]">En cours...</span>}
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4.5 text-xs leading-relaxed max-h-[250px] overflow-y-auto select-all whitespace-pre-wrap">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
