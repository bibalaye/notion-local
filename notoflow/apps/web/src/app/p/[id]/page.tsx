import { PageEditorClient } from "@/app/app/page/[id]/PageEditorClient";
import { getPage } from "@/app/app/actions/pages";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicDocumentPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const page = await getPage(id);
    const user = await getOrCreateProfile();

    const serializedPage = JSON.parse(JSON.stringify(page));
    const serializedUser = user ? JSON.parse(JSON.stringify(user)) : null;

    return <PageEditorClient page={serializedPage} currentUser={serializedUser} />;
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-12 text-center">
        <div className="text-3xl">🔒</div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">Page introuvable ou privee</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Le lien est invalide ou cette page n'est pas partagee publiquement.
        </p>
      </div>
    );
  }
}
