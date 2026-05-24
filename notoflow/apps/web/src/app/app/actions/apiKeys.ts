"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Hash un token API avec SHA-256 pour le stocker en base
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

/**
 * Crée une clé API sécurisée.
 * Retourne la clé en clair UNE SEULE FOIS (elle ne sera plus jamais visible).
 */
export async function createApiKey(workspaceId: string, name: string) {
  const { profile } = await verifyWorkspaceAccess(workspaceId, ["OWNER", "ADMIN"]);

  if (!name || name.trim() === "") {
    throw new Error("Le nom de la clé est requis.");
  }

  // Générer le token brut
  const rawToken = `ntf_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawToken.substring(0, 12); // "ntf_xxxxxxxx"
  const keyHash = hashToken(rawToken);

  await db.apiKey.create({
    data: {
      name: name.trim(),
      keyHash,
      prefix,
      workspaceId,
      userId: profile.id,
    },
  });

  // Retourner la clé brute au frontend (affichage unique)
  return { rawToken, prefix };
}

export async function deleteApiKey(workspaceId: string, id: string) {
  await verifyWorkspaceAccess(workspaceId, ["OWNER", "ADMIN"]);

  await db.apiKey.delete({
    where: { id },
  });
}

/**
 * Valide un token API brut en comparant son hash SHA-256.
 * Retourne l'objet ApiKey si valide, null sinon.
 */
export async function validateApiKey(rawToken: string) {
  const keyHash = hashToken(rawToken);

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKey) return null;

  // Vérifier l'expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }

  // Mettre à jour lastUsedAt en arrière-plan (sans bloquer)
  db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return apiKey;
}
