// Dashboard client: request signing, HTTPS enforcement, refusal of service secrets, cookies and the CSRF guard.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { signRequest, verifyRequest, parseKeyRing, memoryNonceStore, parseMaxSkew, H, DEFAULT_MAX_SKEW_MS } from "../src/core/signing.ts";
import { assertSecureCoreUrl, assertDashboardHoldsNoCoreSecrets, CORE_ONLY_ENV } from "../src/core/http.ts";
import { cookieNames, setTokenCookies, readCookie, secureCookies, apiWriteAllowed } from "../src/lib/auth-cookies.ts";

const S = "secret-".padEnd(40, "z");
const ring = parseKeyRing(`k1:${S}`);
const req = { method: "POST", pathAndQuery: "/api/v1/check?x=1", body: '{"a":1}' };
const TOKEN = "lsat1.payload_0123456789abcdef.sig";

test("signed requests verify, and the token, body, path and method are all covered", async () => {
  const h = signRequest({ ...req, token: TOKEN, keyId: "k1", secret: S });
  const v = (hh: Record<string, string>, o: Partial<typeof req> = {}) => verifyRequest({ ...req, ...o, headers: new Headers(hh), ring, nonces: memoryNonceStore() });
  assert.equal((await v(h)).ok, true);
  assert.equal((await v({ ...h, authorization: "Bearer lsat1.other_0123456789abcdef.sig" })).ok, false);
  assert.equal((await v(h, { body: '{"a":2}' })).ok, false);
  assert.equal((await v(h, { pathAndQuery: "/api/v1/check?x=2" })).ok, false);
  assert.equal((await v(h, { method: "GET" })).ok, false);
  assert.equal((await v({ ...h, [H.signature]: "v2=" + "0".repeat(64) })).ok, false);
});

test("replays and stale timestamps are rejected", async () => {
  const nonces = memoryNonceStore();
  const h = signRequest({ ...req, token: null, keyId: "k1", secret: S });
  const v = (hh: Record<string, string>, now?: number) => verifyRequest({ ...req, headers: new Headers(hh), ring, nonces, now });
  assert.equal((await v(h)).ok, true);
  assert.deepEqual(await v(h), { ok: false, reason: "replayed" });
  const old = signRequest({ ...req, token: null, keyId: "k1", secret: S, now: Date.now() - DEFAULT_MAX_SKEW_MS - 1 });
  assert.deepEqual(await v(old), { ok: false, reason: "stale_timestamp" });
  assert.throws(() => parseMaxSkew("abc"));
});

test("core URL must be https (plain http only for loopback), without credentials", () => {
  for (const ok of ["https://core.example.com", "http://127.0.0.1:3101", "http://localhost:3101"]) assert.doesNotThrow(() => assertSecureCoreUrl(ok), ok);
  for (const bad of ["http://core.example.com", "http://10.0.0.5", "http://127.0.0.1.nip.io", "ftp://core", "https://u:p@core.example.com", ""]) assert.throws(() => assertSecureCoreUrl(bad), bad);
});

test("the dashboard refuses database and service secrets", () => {
  assert.doesNotThrow(() => assertDashboardHoldsNoCoreSecrets({ CORE_URL: "https://c", CORE_SIGNING_KEYS: "k:x" }));
  for (const k of CORE_ONLY_ENV) assert.throws(() => assertDashboardHoldsNoCoreSecrets({ [k]: "x" }), new RegExp(k));
});

test("cookies: __Host- names with Secure over https; planted unprefixed cookies are ignored", () => {
  const sets: { name: string; opts: Record<string, unknown> }[] = [];
  setTokenCookies({ cookies: { set: (name: string, _v: string, opts: Record<string, unknown>) => void sets.push({ name, opts }) } } as never, { accessToken: "a".repeat(30), accessExpiresAt: Date.now() + 600_000, refreshToken: "r".repeat(30), refreshExpiresAt: Date.now() + 86_400_000 }, true);
  for (const c of sets) {
    assert.match(c.name, /^__Host-/);
    assert.deepEqual([c.opts.secure, c.opts.path, c.opts.httpOnly, c.opts.sameSite], [true, "/", true, "lax"]);
  }
  assert.equal(readCookie("ls_at=planted", cookieNames(true).access), undefined);
  const old = process.env.APP_URL;
  process.env.APP_URL = "http://dash.example.com";
  assert.equal(secureCookies(), true, "non-loopback http APP_URL fails safe to Secure");
  if (old === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = old;
});

test("API writes need the dashboard's own origin", () => {
  const APP = "https://dash.example.com";
  const h = (o: Record<string, string>) => new Headers(o);
  assert.equal(apiWriteAllowed("POST", "/api/analyze", h({ origin: APP }), APP), true);
  assert.equal(apiWriteAllowed("POST", "/api/analyze", h({ origin: "https://evil.example.com" }), APP), false);
  assert.equal(apiWriteAllowed("DELETE", "/api/byok", h({ "sec-fetch-site": "same-site" }), APP), false);
  assert.equal(apiWriteAllowed("POST", "/api/byok", h({ "sec-fetch-site": "same-origin" }), APP), true);
  assert.equal(apiWriteAllowed("GET", "/api/reports/x/download", h({ origin: "https://evil.example.com" }), APP), true);
});

test("ASIN must be exactly 10 letters or digits (or absent)", async () => {
  const { listingSchema } = await import("../src/contract/input.ts");
  const ok = (asin: unknown) => listingSchema.safeParse({ marketplace: "amazon.in", asin }).success;
  assert.equal(ok("B0TEST0001"), true);
  assert.equal(ok(""), true);
  for (const bad of ['A"B;C=D', "../XY", "<s>", "B0TEST00012", "B0TEST 001"]) assert.equal(ok(bad), false, bad);
});

test("security headers on every path: no framing, no sniffing, strict referrer, HSTS, no X-Powered-By", async () => {
  const cfg = (await import(pathToFileURL(join(import.meta.dirname, "..", "next.config.mjs")).href)).default; // untyped .mjs
  const rules = await cfg.headers();
  const [rule] = rules;
  assert.equal(rule.source, "/:path*");
  // stricter per-route values come after the global rule (last match wins in Next.js)
  const later = (src: string, key: string) => rules.slice(1).filter((r: { source: string }) => r.source === src).flatMap((r: { headers: { key: string; value: string }[] }) => r.headers).find((x: { key: string }) => x.key === key)?.value;
  assert.equal(later("/auth/:path*", "Referrer-Policy"), "no-referrer");
  assert.match(later("/api/reports/:id/download", "Content-Security-Policy") ?? "", /sandbox/);
  const h = Object.fromEntries(rule.headers.map((x: { key: string; value: string }) => [x.key, x.value]));
  assert.equal(h["X-Frame-Options"], "DENY");
  assert.equal(h["Content-Security-Policy"], "frame-ancestors 'none'");
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.ok(h["Strict-Transport-Security"]);
  assert.equal(cfg.poweredByHeader, false);
});
