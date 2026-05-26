"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { api } from "@/lib/api/client";
import { upgradeWorkspacePlan } from "@/app/app/actions/billing";
import { getApiKeys, createApiKey, deleteApiKey } from "@/app/app/actions/apiKeys";
import { searchNotionPages, importNotionPage } from "@/app/app/actions/notion";
import { Button } from "@notoflow/ui/components/button";
import {
  CreditCard,
  Shield,
  User,
  Users,
  Check,
  Sparkles,
  UserPlus,
  Key,
  Info,
  Copy,
  Trash,
  Link2,
  RefreshCw,
  Download,
  FileText,
  Code2,
  Mail,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "EDITOR", label: "Éditeur" },
  { value: "VIEWER", label: "Lecteur" },
  { value: "GUEST", label: "Invité" },
  { value: "ADMIN", label: "Administrateur" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  VIEWER: "Lecteur",
  GUEST: "Invité",
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [activeTab, setActiveTab] = useState<
    "profile" | "workspace" | "billing" | "integrations" | "developers"
  >("profile");
  const [lastCreatedKey, setLastCreatedKey] = useState<{ name: string; rawToken: string } | null>(null);

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

  // Fetch workspace API Keys
  const { data: apiKeys, isLoading: isApiKeysLoading } = useQuery({
    queryKey: ["api-keys", activeWorkspaceId],
    queryFn: () => getApiKeys(activeWorkspaceId || ""),
    enabled: !!activeWorkspaceId && activeTab === "developers",
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
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER" | "GUEST" | "ADMIN">("VIEWER");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkRole, setLinkRole] = useState<"EDITOR" | "VIEWER" | "GUEST">("VIEWER");

  // Fetch pending invites
  const { data: pendingInvites, isLoading: isInvitesLoading } = useQuery({
    queryKey: ["workspace-invites", activeWorkspaceId],
    queryFn: () => api.workspaces.getInvites(activeWorkspaceId || ""),
    enabled: !!activeWorkspaceId && activeTab === "workspace",
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: any }) =>
      api.workspaces.invite(activeWorkspaceId || "", email, role),
    onSuccess: () => {
      toast.success("Invitation envoyée !");
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["workspace-invites", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'invitation.");
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => api.workspaces.revokeInvite(inviteId),
    onSuccess: () => {
      toast.success("Invitation révoquée.");
      queryClient.invalidateQueries({ queryKey: ["workspace-invites", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la révocation.");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | "GUEST" }) =>
      api.workspaces.updateMemberRole(activeWorkspaceId || "", memberId, role),
    onSuccess: () => {
      toast.success("Rôle mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la mise à jour du rôle.");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.workspaces.removeMember(activeWorkspaceId || "", memberId),
    onSuccess: () => {
      toast.success("Membre retiré de l'espace.");
      queryClient.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la suppression du membre.");
    },
  });

  const generateLinkMutation = useMutation({    mutationFn: (role: "EDITOR" | "VIEWER" | "GUEST") =>
      api.workspaces.generateInviteLink(activeWorkspaceId || "", role),
    onSuccess: (link) => {
      setGeneratedLink(link);
      queryClient.invalidateQueries({ queryKey: ["workspace-invites", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la génération du lien.");
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  // API Key creation
  const [newKeyName, setNewKeyName] = useState("");
  const createKeyMutation = useMutation({
    mutationFn: (name: string) => createApiKey(activeWorkspaceId || "", name),
    onSuccess: (data, variables) => {
      toast.success("Clé d'API créée avec succès !");
      setNewKeyName("");
      setLastCreatedKey({ name: variables, rawToken: data.rawToken });
      queryClient.invalidateQueries({ queryKey: ["api-keys", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la création de la clé.");
    },
  });

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate(newKeyName);
  };

  // API Key deletion
  const deleteKeyMutation = useMutation({
    mutationFn: (keyId: string) => deleteApiKey(activeWorkspaceId || "", keyId),
    onSuccess: () => {
      toast.success("Clé d'API révoquée avec succès.");
      queryClient.invalidateQueries({ queryKey: ["api-keys", activeWorkspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la suppression de la clé.");
    },
  });

  // Notion Integration State
  const [notionToken, setNotionToken] = useState("");
  const [notionPages, setNotionPages] = useState<any[]>([]);
  const [isSearchingNotion, setIsSearchingNotion] = useState(false);
  const [importingPageId, setImportingPageId] = useState<string | null>(null);

  const handleSearchNotion = async () => {
    if (!notionToken.trim()) {
      toast.error("Veuillez saisir votre jeton d'intégration Notion.");
      return;
    }
    setIsSearchingNotion(true);
    try {
      const results = await searchNotionPages(notionToken.trim());
      setNotionPages(results);
      toast.success(`${results.length} pages Notion trouvées !`);
    } catch (err: any) {
      toast.error(err.message || "Impossible de récupérer les pages Notion.");
    } finally {
      setIsSearchingNotion(false);
    }
  };

  const handleImportNotionPage = async (pageId: string) => {
    setImportingPageId(pageId);
    try {
      await importNotionPage(activeWorkspaceId || "", pageId, notionToken.trim());
      toast.success("Page Notion importée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'importation de la page.");
    } finally {
      setImportingPageId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers !");
  };

  const getMcpUrl = (key: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `${origin}/api/mcp?token=${key}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1 border-b border-border/30 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-xs text-muted-foreground">
          Gérez vos préférences de compte, les membres de votre espace et vos intégrations.
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
          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left ${
              activeTab === "integrations" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
            type="button"
          >
            <Link2 className="h-4 w-4" /> Intégrations Notion
          </button>
          <button
            onClick={() => setActiveTab("developers")}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left ${
              activeTab === "developers" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
            type="button"
          >
            <Code2 className="h-4 w-4" /> Développeurs (API / MCP)
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

              {/* ── Inviter par email ── */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Inviter par email
                </div>
                <form onSubmit={handleInvite} className="flex gap-2 max-w-lg">
                  <input
                    required
                    type="email"
                    placeholder="Adresse email du collaborateur..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs outline-none focus:border-foreground"
                  />
                  {/* Sélecteur de rôle */}
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="appearance-none h-full rounded-lg border border-border bg-background/50 pl-3 pr-7 text-xs outline-none focus:border-foreground cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  </div>
                  <Button size="sm" type="submit" disabled={inviteMutation.isPending} className="gap-1 text-xs shrink-0">
                    <UserPlus className="h-3.5 w-3.5" />
                    {inviteMutation.isPending ? "Envoi..." : "Inviter"}
                  </Button>
                </form>
              </div>

              {/* ── Lien d'invitation universel ── */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="h-3 w-3" /> Lien d&apos;invitation
                </div>
                <div className="flex gap-2 items-center max-w-lg">
                  {generatedLink ? (
                    <>
                      <code className="flex-1 bg-background border border-border px-3 py-2 rounded-lg text-[11px] font-mono text-indigo-400 overflow-x-auto whitespace-nowrap scrollbar-none select-all">
                        {generatedLink}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          toast.success("Lien copié !");
                        }}
                        className="p-2 hover:bg-accent rounded-lg border border-border bg-background transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copier le lien"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeneratedLink(null)}
                        className="p-2 hover:bg-accent rounded-lg border border-border bg-background transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Fermer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <select
                          value={linkRole}
                          onChange={(e) => setLinkRole(e.target.value as any)}
                          className="appearance-none h-full rounded-lg border border-border bg-background/50 pl-3 pr-7 py-2 text-xs outline-none focus:border-foreground cursor-pointer"
                        >
                          <option value="VIEWER">Lecteur</option>
                          <option value="EDITOR">Éditeur</option>
                          <option value="GUEST">Invité</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        disabled={generateLinkMutation.isPending}
                        onClick={() => generateLinkMutation.mutate(linkRole)}
                        className="gap-1.5 text-xs"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {generateLinkMutation.isPending ? "Génération..." : "Générer un lien"}
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  N&apos;importe qui avec ce lien peut rejoindre l&apos;espace. Valable 7 jours.
                </p>
              </div>

              {/* ── Invitations en attente ── */}
              {(pendingInvites && pendingInvites.length > 0) && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Invitations en attente ({pendingInvites.length})
                  </div>
                  <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden">
                    {isInvitesLoading ? (
                      <div className="h-12 bg-muted/20 animate-pulse" />
                    ) : (
                      pendingInvites.map((invite) => {
                        const daysLeft = Math.ceil(
                          (new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                        );
                        return (
                          <div key={invite.id} className="flex items-center justify-between px-4 py-3 bg-card/30">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-7 w-7 rounded-full bg-muted/50 border border-border flex items-center justify-center shrink-0">
                                {invite.email ? (
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {invite.email || "Lien universel"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {ROLE_LABELS[invite.role] || invite.role} · expire dans {daysLeft}j
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => revokeInviteMutation.mutate(invite.id)}
                              disabled={revokeInviteMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                              title="Révoquer l'invitation"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ── Membres actuels ── */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Membres actuels
                </div>
                {isMembersLoading ? (
                  <div className="h-12 bg-muted/20 animate-pulse rounded-lg" />
                ) : (
                  <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden">
                    {members?.map((m) => {
                      // Déterminer si l'utilisateur courant est propriétaire
                      const currentUserMember = members.find(
                        (mb) => mb.user.email === members.find((x) => x.role === "OWNER")?.user.email,
                      );
                      const isOwnerView = members.some(
                        (mb) => mb.role === "OWNER" && mb.user.id === m.user.id,
                      );
                      // On affiche les contrôles si le membre courant est OWNER ou ADMIN
                      // (on récupère le rôle du viewer via la liste)
                      const viewerRole = members.find((mb) => mb.id !== m.id)?.role;
                      const canManage =
                        members.some((mb) => mb.role === "OWNER") &&
                        m.role !== "OWNER";

                      return (
                        <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-card/20 hover:bg-card/40 transition-colors">
                          {/* Avatar + infos */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                              {(m.user.name?.[0] || m.user.email[0]).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-foreground truncate">
                                {m.user.name || "Utilisateur sans nom"}
                              </h4>
                              <p className="text-[10px] text-muted-foreground truncate">{m.user.email}</p>
                            </div>
                          </div>

                          {/* Contrôles droite */}
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {m.role === "OWNER" ? (
                              /* Propriétaire — badge non modifiable */
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                <Shield className="h-2.5 w-2.5" /> Propriétaire
                              </span>
                            ) : (
                              <>
                                {/* Sélecteur de rôle */}
                                <div className="relative">
                                  <select
                                    value={m.role}
                                    disabled={updateRoleMutation.isPending}
                                    onChange={(e) =>
                                      updateRoleMutation.mutate({
                                        memberId: m.id,
                                        role: e.target.value as any,
                                      })
                                    }
                                    className="appearance-none rounded-lg border border-border bg-background/60 pl-2.5 pr-6 py-1 text-[10px] font-semibold outline-none focus:border-foreground cursor-pointer text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="ADMIN">Administrateur</option>
                                    <option value="EDITOR">Éditeur</option>
                                    <option value="VIEWER">Lecteur</option>
                                    <option value="GUEST">Invité</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                                </div>

                                {/* Bouton retirer */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Retirer ${m.user.name || m.user.email} de l'espace de travail ?`)) {
                                      removeMemberMutation.mutate(m.id);
                                    }
                                  }}
                                  disabled={removeMemberMutation.isPending}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Retirer ce membre"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Importation de documents Notion</h3>
                <p className="text-[11px] text-muted-foreground">
                  Connectez votre compte Notion pour importer vos pages et bases de données tout en conservant leur style.
                </p>
              </div>

              {/* Instructions and Token input */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                  <div className="flex gap-2 items-start">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p className="font-bold text-foreground">Comment obtenir votre jeton Notion ?</p>
                      <ol className="list-decimal list-inside space-y-1 font-medium">
                        <li>
                          Rendez-vous sur{" "}
                          <a
                            href="https://www.notion.so/my-integrations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            notion.so/my-integrations
                          </a>
                          .
                        </li>
                        <li>Créez une nouvelle intégration de type interne.</li>
                        <li>Copiez le jeton d&apos;intégration secret obtenu.</li>
                        <li>Partagez les pages souhaitées avec l&apos;intégration dans Notion.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 max-w-lg">
                  <input
                    type="password"
                    placeholder="Saisissez votre Notion Integration Token..."
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs outline-none focus:border-foreground"
                  />
                  <Button
                    size="sm"
                    onClick={handleSearchNotion}
                    disabled={isSearchingNotion}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {isSearchingNotion ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Rechercher
                  </Button>
                </div>
              </div>

              {/* Notion Pages Result */}
              {notionPages.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/20">
                  <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    Pages Notion Disponibles ({notionPages.length})
                  </div>
                  <div className="divide-y divide-border/20 max-h-[300px] overflow-y-auto pr-1">
                    {notionPages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">
                            {page.icon || <FileText className="h-4 w-4 text-muted-foreground" />}
                          </span>
                          <span className="text-xs font-semibold text-foreground truncate max-w-sm">
                            {page.title}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={importingPageId !== null}
                          onClick={() => handleImportNotionPage(page.id)}
                          className="h-7 px-3 gap-1 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/5 cursor-pointer"
                        >
                          {importingPageId === page.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          {importingPageId === page.id ? "Importation..." : "Importer"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "developers" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Développeurs & Connecteur MCP</h3>
                <p className="text-[11px] text-muted-foreground">
                  Générez des clés d&apos;API sécurisées pour connecter vos outils de développement (Cursor, Windsurf, Claude Desktop) à NotoFlow.
                </p>
              </div>

              {/* API Keys form */}
              <form onSubmit={handleCreateApiKey} className="flex gap-2 max-w-md">
                <input
                  required
                  placeholder="Nom de la clé (ex: Cursor, Claude Desktop)..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs outline-none focus:border-foreground"
                />
                <Button size="sm" type="submit" disabled={createKeyMutation.isPending} className="gap-1 text-xs">
                  <Key className="h-3.5 w-3.5" /> Générer
                </Button>
              </form>

              {/* Affichage de la clé nouvellement créée (Une seule fois) */}
              {lastCreatedKey && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex gap-2 items-start">
                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p className="font-bold text-foreground text-amber-500">
                        Copiez votre clé d&apos;API maintenant !
                      </p>
                      <p>
                        Pour des raisons de sécurité, cette clé ne sera plus jamais affichée. Si vous la perdez, vous devrez la révoquer et en générer une nouvelle.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 bg-background border border-border px-3 py-2 rounded-lg text-xs font-mono text-amber-400 overflow-x-auto whitespace-nowrap scrollbar-none select-all">
                      {lastCreatedKey.rawToken}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lastCreatedKey.rawToken)}
                      className="p-2 hover:bg-accent rounded-lg border border-border bg-background transition-colors text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                      title="Copier la clé brute"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/20">
                    <p className="text-[11px] font-bold text-foreground">Votre URL de connexion MCP unique (SSE) :</p>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 bg-background border border-border px-3 py-1.5 rounded-lg text-[10px] font-mono text-indigo-400 overflow-x-auto whitespace-nowrap scrollbar-none select-all">
                        {getMcpUrl(lastCreatedKey.rawToken)}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(getMcpUrl(lastCreatedKey.rawToken))}
                        className="p-2 hover:bg-accent rounded-lg border border-border bg-background transition-colors text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                        title="Copier l'URL MCP"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLastCreatedKey(null)}
                      className="text-xs h-8 hover:bg-amber-500/10 hover:text-amber-500"
                    >
                      J&apos;ai copié la clé
                    </Button>
                  </div>
                </div>
              )}

              {/* API Keys list */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Vos clés d&apos;API
                </div>
                {isApiKeysLoading ? (
                  <div className="h-12 bg-muted/20 animate-pulse rounded-lg" />
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="p-4 rounded-xl border border-border/50 bg-card/50 flex flex-col gap-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground">{key.name}</h4>
                          <div className="flex flex-col items-end text-[10px] text-muted-foreground space-y-0.5">
                            <span>Créée le {new Date(key.createdAt).toLocaleDateString("fr-FR")}</span>
                            {key.lastUsedAt && (
                              <span className="text-[9px] text-indigo-400">
                                Utilisée le {new Date(key.lastUsedAt).toLocaleDateString("fr-FR")} à {new Date(key.lastUsedAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <code className="flex-1 select-none bg-muted/40 border border-border/50 px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-none">
                            {key.prefix}••••••••••••••••••••••••
                          </code>
                          <button
                            type="button"
                            onClick={() => deleteKeyMutation.mutate(key.id)}
                            disabled={deleteKeyMutation.isPending}
                            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg border border-border transition-colors text-muted-foreground cursor-pointer focus:outline-none"
                            title="Révoquer la clé"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium py-2">
                    Aucune clé d&apos;API générée. Créez-en une ci-dessus pour commencer.
                  </div>
                )}
              </div>

              {/* MCP instructions */}
              {apiKeys && apiKeys.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/20">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Configuration MCP (Model Context Protocol)
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Pour connecter un client MCP (Cursor ou Windsurf) à votre espace de travail NotoFlow en mode SSE,
                      utilisez l&apos;URL de connexion suivante :
                    </p>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 bg-background border border-border px-3 py-2 rounded-lg text-[10px] font-mono text-indigo-400 overflow-x-auto whitespace-nowrap scrollbar-none select-all">
                        {getMcpUrl("VOTRE_CLE_API")}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(getMcpUrl("VOTRE_CLE_API"))}
                        className="p-2 hover:bg-accent rounded-lg border border-border bg-background transition-colors text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                        title="Copier le modèle d'URL"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-foreground">Configuration dans Cursor / Windsurf :</p>
                      <ol className="list-decimal list-inside text-xs space-y-1.5 text-muted-foreground font-medium">
                        <li>
                          Ouvrez les Paramètres &rarr; <strong>Models</strong> &rarr;{" "}
                          <strong>MCP</strong>.
                        </li>
                        <li>Ajoutez une nouvelle source :</li>
                        <ul className="list-disc list-inside pl-4 mt-0.5 space-y-0.5">
                          <li>
                            Nom : <code className="text-[10px] font-mono text-foreground font-bold">NotoFlow</code>
                          </li>
                          <li>
                            Type : <code className="text-[10px] font-mono text-foreground font-bold">SSE</code>
                          </li>
                          <li>
                            URL : Copiez l&apos;URL ci-dessus en remplaçant <code className="text-[10px] font-mono font-bold text-foreground">VOTRE_CLE_API</code> par votre clé brute.
                          </li>
                        </ul>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

