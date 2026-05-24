"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function verifyWorkspaceAccess(workspaceId: string, allowedRoles: string[] = ["OWNER", "ADMIN"]) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: profile.id, workspaceId } },
  });

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error("Accès refusé à cet espace de travail.");
  }

  return { profile, membership };
}

export async function getApiKeys(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId, ["OWNER", "ADMIN"]);

  return db.apiKey.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createApiKey(workspaceId: string, name: string) {
  const { profile } = await verifyWorkspaceAccess(workspaceId, ["OWNER", "ADMIN"]);

  if (!name || name.trim() === "") {
    throw new Error("Le nom de la clé est requis.");
  }

  const token = `ntf_${crypto.randomBytes(24).toString("hex")}`;

  const apiKey = await db.apiKey.create({
    data: {
      name: name.trim(),
      key: token,
      workspaceId,
      userId: profile.id,
    },
  });

  revalidatePath("/app", "layout");
  return apiKey;
}

export async function deleteApiKey(workspaceId: string, id: string) {
  await verifyWorkspaceAccess(workspaceId, ["OWNER", "ADMIN"]);

  await db.apiKey.delete({
    where: { id },
  });

  revalidatePath("/app", "layout");
}
