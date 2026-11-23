// PUBLIC CONTRACT — request body schema for a listing, shared by the dashboard and the core.
import { z } from "zod";
import { MARKETPLACES } from "./index.ts";

const mk = z.enum(MARKETPLACES.map((m) => m.id) as [string, ...string[]]);
const s = (max: number) => z.string().max(max).optional().default("");

/** Amazon ASIN: exactly 10 letters or digits (stored upper-case). Empty or blank means "no ASIN". */
export const ASIN_RE = /^[A-Z0-9]{10}$/;
const asin = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim().toUpperCase()) : v),
  z.string().regex(ASIN_RE, "ASIN must be 10 letters or digits").optional(),
);

export const listingSchema = z.object({
  marketplace: mk,
  asin,
  brand: s(100),
  title: z.string().max(1000).default(""),
  highlights: s(1000),
  bullets: z.array(z.string().max(2000)).max(10).default([]),
  description: s(10000),
  backendTerms: s(2000),
  attributes: s(20000),
  aplus: s(20000),
  notes: s(4000),
});
export type ListingForm = z.infer<typeof listingSchema>;
