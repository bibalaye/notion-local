import { createClient } from "./server";
import { db } from "@notoflow/database";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getOrCreateProfile() {
  const sUser = await getSessionUser();
  if (!sUser) return null;

  // Check if profile exists
  let profile = await db.user.findUnique({
    where: { email: sUser.email! },
  });

  if (!profile) {
    // Create new profile with the same ID as Supabase auth
    profile = await db.user.create({
      data: {
        id: sUser.id,
        email: sUser.email!,
        name: sUser.user_metadata?.name || sUser.user_metadata?.full_name || sUser.email!.split("@")[0],
        avatarUrl: sUser.user_metadata?.avatar_url || null,
      },
    });

    // Create a default workspace for this new user
    const wsName = profile.name ? `Espace de ${profile.name}` : "Mon Espace";
    const slug = `${profile.id.substring(0, 8)}-workspace`;
    const ws = await db.workspace.create({
      data: {
        name: wsName,
        slug: slug,
        members: {
          create: {
            userId: profile.id,
            role: "OWNER",
          },
        },
      },
    });

    // Create a welcome page for the user
    await db.page.create({
      data: {
        workspaceId: ws.id,
        authorId: profile.id,
        title: "Bienvenue sur votre NotoFlow 🚀",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Ceci est votre espace de travail personnel. Vous pouvez modifier cette page, ajouter des sous-pages et créer des bases de données dynamiques !",
              },
            ],
          },
        ] as any,
      },
    });
  }

  return profile;
}
