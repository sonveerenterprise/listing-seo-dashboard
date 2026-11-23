// Sign-in callback: the core sends the browser back here with a one-time code. Checks the state cookie, exchanges
// the code together with that state with the core (signed, server to server; the core redeems the code only for the
// state it was issued to) and stores the tokens in httpOnly cookies.
import { NextResponse } from "next/server";
import { coreAuth } from "@/core";
import { appBase, clearStateCookie, names, readCookie, sameState, setTokenCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const here = new URL(req.url); // query only — redirects use APP_URL
  const base = appBase();
  const fail = () => {
    const r = NextResponse.redirect(new URL("/login?error=signin", base), 303);
    clearStateCookie(r);
    return r;
  };
  const code = here.searchParams.get("code");
  const state = here.searchParams.get("state");
  const cookieState = readCookie(req.headers.get("cookie"), names().state);
  if (!code || !cookieState || !sameState(state, cookieState)) return fail();
  const pair = await coreAuth.exchange(code, cookieState).catch(() => null);
  if (!pair) return fail();
  const res = NextResponse.redirect(new URL("/app", base), 303);
  setTokenCookies(res, pair);
  clearStateCookie(res);
  res.headers.set("cache-control", "no-store");
  res.headers.set("referrer-policy", "no-referrer");
  return res;
}
