"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Apple, Terminal, Download, Check, ChevronDown, ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "windows" | "mac" | "linux";

interface DistTarget {
  label: string;
  file: string;
  arch: string;
  size: string;
  recommended?: boolean;
}

interface PlatformConfig {
  id: Platform;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  targets: DistTarget[];
}

// ─── Config des distributions ─────────────────────────────────────────────────

const VERSION = "0.1.0";

const PLATFORMS: PlatformConfig[] = [
  {
    id: "windows",
    label: "Windows",
    icon: Monitor,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    targets: [
      {
        label: "Installeur NSIS",
        file: `NotoFlow-Setup-${VERSION}.exe`,
        arch: "x64",
        size: "~85 MB",
        recommended: true,
      },
      {
        label: "Portable (.exe)",
        file: `NotoFlow-${VERSION}-portable.exe`,
        arch: "x64",
        size: "~85 MB",
      },
    ],
  },
  {
    id: "mac",
    label: "macOS",
    icon: Apple,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    targets: [
      {
        label: "Apple Silicon",
        file: `NotoFlow-${VERSION}-arm64.dmg`,
        arch: "arm64 (M1/M2/M3)",
        size: "~90 MB",
        recommended: true,
      },
      {
        label: "Intel",
        file: `NotoFlow-${VERSION}-x64.dmg`,
        arch: "x64",
        size: "~90 MB",
      },
    ],
  },
  {
    id: "linux",
    label: "Linux",
    icon: Terminal,
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    targets: [
      {
        label: "AppImage",
        file: `NotoFlow-${VERSION}.AppImage`,
        arch: "x64",
        size: "~95 MB",
        recommended: true,
      },
      {
        label: "Debian / Ubuntu",
        file: `notoflow_${VERSION}_amd64.deb`,
        arch: "x64",
        size: "~70 MB",
      },
    ],
  },
];

const FEATURES = [
  "Serveur Next.js embarqué — aucune dépendance externe",
  "Node.js v20 LTS bundlé — fonctionne hors ligne",
  "Configuration chiffrée AES-256-GCM au premier lancement",
  "Mises à jour automatiques via electron-updater",
  "Icône système (tray) + raccourcis natifs",
];

// ─── Download Button ──────────────────────────────────────────────────────────

function DownloadButton({ target, color }: { target: DistTarget; color: string }) {
  const [state, setState] = useState<"idle" | "downloading" | "done">("idle");

  const handleClick = () => {
    if (state !== "idle") return;
    setState("downloading");
    // Simuler le déclenchement du téléchargement
    // En prod : pointer vers /api/download?file=... ou un CDN
    const link = document.createElement("a");
    link.href = `/downloads/${target.file}`;
    link.download = target.file;
    link.click();
    setTimeout(() => setState("done"), 1200);
    setTimeout(() => setState("idle"), 4000);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200"
      style={{
        borderColor: state === "done"
          ? "rgba(52,211,153,0.3)"
          : `${color}20`,
        background: state === "done"
          ? "rgba(52,211,153,0.06)"
          : "rgba(255,255,255,0.02)",
        cursor: state === "downloading" ? "wait" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (state === "idle") {
          (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`;
          (e.currentTarget as HTMLButtonElement).style.background = `${color}08`;
        }
      }}
      onMouseLeave={(e) => {
        if (state === "idle") {
          (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}20`;
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
        }
      }}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#e8e8e8" }}>
            {target.label}
          </span>
          {target.recommended && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${color}15`, color }}
            >
              Recommandé
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: "#555" }}>
          {target.arch} · {target.size}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "#444" }}>{target.file.split(".").pop()?.toUpperCase()}</span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200"
          style={{ background: state === "done" ? "rgba(52,211,153,0.15)" : `${color}15`, color: state === "done" ? "#34d399" : color }}
        >
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div key="dl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Download className="h-4 w-4" />
              </motion.div>
            )}
            {state === "downloading" && (
              <motion.div
                key="spin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ rotate: { duration: 0.8, repeat: Infinity, ease: "linear" } }}
                exit={{ opacity: 0 }}
              >
                <Download className="h-4 w-4" />
              </motion.div>
            )}
            {state === "done" && (
              <motion.div
                key="done"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Check className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DesktopSection() {
  const [active, setActive] = useState<Platform>("windows");
  const current = PLATFORMS.find((p) => p.id === active)!;

  return (
    <section
      id="desktop"
      className="relative z-10 border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-28">

        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#60a5fa" }}>
              Application Desktop
            </p>
            <h2
              className="text-4xl font-black tracking-[-0.03em] sm:text-5xl"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              NotoFlow sur votre machine.
              <br />
              <span style={{ color: "#444" }}>Sans navigateur. Sans cloud.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: "#666" }}>
              L&apos;app Electron embarque un serveur Next.js complet et Node.js v20 LTS.
              Zéro dépendance externe — fonctionne même hors ligne.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Left — Platform selector + downloads */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Platform tabs */}
            <div
              className="mb-6 flex gap-2 rounded-xl p-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isActive = p.id === active;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActive(p.id)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200"
                    style={{
                      background: isActive ? p.bg : "transparent",
                      color: isActive ? p.color : "#555",
                      border: isActive ? `1px solid ${p.color}25` : "1px solid transparent",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Download targets */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                {current.targets.map((target, i) => (
                  <DownloadButton key={i} target={target} color={current.color} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Version info */}
            <div
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: "#34d399" }} />
                <span className="text-xs font-medium" style={{ color: "#666" }}>
                  Version {VERSION} · Stable
                </span>
              </div>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs transition-colors hover:text-white"
                style={{ color: "#555" }}
              >
                Changelog
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* System requirements */}
            <div className="mt-4">
              <button
                className="flex w-full items-center justify-between text-xs transition-colors hover:text-white"
                style={{ color: "#444" }}
                onClick={(e) => {
                  const el = (e.currentTarget.nextElementSibling as HTMLElement);
                  el.style.display = el.style.display === "none" ? "block" : "none";
                }}
              >
                <span>Configuration requise</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="mt-2 hidden rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(255,255,255,0.02)", color: "#555" }}>
                {active === "windows" && <p>Windows 10/11 · x64 · 4 GB RAM minimum</p>}
                {active === "mac" && <p>macOS 12 Monterey ou supérieur · 4 GB RAM minimum</p>}
                {active === "linux" && <p>Ubuntu 20.04+ / Debian 11+ · x64 · 4 GB RAM minimum</p>}
              </div>
            </div>
          </motion.div>

          {/* Right — Features list + visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6"
          >
            {/* App preview card */}
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(96,165,250,0.04) 100%)",
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-2 border-b px-4 py-3"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(248,113,113,0.5)" }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(251,191,36,0.5)" }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(52,211,153,0.5)" }} />
                <span className="ml-2 text-xs" style={{ color: "#444" }}>NotoFlow — v{VERSION}</span>
                <div
                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}
                >
                  ● Serveur actif :3100
                </div>
              </div>
              {/* Loading screen preview */}
              <div
                className="flex flex-col items-center justify-center gap-4 py-10"
                style={{ background: "#0a0a0a" }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 8px 32px rgba(124,58,237,0.3)" }}
                >
                  N
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold" style={{ color: "#e8e8e8" }}>NotoFlow</div>
                  <div className="mt-1 text-xs" style={{ color: "#555" }}>Serveur Next.js prêt</div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#34d399" }}>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Connecté · localhost:3100
                </div>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {FEATURES.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm" style={{ color: "#888" }}>{f}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
