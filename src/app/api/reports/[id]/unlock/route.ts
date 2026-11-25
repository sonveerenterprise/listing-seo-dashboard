import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { core, errorBody } from "@/core";

export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const { id } = await params;
  const r = await core.unlock(userId, id);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json(errorBody(r), { status: r.status });
}
