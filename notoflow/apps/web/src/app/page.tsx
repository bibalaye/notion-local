import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "./_landing/LandingPage";

/**
 * Route racine — Server Component.
 * Redirige vers /app si l'utilisateur est connecté,
 * sinon affiche la landing page.
 */
export default async function HomePage() {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/app");
    }
  }

  return <LandingPage />;
}
