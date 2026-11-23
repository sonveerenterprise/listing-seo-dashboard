// Dashboard route: save or remove the user's own Anthropic key. The core checks, encrypts and stores it;
// the dashboard only passes it through once and never keeps or logs it.
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { core, errorBody } from "@/core";

export async function POST(req: Request) {
  const user = await currentUserId();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const { key } = ((await req.json().catch(() => ({}))) ?? {}) as { key?: unknown };
  const r = await core.setKey(user, key);
  return r.ok ? NextResponse.json({ ok: true, masked: r.data.masked }) : NextResponse.json(errorBody(r), { status: r.status });
}

export async function DELETE() {
  const user = await currentUserId();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const r = await core.deleteKey(user);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json(errorBody(r), { status: r.status });
}
