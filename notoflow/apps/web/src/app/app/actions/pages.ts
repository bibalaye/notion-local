"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { PAGE_TEMPLATES } from "@/lib/templates/page-templates";
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

export async function createPageFromTemplate(workspaceId: string, templateId: string) {
  const template = PAGE_TEMPLATES.find((item) => item.id === templateId);
  if (!template) throw new Error("Template introuvable.");

  const { profile } = await verifyWorkspaceAccess(workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

  const page = await db.page.create({
    data: {
      workspaceId,
      authorId: profile.id,
      title: template.title,
      icon: template.icon,
      content: template.content as any,
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
  try {
    const page = await db.page.findUnique({ where: { id: pageId } });
    if (!page) throw new Error("Page introuvable.");

    const { profile } = await verifyWorkspaceAccess(page.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);

    // Next.js 15 Client Reference Proxy serialization fix:
    // Clone data to avoid proxy traversal errors when Prisma reads fields on the server.
    const updateData: typeof data = { ...data };
    if (data.content !== undefined) {
      updateData.content = JSON.parse(JSON.stringify(data.content));
    }

    const updatedPage = await db.page.update({
      where: { id: pageId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    // If content changed, save a throttled version history snapshot.
    if (data.content !== undefined) {
      const recentVersion = await db.pageVersion.findFirst({
        where: {
          pageId,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!recentVersion) {
        await db.pageVersion.create({
          data: {
            pageId,
            content: updateData.content,
          },
        });
      }
    }

    if (data.title !== undefined || data.icon !== undefined || data.coverUrl !== undefined || data.isPublic !== undefined || data.position !== undefined) {
      revalidatePath("/app", "layout");
    }
    return updatedPage;
  } catch (error) {
    console.error("Error in updatePage:", error);
    throw error;
  }
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
