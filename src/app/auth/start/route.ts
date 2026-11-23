// Begin sign-in. Sets a short-lived state cookie (login CSRF protection; the core also binds
// the one-time code to this state) and sends the browser to the core, which handles Google.
import { NextResponse } from "next/server";
import { assertSecureCoreUrl } from "@/core/http";
import { appBase, newState, setStateCookie } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = appBase();
  let corePublic: URL;
  try {
    corePublic = assertSecureCoreUrl(process.env.CORE_PUBLIC_URL);
  } catch (err) {
    console.error("dashboard: sign-in misconfigured:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Sign-in is not configured" }, { status: 500 });
  }
  const state = newState();
  const to = new URL("/api/v1/auth/google/start", corePublic);
  to.searchParams.set("state", state);
  const res = NextResponse.redirect(to, 303);
  setStateCookie(res, state);
  res.headers.set("cache-control", "no-store");
  return res;
}
