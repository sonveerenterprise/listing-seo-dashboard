// PUBLIC CONTRACT — the core service API the dashboard calls. Each method maps to an HTTP endpoint of the core;
// the dashboard's HTTP client (src/core/http.ts) implements this interface. Types only — no logic.
import type { Meter, SectionView } from "./index.ts";

/** Success or a ready-to-send HTTP error. `needCredits` tells the UI to point to billing. */
export type CoreResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; needCredits?: boolean };

/** POST /v1/check — public quick score (rule checks, numbers only). */
export interface CheckResult {
  meters: Meter[];
  overall: number;
}

/** GET /v1/me — what the dashboard needs to know about the signed-in user and the service. */
export interface Me {
  email: string | null;
  billing: boolean;
  /** Credit balance; null when billing is off. */
  credits: number | null;
  /** Credits for one full report. */
  cost: { unlock: number };
  /** The core can fetch listings by ASIN. */
  asinEnabled: boolean;
}

/** GET /v1/reports — one row per report. */
export interface ReportSummary {
  id: string;
  asin: string | null;
  marketplace: string;
  /** Listing title from the input, or null if none was given. */
  title: string | null;
  status: string;
  error: string | null;
  totalScore: number | null;
  unlocked: boolean;
  /** Quick-score meters (rule checks). */
  meters: Meter[] | null;
  /** Average of the quick-score meters; null for older reports. Not the same scale as totalScore. */
  quickScore: number | null;
  /** Score areas of a full report, 0-100 each (null = not applicable). */
  areas: { name: string; percent: number | null }[] | null;
  /** ISO 8601 */
  createdAt: string;
}

/** GET /v1/reports/:id — a finished report, already gated (free preview = locked content removed by the core). */
export interface ReportView {
  id: string;
  asin: string | null;
  marketplace: string;
  /** ASIN, or the first 28 characters of the title. */
  label: string;
  /** ISO 8601 */
  createdAt: string;
  locked: boolean;
  /** "score" = only the meters exist (no AI has run yet); "full" = the sections, gated if locked. */
  kind: "score" | "full";
  /** The full report is being prepared. */
  preparing: boolean;
  meters: Meter[] | null;
  quickScore: number | null;
  sections: SectionView[];
}

/** GET /v1/reports/:id/download — full dashboard HTML (unlocked reports only). */
export interface ReportDownload {
  filename: string;
  html: string;
}

/** GET /v1/billing — balance and recent credit movements. */
export interface BillingView {
  credits: number;
  history: { id: string; delta: number; reason: string; /** ISO 8601 */ createdAt: string }[];
}

/** POST /v1/billing/orders — what Razorpay Checkout needs in the browser. `keyId` is Razorpay's public key id. */
export interface CheckoutOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  packName: string;
  quantity: number;
  credits: number;
}

/** POST /v1/billing/verify — the fields Razorpay Checkout hands to its success handler. */
export interface PaymentProof {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** GET /v1/health — the core can reach its database. */
export interface HealthResult {
  ok: boolean;
  db: boolean;
}

/**
 * Who is calling: the user's core-issued access token. The core derives the user from it and never accepts a user id
 * from the dashboard. (Inside the core the same methods receive the verified user id.)
 */
export type UserRef = string;

export interface CoreApi {
  health(): Promise<HealthResult>;
  check(body: unknown): Promise<CoreResult<CheckResult>>;
  analyze(user: UserRef, body: unknown): Promise<CoreResult<{ id: string }>>;
  me(user: UserRef): Promise<Me>;
  listReports(user: UserRef, opts?: { doneOnly?: boolean; take?: number }): Promise<ReportSummary[]>;
  getReport(user: UserRef, id: string): Promise<CoreResult<ReportView>>;
  download(user: UserRef, id: string): Promise<CoreResult<ReportDownload>>;
  unlock(user: UserRef, id: string): Promise<CoreResult<{ ok: true }>>;
  // billing
  billing(user: UserRef): Promise<CoreResult<BillingView>>;
  createOrder(user: UserRef, packId: unknown, quantity: unknown): Promise<CoreResult<CheckoutOrder>>;
  verifyPayment(user: UserRef, proof: unknown): Promise<CoreResult<{ ok: true }>>;
}

/** POST /v1/auth/exchange and /v1/auth/refresh — times are epoch milliseconds. */
export interface TokenPair {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  refreshExpiresAt: number;
}

/** Sign-in session calls (HTTP mode only). `rotated` = a parallel request already refreshed; keep the current token. */
export interface CoreAuthApi {
  /** `state` = the value of the browser's state cookie; the core redeems the code only with the state it was issued for. */
  exchange(code: string, state: string): Promise<TokenPair | null>;
  refresh(refreshToken: string): Promise<{ ok: true; pair: TokenPair } | { ok: false; reason: "invalid" | "rotated" | "unavailable" }>;
  logout(refreshToken: string): Promise<void>;
}
