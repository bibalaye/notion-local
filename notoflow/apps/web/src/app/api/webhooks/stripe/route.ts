import { db, Plan } from "@notoflow/database";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

function mapPlan(raw: string | undefined): Plan {
  const p = (raw ?? "PRO").toUpperCase();
  if (p === "FREE") return Plan.FREE;
  if (p === "TEAM") return Plan.TEAM;
  if (p === "ENTERPRISE") return Plan.ENTERPRISE;
  return Plan.PRO;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET manquant" }, { status: 500 });
  }

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const plan = mapPlan(sub.items.data[0]?.price.metadata.plan);
      await db.workspace.updateMany({
        where: { billingSub: sub.id },
        data: { plan },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.workspace.updateMany({
        where: { billingSub: sub.id },
        data: { plan: Plan.FREE },
      });
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription") {
        await db.workspace.updateMany({
          where: { billingCustomer: String(session.customer ?? "") },
          data: { billingSub: String(session.subscription ?? "") },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
