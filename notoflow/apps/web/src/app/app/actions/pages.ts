"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";

async function verifyWorkspaceAccess(workspaceId: string, allowedRoles: string[] = ["OWNER", "ADMIN", "EDITOR", "VIEWER", "GUEST"]) {
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

// Get the flat list of non-archived pages for building tree structures
export async function getWorkspacePages(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId);

  return db.page.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    orderBy: { position: "asc" },
  });
}

// Create a new page (optionally nested)
export async function createPage(workspaceId: string, parentId?: string | null) {
  const { profile } = await verifyWorkspaceAccess(workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  const page = await db.page.create({
    data: {
      workspaceId,
      authorId: profile.id,
      parentId: parentId || null,
      title: "Sans titre",
      content: [] as any,
    },
  });

  revalidatePath("/app", "layout");
  return page;
}

// Get single page details (verifying access, fallback to isPublic for non-members)
export async function getPage(pageId: string) {
  const page = await db.page.findUnique({
    where: { id: pageId },
  });

  if (!page) throw new Error("Page introuvable.");

  if (!page.isPublic) {
    await verifyWorkspaceAccess(page.workspaceId);
  }

  return page;
}

// Update page attributes (autosave) and capture version history
export async function updatePage(
  pageId: string,
  data: {
    title?: string;
    content?: any;
    icon?: string | null;
    coverUrl?: string | null;
    isPublic?: boolean;
    position?: number;
  },
) {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page introuvable.");

  const { profile } = await verifyWorkspaceAccess(page.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  const updatedPage = await db.page.update({
    where: { id: pageId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  // If content changed, save a version history snapshot
  if (data.content !== undefined) {
    await db.pageVersion.create({
      data: {
        pageId,
        content: data.content,
      },
    });
  }

  revalidatePath("/app", "layout");
  return updatedPage;
}

// Duplicate page and its nested child pages recursively
export async function duplicatePage(pageId: string, parentId?: string | null) {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page introuvable.");

  const { profile } = await verifyWorkspaceAccess(page.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  // Create duplicate
  const newPage = await db.page.create({
    data: {
      workspaceId: page.workspaceId,
      authorId: profile.id,
      parentId: parentId !== undefined ? parentId : page.parentId,
      title: `${page.title} (Copie)`,
      content: page.content || ([] as any),
      icon: page.icon,
      coverUrl: page.coverUrl,
    },
  });

  // Fetch children and duplicate them too
  const children = await db.page.findMany({
    where: { parentId: pageId, isArchived: false },
  });

  for (const child of children) {
    await duplicatePage(child.id, newPage.id);
  }

  revalidatePath("/app", "layout");
  return newPage;
}

// Archive / Send page to Trash
export async function archivePage(pageId: string) {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page introuvable.");

  await verifyWorkspaceAccess(page.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  await db.page.update({
    where: { id: pageId },
    data: { isArchived: true },
  });

  revalidatePath("/app", "layout");
}

// Unarchive / Restore page from Trash
export async function restorePage(pageId: string) {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page introuvable.");

  await verifyWorkspaceAccess(page.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  await db.page.update({
    where: { id: pageId },
    data: { isArchived: false },
  });

  revalidatePath("/app", "layout");
}

// Delete page permanently
export async function deletePagePermanently(pageId: string) {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page introuvable.");

  await verifyWorkspaceAccess(page.workspaceId, ["OWNER", "ADMIN"]);

  await db.page.delete({
    where: { id: pageId },
  });

  revalidatePath("/app", "layout");
}

// List archived pages (trash bin)
export async function getArchivedPages(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId);

  return db.page.findMany({
    where: {
      workspaceId,
      isArchived: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Get page version history snapshots
export async function getPageVersions(pageId: string) {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page introuvable.");

  await verifyWorkspaceAccess(page.workspaceId);

  return db.pageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    take: 30, // Limit to 30 history versions
  });
}

// Toggle page as favorite
export async function toggleFavorite(pageId: string) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");

  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page introuvable.");

  await verifyWorkspaceAccess(page.workspaceId);

  const existing = await db.favorite.findUnique({
    where: {
      userId_pageId: {
        userId: profile.id,
        pageId,
      },
    },
  });

  if (existing) {
    await db.favorite.delete({
      where: { id: existing.id },
    });
    revalidatePath("/app", "layout");
    return false;
  } else {
    await db.favorite.create({
      data: {
        userId: profile.id,
        pageId,
      },
    });
    revalidatePath("/app", "layout");
    return true;
  }
}

// List user favorites for current workspace
export async function getFavorites(workspaceId: string) {
  const profile = await getOrCreateProfile();
  if (!profile) return [];

  const favorites = await db.favorite.findMany({
    where: {
      userId: profile.id,
      page: {
        workspaceId,
        isArchived: false,
      },
    },
    include: {
      page: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((f) => f.page);
}
