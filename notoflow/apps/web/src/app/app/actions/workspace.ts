"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { sendInviteEmail } from "@/lib/email/invite";

// Ensure authenticated user and return profile
async function getAuthUser() {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");
  return profile;
}

// Get all workspaces the user is a member of
export async function getWorkspaces() {
  const user = await getAuthUser();
  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true },
  });
  return memberships.map((m) => m.workspace);
}

// Create a new workspace
export async function createWorkspace(name: string) {
  const user = await getAuthUser();
  if (!name.trim()) throw new Error("Le nom est requis.");

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-6)}`;
  const workspace = await db.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  revalidatePath("/app", "layout");
  return workspace;
}

// Get workspace details (verifying membership)
export async function getWorkspace(workspaceId: string) {
  const user = await getAuthUser();
  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (!membership) throw new Error("Accès refusé.");

  return db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
}

// ============================================================================
// SYSTÈME D'INVITATION (style Notion)
// ============================================================================

/**
 * Invite un membre par email.
 * - Si l'utilisateur a déjà un compte : crée directement le membre + envoie un email de notification.
 * - Si l'utilisateur n'a pas encore de compte : crée une invitation en attente + envoie un email avec lien.
 */
export async function inviteMember(
  workspaceId: string,
  email: string,
  role: "ADMIN" | "EDITOR" | "VIEWER" | "GUEST" = "VIEWER",
) {
  const user = await getAuthUser();

  // Vérifier que l'invitant est owner ou admin
  const activeMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (!activeMember || (activeMember.role !== "OWNER" && activeMember.role !== "ADMIN")) {
    throw new Error("Seuls les propriétaires et les administrateurs peuvent inviter des membres.");
  }

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error("Espace de travail introuvable.");

  const normalizedEmail = email.toLowerCase().trim();

  // Vérifier si déjà membre
  const existingMember = await db.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: { email: normalizedEmail },
    },
  });
  if (existingMember) {
    throw new Error("Cet utilisateur est déjà membre de l'espace de travail.");
  }

  // Vérifier si une invitation en attente existe déjà
  const existingInvite = await db.invite.findFirst({
    where: {
      workspaceId,
      email: normalizedEmail,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    throw new Error("Une invitation est déjà en attente pour cet email.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
  const inviteUrl = `${appUrl}/invite/${token}`;

  // Créer l'invitation en base
  const invite = await db.invite.create({
    data: {
      email: normalizedEmail,
      workspaceId,
      role,
      token,
      expiresAt,
    },
  });

  // Envoyer l'email d'invitation
  await sendInviteEmail({
    to: normalizedEmail,
    inviterName: user.name || user.email,
    workspaceName: workspace.name,
    inviteUrl,
    role,
  });

  revalidatePath("/app", "layout");
  return invite;
}

/**
 * Génère un lien d'invitation universel (sans email spécifique).
 * N'importe qui avec ce lien peut rejoindre l'espace.
 */
export async function generateInviteLink(
  workspaceId: string,
  role: "EDITOR" | "VIEWER" | "GUEST" = "VIEWER",
) {
  const user = await getAuthUser();

  const activeMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (!activeMember || (activeMember.role !== "OWNER" && activeMember.role !== "ADMIN")) {
    throw new Error("Seuls les propriétaires et les administrateurs peuvent générer des liens d'invitation.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // email vide = lien universel
  await db.invite.create({
    data: {
      email: "",
      workspaceId,
      role,
      token,
      expiresAt,
    },
  });

  return `${appUrl}/invite/${token}`;
}

/**
 * Récupère toutes les invitations en attente d'un workspace.
 */
export async function getWorkspaceInvites(workspaceId: string) {
  const user = await getAuthUser();

  const activeMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (!activeMember || (activeMember.role !== "OWNER" && activeMember.role !== "ADMIN")) {
    throw new Error("Accès refusé.");
  }

  return db.invite.findMany({
    where: {
      workspaceId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Révoque une invitation en attente.
 */
export async function revokeInvite(inviteId: string) {
  const user = await getAuthUser();

  const invite = await db.invite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error("Invitation introuvable.");

  const activeMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
  });

  if (!activeMember || (activeMember.role !== "OWNER" && activeMember.role !== "ADMIN")) {
    throw new Error("Non autorisé.");
  }

  await db.invite.delete({ where: { id: inviteId } });
  revalidatePath("/app", "layout");
}

/**
 * Accepte une invitation via son token.
 * Crée le WorkspaceMember et supprime l'invitation.
 * Retourne le workspaceId pour rediriger l'utilisateur.
 */
export async function acceptInvite(token: string) {
  const user = await getAuthUser();

  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite) throw new Error("Invitation invalide ou introuvable.");
  if (invite.expiresAt < new Date()) throw new Error("Cette invitation a expiré.");

  // Vérifier que l'email correspond (sauf pour les liens universels)
  if (invite.email && invite.email !== user.email.toLowerCase()) {
    throw new Error("Cette invitation est destinée à une autre adresse email.");
  }

  // Vérifier si déjà membre
  const existingMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
  });

  if (existingMember) {
    // Déjà membre — supprimer l'invite et rediriger
    await db.invite.delete({ where: { id: invite.id } });
    return { workspaceId: invite.workspaceId, alreadyMember: true };
  }

  // Créer le membre
  await db.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: invite.workspaceId,
      role: invite.role,
    },
  });

  // Supprimer l'invitation (sauf si c'est un lien universel sans email)
  if (invite.email) {
    await db.invite.delete({ where: { id: invite.id } });
  }

  revalidatePath("/app", "layout");
  return { workspaceId: invite.workspaceId, alreadyMember: false };
}

/**
 * Récupère les infos publiques d'une invitation (pour la page d'accueil du lien).
 */
export async function getInviteInfo(token: string) {
  const invite = await db.invite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite) return null;
  if (invite.expiresAt < new Date()) return null;

  return {
    workspaceName: invite.workspace.name,
    workspaceLogo: invite.workspace.logoUrl,
    role: invite.role,
    email: invite.email || null,
    expiresAt: invite.expiresAt,
  };
}

// ============================================================================
// GESTION DES MEMBRES EXISTANTS
// ============================================================================

// Compatibilité avec l'ancien nom utilisé dans api/client.ts
export const addWorkspaceMember = inviteMember;

// Update workspace member role
export async function updateWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | "GUEST",
) {
  const user = await getAuthUser();

  const activeMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (!activeMember || activeMember.role !== "OWNER") {
    throw new Error("Seul le propriétaire de l'espace de travail peut modifier les rôles.");
  }

  const updated = await db.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });

  revalidatePath("/app", "layout");
  return updated;
}

// Remove member from workspace
export async function removeWorkspaceMember(workspaceId: string, memberId: string) {
  const user = await getAuthUser();

  const activeMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (!activeMember || (activeMember.role !== "OWNER" && activeMember.role !== "ADMIN")) {
    throw new Error("Non autorisé.");
  }

  const targetMember = await db.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember) throw new Error("Membre non trouvé.");
  if (targetMember.role === "OWNER") throw new Error("Impossible de supprimer le propriétaire.");

  await db.workspaceMember.delete({
    where: { id: memberId },
  });

  revalidatePath("/app", "layout");
}
