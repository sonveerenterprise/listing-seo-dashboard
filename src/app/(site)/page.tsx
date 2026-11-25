import Link from "next/link";
import { publicConfig as config, CREDIT_PACKS, rupees } from "@/lib/public-config";

const features = [
  ["Listing SEO Score", "100 points across search visibility, rule compliance, conversion copy, catalogue completeness, claims and trust, and AI shopping readiness."],
  ["Blockers first", "Over-limit titles, banned characters, disease claims, price in bullets, backend over 200 bytes: flagged before anything else."],
  ["Paste-ready rewrite", "Title, Item Highlights, five bullets, description and backend terms, each checked by code for length and bytes."],
  ["India-first rules", "amazon.in rules, FSSAI claim rules, NPOP/Jaivik Bharat organic logic and nutrition-table maths for food sellers."],
  ["Buyer questions", "8–10 buyer questions mapped to where your listing answers them, with paste-ready answers for the gaps."],
  ["A+ content plans", "Module-by-module plans for A+ Basic and A+ Premium, with headlines, copy and image briefs."],
];

export default function Home() {
  return (
    <main>
      <section className="hero wrap">
        <h1>Find out why your Amazon listing isn&apos;t ranking, and get the fixed version.</h1>
        <p>See your listing&apos;s score meters first. Unlock the full report to get every problem, its solution and a rewrite you can paste into Seller Central.</p>
        <div className="row center">
          <Link className="cta" href="/check">Check my listing</Link>
          {config.billingEnabled && <Link className="btn2" href="/pricing">See plans</Link>}
        </div>
      </section>
      <section className="section wrap">
        <div className="grid">{features.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p className="muted">{d}</p></div>)}</div>
      </section>
      {config.billingEnabled && (
        <section className="section wrap">
          <h2>Two simple plans</h2>
          <div className="plans">{CREDIT_PACKS.map((p) => <div className="card" key={p.id}><h3>{p.name}</h3><div className="price">{rupees(p.pricePaise)}</div><p className="muted">{p.note}</p><Link className="cta wide" href="/app/billing">Buy</Link></div>)}</div>
        </section>
      )}
    </main>
  );
}
