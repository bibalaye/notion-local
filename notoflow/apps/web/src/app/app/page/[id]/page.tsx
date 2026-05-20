import { getPage } from "@/app/app/actions/pages";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { PageEditorClient } from "./PageEditorClient";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const page = await getPage(id);
    const user = await getOrCreateProfile();

    if (!user) {
      redirect("/login");
    }

    // Convert decimal or other json values safely
    const serializedPage = JSON.parse(JSON.stringify(page));
    const serializedUser = JSON.parse(JSON.stringify(user));

    return <PageEditorClient page={serializedPage} currentUser={serializedUser} />;
  } catch (err: any) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[80vh] space-y-4">
        <div className="text-3xl">🔒</div>
        <h2 className="text-lg font-bold text-destructive">Accès Refusé / Document Introuvable</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          Vous n&apos;avez pas les droits pour accéder à cette page ou le lien est invalide.
        </p>
      </div>
    );
  }
}
