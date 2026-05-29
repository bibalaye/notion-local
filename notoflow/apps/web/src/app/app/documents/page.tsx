import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { db } from "@notoflow/database";
import { redirect } from "next/navigation";
import { DocumentsClient } from "./DocumentsClient";

export default async function DocumentsPage() {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login");

  const membership = await db.workspaceMember.findFirst({
    where: { userId: profile.id },
    include: { workspace: true },
  });

  if (!membership) redirect("/app");

  const workspace = membership.workspace;
  const userRole = membership.role;

  // Pré-charger les documents côté serveur
  const documents = await db.document.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Tags distincts
  const allTags = [...new Set(documents.flatMap((d) => d.tags))].sort();

  const serialized = JSON.parse(JSON.stringify(documents));

  return (
    <DocumentsClient
      workspaceId={workspace.id}
      initialDocuments={serialized}
      allTags={allTags}
      userRole={userRole}
      currentUserId={profile.id}
    />
  );
}
