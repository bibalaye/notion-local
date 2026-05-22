"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPage } from "@/app/app/actions/pages";
import { Button } from "@notoflow/ui/components/button";
import {
  Sparkles,
  FileText,
  Users,
  Map,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface QuickAiActionsProps {
  workspaceId: string;
}

export function QuickAiActions({ workspaceId }: QuickAiActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    id: string;
    title: string;
    placeholder: string;
    label: string;
  } | null>(null);
  const [promptText, setPromptText] = useState("");

  const handleActionClick = async (actionId: string, actionTitle: string) => {
    if (!workspaceId) {
      toast.error("Aucun espace de travail actif trouvé.");
      return;
    }

    if (actionId === "chat") {
      setIsPending(true);
      try {
        const newPage = await createPage(workspaceId);
        toast.success("Initialisation de l'IA...");
        router.push(`/app/page/${newPage.id}?ai_open=true`);
      } catch (err) {
        toast.error("Erreur de création de la page");
      } finally {
        setIsPending(false);
      }
      return;
    }

    // Open configuration modal for other action types
    let placeholder = "Décrivez le sujet de votre page en quelques lignes...";
    let label = "Instructions / Sujet du document";

    if (actionId === "meeting") {
      placeholder = "Collez la transcription brute de la réunion ici (ex: Jean: Bonjour à tous, aujourd'hui nous devons...)";
      label = "Transcription de la réunion";
    } else if (actionId === "roadmap") {
      placeholder = "Décrivez les objectifs, jalons ou projets pour les trimestres à venir...";
      label = "Objectifs et fonctionnalités clés";
    }

    setSelectedAction({
      id: actionId,
      title: actionTitle,
      placeholder,
      label,
    });
    setPromptText("");
  };

  const handleLaunch = async () => {
    if (!promptText.trim() || !selectedAction || !workspaceId) return;

    setIsPending(true);
    try {
      const newPage = await createPage(workspaceId);
      toast.success("Page créée ! Lancement de la génération Mistral AI...");
      router.push(
        `/app/page/${newPage.id}?ai_generate=true&prompt=${encodeURIComponent(
          promptText
        )}&type=${selectedAction.id}`
      );
      setSelectedAction(null);
    } catch (err) {
      toast.error("Erreur lors de l'initialisation de la génération");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-black text-violet-500 uppercase tracking-widest bg-violet-500/5 py-1 px-3 rounded-full w-fit border border-violet-500/10">
        <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
        <span>✨ Mistral AI Studio — Actions Rapides</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Shortcut 1 - generate-page */}
        <button
          onClick={() => handleActionClick("generate-page", "Générer une page")}
          disabled={isPending}
          className="group text-left rounded-2xl border border-border/50 bg-gradient-to-br from-violet-600/5 via-card to-card p-5 hover:border-violet-500/35 hover:bg-accent/40 shadow-sm transition-all duration-150 flex items-center justify-between"
        >
          <div className="space-y-1.5 pr-2">
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-violet-400 transition-colors">
              Générer une Page
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Créez instantanément un wiki, rapport ou document complet grâce à l&apos;IA.
            </p>
          </div>
        </button>

        {/* Shortcut 2 - meeting */}
        <button
          onClick={() => handleActionClick("meeting", "Compte-rendu de Réunion")}
          disabled={isPending}
          className="group text-left rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-600/5 via-card to-card p-5 hover:border-emerald-500/35 hover:bg-accent/40 shadow-sm transition-all duration-150 flex items-center justify-between"
        >
          <div className="space-y-1.5 pr-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">
              Compte-rendu de Réunion
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Transformez vos transcriptions en comptes-rendus structurés et plans d&apos;action.
            </p>
          </div>
        </button>

        {/* Shortcut 3 - roadmap */}
        <button
          onClick={() => handleActionClick("roadmap", "Créer une Feuille de Route")}
          disabled={isPending}
          className="group text-left rounded-2xl border border-border/50 bg-gradient-to-br from-amber-600/5 via-card to-card p-5 hover:border-amber-500/35 hover:bg-accent/40 shadow-sm transition-all duration-150 flex items-center justify-between"
        >
          <div className="space-y-1.5 pr-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition">
              <Map className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-amber-400 transition-colors">
              Créer une Feuille de Route
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Convertissez vos notes ou objectifs en feuilles de route trimestrielles.
            </p>
          </div>
        </button>

        {/* Shortcut 4 - chat */}
        <button
          onClick={() => handleActionClick("chat", "Discuter avec l'IA")}
          disabled={isPending}
          className="group text-left rounded-2xl border border-border/50 bg-gradient-to-br from-indigo-600/5 via-card to-card p-5 hover:border-indigo-500/35 hover:bg-accent/40 shadow-sm transition-all duration-150 flex items-center justify-between"
        >
          <div className="space-y-1.5 pr-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition animate-pulse">
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-indigo-400 transition-colors">
              Discuter avec l&apos;IA
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Ouvrez le chat IA pour poser une question libre ou brainstormer en direct.
            </p>
          </div>
        </button>
      </div>

      {/* Frosted Glass Custom Modal for AI inputs */}
      {selectedAction && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
                <h3 className="text-sm font-black tracking-tight">{selectedAction.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold h-7 w-7 rounded-full bg-accent/45 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {selectedAction.label}
              </label>
              <textarea
                rows={5}
                placeholder={selectedAction.placeholder}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full text-xs rounded-xl border border-border/80 bg-background/50 p-4 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedAction(null)}
                className="text-xs h-9 hover:bg-accent/50 px-4 rounded-xl font-bold"
              >
                Annuler
              </Button>
              <Button
                onClick={handleLaunch}
                disabled={isPending || !promptText.trim()}
                className="text-xs h-9 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 rounded-xl shadow-md shadow-violet-600/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Création...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-white" />
                    Lancer la génération
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
