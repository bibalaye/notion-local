"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Sparkles, FileText, Database, Zap, ArrowRight,
  ChevronRight, Users, Globe, Lock,
} from "lucide-react";
import { NavBar } from "./NavBar";
import { AppMockup } from "./AppMockup";
import { DesktopSection } from "./DesktopSection";

// ─── Animation helpers ────────────────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Sparkles,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    title: "IA Mistral intégrée",
    desc: "Rédigez, résumez, brainstormez. L'IA comprend le contexte de vos notes et répond en temps réel.",
  },
  {
    icon: FileText,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    title: "Éditeur TipTap",
    desc: "Markdown, slash commands, blocs dynamiques. Une expérience d'écriture aussi fluide que la pensée.",
  },
  {
    icon: Database,
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    title: "Bases de données",
    desc: "Filtres, tris, vues tabulaires. Structurez vos projets comme un vrai outil de gestion.",
  },
  {
    icon: Zap,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    title: "Temps réel",
    desc: "Supabase Realtime + présence collaborative. Vos équipes travaillent ensemble sans friction.",
  },
  {
    icon: Lock,
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    title: "Sécurité by design",
    desc: "Auth Supabase SSR, RLS PostgreSQL, chiffrement des secrets. Vos données restent les vôtres.",
  },
  {
    icon: Globe,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    title: "Multi-workspace",
    desc: "Espaces de travail isolés, rôles granulaires (Owner, Admin, Editor, Viewer). Scalable.",
  },
];

const STATS = [
  { value: "< 50ms", label: "Latence éditeur" },
  { value: "100%", label: "Open source" },
  { value: "∞", label: "Pages & bases" },
  { value: "0€", label: "Pour commencer" },
];

const TESTIMONIALS = [
  {
    quote: "NotoFlow a remplacé Notion dans toute notre équipe. L'IA intégrée change vraiment la façon dont on rédige nos specs.",
    name: "Amara Diallo",
    role: "CTO · Dakar Tech",
    avatar: "AD",
    color: "#a78bfa",
  },
  {
    quote: "La vitesse de l'éditeur est bluffante. Et le fait que tout soit self-hosted nous donne une tranquillité d'esprit totale.",
    name: "Moussa Traoré",
    role: "Lead Dev · Abidjan Labs",
    avatar: "MT",
    color: "#34d399",
  },
  {
    quote: "On a migré 3 000 pages depuis Notion en une journée. L'import est parfait et les bases de données sont encore plus puissantes.",
    name: "Fatou Ndiaye",
    role: "Product Manager · Lomé Digital",
    avatar: "FN",
    color: "#60a5fa",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: "#080808",
        color: "#e8e8e8",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Noise texture overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      {/* ── Ambient glow blobs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 700, height: 700,
            top: -200, left: "30%",
            background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            top: "40%", right: "-10%",
            background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <NavBar />

      {/* ════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-center px-6 pt-24 pb-16 text-center"
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
            style={{
              borderColor: "rgba(124,58,237,0.3)",
              background: "rgba(124,58,237,0.08)",
              color: "#a78bfa",
            }}
          >
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>NotoFlow v1.0 — Open Source & Self-Hosted</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-5xl font-black leading-[1.05] tracking-[-0.03em] sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Votre cerveau
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              augmenté par l&apos;IA
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl"
            style={{ color: "#888" }}
          >
            Notes, bases de données, wikis et collaboration en temps réel —
            le tout propulsé par Mistral AI et hébergé chez vous.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px rgba(124,58,237,0.25)",
              }}
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/app"
              className="inline-flex h-12 items-center gap-2 rounded-xl border px-7 text-sm font-semibold transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ccc" }}
            >
              Voir la démo
            </Link>
          </motion.div>

          {/* Social proof micro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center justify-center gap-3"
            style={{ color: "#555", fontSize: 13 }}
          >
            <div className="flex -space-x-2">
              {["AD", "MT", "FN", "KS"].map((init, i) => (
                <div
                  key={i}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold"
                  style={{
                    borderColor: "#080808",
                    background: ["#7c3aed","#0ea5e9","#059669","#d97706"][i],
                    color: "#fff",
                  }}
                >
                  {init}
                </div>
              ))}
            </div>
            <span>Rejoint par <strong style={{ color: "#888" }}>+240 équipes</strong> ce mois</span>
          </motion.div>
        </motion.div>

        {/* App Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 w-full max-w-5xl"
        >
          <AppMockup />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <FadeUp key={i} delay={i * 0.08} className="text-center">
                <div
                  className="text-4xl font-black tracking-tight"
                  style={{ fontFamily: "'Syne', sans-serif", color: "#e8e8e8" }}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-sm" style={{ color: "#555" }}>{s.label}</div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-28">
        <FadeUp className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#a78bfa" }}>
            Fonctionnalités
          </p>
          <h2
            className="text-4xl font-black tracking-[-0.03em] sm:text-5xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Tout ce dont vous avez besoin.
            <br />
            <span style={{ color: "#444" }}>Rien de superflu.</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeUp key={i} delay={i * 0.07}>
                <div
                  className="group relative h-full cursor-default rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = f.color + "40";
                    (e.currentTarget as HTMLDivElement).style.background = f.bg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
                  }}
                >
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: f.bg, color: f.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-bold" style={{ color: "#e8e8e8" }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                    {f.desc}
                  </p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative z-10 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-28">
          <FadeUp className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#34d399" }}>
              Témoignages
            </p>
            <h2
              className="text-4xl font-black tracking-[-0.03em] sm:text-5xl"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Ils ont fait le switch.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div
                  className="flex h-full flex-col rounded-2xl border p-6"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Stars */}
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className="h-4 w-4" fill={t.color} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed" style={{ color: "#888" }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: t.color }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#e8e8e8" }}>{t.name}</div>
                      <div className="text-xs" style={{ color: "#555" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <DesktopSection />

      {/* ════════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <FadeUp>
          <div
            className="relative overflow-hidden rounded-3xl border p-10 text-center md:p-16"
            style={{
              borderColor: "rgba(124,58,237,0.2)",
              background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(96,165,250,0.05) 100%)",
            }}
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 400, height: 200,
                background: "radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />
            <Users className="mx-auto mb-5 h-10 w-10" style={{ color: "#a78bfa" }} />
            <h2
              className="text-4xl font-black tracking-[-0.03em] sm:text-5xl"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Prêt à transformer
              <br />votre façon de travailler ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base" style={{ color: "#666" }}>
              Gratuit pour commencer. Aucune carte bancaire requise.
              Déployez en 5 minutes avec Docker.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex h-13 items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 8px 32px rgba(124,58,237,0.3)",
                }}
              >
                Créer un compte gratuit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center gap-2 rounded-xl border px-8 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ccc" }}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Voir sur GitHub
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer
        className="relative z-10 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="NotoFlow" width={28} height={28} className="rounded-md" />
              <span className="font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                NotoFlow
              </span>
            </div>
            <p className="text-xs" style={{ color: "#444" }}>
              © {new Date().getFullYear()} NotoFlow. Open Source. MIT License.
            </p>
            <div className="flex items-center gap-5 text-xs" style={{ color: "#555" }}>
              <Link href="/privacy" className="transition-colors hover:text-white">Confidentialité</Link>
              <Link href="/terms" className="transition-colors hover:text-white">Conditions</Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
