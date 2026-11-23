import { NextResponse } from "next/server";
import { core, errorBody } from "@/core";

// Free, no login, no AI cost.
export async function POST(req: Request) {
  const r = await core.check(await req.json().catch(() => null));
  return r.ok ? NextResponse.json(r.data) : NextResponse.json(errorBody(r), { status: r.status });
}
