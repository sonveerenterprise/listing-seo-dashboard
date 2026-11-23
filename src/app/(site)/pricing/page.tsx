import Link from "next/link";
import { publicConfig as config, CREDIT_PACKS, rupees } from "@/lib/public-config";
export const metadata = { title: "Pricing" };
export default function Pricing() {
  return (
    <main className="wrap section">
      <h1>Free score. Pay per ASIN for the full report.</h1>
      <p className="muted">
        Enter any ASIN to see its Listing SEO Score and one suggestion per section for free ({config.freePerMonth} ASINs a month).
        Buy a full report to see every problem and solution, the paste-ready rewrite, A+ Basic and Premium plans, claims and Rufus answers.
        Credits don&apos;t expire. Prices include GST.
      </p>
      <div className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Free preview</h3>
          <div className="price">₹0</div>
          <ul className="muted feat">
            <li>Listing SEO Score and status</li>
            <li>1 suggestion per section</li>
            <li>1 rewritten bullet point</li>
            <li>A+ Basic / Premium, claims and rewrite locked</li>
          </ul>
          <Link className="btn ghost" href="/app">Start free</Link>
        </div>
        {CREDIT_PACKS.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.name}</h3>
            <div className="price">{rupees(p.pricePaise)}</div>
            <p className="muted">{p.note}</p>
            <ul className="muted feat">
              <li>Every problem with its solution</li>
              <li>Paste-ready title, highlights, 5 bullets, description, backend</li>
              <li>A+ Basic and A+ Premium plans</li>
              <li>Claims, Rufus intent map, full action plan, download</li>
            </ul>
            <Link className="btn" href="/app/billing">Buy</Link>
          </div>
        ))}
        {config.byokEnabled && (
          <div className="card">
            <h3>Your own AI key</h3>
            <div className="price">₹0</div>
            <p className="muted">Add your Anthropic API key in Settings and every report is full and free here — you pay Anthropic for tokens directly.</p>
            <Link className="btn ghost" href="/app/settings">Add key</Link>
          </div>
        )}
      </div>
    </main>
  );
}
