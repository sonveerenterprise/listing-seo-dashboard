// PUBLIC CONTRACT — the only types and constants the dashboard (UI) may import.
// Safe to publish: data shapes and marketplace list only. No rules, prompts, weights or provider details.
// Rule: this folder must never import from engine/, lib/ or any generated file (enforced by tests/contract.test.ts).

export type Marketplace = "amazon.in" | "amazon.com" | "amazon.co.uk" | "amazon.ae" | "amazon.de" | "other";

export interface MarketplaceInfo {
  id: Marketplace;
  label: string;
  /** Title character limit shown in the form counter. */
  titleLimit: number;
  /** True when the core can fetch a listing by ASIN for this marketplace. */
  asinLookup: boolean;
}

export const MARKETPLACES: MarketplaceInfo[] = [
  { id: "amazon.in", label: "India (amazon.in)", titleLimit: 75, asinLookup: true },
  { id: "amazon.com", label: "United States (amazon.com)", titleLimit: 75, asinLookup: true },
  { id: "amazon.co.uk", label: "United Kingdom (amazon.co.uk)", titleLimit: 200, asinLookup: true },
  { id: "amazon.ae", label: "UAE (amazon.ae)", titleLimit: 200, asinLookup: true },
  { id: "amazon.de", label: "Germany (amazon.de)", titleLimit: 200, asinLookup: true },
  { id: "other", label: "Other", titleLimit: 200, asinLookup: false },
];

export interface ListingInput {
  marketplace: Marketplace;
  asin?: string;
  brand?: string;
  title: string;
  highlights?: string;
  bullets: string[];
  description?: string;
  backendTerms?: string;
  /** Free text: product details table, attributes, ingredients, nutrition, etc. */
  attributes?: string;
  /** A+ text if the seller pastes it. */
  aplus?: string;
  imageUrls?: string[];
  videoCount?: number;
  price?: string;
  rating?: string;
  /** Anything else the seller wants the analyst to know. */
  notes?: string;
}

export type Severity = "P0" | "P1" | "P2";

export interface Finding {
  field: "title" | "highlights" | "bullets" | "description" | "backend" | "general";
  severity: Severity;
  /** Gate code (B1–B9) when this finding is a blocker. */
  blocker?: string;
  message: string;
  evidence?: string;
  fix?: string;
}

/** Listing areas that get their own problem → solution page. */
export const SECTION_KEYS = ["title", "highlights", "bullets", "description", "backend", "images", "aplus_basic", "aplus_premium"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export interface SectionIssue { problem: string; solution: string; severity: Severity }
export interface AplusModule { module: string; headline: string; copy: string; image_brief: string; alt_text: string }

/** One display block of a dashboard section. The core sends these already gated (free preview = content removed). */
export type Block =
  | { kind: "score"; score: number; status: string; rawScore: number; pillars: { name: string; earned: number; available: number; percent: number | null }[] | null; summary: string }
  | { kind: "issues"; title: string; items: SectionIssue[]; hidden: number }
  | { kind: "text"; title: string; items: { label?: string; text: string; meta?: string }[]; hidden: number; tone?: "current" | "rewrite" }
  | { kind: "table"; title: string; head: string[]; rows: string[][]; hidden: number }
  | { kind: "locked"; title: string; detail: string };

export interface SectionView {
  id: string;
  label: string;
  group: string;
  /** Problems found (badge in the sidebar). */
  count: number;
  locked: boolean;
  blocks: Block[];
}
