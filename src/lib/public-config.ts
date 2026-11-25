// PUBLIC (dashboard) — display settings only, from non-secret environment variables. No secrets, no server logic.
// The core enforces everything (credits, plans, prices); these values only decide what the dashboard shows.
const env = (k: string, d = "") => process.env[k] ?? d;

export const publicConfig = {
  appName: env("APP_NAME", "ListRankly"),
  billingEnabled: env("BILLING_ENABLED", "false") === "true",
  cost: {
    unlock: Number(env("CREDITS_PER_UNLOCK", env("CREDITS_PER_ANALYSIS", "1"))),
  },
};

/** 1 credit = 1 full ASIN report (ASIN lookup included). Prices include GST. The core validates pack ids and prices. */
export const CREDIT_PACKS = [
  { id: "single", name: "1 ASIN", credits: 1, pricePaise: 119900, note: "One full report" },
  { id: "pack5", name: "5 ASIN pack", credits: 5, pricePaise: 500000, note: "₹1,000 per ASIN · save ₹995" },
] as const;
/** Most packs in one order. The core enforces it and computes the price. */
export const MAX_QUANTITY = 20;
export type PackId = (typeof CREDIT_PACKS)[number]["id"];

export const rupees = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");
