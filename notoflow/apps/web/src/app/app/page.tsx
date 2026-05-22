import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { db } from "@notoflow/database";
import Link from "next/link";
import { Sparkles, Star, Clock, Plus, Database, Settings, ArrowRight } from "lucide-react";
import { Button } from "@notoflow/ui/components/button";
import { QuickAiActions } from "@/components/ai/QuickAiActions";

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
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Greeting Banner */}
      <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-indigo-500/10 via-background to-background p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Espace de travail actif : {workspace?.name || "NotoFlow"}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Bonjour, {profile?.name || profile?.email?.split("@")[0] || "utilisateur"} !
          </h1>
          <p className="text-sm text-muted-foreground leading-normal">
            Bienvenue sur votre espace de productivité. Créez des notes, organisez des bases de données ou utilisez l&apos;intelligence artificielle.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Shortcut 1 */}
        <Link
          href={`/app/databases`}
          className="group rounded-2xl border border-border/50 bg-card p-5 hover:bg-accent/40 shadow-sm transition-all duration-150 flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Bases de données</h3>
            <p className="text-[10px] text-muted-foreground">Tables et Kanbans</p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        </Link>

        {/* Shortcut 2 */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-1.5 mb-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Créer un document</h3>
            <p className="text-[10px] text-muted-foreground">Notes ou wiki de projet</p>
          </div>
          <Button size="sm" variant="ghost" className="w-full text-xs justify-start h-8 p-0" asChild>
            <Link href="/app">
              <span>Nouveau document</span>
            </Link>
          </Button>
        </div>

        {/* Shortcut 3 */}
        <Link
          href="/app/settings"
          className="group rounded-2xl border border-border/50 bg-card p-5 hover:bg-accent/40 shadow-sm transition-all duration-150 flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Configuration</h3>
            <p className="text-[10px] text-muted-foreground">Membres et abonnements</p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        </Link>
      </div>

      {/* ✨ Mistral AI Studio Quick Actions Widget */}
      {workspace && <QuickAiActions workspaceId={workspace.id} />}

      {/* Lists Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent pages */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" /> Pages récentes
          </div>
          {recentPages.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
              Aucune page récente.
            </div>
          ) : (
            <div className="border border-border/40 rounded-2xl bg-card/45 overflow-hidden divide-y divide-border/25">
              {recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/app/page/${page.id}`}
                  className="flex items-center justify-between p-4 hover:bg-accent/25 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{page.icon || "📄"}</span>
                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                      {page.title || "Sans titre"}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium">
                    Modifié le {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Star className="h-3.5 w-3.5 text-amber-500" /> Favoris
          </div>
          {favorites.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
              Marquez des pages d&apos;une étoile pour les retrouver ici.
            </div>
          ) : (
            <div className="border border-border/40 rounded-2xl bg-card/45 overflow-hidden divide-y divide-border/25">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/app/page/${fav.page.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/25 transition-colors"
                >
                  <span className="text-base">{fav.page.icon || "📄"}</span>
                  <span className="text-xs font-bold text-foreground truncate">
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
