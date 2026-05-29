"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Constantes ───────────────────────────────────────────────────────────────

const BUCKET = "documents";

/** Extensions → type normalisé */
const EXT_TYPE_MAP: Record<string, string> = {
  pdf: "pdf",
  doc: "docx",
  docx: "docx",
  xls: "xlsx",
  xlsx: "xlsx",
  ppt: "pptx",
  pptx: "pptx",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  txt: "text",
  md: "text",
  csv: "csv",
};

function getFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TYPE_MAP[ext] ?? "other";
}

// ─── Vérification d'accès ─────────────────────────────────────────────────────

async function verifyAccess(
  workspaceId: string,
  roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER", "GUEST"],
) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");
  const m = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: profile.id, workspaceId } },
  });
  if (!m || !roles.includes(m.role)) throw new Error("Accès refusé.");
  return profile;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload un document vers Supabase Storage et crée l'entrée en base.
 * Appelé depuis un FormData (Server Action).
 */
export async function uploadDocument(formData: FormData) {
  const workspaceId = formData.get("workspaceId") as string;
  const file = formData.get("file") as File;
  const tagsRaw = formData.get("tags") as string | null;

  if (!workspaceId || !file) throw new Error("Paramètres manquants.");

  const profile = await verifyAccess(workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase non configuré.");

  // Chemin unique dans le bucket
  const ext = file.name.split(".").pop() ?? "bin";
  const storageKey = `${workspaceId}/${profile.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error(`Upload échoué : ${uploadError.message}`);

  // URL publique (le bucket doit être public) ou signée
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);
  const publicUrl = urlData.publicUrl;

  const tags: string[] = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const doc = await db.document.create({
    data: {
      workspaceId,
      uploaderId: profile.id,
      name: file.name,
      fileType: getFileType(file.name),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      storageKey,
      publicUrl,
      tags,
    },
    include: {
      uploader: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  revalidatePath("/app/documents");
  return doc;
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

export async function getDocuments(workspaceId: string, filters?: { tag?: string; type?: string; search?: string }) {
  await verifyAccess(workspaceId);

  const where: any = { workspaceId };

  if (filters?.type && filters.type !== "all") {
    where.fileType = filters.type;
  }
  if (filters?.tag) {
    where.tags = { has: filters.tag };
  }
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  return db.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function getDocument(documentId: string) {
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
  });
  if (!doc) throw new Error("Document introuvable.");
  await verifyAccess(doc.workspaceId);
  return doc;
}

/** Retourne tous les tags distincts utilisés dans le workspace */
export async function getDocumentTags(workspaceId: string): Promise<string[]> {
  await verifyAccess(workspaceId);
  const docs = await db.document.findMany({
    where: { workspaceId },
    select: { tags: true },
  });
  const all = docs.flatMap((d) => d.tags);
  return [...new Set(all)].sort();
}

// ─── Mise à jour des tags ─────────────────────────────────────────────────────

export async function updateDocumentTags(documentId: string, tags: string[]) {
  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document introuvable.");
  await verifyAccess(doc.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  const cleanTags = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);

  const updated = await db.document.update({
    where: { id: documentId },
    data: { tags: cleanTags, updatedAt: new Date() },
  });

  revalidatePath("/app/documents");
  return updated;
}

export async function renameDocument(documentId: string, name: string) {
  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document introuvable.");
  await verifyAccess(doc.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  const updated = await db.document.update({
    where: { id: documentId },
    data: { name: name.trim(), updatedAt: new Date() },
  });

  revalidatePath("/app/documents");
  return updated;
}

// ─── Suppression ─────────────────────────────────────────────────────────────

export async function deleteDocument(documentId: string) {
  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document introuvable.");
  await verifyAccess(doc.workspaceId, ["OWNER", "ADMIN"]);

  const supabase = await createClient();
  if (supabase) {
    await supabase.storage.from(BUCKET).remove([doc.storageKey]);
  }

  await db.document.delete({ where: { id: documentId } });
  revalidatePath("/app/documents");
}
