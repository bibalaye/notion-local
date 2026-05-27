"use client";

import { Sparkles, FileText, Database, Layers } from "lucide-react";

/**
 * AppMockup — Maquette visuelle de l'interface NotoFlow.
 * Rendu statique, pas d'état, optimisé pour le LCP.
 */
export function AppMockup() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6), 0 0 120px rgba(124,58,237,0.08)",
      }}
    >
      {/* Gradient fade bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32"
        style={{ background: "linear-gradient(to top, #080808, transparent)" }}
      />

      {/* Window chrome */}
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(248,113,113,0.5)" }} />
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(251,191,36,0.5)" }} />
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(52,211,153,0.5)" }} />
        <div
          className="mx-auto rounded-md px-4 py-1 text-xs"
          style={{ background: "rgba(255,255,255,0.04)", color: "#555" }}
        >
          notoflow.app/workspace/getting-started
        </div>
      </div>

      {/* App layout */}
      <div
        className="grid overflow-hidden text-xs"
        style={{
          gridTemplateColumns: "200px 1fr",
          height: 420,
          background: "#0c0c0c",
        }}
      >
        {/* Sidebar */}
        <div
          className="flex flex-col gap-1 border-r p-3"
          style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0a0a" }}
        >
          {/* Workspace header */}
          <div className="mb-2 flex items-center gap-2 px-2 py-1">
            <div
              className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-black text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              N
            </div>
            <span className="font-semibold" style={{ color: "#888", fontSize: 11 }}>Mon Workspace</span>
          </div>

          {/* Nav items */}
          {[
            { icon: Sparkles, label: "Assistant IA", active: false, color: "#a78bfa" },
            { icon: FileText, label: "Getting Started", active: true, color: "#60a5fa" },
            { icon: FileText, label: "Roadmap Q3", active: false, color: "#60a5fa" },
            { icon: Database, label: "Tâches & Projets", active: false, color: "#34d399" },
            { icon: Layers, label: "Templates", active: false, color: "#fbbf24" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
                style={{
                  background: item.active ? "rgba(96,165,250,0.08)" : "transparent",
                  color: item.active ? item.color : "#555",
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span style={{ fontSize: 11 }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Editor area */}
        <div className="overflow-hidden p-8">
          {/* Page title */}
          <div className="mb-6">
            <div className="mb-1 text-2xl font-black tracking-tight" style={{ color: "#e8e8e8", fontFamily: "'Syne', sans-serif" }}>
              🚀 Getting Started
            </div>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: "#444" }}>
              <span>Modifié il y a 2 min</span>
              <span>·</span>
              <span className="rounded-full px-2 py-0.5" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
                Partagé
              </span>
            </div>
          </div>

          {/* Content blocks */}
          <div className="space-y-3" style={{ color: "#666", lineHeight: 1.7 }}>
            <p style={{ fontSize: 13 }}>
              NotoFlow est un espace de travail intelligent qui combine notes, bases de données
              et IA pour booster votre productivité.
            </p>

            {/* AI block */}
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: "rgba(167,139,250,0.2)",
                background: "rgba(167,139,250,0.05)",
              }}
            >
              <div className="mb-2 flex items-center gap-2" style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Réponse IA — Mistral</span>
                <span
                  className="ml-auto rounded-full px-2 py-0.5"
                  style={{ background: "rgba(167,139,250,0.1)", fontSize: 10 }}
                >
                  Généré
                </span>
              </div>
              <div
                className="rounded-lg p-3 font-mono"
                style={{ background: "rgba(0,0,0,0.3)", color: "#888", fontSize: 11, lineHeight: 1.8 }}
              >
                <span style={{ color: "#a78bfa" }}>✦</span> NotoFlow simplifie la gestion de vos projets :<br />
                <span style={{ color: "#555" }}>1.</span> Zéro config avec Supabase et Prisma intégrés.<br />
                <span style={{ color: "#555" }}>2.</span> Sync instantanée entre tous vos appareils.<br />
                <span style={{ color: "#555" }}>3.</span> IA Mistral disponible dans chaque note.
              </div>
            </div>

            {/* Inline toolbar hint */}
            <div className="flex items-center gap-2" style={{ fontSize: 11, color: "#333" }}>
              {["/", "B", "I", "H1", "H2", "[ ]", "---"].map((cmd, i) => (
                <kbd
                  key={i}
                  className="rounded px-1.5 py-0.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {cmd}
                </kbd>
              ))}
              <span style={{ color: "#2a2a2a" }}>Tapez / pour les commandes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
