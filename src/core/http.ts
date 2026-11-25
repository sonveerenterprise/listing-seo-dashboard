// CoreApi over HTTP to the core service (CORE_URL).
// Every request is signed (signing.ts): method, path + query, timestamp, nonce, access-token hash and body hash.
// User-scoped calls carry the user's core-issued access token; the dashboard never sends a user id.
// Holds no proprietary logic: it only moves JSON defined by the public contract.
import type { CoreApi, CoreAuthApi, CoreResult, Me, ReportSummary, HealthResult, CheckResult, ReportView, ReportDownload, TokenPair, BillingView, CheckoutOrder } from "@/contract/api";
import { Unauthorized, CoreUnavailable } from "./errors.ts";
import { parseKeyRing, signRequest } from "./signing.ts";

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/**
 * The core must be reached over HTTPS. Plain http is accepted only for loopback (same machine — local development
 * and integration tests), never for a network address, in any mode. No credentials in the URL.
 */
export function assertSecureCoreUrl(raw: string | undefined): URL {
  let u: URL;
  try {
    u = new URL(raw ?? "");
  } catch {
    throw new Error("CORE_URL is not a valid URL");
  }
  if (u.username || u.password) throw new Error("CORE_URL must not contain credentials");
  if (u.protocol === "https:") return u;
  if (u.protocol === "http:" && LOOPBACK.has(u.hostname)) return u;
  throw new Error("CORE_URL must use https (plain http is only allowed for localhost)");
}

type Opts = { baseUrl: string; keyId: string; secret: string; fetchImpl?: typeof fetch };

function caller(o: Opts) {
  const f = o.fetchImpl ?? fetch;
  return async function call(method: "GET" | "POST" | "DELETE", path: string, token: string | null, payload?: unknown, timeoutMs = 30_000) {
    const url = new URL(path, o.baseUrl);
    const body = method === "GET" ? "" : JSON.stringify(payload ?? null);
    const headers: Record<string, string> = {
      ...signRequest({ method, pathAndQuery: url.pathname + url.search, body, token: token || null, keyId: o.keyId, secret: o.secret }),
      accept: "application/json",
    };
    if (method !== "GET") headers["content-type"] = "application/json";
    let res: Response;
    try {
      res = await f(url, { method, headers, body: method === "GET" ? undefined : body, signal: AbortSignal.timeout(timeoutMs), cache: "no-store", redirect: "error" }); // never follow a redirect (could downgrade to http)
    } catch {
      return { status: 503, json: { error: "Core service unavailable" } as Record<string, unknown> };
    }
    const json = (await res.json().catch(() => ({ error: "Bad response from core" }))) as Record<string, unknown>;
    return { status: res.status, json };
  };
}

/** Sign-in session calls (exchange / refresh / logout). Signed, without a user token. */
export function createHttpAuth(o: Opts): CoreAuthApi {
  const call = caller(o);
  const isPair = (j: Record<string, unknown>) => typeof j.accessToken === "string" && typeof j.refreshToken === "string" && Number.isFinite(j.accessExpiresAt) && Number.isFinite(j.refreshExpiresAt);
  return {
    async exchange(code, state) {
      const r = await call("POST", "/api/v1/auth/exchange", null, { code, state });
      return r.status === 200 && isPair(r.json) ? (r.json as unknown as TokenPair) : null;
    },
    async refresh(refreshToken) {
      const r = await call("POST", "/api/v1/auth/refresh", null, { refreshToken });
      if (r.status === 200 && isPair(r.json)) return { ok: true, pair: r.json as unknown as TokenPair };
      if (r.status === 409) return { ok: false, reason: "rotated" };
      if (r.status === 401 || r.status === 400) return { ok: false, reason: "invalid" };
      return { ok: false, reason: "unavailable" };
    },
    async logout(refreshToken) {
      await call("POST", "/api/v1/auth/logout", null, { refreshToken });
    },
  };
}

