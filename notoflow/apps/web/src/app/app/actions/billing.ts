"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";

export async function upgradeWorkspacePlan(workspaceId: string, plan: "FREE" | "PRO" | "TEAM") {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");

  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: profile.id, workspaceId } },
  });
  
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    throw new Error("Seuls le propriétaire ou l'administrateur peuvent changer de plan.");
  }

  // Simuler le délai de paiement Stripe
  await new Promise((resolve) => setTimeout(resolve, 600));

  const updated = await db.workspace.update({
    where: { id: workspaceId },
    data: {
      plan,
      billingCustomer: plan === "FREE" ? null : `cus_mock_${Math.random().toString(36).slice(-6)}`,
      billingSub: plan === "FREE" ? null : `sub_mock_${Math.random().toString(36).slice(-8)}`,
    },
  });

  revalidatePath("/app", "layout");
  return updated;
}
