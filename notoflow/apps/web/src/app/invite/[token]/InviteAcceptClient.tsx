"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/app/app/actions/workspace";
import { Button } from "@notoflow/ui/components/button";
import { Users, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  VIEWER: "Lecteur",
  GUEST: "Invité",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  ADMIN: "text-red-400 bg-red-400/10 border-red-400/20",
  EDITOR: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  VIEWER: "text-green-400 bg-green-400/10 border-green-400/20",
  GUEST: "text-muted-foreground bg-muted/30 border-border",
};

interface InviteAcceptClientProps {
  token: string;
  workspaceName: string;
  workspaceLogo: string | null;
  role: string;
  email: string | null;
  expiresAt: string;
  isLoggedIn: boolean;
  userEmail: string;
}

export default function InviteAcceptClient({
  token,
  workspaceName,
  workspaceLogo,
  role,
  email,
  expiresAt,
  isLoggedIn,
  userEmail,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const roleLabel = ROLE_LABELS[role] || role;
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.VIEWER;

  const expiresDate = new Date(expiresAt);
  const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptInvite(token);
      setAccepted(true);
      toast.success(`Vous avez rejoint "${workspaceName}" !`);
      setTimeout(() => {
        router.push(`/app?workspace=${result.workspaceId}`);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'acceptation de l'invitation.");
      setIsAccepting(false);
    }
  };

  const handleLoginRedirect = () => {
    const redirectUrl = encodeURIComponent(`/invite/${token}`);
    router.push(`/login?redirect=${redirectUrl}`);
  };

  const handleSignupRedirect = () => {
    const redirectUrl = encodeURIComponent(`/invite/${token}`);
    const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
    router.push(`/signup?redirect=${redirectUrl}${emailParam}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo NotoFlow */}
        <div className="text-center">
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            Noto<span className="text-indigo-500">Flow</span>
          </span>
        </div>

        {/* Carte d'invitation */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden">
          {/* Header coloré */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-8 space-y-6">
            {accepted ? (
              /* État accepté */
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h2 className="text-lg font-bold text-foreground">Invitation acceptée !</h2>
                <p className="text-sm text-muted-foreground">
                  Redirection vers votre espace de travail...
                </p>
              </div>
            ) : (
              <>
                {/* Workspace info */}
                <div className="text-center space-y-3">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    {workspaceLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={workspaceLogo} alt={workspaceName} className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <Users className="h-7 w-7 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                      Vous êtes invité à rejoindre
                    </p>
                    <h1 className="text-xl font-bold text-foreground">{workspaceName}</h1>
                  </div>
                </div>

                {/* Rôle */}
                <div className="flex items-center justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${roleColor}`}
                  >
                    {roleLabel}
                  </span>
                </div>

                {/* Email cible si invitation nominative */}
                {email && (
                  <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      Cette invitation est destinée à
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{email}</p>
                  </div>
                )}

                {/* Expiration */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {daysLeft > 1
                      ? `Expire dans ${daysLeft} jours`
                      : daysLeft === 1
                        ? "Expire demain"
                        : "Expire aujourd'hui"}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  {isLoggedIn ? (
                    <>
                      <p className="text-xs text-center text-muted-foreground">
                        Connecté en tant que <strong className="text-foreground">{userEmail}</strong>
                      </p>
                      <Button
                        className="w-full h-11 text-sm font-semibold"
                        onClick={handleAccept}
                        disabled={isAccepting}
                      >
                        {isAccepting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Acceptation en cours...
                          </>
                        ) : (
                          `Rejoindre "${workspaceName}"`
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="w-full h-11 text-sm font-semibold"
                        onClick={handleSignupRedirect}
                      >
                        Créer un compte et rejoindre
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-11 text-sm font-semibold"
                        onClick={handleLoginRedirect}
                      >
                        Se connecter pour rejoindre
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          En rejoignant cet espace, vous acceptez les{" "}
          <a href="/terms" className="underline hover:text-foreground transition-colors">
            conditions d&apos;utilisation
          </a>{" "}
          de NotoFlow.
        </p>
      </div>
    </div>
  );
}
