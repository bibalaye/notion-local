"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@notoflow/ui/components/button";
import {
  Sparkles,
  FileText,
  Database,
  Zap,
  ArrowRight,
  Layers,
  LayoutGrid,
  Check,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-violet-500" />,
      title: "Assistant IA (Mistral)",
      description: "Rédigez, résumez et brainstormez directement dans vos notes grâce à une IA intégrée intelligente et réactive.",
      color: "from-violet-500/10 to-purple-500/10",
      border: "group-hover:border-violet-500/30",
    },
    {
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      title: "Éditeur Ultra-fluide",
      description: "Une expérience d'écriture riche propulsée par TipTap, supportant le Markdown, les blocs dynamiques et le slash command.",
      color: "from-blue-500/10 to-indigo-500/10",
      border: "group-hover:border-blue-500/30",
    },
    {
      icon: <Database className="h-6 w-6 text-emerald-500" />,
      title: "Bases de Données",
      description: "Structurez vos projets et idées avec des bases de données relationnelles, des filtres puissants et des vues tabulaires.",
      color: "from-emerald-500/10 to-teal-500/10",
      border: "group-hover:border-emerald-500/30",
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      title: "Temps Réel & Sync",
      description: "Vos modifications sont synchronisées instantanément à l'aide de Socket.io et Supabase pour une collaboration sans accroc.",
      color: "from-amber-500/10 to-orange-500/10",
      border: "group-hover:border-amber-500/30",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-violet-500/20">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-10 left-1/3 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="NotoFlow Logo"
              width={32}
              height={32}
              className="rounded-md object-contain"
            />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              NotoFlow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="/pricing" className="hover:text-foreground transition-colors">Tarifs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild className="bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-500/10">
              <Link href="/signup">Créer un compte</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app">Ouvrir l&apos;app</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs font-semibold text-violet-500 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>NotoFlow AI v1.0 est disponible</span>
            <ChevronRight className="h-3 w-3" />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Votre espace de travail <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              intelligent & collaboratif
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Fusionnez vos notes, vos bases de données et la puissance de l&apos;IA (Mistral) dans une interface ultra-rapide, locale et connectée conçue pour booster votre productivité.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" asChild className="bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20 group h-12 px-6">
              <Link href="/signup">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-6 border-border/60 hover:bg-accent/40">
              <Link href="/app">Ouvrir la démo</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Visual Mockup of App */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 50 }}
          className="relative mt-16 md:mt-24"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="relative rounded-xl border border-border/50 bg-card/60 p-2 shadow-2xl backdrop-blur-sm overflow-hidden">
            {/* Window bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/30">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-amber-500/60" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
              <div className="mx-auto text-xs text-muted-foreground font-mono">notoflow.app/workspace</div>
            </div>

            {/* Mocked Application UI */}
            <div className="grid grid-cols-[200px_1fr] h-[400px] md:h-[500px] overflow-hidden text-xs bg-background/50">
              {/* Sidebar Mock */}
              <div className="border-r border-border/30 bg-muted/10 p-3 flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <Image src="/logo.png" alt="Logo" width={16} height={16} />
                  <span className="font-bold">Espace NotoFlow</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-6 rounded bg-violet-500/10 text-violet-500 font-medium px-2 py-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Assistant IA</span>
                  </div>
                  <div className="h-6 rounded hover:bg-muted/30 text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>📄 Introduction</span>
                  </div>
                  <div className="h-6 rounded hover:bg-muted/30 text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    <span>📊 Tâches & Projets</span>
                  </div>
                  <div className="h-6 rounded hover:bg-muted/30 text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>🗂️ Templates</span>
                  </div>
                </div>
              </div>

              {/* Editor Mock */}
              <div className="p-6 md:p-8 overflow-y-auto flex flex-col gap-4">
                <div className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>🚀 Bienvenue sur votre NotoFlow</span>
                  <span className="text-sm rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-500">Actif</span>
                </div>
                <div className="text-muted-foreground leading-relaxed max-w-2xl">
                  NotoFlow est un outil de productivité moderne développé avec Next.js et pnpm. Il offre un éditeur ultra réactif TipTap et une synchronisation temps réel puissante. Vous pouvez interroger l&apos;IA pour vous aider à rédiger vos documents.
                </div>
                <div className="mt-4 p-4 rounded-lg border border-violet-500/20 bg-violet-500/5 max-w-xl">
                  <div className="flex items-center gap-2 font-semibold text-violet-500 mb-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Prompt IA : Rédiger les objectifs de NotoFlow</span>
                  </div>
                  <div className="text-muted-foreground font-mono text-[10px] bg-background/60 p-2.5 rounded border border-border/30 leading-normal">
                    💡 <span className="text-foreground">NotoFlow simplifie la gestion des projets locaux :</span><br />
                    1. Zéro configuration avec le support Supabase et Prisma.<br />
                    2. Synchronisation instantanée entre plusieurs onglets.<br />
                    3. Intégration transparente de Mistral AI.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 border-t border-border/40 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce dont vous avez besoin pour créer et organiser
          </h2>
          <p className="mt-4 text-muted-foreground">
            Des outils performants, modernes et interconnectés pour éliminer la friction mentale.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="group relative rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${feature.color}`} />
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/60 mb-4 group-hover:bg-background transition-colors duration-300 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold group-hover:text-violet-500 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack / Architecture Section */}
      <section id="architecture" className="mx-auto max-w-7xl px-6 py-20 border-t border-border/40 bg-muted/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Une architecture solide et modulaire
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              NotoFlow est construit sous forme de monorepo avec Turborepo et pnpm, garantissant une séparation claire des responsabilités, un partage de code optimal et des performances de build exceptionnelles.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Structure Turborepo + pnpm Workspaces ultra-rapide",
                "Gestion de base de données avec Prisma ORM",
                "Authentification et stockage avec Supabase SSR",
                "Composants UI premium partagés et hautement personnalisables",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-xl border border-border/50 bg-card p-6 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-violet-500" />
              <span>Organisation des Packages</span>
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-violet-500/20 transition-colors">
                <span className="text-violet-500 font-bold">apps/web</span> — Application Next.js 15
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-violet-500/20 transition-colors">
                <span className="text-blue-500 font-bold">packages/ui</span> — Bibliothèque de composants
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-violet-500/20 transition-colors">
                <span className="text-emerald-500 font-bold">packages/editor</span> — Éditeur de texte riche TipTap
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-violet-500/20 transition-colors">
                <span className="text-amber-500 font-bold">packages/database</span> — Schémas & client Prisma
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box Section */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        <div className="relative rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-purple-500/5 p-8 md:p-12 text-center overflow-hidden shadow-xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-violet-500/10 blur-[60px]" />
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Prêt à transformer votre flux de travail ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Rejoignez dès aujourd&apos;hui l&apos;aventure NotoFlow et profitez d&apos;un espace de productivité intelligent.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild className="bg-violet-600 text-white hover:bg-violet-700 h-12 px-8 shadow-md shadow-violet-500/15">
              <Link href="/signup">Créer un compte maintenant</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/10 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NotoFlow Logo"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="font-bold tracking-tight text-sm">NotoFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NotoFlow. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              GitHub
            </a>
            <span>•</span>
            <a href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</a>
            <span>•</span>
            <a href="/terms" className="hover:text-foreground transition-colors">Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
