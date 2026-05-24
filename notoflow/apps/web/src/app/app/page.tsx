import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { db } from "@notoflow/database";
import Link from "next/link";
import { Sparkles, Star, Clock, Plus, Database, Settings, ArrowRight } from "lucide-react";
import { Button } from "@notoflow/ui/components/button";
import { QuickAiActions } from "@/components/ai/QuickAiActions";
import { CreatePageButton } from "@/components/layout/CreatePageButton";

export default async function AppHomePage() {
  const profile = await getOrCreateProfile();

  // Find workspace memberships
  const membership = await db.workspaceMember.findFirst({
    where: { userId: profile?.id },
    include: { workspace: true },
  });

  const workspace = membership?.workspace;

  // Retrieve recent pages
  const recentPages = workspace
    ? await db.page.findMany({
        where: { workspaceId: workspace.id, isArchived: false },
        orderBy: { updatedAt: "desc" },
        take: 5,
      })
    : [];

  // Retrieve favorites
  const favorites = profile
    ? await db.favorite.findMany({
        where: { userId: profile.id, page: { isArchived: false } },
        include: { page: true },
        take: 5,
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 select-none">
      {/* Greeting Banner */}
      <div className="relative pb-4 border-b border-border/30">
        <div className="space-y-3">
          <div className="text-4xl">👋</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90 font-sans">
            Bonjour, {profile?.name || profile?.email?.split("@")[0] || "utilisateur"} !
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl font-medium">
            Bienvenue sur votre espace de travail personnel. Organisez vos idées, collaborez avec votre équipe et libérez votre productivité grâce à l&apos;intelligence artificielle.
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800/40 px-2.5 py-1 border border-border/20 text-[11px] font-semibold text-muted-foreground">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Espace de travail : <strong className="text-foreground/80 font-bold">{workspace?.name || "NotoFlow"}</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Shortcut 1 */}
        <Link
          href={`/app/databases`}
          className="group rounded-xl border border-border/40 bg-card/40 p-5 hover:bg-accent/60 shadow-sm transition-all duration-150 flex items-center justify-between cursor-pointer focus:outline-none"
        >
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Database className="h-4.5 w-4.5 stroke-[1.8]" />
            </div>
            <h3 className="text-xs font-bold text-foreground/90">Bases de données</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Créez des tables et des Kanbans</p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-150 text-muted-foreground shrink-0 translate-x-[-4px] group-hover:translate-x-0" />
        </Link>

        {/* Shortcut 2 */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Plus className="h-4.5 w-4.5 stroke-[1.8]" />
            </div>
            <h3 className="text-xs font-bold text-foreground/90">Créer un document</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Rédigez des notes ou des wikis</p>
          </div>
          <CreatePageButton className="w-full flex items-center justify-center h-8 rounded-lg bg-neutral-200/50 hover:bg-neutral-200/80 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/70 text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors cursor-pointer focus:outline-none" />
        </div>

        {/* Shortcut 3 */}
        <Link
          href="/app/settings"
          className="group rounded-xl border border-border/40 bg-card/40 p-5 hover:bg-accent/60 shadow-sm transition-all duration-150 flex items-center justify-between cursor-pointer focus:outline-none"
        >
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Settings className="h-4.5 w-4.5 stroke-[1.8]" />
            </div>
            <h3 className="text-xs font-bold text-foreground/90">Configuration</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Gérez vos membres et abonnements</p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-150 text-muted-foreground shrink-0 translate-x-[-4px] group-hover:translate-x-0" />
        </Link>
      </div>

      {/* ✨ Mistral AI Studio Quick Actions Widget */}
      {workspace && <QuickAiActions workspaceId={workspace.id} />}

      {/* Lists Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* Recent pages */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/75 uppercase tracking-widest">
            <Clock className="h-3.5 w-3.5 stroke-[1.8]" /> Pages récentes
          </div>
          {recentPages.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground/80 border border-dashed border-border/40 rounded-xl bg-card/10">
              Aucune page consultée récemment.
            </div>
          ) : (
            <div className="border border-border/30 rounded-xl bg-card/25 overflow-hidden divide-y divide-border/20 shadow-sm">
              {recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/app/page/${page.id}`}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors duration-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{page.icon || "📄"}</span>
                    <span className="text-xs font-semibold text-foreground/80 truncate max-w-[200px]">
                      {page.title || "Sans titre"}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 font-semibold shrink-0">
                    {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/75 uppercase tracking-widest">
            <Star className="h-3.5 w-3.5 text-amber-500 stroke-[1.8]" /> Vos favoris
          </div>
          {favorites.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground/80 border border-dashed border-border/40 rounded-xl bg-card/10">
              Marquez vos pages d&apos;une étoile pour les épingler ici.
            </div>
          ) : (
            <div className="border border-border/30 rounded-xl bg-card/25 overflow-hidden divide-y divide-border/20 shadow-sm">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/app/page/${fav.page.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors duration-100 cursor-pointer"
                >
                  <span className="text-base shrink-0">{fav.page.icon || "📄"}</span>
                  <span className="text-xs font-semibold text-foreground/80 truncate">
                    {fav.page.title || "Sans titre"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
