// Sign out — revokes the session at the core and clears the token cookies.
// POST only, same-origin only (a cross-site form can't sign the user out).
import { NextResponse } from "next/server";
import { coreAuth } from "@/core";
import { appBase, clearTokenCookies, names, readCookie } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const base = appBase();
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if ((origin && origin !== base.origin) || (!origin && site !== "same-origin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rt = readCookie(req.headers.get("cookie"), names().refresh);
  if (rt && process.env.CORE_URL) await coreAuth.logout(rt).catch(() => {});
  const res = NextResponse.redirect(new URL("/", base), 303);
  clearTokenCookies(res);
  return res;
}
