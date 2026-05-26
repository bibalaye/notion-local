"use client";

import { useActionState, useState, useTransition } from "react";
import type { AuthActionState } from "../actions";
import { login, loginWithMagicLink, signInWith } from "../actions";
import { Button } from "@notoflow/ui/components/button";
import { Mail, ShieldAlert, Sparkles, Github } from "lucide-react";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [authMethod, setAuthMethod] = useState<"password" | "magic">("password");
  const [passwordState, passwordAction, passwordPending] = useActionState(login, {} satisfies AuthActionState);
  const [magicState, magicAction, magicPending] = useActionState(loginWithMagicLink, {} satisfies AuthActionState);
  const [isOauthPending, startOauthTransition] = useTransition();

  const handleOAuth = (provider: "google" | "github") => {
    startOauthTransition(async () => {
      await signInWith(provider, redirectTo);
    });
  };

  const pending = passwordPending || magicPending || isOauthPending;
  const currentError = authMethod === "password" ? passwordState?.error : magicState?.error;
  const magicLinkSent = authMethod === "magic" && magicState && !magicState.error && Object.keys(magicState).length > 0;

  return (
    <div className="space-y-6 w-full">
      {/* Social Logins */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-border/60 hover:bg-accent/50 dark:hover:bg-accent/30 transition-all duration-200"
          onClick={() => handleOAuth("google")}
          disabled={pending}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-border/60 hover:bg-accent/50 dark:hover:bg-accent/30 transition-all duration-200"
          onClick={() => handleOAuth("github")}
          disabled={pending}
        >
          <Github className="h-4 w-4" />
          GitHub
        </Button>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <span className="relative bg-background px-3 text-xs uppercase text-muted-foreground tracking-wider">
          Ou continuer avec
        </span>
      </div>

      {authMethod === "password" ? (
        <form action={passwordAction} className="space-y-4">
          {/* Champ caché pour préserver le redirect après connexion */}
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="email">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={pending}
              placeholder="nom@entreprise.com"
              className="w-full rounded-lg border border-border/80 bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="password">
                Mot de passe
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={pending}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border/80 bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
            />
          </div>

          {currentError && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{currentError}</span>
            </div>
          )}

          <Button className="w-full rounded-lg h-10 font-medium" type="submit" disabled={pending}>
            {pending ? "Connexion..." : "Se connecter"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setAuthMethod("magic")}
          >
            Se connecter via Magic Link
          </Button>
        </form>
      ) : (
        <form action={magicAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="magic-email">
              Adresse email
            </label>
            <input
              id="magic-email"
              name="email"
              type="email"
              required
              disabled={pending || magicLinkSent}
              placeholder="nom@entreprise.com"
              className="w-full rounded-lg border border-border/80 bg-background/50 px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
            />
          </div>

          {currentError && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{currentError}</span>
            </div>
          )}

          {magicLinkSent && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Lien de connexion envoyé ! Vérifiez votre boîte mail.</span>
            </div>
          )}

          {!magicLinkSent ? (
            <Button className="w-full rounded-lg h-10 font-medium" type="submit" disabled={pending}>
              <Mail className="mr-2 h-4 w-4" />
              {pending ? "Envoi du lien..." : "Envoyer le Magic Link"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                // reset state
                setAuthMethod("password");
              }}
            >
              Retour à la connexion par mot de passe
            </Button>
          )}

          {!magicLinkSent && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setAuthMethod("password")}
            >
              Connexion classique par mot de passe
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
