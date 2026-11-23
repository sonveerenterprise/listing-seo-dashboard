import { NextResponse } from "next/server";
import { core } from "@/core";

// Dashboard health: whether the core answers (over signed HTTP) and can reach its database. The dashboard has no
// database of its own. Returns booleans only — no versions, hosts or errors.
export async function GET() {
  const c = await core.health().catch(() => ({ ok: false, db: false }));
  return NextResponse.json({ ok: c.ok, core: c.ok, coreDb: c.db }, { status: c.ok ? 200 : 503 });
}
