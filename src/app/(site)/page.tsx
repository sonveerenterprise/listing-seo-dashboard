import Link from "next/link";
import { publicConfig as config } from "@/lib/public-config";

const features = [
  ["Listing SEO Score", "100 points across search visibility, rule compliance, conversion copy, catalogue completeness, claims and trust, and AI shopping readiness — one transparent scoring model, the same for every listing."],
  ["Blockers first", "Over-limit titles, banned characters, disease claims, price in bullets, backend over 200 bytes — any blocker caps the score and is flagged before anything else."],
  ["Paste-ready rewrite", "Title, Item Highlights, five bullets, description and backend terms, each checked by code for length and bytes."],
  ["India-first rules", "amazon.in Seller Central rules, FSSAI claim rules, NPOP/Jaivik Bharat organic logic and nutrition-table maths for food sellers."],
  ["Rufus / Alexa intent map", "10–15 buyer questions mapped to where your listing answers them — and paste-ready answers for the gaps."],
  ["Pay your way", "Free previews every month, pay per full report, or bring your own Anthropic key for free full reports."],
];

export default function Home() {
  return (
    <main>
      <section className="hero wrap">
        <h1>Find out why your Amazon listing isn&apos;t ranking — and get the fixed version.</h1>
        <p>Paste your listing or enter an ASIN. Get a scored audit, every compliance risk, and a rewrite you can paste straight into Seller Central.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn" href="/check">Run the free check</Link>
          <Link className="btn ghost" href="/app/new">{config.billingEnabled ? `Free AI score (${config.freePerMonth}/month)` : "Full AI analysis"}</Link>
        </div>
      </section>
      <section className="section wrap">
        <div className="grid">
          {features.map(([t, d]) => (
            <div className="card" key={t}><h3>{t}</h3><p className="muted">{d}</p></div>
          ))}
        </div>
      </section>
      <section className="section wrap">
        <div className="grid">
          <div className="card">
            <h3>Free check</h3>
            <p className="muted">Instant rule checks on title, bullets, backend terms and risky claims. No sign-up, no AI.</p>
          </div>
          <div className="card">
            <h3>Free AI preview</h3>
            <p className="muted">Your Listing SEO Score, pillar scores, every blocker and the top 3 fixes — free each month after sign-in.</p>
          </div>
          <div className="card">
            <h3>Full report</h3>
            <p className="muted">All 28 checkpoints, claims, fact conflicts, nutrition maths, buyer worries, Rufus intent map and a complete rewrite. Pay per report, or bring your own Anthropic key.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
