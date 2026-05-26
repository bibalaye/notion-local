import Link from "next/link";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 dark:opacity-20">
        <div className="h-[400px] w-[600px] rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 blur-[120px] animate-pulse duration-10000" />
      </div>
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background font-bold text-xl shadow-lg">
            N
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/75 bg-clip-text text-transparent">
            Bienvenue sur NotoFlow
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour commencer à collaborer.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/65 backdrop-blur-xl p-8 shadow-2xl dark:shadow-indigo-950/20">
          <LoginForm redirectTo={redirect} />
        </div>

        <p className="px-8 text-center text-sm text-muted-foreground">
          Nouveau sur NotoFlow ?{" "}
          <Link
            href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup"}
            className="underline underline-offset-4 hover:text-foreground font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
