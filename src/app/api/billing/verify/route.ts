// Dashboard route: called by the browser after Razorpay Checkout succeeds. The core verifies the payment
// signature and adds credits once. The webhook on the core is the backup if the tab closes.
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { core, errorBody } from "@/core";

export async function POST(req: Request) {
  const user = await currentUserId();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const r = await core.verifyPayment(user, await req.json().catch(() => null));
  return r.ok ? NextResponse.json(r.data) : NextResponse.json(errorBody(r), { status: r.status });
}
