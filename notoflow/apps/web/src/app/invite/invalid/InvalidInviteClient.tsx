"use client";

import { useSearchParams } from "next/navigation";
import { LinkIcon } from "lucide-react";

export default function InvalidInviteClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <LinkIcon className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Lien invalide ou expiré</h1>
          <p className="text-sm text-muted-foreground">
            {error
              ? decodeURIComponent(error)
              : "Ce lien d'invitation n'est plus valide. Il a peut-être expiré ou été révoqué."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href="/app"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Retour à l&apos;accueil
          </a>
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}
