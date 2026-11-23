// Cookies that hold the core-issued tokens in the browser. httpOnly, SameSite=Lax,
// Secure except on loopback (local development / tests). The dashboard never verifies or creates tokens; it only
// reads the access token's expiry to decide when to refresh. No secrets here.
//
// Whenever cookies are Secure (every non-loopback deployment) they use the `__Host-` prefix, which browsers
// accept only with Secure, Path=/ and no Domain — so a sibling subdomain can't plant or overwrite them. Only the name
// for the current mode is ever read; a planted unprefixed cookie is ignored.
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import type { TokenPair } from "@/contract/api";

/** Refresh this long before the access token expires. */
export const REFRESH_EARLY_MS = 120_000;
const STATE_MAX_AGE_S = 600;

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
export const secureFor = (url: URL) => !LOOPBACK.has(url.hostname);

/**
 * The dashboard's public origin, from APP_URL — used for redirects and the same-origin check instead of the request
 * URL or Host header (which reflect how the server is bound or proxied, and can be influenced by the client).
 * Must be https, except loopback for local development and tests.
 */
export function appBase(): URL {
  const u = new URL(process.env.APP_URL || "http://localhost:3000");
  if (u.protocol !== "https:" && !(u.protocol === "http:" && LOOPBACK.has(u.hostname))) throw new Error("APP_URL must use https (plain http only for localhost)");
  return new URL(u.origin);
}

/** Secure cookies unless APP_URL is loopback; fails safe (Secure) if APP_URL is unusable. */
export function secureCookies(): boolean {
  try {
    return secureFor(appBase());
  } catch {
    return true;
  }
}

export type CookieNames = { access: string; refresh: string; state: string };
export const cookieNames = (secure: boolean): CookieNames =>
  secure ? { access: "__Host-ls_at", refresh: "__Host-ls_rt", state: "__Host-ls_state" } : { access: "ls_at", refresh: "ls_rt", state: "ls_state" };
export const names = () => cookieNames(secureCookies());

const attrs = (secure: boolean) => ({ httpOnly: true, sameSite: "lax" as const, secure, path: "/" });

type CookieSink = Pick<NextResponse, "cookies">;

export function setTokenCookies(res: CookieSink, pair: TokenPair, secure = secureCookies()) {
  const n = cookieNames(secure);
  const now = Date.now();
  res.cookies.set(n.access, pair.accessToken, { ...attrs(secure), maxAge: Math.max(1, Math.floor((pair.accessExpiresAt - now) / 1000)) });
  res.cookies.set(n.refresh, pair.refreshToken, { ...attrs(secure), maxAge: Math.max(1, Math.floor((pair.refreshExpiresAt - now) / 1000)) });
}

export function clearTokenCookies(res: CookieSink, secure = secureCookies()) {
  const n = cookieNames(secure);
  res.cookies.set(n.access, "", { ...attrs(secure), maxAge: 0 });
  res.cookies.set(n.refresh, "", { ...attrs(secure), maxAge: 0 });
}

export function setStateCookie(res: CookieSink, state: string, secure = secureCookies()) {
  res.cookies.set(cookieNames(secure).state, state, { ...attrs(secure), maxAge: STATE_MAX_AGE_S });
}
export function clearStateCookie(res: CookieSink, secure = secureCookies()) {
  res.cookies.set(cookieNames(secure).state, "", { ...attrs(secure), maxAge: 0 });
}

/** One cookie value from a raw Cookie header (exact name match). */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  return (header ?? "").split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) || undefined;
}

/**
 * CSRF guard for dashboard API writes. SameSite=Lax stops cross-SITE requests, but a sibling
 * subdomain is the same site and would still send the cookies. A non-GET /api/* request is allowed only when its
 * Origin is the dashboard's own (APP_URL) — or, with no Origin, when the browser says Sec-Fetch-Site: same-origin.
 * A server-to-server webhook path (signed by its sender) is exempt.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT = new Set(["/api/billing/webhook"]);
export function apiWriteAllowed(method: string, path: string, headers: { get(name: string): string | null }, appOrigin: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase()) || !path.startsWith("/api/") || CSRF_EXEMPT.has(path)) return true;
  const origin = headers.get("origin");
  if (origin !== null) return origin === appOrigin;
  return headers.get("sec-fetch-site") === "same-origin";
}

/** Expiry (epoch ms) from the token payload, UNVERIFIED — refresh timing only, never access control. */
export function accessExpiry(token: string | undefined): number | null {
  try {
    const p = (token ?? "").split(".");
    if (p.length !== 3) return null;
    const exp = JSON.parse(Buffer.from(p[1], "base64url").toString("utf8")).exp;
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

export const newState = () => randomBytes(24).toString("base64url");
export function sameState(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
