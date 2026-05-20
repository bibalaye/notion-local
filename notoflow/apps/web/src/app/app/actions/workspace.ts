"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";

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

// Add/invite user to workspace (simplified invite - directly adds as member for convenience in local test)
export async function addWorkspaceMember(workspaceId: string, email: string, role: "ADMIN" | "EDITOR" | "VIEWER" | "GUEST" = "VIEWER") {
  const user = await getAuthUser();
  
  // Check user is owner or admin in this workspace
  const activeMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (!activeMember || (activeMember.role !== "OWNER" && activeMember.role !== "ADMIN")) {
    throw new Error("Seuls les propriétaires et les administrateurs peuvent inviter des membres.");
  }

  // Find target user by email
  const targetUser = await db.user.findUnique({
    where: { email },
  });

  if (!targetUser) {
    throw new Error("L'utilisateur avec cet email n'existe pas encore sur NotoFlow.");
  }

  // Create member
  const newMember = await db.workspaceMember.create({
    data: {
      userId: targetUser.id,
      workspaceId,
      role,
    },
  });

  revalidatePath("/app", "layout");
  return newMember;
}

// Update workspace member role
export async function updateWorkspaceMemberRole(workspaceId: string, memberId: string, role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | "GUEST") {
  const user = await getAuthUser();

  // Check current user is owner
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
