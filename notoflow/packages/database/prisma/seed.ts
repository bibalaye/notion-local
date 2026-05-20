import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workspace.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Espace démo",
      slug: "demo",
      plan: "FREE",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@notoflow.local" },
    update: {},
    create: {
      email: "demo@notoflow.local",
      name: "Utilisateur démo",
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId: ws.id },
    },
    update: { role: "OWNER" },
    create: {
      userId: user.id,
      workspaceId: ws.id,
      role: "OWNER",
    },
  });

  const existing = await prisma.page.findFirst({
    where: { workspaceId: ws.id, title: "Bienvenue sur NotoFlow" },
  });
  if (!existing) {
    await prisma.page.create({
      data: {
        workspaceId: ws.id,
        authorId: user.id,
        title: "Bienvenue sur NotoFlow",
        content: [],
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed OK : workspace demo + page d’accueil.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
