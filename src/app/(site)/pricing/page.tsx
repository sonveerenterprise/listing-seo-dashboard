import Link from "next/link";
import { CREDIT_PACKS, rupees } from "@/lib/public-config";

export const metadata = { title: "Pricing" };

export default function Pricing() {
  return (
    <main className="wrap section">
      <h1>Pay per ASIN</h1>
      <p className="muted">Check any listing&apos;s score meters first. 1 credit unlocks 1 full report. Choose the quantity when you buy. Credits don&apos;t expire. Prices include GST.</p>
      <div className="plans">
        {CREDIT_PACKS.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.name}</h3>
            <div className="price">{rupees(p.pricePaise)}</div>
            <p className="muted">{p.note}</p>
            <ul className="muted feat">
              <li>Every problem with its solution</li>
              <li>Paste-ready title, highlights, 5 bullets, description, backend</li>
              <li>A+ Basic and A+ Premium plans</li>
              <li>Claims, buyer questions, full action plan, download</li>
            </ul>
            <Link className="cta wide" href="/app/billing">Buy</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
