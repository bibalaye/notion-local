"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { api } from "@/lib/api/client";
import { upgradeWorkspacePlan } from "@/app/app/actions/billing";
import { Button } from "@notoflow/ui/components/button";
import { CreditCard, Shield, User, Users, Check, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [activeTab, setActiveTab] = useState<"profile" | "workspace" | "billing">("profile");

  // Fetch active workspace details
  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: api.workspaces.list,
  });

  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId);

  // Fetch workspace members
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: ["workspace-members", activeWorkspaceId],
    queryFn: () => api.workspaces.getMembers(activeWorkspaceId || ""),
    enabled: !!activeWorkspaceId,
  });

  // Upgrade Plan Mutation
  const upgradeMutation = useMutation({
    mutationFn: ({ plan }: { plan: "FREE" | "PRO" | "TEAM" }) =>
      upgradeWorkspacePlan(activeWorkspaceId || "", plan),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success(`Votre espace de travail a été mis à jour vers le plan ${updated.plan} !`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur de mise à jour.");
    },
  });

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState("");
  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: any }) =>
      api.workspaces.inviteMember(activeWorkspaceId || "", email, role),
    onSuccess: () => {
      toast.success("Invitation envoyée !");
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'invitation.");
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail, role: "VIEWER" });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1 border-b border-border/30 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-xs text-muted-foreground">
          Gérez vos préférences de compte, les membres de votre espace et vos abonnements.
        </p>
      </div>

      {/* Settings layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Tabs Side */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left ${
              activeTab === "profile" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
            type="button"
          >
            <User className="h-4 w-4" /> Profil
          </button>
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left ${
              activeTab === "workspace" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
            type="button"
          >
            <Users className="h-4 w-4" /> Membres & Équipe
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left ${
              activeTab === "billing" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
            type="button"
          >
            <CreditCard className="h-4 w-4" /> Abonnements
          </button>
        </div>

        {/* Tab content panel */}
        <div className="flex-1 rounded-2xl border border-border/50 bg-card/40 p-6 shadow-sm min-h-[350px]">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Mon Profil</h3>
                <p className="text-[11px] text-muted-foreground">Mettez à jour vos informations personnelles.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-400">
                    N
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Utilisateur NotoFlow</h4>
                    <p className="text-xs text-muted-foreground">Compte personnel synchronisé</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Nom complet
                    </label>
                    <input
                      disabled
                      value="Utilisateur NotoFlow"
                      className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "workspace" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Membres de l&apos;espace</h3>
                <p className="text-[11px] text-muted-foreground">Gérez les accès de votre équipe.</p>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInvite} className="flex gap-2 max-w-md">
                <input
                  required
                  type="email"
                  placeholder="Adresse email du collaborateur..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs outline-none focus:border-foreground"
                />
                <Button size="sm" type="submit" disabled={inviteMutation.isPending} className="gap-1 text-xs">
                  <UserPlus className="h-3.5 w-3.5" /> Inviter
                </Button>
              </form>

              {/* Members List */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Membres actuels
                </div>
                {isMembersLoading ? (
                  <div className="h-12 bg-muted/20 animate-pulse rounded-lg" />
                ) : (
                  <div className="divide-y divide-border/30">
                    {members?.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {m.user.name?.[0] || m.user.email[0]}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-foreground">
                              {m.user.name || "Utilisateur sans nom"}
                            </h4>
                            <p className="text-[10px] text-muted-foreground">{m.user.email}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                          <Shield className="h-2.5 w-2.5" /> {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Abonnement & Plans</h3>
                <p className="text-[11px] text-muted-foreground">Modifiez votre forfait et gérez la facturation.</p>
              </div>

              {/* Current plan badge */}
              <div className="p-4 rounded-xl border border-border/50 bg-card/65 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Plan actuel
                  </div>
                  <h4 className="text-sm font-bold text-foreground mt-0.5">
                    NotoFlow {activeWorkspace?.plan || "FREE"}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Actif
                </span>
              </div>

              {/* Plans Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Pro Plan Card */}
                <div className="relative rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 flex flex-col justify-between overflow-hidden shadow-sm">
                  <div className="absolute top-2.5 right-2.5 text-[9px] font-extrabold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Populaire
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold">Pro</h4>
                      <p className="text-[10px] text-muted-foreground">Idéal pour les créateurs et indépendants.</p>
                    </div>
                    <div className="text-lg font-extrabold">8€ /mois</div>
                    <ul className="text-[10px] space-y-1.5 text-muted-foreground/80 font-medium">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-indigo-500" /> Pages et sous-pages illimitées
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-indigo-500" /> Assistant IA complet (création)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-indigo-500" /> 3 bases de données configurables
                      </li>
                    </ul>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                    disabled={activeWorkspace?.plan === "PRO" || upgradeMutation.isPending}
                    onClick={() => upgradeMutation.mutate({ plan: "PRO" })}
                    type="button"
                  >
                    {activeWorkspace?.plan === "PRO" ? "Plan actuel" : "Passer au Plan Pro"}
                  </Button>
                </div>

                {/* Team Plan Card */}
                <div className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold">Team</h4>
                      <p className="text-[10px] text-muted-foreground">Idéal pour la collaboration en temps réel.</p>
                    </div>
                    <div className="text-lg font-extrabold">15€ /membre/mois</div>
                    <ul className="text-[10px] space-y-1.5 text-muted-foreground/80 font-medium">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-foreground" /> Tout le contenu Pro inclus
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-foreground" /> Membres d&apos;espace illimités
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-foreground" /> Historique de version étendu
                      </li>
                    </ul>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-4 text-xs h-8"
                    disabled={activeWorkspace?.plan === "TEAM" || upgradeMutation.isPending}
                    onClick={() => upgradeMutation.mutate({ plan: "TEAM" })}
                    type="button"
                  >
                    {activeWorkspace?.plan === "TEAM" ? "Plan actuel" : "Passer au Plan Team"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
