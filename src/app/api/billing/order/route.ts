// Dashboard route (browser → dashboard): the core creates the order and records the payment.
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { core, errorBody } from "@/core";

export async function POST(req: Request) {
  const user = await currentUserId();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const { packId } = ((await req.json().catch(() => ({}))) ?? {}) as { packId?: unknown };
  const r = await core.createOrder(user, packId);
  return r.ok ? NextResponse.json(r.data) : NextResponse.json(errorBody(r), { status: r.status });
}
