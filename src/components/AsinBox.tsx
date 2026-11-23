"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETPLACES } from "@/contract";

// Top-of-dashboard search: enter an ASIN, get a report (like OpenSEO's domain box).
export default function AsinBox({ enabled, defaultAsin = "", defaultMarketplace = "amazon.in" }: { enabled: boolean; defaultAsin?: string; defaultMarketplace?: string }) {
  const router = useRouter();
  const [asin, setAsin] = useState(defaultAsin);
  const [mk, setMk] = useState(defaultMarketplace);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "asin", listing: { marketplace: mk, asin: asin.trim().toUpperCase() } }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) return router.push("/login");
      if (!r.ok) throw new Error(j.error ?? "Something went wrong");
      router.push(`/app/reports/${j.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form className="asinbox" onSubmit={go}>
      <select value={mk} onChange={(e) => setMk(e.target.value)} aria-label="Marketplace">
        {MARKETPLACES.filter((m) => m.asinLookup).map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
      </select>
      <input value={asin} onChange={(e) => setAsin(e.target.value)} placeholder="Enter an ASIN, e.g. B0XXXXXXXX" pattern="[A-Za-z0-9]{10}" title="10-character ASIN" maxLength={10} required disabled={!enabled || busy} />
      <button className="btn" disabled={!enabled || busy}>{busy ? "Analysing… 1–3 min" : "Analyze"}</button>
      {!enabled && <span className="muted small">ASIN lookup isn&apos;t set up on this server — <a href="/app/new">paste the listing</a> instead.</span>}
      {err && <div className="error" style={{ flexBasis: "100%" }}>{err}</div>}
    </form>
  );
}
