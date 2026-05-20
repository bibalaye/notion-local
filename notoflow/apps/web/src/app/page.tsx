import Link from "next/link";
import { Button } from "@notoflow/ui/components/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-24">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          NotoFlow
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Clone Notion — monorepo Turborepo + pnpm
        </h1>
        <p className="mt-3 text-muted-foreground">
          Auth Supabase, Prisma, TipTap, React Query, Stripe webhooks et temps réel : voir{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">docs/ARCHITECTURE.md</code>.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/login">Connexion</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/signup">Créer un compte</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app">Ouvrir l&apos;app</Link>
        </Button>
      </div>
    </main>
  );
}
