"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AuthActionState = { error?: string };

import { getOrCreateProfile } from "@/lib/supabase/auth-helper";

const SUPABASE_CONFIG_ERROR = "Configuration Supabase manquante.";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export async function signup(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: "Données invalides" };

  const supabase = await createClient();
  if (!supabase) return { error: SUPABASE_CONFIG_ERROR };
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });

  if (error) return { error: error.message };

  // Sync profile and initialize workspace
  await getOrCreateProfile();

  revalidatePath("/", "layout");

  // Respecter le redirect param (ex: /invite/TOKEN après inscription depuis une invitation)
  const redirectTo = (formData.get("redirect") as string) || "/app";
  redirect(redirectTo);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function login(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Données invalides" };

  const supabase = await createClient();
  if (!supabase) return { error: SUPABASE_CONFIG_ERROR };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: error.message };

  // Sync profile and initialize workspace
  await getOrCreateProfile();

  revalidatePath("/", "layout");

  // Respecter le redirect param (ex: /invite/TOKEN après connexion depuis une invitation)
  const redirectTo = (formData.get("redirect") as string) || "/app";
  redirect(redirectTo);
}

export async function signInWith(provider: "google" | "github", redirectTo?: string) {
  const supabase = await createClient();
  if (!supabase) return { error: SUPABASE_CONFIG_ERROR };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Encoder le redirect dans le param `next` du callback Supabase
  const next = redirectTo ? encodeURIComponent(redirectTo) : "/app";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${appUrl}/auth/callback?next=${next}` },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
  return { error: "URL OAuth indisponible" };
}

export async function loginWithMagicLink(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email requis" };

  const supabase = await createClient();
  if (!supabase) return { error: SUPABASE_CONFIG_ERROR };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  return { error: undefined }; // Success state
}

export async function signOut() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  await supabase.auth.signOut();
  redirect("/login");
}
