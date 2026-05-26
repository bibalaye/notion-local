"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { NotionEditor } from "@notoflow/editor";
import { usePageRealtime } from "@notoflow/realtime";
import { DatabaseView } from "@/components/database/DatabaseView";
import { updatePage, toggleFavorite, archivePage, duplicatePage, createPage } from "@/app/app/actions/pages";
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
  FileText,
  CheckSquare,
  Map,
  MessageSquare,
  Terminal,
  LayoutDashboard,
  Check,
  Users,
  Cpu,
  Compass,
  ChevronLeft,
  Database,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
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

const PAGE_BACKGROUNDS = [
  { label: "Defaut", value: "default", className: "bg-background" },
  { label: "Ivoire", value: "ivory", className: "bg-[#fbfaf7] dark:bg-[#1f1e1b]" },
  { label: "Bleu", value: "blue", className: "bg-[#f4f8fb] dark:bg-[#18212b]" },
  { label: "Vert", value: "green", className: "bg-[#f5f9f3] dark:bg-[#19251d]" },
  { label: "Rose", value: "rose", className: "bg-[#fbf6f8] dark:bg-[#2a1d25]" },
];

const PAGE_WIDTHS = {
  regular: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none",
} as const;

const PAGE_FONTS = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
} as const;

type PageCustomization = {
  width: keyof typeof PAGE_WIDTHS;
  font: keyof typeof PAGE_FONTS;
  smallText: boolean;
  background: (typeof PAGE_BACKGROUNDS)[number]["value"];
};

const DEFAULT_PAGE_CUSTOMIZATION: PageCustomization = {
  width: "regular",
  font: "sans",
  smallText: false,
  background: "default",
};

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
  } | null;
  /** Rôle du membre courant dans le workspace. null = page publique non connectée. */
  userRole?: string | null;
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

