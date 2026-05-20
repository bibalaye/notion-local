"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";

export async function searchPages(workspaceId: string, query: string) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");

  // Check workspace membership
  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: profile.id, workspaceId } },
  });
  if (!membership) throw new Error("Accès refusé.");

  // Simple like query or full-text query for Postgres
  return db.page.findMany({
    where: {
      workspaceId,
      isArchived: false,
      OR: [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      icon: true,
    },
    take: 10,
  });
}
