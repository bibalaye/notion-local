import { NextRequest, NextResponse } from "next/server";
import { acceptInvite } from "@/app/app/actions/workspace";

/**
 * GET /api/invite/accept?token=xxx
 * Accepte une invitation et redirige vers l'espace de travail.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/invite/invalid", request.url));
  }

  try {
    const result = await acceptInvite(token);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL(`/app?workspace=${result.workspaceId}`, appUrl));
  } catch (error: any) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const message = encodeURIComponent(error.message || "Erreur lors de l'acceptation de l'invitation.");
    return NextResponse.redirect(new URL(`/invite/invalid?error=${message}`, appUrl));
  }
}
