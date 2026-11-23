import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { core, errorBody } from "@/core";

export const maxDuration = 300;

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const r = await core.analyze(userId, await req.json().catch(() => null));
  return r.ok ? NextResponse.json(r.data) : NextResponse.json(errorBody(r), { status: r.status });
}
