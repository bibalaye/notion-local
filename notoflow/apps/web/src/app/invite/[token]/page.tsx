import { getInviteInfo, acceptInvite } from "@/app/app/actions/workspace";
import { getSessionUser } from "@/lib/supabase/auth-helper";
import { redirect } from "next/navigation";
import InviteAcceptClient from "./InviteAcceptClient";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const invite = await getInviteInfo(token);
  const sessionUser = await getSessionUser();

  // Invitation invalide ou expirée
  if (!invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">🔗</div>
          <h1 className="text-xl font-bold text-foreground">Lien invalide ou expiré</h1>
          <p className="text-sm text-muted-foreground">
            Ce lien d&apos;invitation n&apos;est plus valide. Demandez un nouveau lien à l&apos;administrateur de l&apos;espace.
          </p>
          <a
            href="/app"
            className="inline-block mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, on peut accepter directement côté serveur
  if (sessionUser) {
    // Vérifier que l'email correspond si c'est une invitation nominative
    if (invite.email && invite.email !== sessionUser.email?.toLowerCase()) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-xl font-bold text-foreground">Invitation non destinée à ce compte</h1>
            <p className="text-sm text-muted-foreground">
              Cette invitation est destinée à <strong>{invite.email}</strong>.<br />
              Vous êtes connecté avec <strong>{sessionUser.email}</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              Connectez-vous avec le bon compte pour accepter cette invitation.
            </p>
            <a
              href={`/auth/login?redirect=/invite/${token}`}
              className="inline-block mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Se connecter avec un autre compte
            </a>
          </div>
        </div>
      );
    }

    // Tout est bon — afficher la page de confirmation avec bouton d'acceptation
    return (
      <InviteAcceptClient
        token={token}
        workspaceName={invite.workspaceName}
        workspaceLogo={invite.workspaceLogo}
        role={invite.role}
        email={invite.email}
        expiresAt={invite.expiresAt.toISOString()}
        isLoggedIn={true}
        userEmail={sessionUser.email || ""}
      />
    );
  }

  // Utilisateur non connecté — afficher la page avec bouton de connexion/inscription
  return (
    <InviteAcceptClient
      token={token}
      workspaceName={invite.workspaceName}
      workspaceLogo={invite.workspaceLogo}
      role={invite.role}
      email={invite.email}
      expiresAt={invite.expiresAt.toISOString()}
      isLoggedIn={false}
      userEmail=""
    />
  );
}
