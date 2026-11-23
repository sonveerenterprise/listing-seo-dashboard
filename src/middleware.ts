// Dashboard middleware: refuses API writes (non-GET /api/*) from any origin other than APP_URL (CSRF guard), and
// refreshes the core-issued access token shortly before it expires, so pages and routes always see a usable token.
// Runs on the Node.js runtime so the environment is read at request time from the server.
import { NextResponse, type NextRequest } from "next/server";
import { httpAuthFromEnv } from "@/core/http";
import { REFRESH_EARLY_MS, accessExpiry, apiWriteAllowed, appBase, clearTokenCookies, cookieNames, secureCookies, setTokenCookies } from "@/lib/auth-cookies";
import type { CoreAuthApi } from "@/contract/api";

export const config = { runtime: "nodejs", matcher: "/:path*" };

let auth: CoreAuthApi | null = null;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // API writes only from the dashboard's own origin.
  let appOrigin = "";
  try {
    appOrigin = appBase().origin;
  } catch {} // unusable APP_URL → no origin matches → writes refused (fail closed)
  if (!apiWriteAllowed(req.method, path, req.headers, appOrigin)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.CORE_URL || path.startsWith("/_next/") || path.startsWith("/auth/") || path === "/favicon.ico") return NextResponse.next();

  const secure = secureCookies();
  const n = cookieNames(secure); // only the name for this mode is read (__Host- when Secure)
  const at = req.cookies.get(n.access)?.value;
  const rt = req.cookies.get(n.refresh)?.value;
  if (!rt || (at && (accessExpiry(at) ?? 0) - Date.now() > REFRESH_EARLY_MS)) return NextResponse.next();

  let r: Awaited<ReturnType<CoreAuthApi["refresh"]>>;
  try {
    r = await (auth ??= httpAuthFromEnv()).refresh(rt);
  } catch (err) {
    console.error("dashboard: token refresh failed:", err instanceof Error ? err.message : err);
    return NextResponse.next();
  }
  if (r.ok) {
    // Pass the new tokens to this request (server components read cookies) and to the browser.
    req.cookies.set(n.access, r.pair.accessToken);
    req.cookies.set(n.refresh, r.pair.refreshToken);
    const res = NextResponse.next({ request: { headers: req.headers } });
    setTokenCookies(res, r.pair, secure);
    return res;
  }
  if (r.reason === "invalid") {
    req.cookies.delete(n.access);
    req.cookies.delete(n.refresh);
    const res = NextResponse.next({ request: { headers: req.headers } });
    clearTokenCookies(res, secure);
    return res;
  }
  return NextResponse.next(); // rotated by a parallel request, or core unavailable: keep what we have
}
