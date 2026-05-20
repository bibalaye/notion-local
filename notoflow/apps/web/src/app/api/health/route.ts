import { NextResponse } from "next/server";
import { db } from "@notoflow/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "up" });
  } catch {
    return NextResponse.json({ ok: true, database: "down" });
  }
}
