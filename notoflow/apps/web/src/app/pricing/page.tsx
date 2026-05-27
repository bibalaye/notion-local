"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Check, X, Zap, Users, Building2, Sparkles,
  ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanFeature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  team: boolean | string;
  enterprise: boolean | string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Sparkles,
    price: { monthly: 0, annual: 0 },
    description: "Pour découvrir NotoFlow et les projets personnels.",
    color: "#888",
    border: "rgba(255,255,255,0.08)",
    bg: "rgba(255,255,255,0.02)",
    cta: "Commencer gratuitement",
    ctaHref: "/signup",
    ctaStyle: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "#e8e8e8",
    },
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    price: { monthly: 12, annual: 9 },
    description: "Pour les freelances et créateurs qui veulent plus de puissance.",
    color: "#a78bfa",
    border: "rgba(167,139,250,0.3)",
    bg: "rgba(167,139,250,0.05)",
    cta: "Démarrer l'essai gratuit",
    ctaHref: "/signup?plan=pro",
    ctaStyle: {
      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
      boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px rgba(124,58,237,0.25)",
      color: "#fff",
    },
    badge: "Le plus populaire",
  },
  {
    id: "team",
    name: "Team",
    icon: Users,
    price: { monthly: 20, annual: 16 },
    description: "Pour les équipes qui collaborent et partagent des espaces de travail.",
    color: "#34d399",
    border: "rgba(52,211,153,0.2)",
    bg: "rgba(52,211,153,0.04)",
    cta: "Essayer en équipe",
    ctaHref: "/signup?plan=team",
    ctaStyle: {
      background: "rgba(52,211,153,0.1)",
      border: "1px solid rgba(52,211,153,0.3)",
      color: "#34d399",
    },
    badge: null,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    price: { monthly: null, annual: null },
    description: "Déploiement on-premise, SLA garanti, support dédié.",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.2)",
    bg: "rgba(251,191,36,0.03)",
    cta: "Contacter l'équipe",
    ctaHref: "mailto:hello@notoflow.app",
    ctaStyle: {
      background: "rgba(251,191,36,0.08)",
      border: "1px solid rgba(251,191,36,0.25)",
      color: "#fbbf24",
    },
    badge: null,
  },
] as const;

const FEATURES: PlanFeature[] = [
  { label: "Pages & notes illimitées",        free: true,       pro: true,        team: true,        enterprise: true },
  { label: "Éditeur TipTap complet",          free: true,       pro: true,        team: true,        enterprise: true },
  { label: "Bases de données",                free: "3 max",    pro: true,        team: true,        enterprise: true },
  { label: "Membres du workspace",            free: "1",        pro: "1",         team: "Illimité",  enterprise: "Illimité" },
  { label: "Workspaces",                      free: "1",        pro: "3",         team: "Illimité",  enterprise: "Illimité" },
  { label: "Stockage fichiers",               free: "1 GB",     pro: "20 GB",     team: "100 GB",    enterprise: "Illimité" },
  { label: "Assistant IA (Mistral)",          free: "50 req/j", pro: "Illimité",  team: "Illimité",  enterprise: "Illimité" },
  { label: "Historique des versions",         free: "7 jours",  pro: "90 jours",  team: "1 an",      enterprise: "Illimité" },
  { label: "Collaboration temps réel",        free: false,      pro: true,        team: true,        enterprise: true },
  { label: "Permissions granulaires",         free: false,      pro: false,       team: true,        enterprise: true },
  { label: "Audit log",                       free: false,      pro: false,       team: true,        enterprise: true },
  { label: "SSO / SAML",                      free: false,      pro: false,       team: false,       enterprise: true },
  { label: "Déploiement on-premise",          free: false,      pro: false,       team: false,       enterprise: true },
  { label: "SLA 99.9%",                       free: false,      pro: false,       team: false,       enterprise: true },
  { label: "Support prioritaire",             free: false,      pro: "Email",     team: "Email + Chat", enterprise: "Dédié 24/7" },
];

