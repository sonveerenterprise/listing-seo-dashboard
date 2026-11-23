// Request signing between the dashboard and the core service.
// HMAC-SHA256 over a canonical string that covers method, path + query, timestamp, nonce, a SHA-256 of the user's
// core-issued access token (empty when none) and a SHA-256 of the exact body bytes. The signature proves
// which SERVICE sent the request; the user is identified only by the token, which the core verifies separately. Supports several keys at once for rotation. Pure Node crypto — no app imports,
// so the dashboard, the core and the tests share it.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SIG_VERSION = "v2";
export const H = {
  keyId: "x-ls-key-id",
  timestamp: "x-ls-timestamp",
  nonce: "x-ls-nonce",
  bodySha: "x-ls-body-sha256",
  signature: "x-ls-signature",
} as const;

/** Default accepted clock difference between dashboard and core. */
export const DEFAULT_MAX_SKEW_MS = 60_000;
export const MIN_SKEW_MS = 1_000;
export const MAX_SKEW_MS = 300_000;

/** CORE_SIGNING_MAX_SKEW_MS must be an integer between 1,000 and 300,000 ms; anything else is a misconfiguration. */
export function parseMaxSkew(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return DEFAULT_MAX_SKEW_MS;
  if (!/^\d+$/.test(value.trim())) throw new Error("CORE_SIGNING_MAX_SKEW_MS must be a whole number of milliseconds");
  const n = Number(value.trim());
  if (n < MIN_SKEW_MS || n > MAX_SKEW_MS) throw new Error(`CORE_SIGNING_MAX_SKEW_MS must be between ${MIN_SKEW_MS} and ${MAX_SKEW_MS}`);
  return n;
}
export const MIN_SECRET_LENGTH = 32;

export type KeyRing = Map<string, string>;

/**
 * Keys from env. `CORE_SIGNING_KEYS="k2:secret2,k1:secret1"` (all accepted by the core; the dashboard signs with
 * `CORE_SIGNING_KEY_ID`, default = first). Legacy `CORE_SIGNING_SECRET` becomes key id `default`.
 * Rotation: add the new key to the core, switch the dashboard's key id, then remove the old key from the core.
 */
export function parseKeyRing(keys: string | undefined, legacySecret?: string): KeyRing {
  const ring: KeyRing = new Map();
  for (const part of (keys ?? "").split(",").map((p) => p.trim()).filter(Boolean)) {
    const i = part.indexOf(":");
    if (i <= 0) throw new Error("CORE_SIGNING_KEYS entries must be keyId:secret");
    const id = part.slice(0, i).trim();
    const secret = part.slice(i + 1).trim();
    if (!/^[A-Za-z0-9._-]{1,32}$/.test(id)) throw new Error("Signing key ids may use letters, digits, . _ - (max 32)");
    if (secret.length < MIN_SECRET_LENGTH) throw new Error(`Signing secret for ${id} is shorter than ${MIN_SECRET_LENGTH} characters`);
    if (ring.has(id)) throw new Error(`Duplicate signing key id ${id}`);
    ring.set(id, secret);
  }
  if (legacySecret) {
    if (legacySecret.length < MIN_SECRET_LENGTH) throw new Error(`CORE_SIGNING_SECRET is shorter than ${MIN_SECRET_LENGTH} characters`);
    if (!ring.has("default")) ring.set("default", legacySecret);
  }
  return ring;
}

export const sha256Hex = (body: string | Uint8Array) => createHash("sha256").update(body).digest("hex");

export function canonicalString(p: { method: string; pathAndQuery: string; timestamp: string; nonce: string; tokenSha: string; bodySha: string }) {
  return [SIG_VERSION, p.method.toUpperCase(), p.pathAndQuery, p.timestamp, p.nonce, p.tokenSha, p.bodySha].join("\n");
}

/** The user's access token travels as `Authorization: Bearer <token>`; null = none, false = malformed header. */
export function bearerToken(value: string | null): string | null | false {
  if (value === null || value === "") return null;
  const m = /^Bearer ([A-Za-z0-9._-]{20,2048})$/.exec(value);
  return m ? m[1] : false;
}
const tokenHash = (token: string | null) => (token ? sha256Hex(token) : "");

const hmac = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");