export function createHttpCore(o: Opts): CoreApi {
  const call = caller(o);

  /** For methods that return CoreResult: any non-2xx becomes the same error shape the routes send. */
  const asResult = <T,>(r: { status: number; json: Record<string, unknown> }): CoreResult<T> =>
    r.status >= 200 && r.status < 300
      ? { ok: true, data: r.json as T }
      : { ok: false, status: r.status, error: String(r.json.error ?? "Core error"), ...(r.json.needCredits ? { needCredits: true } : {}) };

  /** For methods that return plain data: 401 → Unauthorized; other failures throw. */
  const asData = <T,>(r: { status: number; json: Record<string, unknown> }): T => {
    if (r.status === 401) throw new Unauthorized();
    if (r.status < 200 || r.status >= 300) throw new CoreUnavailable(r.status, String(r.json.error ?? "Core error"));
    return r.json as T;
  };

  return {
    async health() {
      const r = await call("GET", "/api/v1/health", null);
      return r.status === 200 ? (r.json as unknown as HealthResult) : { ok: false, db: false };
    },
    async check(body) {
      return asResult<CheckResult>(await call("POST", "/api/v1/check", null, body));
    },
    async analyze(userId, body) {
      return asResult<{ id: string }>(await call("POST", "/api/v1/analyses", userId, body, 310_000));
    },
    async me(userId) {
      return asData<Me>(await call("GET", "/api/v1/me", userId));
    },
    async listReports(userId, opts = {}) {
      const q = new URLSearchParams();
      if (opts.doneOnly) q.set("doneOnly", "1");
      q.set("take", String(opts.take ?? 50));
      return asData<ReportSummary[]>(await call("GET", `/api/v1/reports?${q}`, userId));
    },
    async getReport(userId, id) {
      return asResult<ReportView>(await call("GET", `/api/v1/reports/${encodeURIComponent(id)}`, userId));
    },
    async download(userId, id) {
      return asResult<ReportDownload>(await call("GET", `/api/v1/reports/${encodeURIComponent(id)}/download`, userId));
    },
    async unlock(userId, id) {
      return asResult<{ ok: true }>(await call("POST", `/api/v1/reports/${encodeURIComponent(id)}/unlock`, userId, undefined, 310_000)); // the full report runs now
    },
    async billing(user) {
      return asResult<BillingView>(await call("GET", "/api/v1/billing", user));
    },
    async createOrder(user, packId, quantity) {
      return asResult<CheckoutOrder>(await call("POST", "/api/v1/billing/orders", user, { packId, quantity }));
    },
    async verifyPayment(user, proof) {
      return asResult<{ ok: true }>(await call("POST", "/api/v1/billing/verify", user, proof));
    },
  };
}

/**
 * The dashboard holds no database and no core secret. If any is present it refuses to
 * talk to the core at all (fails closed), so a misconfigured dashboard can't quietly become a second, weaker core.
 */
export const CORE_ONLY_ENV = [
  "DATABASE_URL", "AUTH_SECRET", "BYOK_ENCRYPTION_KEY", "CORE_TOKEN_KEYS", "AUTH_GOOGLE_SECRET",
  "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "ANTHROPIC_API_KEY", "DATAFORSEO_PASSWORD",
] as const;
export function assertDashboardHoldsNoCoreSecrets(env: Record<string, string | undefined> = process.env): void {
  const found = CORE_ONLY_ENV.filter((k) => env[k]);
  if (found.length) throw new Error(`Split dashboard must not hold core-only settings: ${found.join(", ")} (remove them; only the core needs them)`);
}

export function optsFromEnv(): Opts {
  if (process.env.CORE_MODE === "server") throw new Error("CORE_URL and CORE_MODE=server can't both be set: a process is either the dashboard or the core");
  assertDashboardHoldsNoCoreSecrets();
  const baseUrl = assertSecureCoreUrl(process.env.CORE_URL).toString();
  const ring = parseKeyRing(process.env.CORE_SIGNING_KEYS, process.env.CORE_SIGNING_SECRET);
  const keyId = process.env.CORE_SIGNING_KEY_ID || [...ring.keys()][0];
  const secret = keyId ? ring.get(keyId) : undefined;
  if (!secret) throw new Error("CORE_URL is set but no signing key is configured (CORE_SIGNING_KEYS / CORE_SIGNING_KEY_ID)");
  return { baseUrl, keyId, secret };
}

/** Builds the client from env: CORE_URL, CORE_SIGNING_KEYS (or CORE_SIGNING_SECRET), CORE_SIGNING_KEY_ID. */
export function httpCoreFromEnv(): CoreApi {
  return createHttpCore(optsFromEnv());
}
export function httpAuthFromEnv(): CoreAuthApi {
  return createHttpAuth(optsFromEnv());
}