const FAQS = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui. Les upgrades sont effectifs immédiatement avec un prorata. Les downgrades prennent effet à la fin de la période de facturation en cours.",
  },
  {
    q: "Y a-t-il un essai gratuit pour les plans payants ?",
    a: "Pro et Team incluent 14 jours d'essai gratuit, sans carte bancaire requise. Vous pouvez annuler à tout moment pendant cette période.",
  },
  {
    q: "Comment fonctionne la facturation annuelle ?",
    a: "En choisissant la facturation annuelle, vous économisez environ 25% par rapport au mensuel. Le montant est débité en une seule fois pour l'année.",
  },
  {
    q: "Puis-je self-hoster NotoFlow gratuitement ?",
    a: "Oui. NotoFlow est open source (MIT). Vous pouvez déployer votre propre instance avec Docker sans aucun frais. Les plans payants concernent uniquement le service cloud hébergé.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Carte bancaire (Visa, Mastercard, Amex) via Stripe. Les clients Enterprise peuvent payer par virement bancaire.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="mx-auto h-4 w-4" style={{ color: "#34d399" }} />;
  if (value === false) return <X    className="mx-auto h-4 w-4" style={{ color: "#333" }} />;
  return <span className="text-xs font-medium" style={{ color: "#888" }}>{value}</span>;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left transition-colors hover:text-white"
        style={{ color: open ? "#e8e8e8" : "#888" }}
      >
        <span className="text-sm font-semibold">{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0" />
          : <ChevronDown className="h-4 w-4 shrink-0" />
        }
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm leading-relaxed" style={{ color: "#666" }}>{a}</p>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [showTable, setShowTable] = useState(false);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "#080808", color: "#e8e8e8", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Noise */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat", backgroundSize: "128px",
        }}
      />
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 600, height: 600, top: -100, left: "20%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, top: "50%", right: "10%", background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* ── Navbar minimal ── */}
      <header className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="NotoFlow" width={28} height={28} className="rounded-md" />
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>NotoFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/5" style={{ color: "#888" }}>Connexion</Link>
          <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 0 1px rgba(124,58,237,0.3)" }}>Commencer</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#a78bfa" }}>Tarifs</p>
          <h1 className="text-5xl font-black tracking-[-0.03em] sm:text-6xl" style={{ fontFamily: "'Syne', sans-serif" }}>
            Simple. Transparent.
            <br /><span style={{ color: "#444" }}>Sans surprise.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: "#666" }}>
            Commencez gratuitement. Passez au plan supérieur quand vous en avez besoin.
            Annulez à tout moment.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setAnnual(false)}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={{ background: !annual ? "rgba(255,255,255,0.08)" : "transparent", color: !annual ? "#e8e8e8" : "#555" }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={{ background: annual ? "rgba(167,139,250,0.1)" : "transparent", color: annual ? "#a78bfa" : "#555" }}
            >
              Annuel
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}>
                −25%
              </span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Plans grid ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = annual ? plan.price.annual : plan.price.monthly;
            return (
              <FadeUp key={plan.id} delay={i * 0.08}>
                <div
                  className="relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300"
                  style={{ borderColor: plan.border, background: plan.bg }}
                >
                  {/* Popular badge */}
                  {plan.badge && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  {/* Icon + name */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${plan.color}15`, color: plan.color }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-base font-bold" style={{ color: "#e8e8e8" }}>{plan.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    {price !== null ? (
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#e8e8e8" }}>
                          {price === 0 ? "0€" : `${price}€`}
                        </span>
                        {price > 0 && (
                          <span className="mb-1 text-sm" style={{ color: "#555" }}>/ mois</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-2xl font-black" style={{ fontFamily: "'Syne', sans-serif", color: "#e8e8e8" }}>
                        Sur devis
                      </div>
                    )}
                    {annual && price !== null && price > 0 && (
                      <p className="mt-0.5 text-xs" style={{ color: "#555" }}>
                        Facturé {price * 12}€/an
                      </p>
                    )}
                  </div>

                  <p className="mb-6 text-sm leading-relaxed" style={{ color: "#666" }}>{plan.description}</p>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className="mb-6 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                    style={plan.ctaStyle as React.CSSProperties}
                  >
                    {plan.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {/* Divider */}
                  <div className="mb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />

                  {/* Key features (top 6) */}
                  <ul className="flex flex-col gap-2.5">
                    {FEATURES.slice(0, 8).map((f, j) => {
                      const val = f[plan.id as keyof PlanFeature];
                      if (val === false) return null;
                      return (
                        <li key={j} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: plan.color }} />
                          <span className="text-xs leading-relaxed" style={{ color: "#777" }}>
                            {typeof val === "string" && val !== "true"
                              ? <><span style={{ color: "#e8e8e8" }}>{val}</span> {f.label.toLowerCase()}</>
                              : f.label
                            }
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <FadeUp>
          <button
            onClick={() => setShowTable(!showTable)}
            className="mx-auto flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "#888", display: "flex" }}
          >
            {showTable ? "Masquer" : "Voir"} la comparaison complète
            {showTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </FadeUp>

        <motion.div
          initial={false}
          animate={{ height: showTable ? "auto" : 0, opacity: showTable ? 1 : 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="mt-8 overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <th className="px-5 py-4 text-left text-xs font-semibold" style={{ color: "#555", width: "35%" }}>Fonctionnalité</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-4 py-4 text-center text-xs font-bold" style={{ color: p.color }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#888" }}>{f.label}</td>
                    <td className="px-4 py-3.5 text-center"><FeatureValue value={f.free} /></td>
                    <td className="px-4 py-3.5 text-center"><FeatureValue value={f.pro} /></td>
                    <td className="px-4 py-3.5 text-center"><FeatureValue value={f.team} /></td>
                    <td className="px-4 py-3.5 text-center"><FeatureValue value={f.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <FadeUp className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#a78bfa" }}>FAQ</p>
          <h2 className="text-3xl font-black tracking-[-0.03em]" style={{ fontFamily: "'Syne', sans-serif" }}>
            Questions fréquentes
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="rounded-2xl border px-6" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── CTA final ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <FadeUp>
          <div
            className="relative overflow-hidden rounded-3xl border p-10 text-center md:p-14"
            style={{ borderColor: "rgba(124,58,237,0.2)", background: "linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(52,211,153,0.04) 100%)" }}
          >
            <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: 400, height: 200, background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)", filter: "blur(30px)" }} />
            <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl" style={{ fontFamily: "'Syne', sans-serif" }}>
              Pas encore convaincu ?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: "#666" }}>
              Essayez NotoFlow gratuitement pendant 14 jours sur les plans Pro et Team.
              Aucune carte bancaire requise.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 8px 32px rgba(124,58,237,0.25)" }}
              >
                Démarrer l&apos;essai gratuit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border px-7 py-3 text-sm font-semibold transition-all duration-200 hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "#888" }}
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer minimal ── */}
      <footer className="relative z-10 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="NotoFlow" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>NotoFlow</span>
          </div>
          <p className="text-xs" style={{ color: "#444" }}>© {new Date().getFullYear()} NotoFlow. MIT License.</p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#555" }}>
            <Link href="/privacy" className="transition-colors hover:text-white">Confidentialité</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