/** Headers for one request. `body` must be exactly what will be sent ("" for GET); its UTF-8 bytes are hashed. */
export function signRequest(o: { method: string; pathAndQuery: string; body: string | Uint8Array; token: string | null; keyId: string; secret: string; now?: number; nonce?: string }): Record<string, string> {
  const timestamp = String(o.now ?? Date.now());
  const nonce = o.nonce ?? randomBytes(16).toString("base64url");
  const bodySha = sha256Hex(o.body);
  const sig = hmac(o.secret, canonicalString({ method: o.method, pathAndQuery: o.pathAndQuery, timestamp, nonce, tokenSha: tokenHash(o.token), bodySha }));
  const h: Record<string, string> = { [H.keyId]: o.keyId, [H.timestamp]: timestamp, [H.nonce]: nonce, [H.bodySha]: bodySha, [H.signature]: `${SIG_VERSION}=${sig}` };
  if (o.token) h.authorization = `Bearer ${o.token}`;
  return h;
}

export type VerifyFailure = "missing_headers" | "bad_token_header" | "unknown_key" | "bad_timestamp" | "stale_timestamp" | "bad_nonce" | "body_mismatch" | "bad_signature" | "replayed";
export type VerifyResult = { ok: true; token: string | null; keyId: string; nonce: string; timestamp: number } | { ok: false; reason: VerifyFailure };

/** Records a nonce; returns false if it was already used (replay). Must be atomic across processes in production. */
export type NonceStore = (keyId: string, nonce: string, expiresAt: Date) => Promise<boolean>;

const safeEqualHex = (a: string, b: string) => {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * Verifies a signed request. Order: headers → key → timestamp window → body hash → signature (constant time) →
 * nonce (only after the signature is valid, so unsigned traffic can't fill the nonce store).
 */
export async function verifyRequest(o: {
  method: string;
  pathAndQuery: string;
  /** Pass the raw request bytes (as received), not decoded text. */
  body: string | Uint8Array;
  headers: { get(name: string): string | null };
  ring: KeyRing;
  nonces: NonceStore;
  now?: number;
  maxSkewMs?: number;
}): Promise<VerifyResult> {
  const g = (n: string) => o.headers.get(n);
  const keyId = g(H.keyId), ts = g(H.timestamp), nonce = g(H.nonce), bodySha = g(H.bodySha), sigHeader = g(H.signature);
  if (!keyId || !ts || !nonce || !bodySha || !sigHeader) return { ok: false, reason: "missing_headers" };
  const token = bearerToken(g("authorization"));
  if (token === false) return { ok: false, reason: "bad_token_header" };
  const secret = o.ring.get(keyId);
  if (!secret) return { ok: false, reason: "unknown_key" };
  if (!/^\d{10,16}$/.test(ts)) return { ok: false, reason: "bad_timestamp" };
  const now = o.now ?? Date.now();
  const skew = o.maxSkewMs ?? DEFAULT_MAX_SKEW_MS;
  const t = Number(ts);
  if (Math.abs(now - t) > skew) return { ok: false, reason: "stale_timestamp" };
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(nonce)) return { ok: false, reason: "bad_nonce" };
  const actualSha = sha256Hex(o.body);
  if (!safeEqualHex(actualSha, bodySha)) return { ok: false, reason: "body_mismatch" };
  if (!sigHeader.startsWith(`${SIG_VERSION}=`)) return { ok: false, reason: "bad_signature" };
  const expected = hmac(secret, canonicalString({ method: o.method, pathAndQuery: o.pathAndQuery, timestamp: ts, nonce, tokenSha: tokenHash(token), bodySha: actualSha }));
  if (!safeEqualHex(expected, sigHeader.slice(SIG_VERSION.length + 1))) return { ok: false, reason: "bad_signature" };
  // Keep the nonce at least as long as the request could still pass the timestamp check.
  if (!(await o.nonces(keyId, nonce, new Date(t + skew + 1_000)))) return { ok: false, reason: "replayed" };
  return { ok: true, token, keyId, nonce, timestamp: t };
}

/** In-memory nonce store — for unit tests only. */
export function memoryNonceStore(): NonceStore {
  const seen = new Map<string, number>();
  return async (keyId, nonce, expiresAt) => {
    const now = Date.now();
    for (const [k, exp] of seen) if (exp < now) seen.delete(k);
    const k = `${keyId}:${nonce}`;
    if (seen.has(k)) return false;
    seen.set(k, expiresAt.getTime());
    return true;
  };
}
