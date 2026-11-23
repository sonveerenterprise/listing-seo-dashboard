// PUBLIC (dashboard) — display settings only, from non-secret environment variables. No secrets, no server logic.
// The core enforces everything (credits, plans, prices); these values only decide what the dashboard shows.
const env = (k: string, d = "") => process.env[k] ?? d;

export const publicConfig = {
  appName: env("APP_NAME", "Listing SEO for Amazon"),
  billingEnabled: env("BILLING_ENABLED", "false") === "true",
  byokEnabled: env("BYOK_ENABLED", "true") === "true",
  freePerMonth: Number(env("FREE_ANALYSES_PER_MONTH", "3")),
  /** Shown on the settings page (which model own-key analyses use). */
  model: env("ANTHROPIC_MODEL", "claude-sonnet-5-5"),
  cost: {
    analysis: Number(env("CREDITS_PER_ANALYSIS", "1")),
    asinFetch: Number(env("CREDITS_PER_ASIN_FETCH", "0")),
    unlock: Number(env("CREDITS_PER_UNLOCK", env("CREDITS_PER_ANALYSIS", "1"))),
  },
};

/** 1 credit = 1 full ASIN report (ASIN lookup included). Prices include GST. The core validates pack ids and prices. */
export const CREDIT_PACKS = [
  { id: "single", name: "1 ASIN", credits: 1, pricePaise: 119900, note: "One full report" },
  { id: "pack5", name: "5 ASIN pack", credits: 5, pricePaise: 500000, note: "₹1,000 per ASIN · save ₹995" },
] as const;
export type PackId = (typeof CREDIT_PACKS)[number]["id"];

export const rupees = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");
