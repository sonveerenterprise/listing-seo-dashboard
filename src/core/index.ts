// The core API used by pages and routes: always the signed HTTP client for the core service (CORE_URL).
// The dashboard contains no analysis logic and has no fallback when the core isn't configured.
// Built lazily so a misconfigured dashboard fails on first use with a clear error, not at import time.
import type { CoreApi, CoreAuthApi } from "@/contract/api";
import { httpAuthFromEnv, httpCoreFromEnv } from "./http";

let impl: CoreApi | null = null;
const pick = (): CoreApi => {
  if (!process.env.CORE_URL) throw new Error("CORE_URL is not set: the dashboard needs the core service");
  return (impl ??= httpCoreFromEnv());
};

// async wrappers: a configuration error in pick() becomes a rejected promise, so callers' .catch() handlers see it.
export const core: CoreApi = {
  health: async () => pick().health(),
  check: async (b) => pick().check(b),
  analyze: async (u, b) => pick().analyze(u, b),
  me: async (u) => pick().me(u),
  listReports: async (u, o) => pick().listReports(u, o),
  getReport: async (u, id) => pick().getReport(u, id),
  download: async (u, id) => pick().download(u, id),
  unlock: async (u, id) => pick().unlock(u, id),
  billing: async (u) => pick().billing(u),
  createOrder: async (u, p) => pick().createOrder(u, p),
  verifyPayment: async (u, p) => pick().verifyPayment(u, p),
  getKey: async (u) => pick().getKey(u),
  setKey: async (u, k) => pick().setKey(u, k),
  deleteKey: async (u) => pick().deleteKey(u),
};

/** Sign-in session calls to the core. */
let authImpl: CoreAuthApi | null = null;
const pickAuth = (): CoreAuthApi => (authImpl ??= httpAuthFromEnv());
export const coreAuth: CoreAuthApi = {
  exchange: async (c, s) => pickAuth().exchange(c, s),
  refresh: async (t) => pickAuth().refresh(t),
  logout: async (t) => pickAuth().logout(t),
};

/** Turns a CoreResult error into the JSON body the routes always returned. */
export const errorBody = (r: { error: string; needCredits?: boolean }) => (r.needCredits ? { error: r.error, needCredits: true } : { error: r.error });