export function PageEditorClient({ page, currentUser, userRole }: PageEditorClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState<string | null>(page.icon);
  const [coverUrl, setCoverUrl] = useState<string | null>(page.coverUrl);
  const [isPublic, setIsPublic] = useState(page.isPublic);
  const [isFav, setIsFav] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");

  // Lecture seule si : non connecté, ou rôle VIEWER/GUEST (pas de droit d'écriture)
  const READ_ONLY_ROLES = ["VIEWER", "GUEST"];
  const isReadOnly = !currentUser || (userRole != null && READ_ONLY_ROLES.includes(userRole));

  // Floating controls popovers
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [pageCustomization, setPageCustomization] =
    useState<PageCustomization>(DEFAULT_PAGE_CUSTOMIZATION);

  // AI Assistant Sidebar state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [aiActiveTab, setAiActiveTab] = useState<"chat" | "generators" | "coder" | "suggest">("chat");
  const [selectionContext, setSelectionContext] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [selectedGenerator, setSelectedGenerator] = useState<any>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [generatorInputs, setGeneratorInputs] = useState<Record<string, string>>({});
  const [selectedLanguage, setSelectedLanguage] = useState("anglais");

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
      currentUser
        ? {
            id: currentUser.id,
            name: currentUser.name || currentUser.email,
            avatarUrl: currentUser.avatarUrl,
            color: colorRef.current,
          }
        : null,
      () => {
        // Doc update refetch callback
        toast.info("Le document a été mis à jour par un autre utilisateur.");
        router.refresh();
      },
    );

  // Debounced auto-save logic
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<Parameters<typeof updatePage>[1] | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedTitleRef = useRef(page.title);
  const lastSavedContentRef = useRef(JSON.stringify(page.content ?? null));

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`notoflow-page-customization:${page.id}`);
      if (saved) {
        setPageCustomization({
          ...DEFAULT_PAGE_CUSTOMIZATION,
          ...JSON.parse(saved),
        });
      }
    } catch {
      // Ignore local customization restore errors.
    }
  }, [page.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        `notoflow-page-customization:${page.id}`,
        JSON.stringify(pageCustomization),
      );
    } catch {
      // Ignore local customization persistence errors.
    }
  }, [page.id, pageCustomization]);

  const queueSave = useCallback((updatedFields: Parameters<typeof updatePage>[1]) => {
    pendingSaveRef.current = {
      ...(pendingSaveRef.current ?? {}),
      ...updatedFields,
    };
  }, []);

  const flushSave = useCallback(async (): Promise<boolean> => {
    if (isReadOnly || isSavingRef.current || !pendingSaveRef.current) return false;

    const payload = pendingSaveRef.current;
    pendingSaveRef.current = null;
    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      await updatePage(page.id, payload);
      if (payload.title !== undefined) lastSavedTitleRef.current = payload.title;
      if (payload.content !== undefined) lastSavedContentRef.current = typeof payload.content === "string" ? payload.content : JSON.stringify(payload.content);
      broadcastDocUpdate();
      setSaveStatus("saved");
      if (savedStatusTimeoutRef.current) clearTimeout(savedStatusTimeoutRef.current);
      savedStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 1400);
      return true;
    } catch (err: any) {
      pendingSaveRef.current = {
        ...payload,
        ...(pendingSaveRef.current ?? {}),
      };
      setSaveStatus("error");
      toast.error("Erreur lors de la sauvegarde. Nouvelle tentative au prochain changement.");
      return false;
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        saveTimeoutRef.current = setTimeout(() => {
          void flushSave();
        }, 300);
      }
    }
  }, [broadcastDocUpdate, isReadOnly, page.id]);

  const triggerSave = useCallback(
    async (updatedFields: Parameters<typeof updatePage>[1]) => {
      if (isReadOnly) return false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      queueSave(updatedFields);
      return flushSave();
    },
    [flushSave, isReadOnly, queueSave],
  );

  const debouncedSave = useCallback(
    (updatedFields: Parameters<typeof updatePage>[1], delay = 3000) => {
      if (isReadOnly) return;
      queueSave(updatedFields);
      setSaveStatus("pending");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void flushSave();
      }, delay);
    },
    [flushSave, isReadOnly, queueSave],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (val !== lastSavedTitleRef.current) debouncedSave({ title: val }, 900);
  };

  const handleEditorChange = (json: unknown) => {
    const nextContent = JSON.stringify(json);
    if (nextContent !== lastSavedContentRef.current) {
      debouncedSave({ content: nextContent }, 3500);
    }
  };

  const handleSelectCover = (url: string) => {
    if (isReadOnly) return;
    setCoverUrl(url);
    triggerSave({ coverUrl: url });
    setShowCoverPicker(false);
  };

  const handleRemoveCover = () => {
    if (isReadOnly) return;
    setCoverUrl(null);
    triggerSave({ coverUrl: null });
    setShowCoverPicker(false);
  };

  const handleSelectIcon = (selectedEmoji: string) => {
    if (isReadOnly) return;
    setIcon(selectedEmoji);
    triggerSave({ icon: selectedEmoji });
    setShowIconPicker(false);
  };

  const handleRemoveIcon = () => {
    if (isReadOnly) return;
    setIcon(null);
    triggerSave({ icon: null });
    setShowIconPicker(false);
  };

  const handleToggleFav = async () => {
    if (isReadOnly) return;
    try {
      const favState = await toggleFavorite(page.id);
      setIsFav(favState);
      toast.success(favState ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch {
      toast.error("Impossible de modifier les favoris");
    }
  };

  const handleTogglePublic = async () => {
    if (isReadOnly) return;
    const nextState = !isPublic;
    setIsPublic(nextState);
    const saved = await triggerSave({ isPublic: nextState });
    if (!saved) {
      setIsPublic(!nextState);
      return;
    }
    toast.success(nextState ? "Document public" : "Document privé");
  };

  const handleDuplicate = async () => {
    if (isReadOnly) return;
    try {
      const dup = await duplicatePage(page.id);
      toast.success("Document dupliqué !");
      router.push(`/app/page/${dup.id}`);
    } catch {
      toast.error("Erreur de duplication");
    }
  };

  const handleArchive = async () => {
    if (isReadOnly) return;
    try {
      await archivePage(page.id);
      toast.success("Page envoyée à la corbeille");
      router.push("/app");
    } catch {
      toast.error("Erreur d'archivage");
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedStatusTimeoutRef.current) clearTimeout(savedStatusTimeoutRef.current);
    };
  }, []);

  // AI Prompt stream function
  const handleAiAction = async (
    type: string,
    options?: { lang?: string; customPrompt?: string; directEditorInsert?: boolean }
  ) => {
    setIsAiStreaming(true);
    setAiResponse("");
    setIsAiOpen(true);

    const targetPrompt = options?.customPrompt || aiPrompt || "Améliore ce document";

    try {
      const payload: any = {
        prompt: targetPrompt,
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

      let fullContent = "";

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
                fullContent += json.text;
                setAiResponse(fullContent);

                if (options?.directEditorInsert && editorInstance) {
                  editorInstance.commands.setContent(fullContent);
                }
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }

      if (options?.directEditorInsert && editorInstance) {
        const json = editorInstance.getJSON();
        debouncedSave({ content: JSON.stringify(json) }, 100);
      }
    } catch (err: any) {
      toast.error("Erreur de l'assistant IA");
    } finally {
      setIsAiStreaming(false);
    }
  };

  const handleSendChatMessage = async (customPromptText?: string) => {
    const promptToSend = customPromptText || aiPrompt;
    if (!promptToSend.trim()) return;

    setIsAiStreaming(true);
    setAiResponse("");
    setAiPrompt("");

    const userMsg = { role: "user" as const, content: promptToSend };
    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);

    try {
      const conversationText = nextHistory
        .map((m) => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
        .join("\n") + "\nAssistant:";

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: conversationText,
          type: "chat",
        }),
      });

      if (!response.ok) throw new Error("Erreur de l'API de chat IA");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) return;

      let fullContent = "";
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
                fullContent += json.text;
                setAiResponse(fullContent);
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
      setAiResponse("");
    } catch (err: any) {
      toast.error("Erreur lors de la communication avec le chat IA");
    } finally {
      setIsAiStreaming(false);
    }
  };

  const handleInsertAtCursor = (htmlContent: string) => {
    if (!editorInstance) {
      toast.error("Éditeur non initialisé.");
      return;
    }
    editorInstance.commands.insertContent(htmlContent);
    toast.success("Contenu inséré avec succès !");
  };

  // Process direct AI page generation request from query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldGenerate = urlParams.get("ai_generate") === "true";
    const shouldOpen = urlParams.get("ai_open") === "true";

    if ((shouldGenerate || shouldOpen) && editorInstance) {
      setIsAiOpen(true);
      if (shouldGenerate) {
        const type = urlParams.get("type") || "generate-page";
        const promptText = urlParams.get("prompt") || "Nouveau document";
        // Clear query params immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        void handleAiAction(type, { customPrompt: promptText, directEditorInsert: true });
      } else {
        // Just clear query params if we are just opening
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [editorInstance]);

  useEffect(() => {
    const handleOpenAiStudio = () => {
      setIsAiOpen(true);
    };
    window.addEventListener("open-ai-studio", handleOpenAiStudio);
    return () => {
      window.removeEventListener("open-ai-studio", handleOpenAiStudio);
    };
  }, []);

  // Create a new empty page in the workspace, redirect to it and trigger direct AI streaming
  const handleCreateAndGenerate = async (genType: string) => {
    try {
      const newPage = await createPage(page.workspaceId);
      toast.success("Page créée avec succès ! Initialisation de l'IA...");
      router.push(
        `/app/page/${newPage.id}?ai_generate=true&prompt=${encodeURIComponent(
          aiPrompt || "Document généré par l'IA"
        )}&type=${genType}`
      );
    } catch (err: any) {
      toast.error("Erreur lors de la création directe de la page");
    }
  };

  const selectedBackground =
    PAGE_BACKGROUNDS.find((preset) => preset.value === pageCustomization.background) ??
    PAGE_BACKGROUNDS[0];
  const pageWidthClass = PAGE_WIDTHS[pageCustomization.width];
  const pageFontClass = PAGE_FONTS[pageCustomization.font];
  const editorTextClass = pageCustomization.smallText ? "text-[0.94rem]" : "text-base";

  return (
    <div className={`flex h-screen overflow-hidden ${selectedBackground.className}`}>
      {/* Main Document Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-transparent">
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
            {saveStatus !== "idle" && (
              <span className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {saveStatus === "pending" && "Modifications en attente"}
                {saveStatus === "saving" && "Sauvegarde..."}
                {saveStatus === "saved" && "Enregistre"}
                {saveStatus === "error" && "Non sauvegarde"}
              </span>
            )}
            {isReadOnly && (
              <span className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Lecture seule
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

            {isReadOnly && (
              <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                <Link href={`/login?redirect=/app/page/${page.id}`}>Se connecter</Link>
              </Button>
            )}

            {/* AI Assistant button */}
            <Button
              size="sm"
              variant="outline"
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
              disabled={isReadOnly}
              onClick={handleToggleFav}
            >
              <Star className="h-4 w-4 fill-current" />
            </Button>

            {isPublic && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const publicUrl = `${window.location.origin}/p/${page.id}`;
                  void navigator.clipboard.writeText(publicUrl);
                  toast.success("Lien public copie");
                }}
                title="Copier le lien public"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}

            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCustomizePanel(!showCustomizePanel)}
                title="Personnaliser la page"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>

              {showCustomizePanel && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCustomizePanel(false)} />
                  <div className="absolute right-0 mt-1.5 z-50 w-72 rounded-xl border border-border bg-popover/95 p-3 shadow-2xl backdrop-blur-md">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold text-foreground">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      Personnaliser
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Largeur
                        </div>
                        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/50 p-1">
                          {[
                            { label: "Standard", value: "regular" },
                            { label: "Large", value: "wide" },
                            { label: "Pleine", value: "full" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() =>
                                setPageCustomization((prev) => ({
                                  ...prev,
                                  width: item.value as PageCustomization["width"],
                                }))
                              }
                              className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                                pageCustomization.width === item.value
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Police
                        </div>
                        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/50 p-1">
                          {[
                            { label: "Sans", value: "sans" },
                            { label: "Serif", value: "serif" },
                            { label: "Mono", value: "mono" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() =>
                                setPageCustomization((prev) => ({
                                  ...prev,
                                  font: item.value as PageCustomization["font"],
                                }))
                              }
                              className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                                pageCustomization.font === item.value
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold">
                        Texte compact
                        <input
                          type="checkbox"
                          checked={pageCustomization.smallText}
                          onChange={(event) =>
                            setPageCustomization((prev) => ({
                              ...prev,
                              smallText: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-border accent-violet-600"
                        />
                      </label>

                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Couleur de page
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {PAGE_BACKGROUNDS.map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() =>
                                setPageCustomization((prev) => ({
                                  ...prev,
                                  background: preset.value,
                                }))
                              }
                              className={`h-8 rounded-lg border transition ${preset.className} ${
                                pageCustomization.background === preset.value
                                  ? "border-violet-500 ring-2 ring-violet-500/20"
                                  : "border-border/70 hover:border-foreground/40"
                              }`}
                              title={preset.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions MenuDropdown */}
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                disabled={isReadOnly}
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
        <div
          className={`${pageWidthClass} ${pageFontClass} ${editorTextClass} w-full mx-auto px-6 md:px-12 py-8 flex-1 transition-[max-width] duration-200`}
        >
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

          {/* Bandeau lecture seule — visible uniquement pour VIEWER/GUEST */}
          {isReadOnly && currentUser && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-500/90">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <p className="text-[11px] font-medium">
                Vous consultez cette page en lecture seule.{" "}
                <span className="text-amber-500/60">
                  {userRole === "GUEST" ? "Les invités" : "Les lecteurs"} ne peuvent pas modifier le contenu.
                </span>
              </p>
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
              onBlur={() => void flushSave()}
              readOnly={isReadOnly}
              className={`text-4xl font-bold ${pageFontClass} tracking-tight bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full placeholder:text-muted-foreground/20 text-foreground mb-6`}
              placeholder="Sans titre"
            />
          </div>

          <NotionEditor
            initialContent={page.content}
            onChange={handleEditorChange}
            readOnly={isReadOnly}
            renderDatabase={(dbId) => <DatabaseView databaseId={dbId} />}
            onCursorChange={(pos) => broadcastCursorMove(pos)}
            collaborativeCursors={collaborativeCursors}
            onEditorReady={(editor) => setEditorInstance(editor)}
            onTriggerAI={(editor) => {
              if (!isReadOnly) {
                setEditorInstance(editor);
                setIsAiOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* Floating AI Side Panel - ✨ Mistral AI Studio */}
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border/50 bg-card/90 backdrop-blur-xl h-full flex flex-col shadow-2xl shrink-0 z-30"
          >
            {/* AI Side Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 bg-muted/20 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
                <h3 className="text-sm font-black tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  Mistral AI Studio
                </h3>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-accent/60" onClick={() => setIsAiOpen(false)}>
                ✕
              </Button>
            </div>

            {/* AI Studio Tabs Navigation */}
            <div className="flex border-b border-border/30 bg-muted/5 shrink-0 px-2 py-1 gap-1">
              {[
                { id: "chat", label: "Chat", icon: MessageSquare },
                { id: "generators", label: "Générateurs", icon: Sparkles },
                { id: "coder", label: "Dev", icon: Terminal },
                { id: "suggest", label: "Organiser", icon: Compass },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = aiActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAiActiveTab(tab.id as any);
                      setSelectedGenerator(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold rounded-lg transition-all ${
                      isActive
                        ? "bg-violet-600/10 text-violet-500 border border-violet-500/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-violet-500" : "text-muted-foreground"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* --- 1. CHAT TAB --- */}
              {aiActiveTab === "chat" && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  {/* Message History & Context */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
                    {/* Welcome Message */}
                    {chatMessages.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-5 text-center space-y-2">
                        <Sparkles className="h-6 w-6 text-violet-500 mx-auto" />
                        <h4 className="text-xs font-bold">Bienvenue sur le Chat Mistral</h4>
                        <p className="text-[10px] text-muted-foreground leading-normal">
                          Posez des questions sur votre document, demandez des améliorations de style ou rédigez du contenu complet.
                        </p>
                      </div>
                    )}

                    {/* Active Editor Text Selection Context Card */}
                    {editorInstance && (() => {
                      const sel = editorInstance.state.selection;
                      const hasSelection = sel && sel.from !== sel.to;
                      if (!hasSelection) return null;
                      const text = editorInstance.state.doc.textBetween(sel.from, sel.to, " ");
                      return (
                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-violet-500 uppercase tracking-wider">
                            <Sparkles className="h-3 w-3" /> Texte sélectionné dans l&apos;éditeur
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 italic bg-background/40 p-2 rounded-lg">
                            &quot;{text}&quot;
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAiPrompt(`Améliore ce texte sélectionné : "${text}"`);
                                toast.success("Sélection insérée dans la boîte de dialogue !");
                              }}
                              className="text-[9px] h-6 px-2.5 font-bold"
                            >
                              Utiliser comme prompt
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Chat Bubble List */}
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col space-y-1.5 max-w-[85%] ${
                          msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs leading-relaxed transition-all ${
                            msg.role === "user"
                              ? "bg-violet-600/10 border border-violet-500/20 text-foreground"
                              : "bg-muted/40 border border-border/30 text-foreground prose-xs prose-invert"
                          }`}
                          dangerouslySetInnerHTML={msg.role === "assistant" ? { __html: msg.content } : undefined}
                        >
                          {msg.role === "user" ? msg.content : undefined}
                        </div>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-2 pl-1 select-none">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content.replace(/<[^>]*>/g, ""));
                                setCopiedStates((prev) => ({ ...prev, [index]: true }));
                                toast.success("Contenu copié !");
                                setTimeout(() => setCopiedStates((prev) => ({ ...prev, [index]: false })), 2000);
                              }}
                              className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-foreground transition"
                            >
                              {copiedStates[index] ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  <span>Copié</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copier</span>
                                </>
                              )}
                            </button>
                            <span className="text-muted-foreground/30 text-[9px]">•</span>
                            <button
                              onClick={() => handleInsertAtCursor(msg.content)}
                              className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-foreground transition"
                            >
                              <FileText className="h-3 w-3 text-violet-500" />
                              <span>Insérer au curseur</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Active Streaming Output Bubble */}
                    {aiResponse && (
                      <div className="flex flex-col space-y-1.5 max-w-[85%] mr-auto items-start animate-in fade-in duration-200">
                        <div className="rounded-2xl px-4 py-3 text-xs leading-relaxed bg-muted/40 border border-violet-500/20 text-foreground prose-xs prose-invert">
                          <div dangerouslySetInnerHTML={{ __html: aiResponse }} />
                          <span className="inline-block h-3.5 w-1 bg-violet-500 animate-pulse ml-0.5 rounded-full" />
                        </div>
                        <div className="flex items-center gap-1.5 pl-1 select-none">
                          <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                          <span className="text-[9px] text-violet-500 animate-pulse font-bold">Mistral génère...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Chat Box */}
                  <div className="pt-2 border-t border-border/40 shrink-0">
                    <div className="relative">
                      <textarea
                        rows={2}
                        placeholder="Envoyez un message à Mistral..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSendChatMessage();
                          }
                        }}
                        className="w-full text-xs rounded-xl border border-border/80 bg-background/50 p-3 pr-10 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition resize-none"
                      />
                      <button
                        onClick={() => handleSendChatMessage()}
                        disabled={isAiStreaming || !aiPrompt.trim()}
                        className="absolute bottom-2.5 right-2.5 h-7 w-7 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-violet-600"
                      >
                        {isAiStreaming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2. GENERATORS TAB --- */}
              {aiActiveTab === "generators" && (
                <div className="space-y-4">
                  {!selectedGenerator ? (
                    <>
                      {/* Grid of 10 Specialized Generators */}
                      <div className="flex flex-col gap-2">
                        {[
                          {
                            id: "generate-page",
                            title: "Créateur de Page",
                            desc: "Génère un document entier riche et structuré.",
                            icon: FileText,
                            color: "text-violet-500 bg-violet-500/10",
                          },
                          {
                            id: "meeting",
                            title: "Résumé de Réunion",
                            desc: "Analyse une transcription et génère un plan d&apos;action.",
                            icon: Users,
                            color: "text-emerald-500 bg-emerald-500/10",
                          },
                          {
                            id: "tasks",
                            title: "Extracteur de Tâches",
                            desc: "Extrait une checklist actionnable de vos notes.",
                            icon: CheckSquare,
                            color: "text-blue-500 bg-blue-500/10",
                          },
                          {
                            id: "roadmap",
                            title: "Feuille de Route",
                            desc: "Génère une roadmap projet trimestrielle structurée.",
                            icon: Map,
                            color: "text-amber-500 bg-amber-500/10",
                          },
                          {
                            id: "crm",
                            title: "Structure CRM",
                            desc: "Crée une base de données clients complète.",
                            icon: Database,
                            color: "text-pink-500 bg-pink-500/10",
                          },
                          {
                            id: "docs",
                            title: "Doc Technique",
                            desc: "Documentation structurée avec blocs de code.",
                            icon: Terminal,
                            color: "text-teal-500 bg-teal-500/10",
                          },
                          {
                            id: "dev",
                            title: "Assistant Code",
                            desc: "Analyse, debugue ou génère des algorithmes.",
                            icon: Cpu,
                            color: "text-indigo-500 bg-indigo-500/10",
                          },
                          {
                            id: "translate",
                            title: "Traducteur Express",
                            desc: "Traduit fidèlement dans n&apos;importe quelle langue.",
                            icon: Languages,
                            color: "text-cyan-500 bg-cyan-500/10",
                          },
                          {
                            id: "suggest",
                            title: "Conseiller Workspace",
                            desc: "Suggestions d&apos;organisation documentaires.",
                            icon: Compass,
                            color: "text-orange-500 bg-orange-500/10",
                          },
                          {
                            id: "dashboard",
                            title: "KPI Dashboard",
                            desc: "Génère un tableau de bord analytique.",
                            icon: LayoutDashboard,
                            color: "text-purple-500 bg-purple-500/10",
                          },
                        ].map((gen) => {
                          const Icon = gen.icon;
                          return (
                            <button
                              key={gen.id}
                              onClick={() => {
                                setSelectedGenerator(gen);
                                setGeneratorInputs((prev) => ({ ...prev, [gen.id]: "" }));
                              }}
                              className="w-full text-left p-3 rounded-xl border border-border/40 hover:border-violet-500/30 bg-card hover:bg-accent/25 transition-all flex items-center gap-3.5 group"
                            >
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${gen.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-foreground group-hover:text-violet-400 transition">
                                  {gen.title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground truncate">{gen.desc}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* Detailed Config Screen for Selected Generator */
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                      <Button
                        onClick={() => setSelectedGenerator(null)}
                        variant="ghost"
                        size="sm"
                        className="text-[11px] h-7 px-2 hover:bg-accent/40 gap-1"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Retour aux générateurs
                      </Button>

                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${selectedGenerator.color}`}>
                          <selectedGenerator.icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{selectedGenerator.title}</h4>
                          <p className="text-[10px] text-muted-foreground">{selectedGenerator.desc}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {selectedGenerator.id === "meeting" && "Coller la transcription de réunion"}
                          {selectedGenerator.id === "tasks" && "Notes ou texte brut"}
                          {selectedGenerator.id === "translate" && "Texte à traduire"}
                          {selectedGenerator.id === "suggest" && "Instructions / Contexte de l'espace"}
                          {selectedGenerator.id !== "meeting" &&
                            selectedGenerator.id !== "tasks" &&
                            selectedGenerator.id !== "translate" &&
                            selectedGenerator.id !== "suggest" &&
                            "Sujet ou consignes de génération"}
                        </label>
                        <textarea
                          rows={selectedGenerator.id === "meeting" ? 6 : 4}
                          placeholder={
                            selectedGenerator.id === "meeting"
                              ? "ex: Jean: Salut tout le monde, aujourd'hui nous devons valider les livrables de la V2..."
                              : selectedGenerator.id === "translate"
                              ? "ex: Entrez le texte que vous souhaitez faire traduire par Mistral..."
                              : "ex: Entrez les consignes détaillées ici..."
                          }
                          value={generatorInputs[selectedGenerator.id] || ""}
                          onChange={(e) =>
                            setGeneratorInputs((prev) => ({ ...prev, [selectedGenerator.id]: e.target.value }))
                          }
                          className="w-full text-xs rounded-xl border border-border/80 bg-background/50 p-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                        />
                      </div>

                      {/* Language Selection for Translator */}
                      {selectedGenerator.id === "translate" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Langue cible
                          </label>
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full text-xs rounded-xl border border-border/80 bg-background/50 p-2.5 focus:outline-none focus:border-violet-500"
                          >
                            <option value="anglais">🇬🇧 Anglais</option>
                            <option value="espagnol">🇪🇸 Espagnol</option>
                            <option value="allemand">🇩🇪 Allemand</option>
                            <option value="italien">🇮🇹 Italien</option>
                            <option value="portugais">🇵🇹 Portugais</option>
                            <option value="japonais">🇯🇵 Japonais</option>
                          </select>
                        </div>
                      )}

                      {/* Generators Actions Trigger */}
                      <div className="space-y-2 pt-2 border-t border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          Destination de l&apos;AI
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => {
                              void handleAiAction(selectedGenerator.id, {
                                customPrompt: generatorInputs[selectedGenerator.id],
                                lang: selectedGenerator.id === "translate" ? selectedLanguage : undefined,
                                directEditorInsert: true,
                              });
                              setSelectedGenerator(null);
                            }}
                            disabled={isAiStreaming || !generatorInputs[selectedGenerator.id]?.trim()}
                            variant="outline"
                            className="text-xs h-9 justify-center gap-1 hover:bg-violet-600/10 hover:text-violet-500"
                          >
                            Dans ce document
                          </Button>
                          <Button
                            onClick={async () => {
                              const promptText = generatorInputs[selectedGenerator.id];
                              try {
                                const newPage = await createPage(page.workspaceId);
                                toast.success("Nouvelle page créée !");
                                router.push(
                                  `/app/page/${newPage.id}?ai_generate=true&prompt=${encodeURIComponent(
                                    promptText || "Document généré par l'IA"
                                  )}&type=${selectedGenerator.id}${
                                    selectedGenerator.id === "translate" ? `&lang=${selectedLanguage}` : ""
                                  }`
                                );
                                setSelectedGenerator(null);
                              } catch {
                                toast.error("Erreur de création de la page");
                              }
                            }}
                            disabled={isAiStreaming || !generatorInputs[selectedGenerator.id]?.trim()}
                            className="text-xs h-9 bg-violet-600 hover:bg-violet-700 text-white justify-center gap-1 shadow-md shadow-violet-600/20"
                          >
                            Nouvelle page
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- 3. CODER ASSISTANT TAB --- */}
              {aiActiveTab === "coder" && (
                <div className="space-y-4">
                  <div className="space-y-1 bg-violet-600/5 rounded-xl border border-violet-500/15 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-500">
                      <Cpu className="h-4 w-4" /> Assistant Développeur
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Mistral analyse votre code, explique des algorithmes, corrige des bugs ou génère des tests unitaires robustes.
                    </p>
                  </div>

                  {/* Preconfigured Quick Prompt Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Expliquer le code", prompt: "Explique ce code de manière exhaustive, ligne par ligne." },
                      { label: "Trouver des bugs", prompt: "Analyse ce code, détecte les failles potentielles et propose des corrections." },
                      { label: "Optimiser", prompt: "Optimise la structure de ce code pour de meilleures performances et une meilleure lisibilité." },
                      { label: "Générer des tests", prompt: "Rédige une suite de tests unitaires complète pour ce code." },
                    ].map((btn, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAiPrompt(btn.prompt);
                          toast.success("Prompt copié dans l'éditeur de texte !");
                        }}
                        className="text-[10px] h-8 justify-start font-semibold text-muted-foreground hover:text-foreground"
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Coller votre code / prompt technique
                    </label>
                    <div className="relative">
                      <textarea
                        rows={5}
                        placeholder="Collez votre code ici ou posez une question technique..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full text-xs font-mono rounded-xl border border-border/80 bg-background/50 p-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      void handleAiAction("dev", {
                        customPrompt: aiPrompt,
                        directEditorInsert: false,
                      });
                    }}
                    disabled={isAiStreaming || !aiPrompt.trim()}
                    className="w-full text-xs h-9 bg-violet-600 hover:bg-violet-700 text-white font-bold justify-center gap-1.5 shadow-md shadow-violet-600/20"
                  >
                    {isAiStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                    Lancer l&apos;analyse code
                  </Button>

                  {/* Output block with option to insert code block directly */}
                  {aiResponse && (
                    <div className="space-y-2 pt-3 border-t border-border/40 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Réponse code</span>
                        <button
                          onClick={() => {
                            handleInsertAtCursor(`<pre><code>${aiResponse.replace(/<[^>]*>/g, "")}</code></pre>`);
                          }}
                          className="text-[9px] text-violet-500 hover:underline hover:text-violet-400 font-black transition"
                        >
                          Insérer comme bloc de code
                        </button>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs font-mono max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                        {aiResponse}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- 4. SUGGESTIONS TAB --- */}
              {aiActiveTab === "suggest" && (
                <div className="space-y-4">
                  <div className="space-y-1 bg-amber-500/5 rounded-xl border border-amber-500/15 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                      <Compass className="h-4 w-4" /> Suggestions d&apos;Espace de Travail
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Mistral analyse votre page active et l&apos;organisation globale pour vous proposer des sous-pages clés, des tags utiles et des conventions de structure documentaire optimisées.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      void handleAiAction("suggest", {
                        customPrompt: `Analyse la page actuelle "${title}" pour proposer un plan d'organisation optimal de l'espace de travail.`,
                        directEditorInsert: false,
                      });
                    }}
                    disabled={isAiStreaming}
                    className="w-full text-xs h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold justify-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    {isAiStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
                    Analyser l&apos;espace
                  </Button>

                  {/* Suggestion list render */}
                  {aiResponse && (
                    <div className="space-y-3 pt-3 border-t border-border/40 animate-in fade-in duration-200">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Recommandations d&apos;Organisation
                      </div>
                      <div
                        className="rounded-xl border bg-muted/30 p-4 text-xs leading-relaxed max-h-[300px] overflow-y-auto prose-xs prose-invert"
                        dangerouslySetInnerHTML={{ __html: aiResponse }}
                      />
                      
                      {/* Premium Fast-Create Actions next to recommendations */}
                      <div className="rounded-xl border border-dashed border-border p-3.5 space-y-2.5">
                        <h5 className="text-[10px] font-black uppercase text-muted-foreground">Création rapide conseillée</h5>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const newPage = await createPage(page.workspaceId);
                                toast.success("Sous-page créée ! Redirection...");
                                router.push(`/app/page/${newPage.id}`);
                              } catch {
                                toast.error("Erreur lors de la création");
                              }
                            }}
                            className="text-[10px] h-7 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 font-bold"
                          >
                            Créer une sous-page vide
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
