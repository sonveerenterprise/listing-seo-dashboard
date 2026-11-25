"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETPLACES } from "@/contract";
import Icon from "./Icon";

/** ASIN search: shows the score meters (no charge). Rendered only when the core can look up ASINs. */
export default function AsinBox({ variant, defaultAsin = "", defaultMarketplace = "amazon.in" }: { variant: "top" | "hero" | "card"; defaultAsin?: string; defaultMarketplace?: string }) {
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
    }
    setBusy(false);
  }

  return (
    <form className={`asinbox ${variant}`} onSubmit={go}>
      <select value={mk} onChange={(e) => setMk(e.target.value)} aria-label="Marketplace">
        {MARKETPLACES.filter((m) => m.asinLookup).map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
      </select>
      <input value={asin} onChange={(e) => setAsin(e.target.value)} aria-label="ASIN" placeholder="Enter ASIN" pattern="[A-Za-z0-9]{10}" title="10-character ASIN" maxLength={10} required disabled={busy} />
      <button className={variant === "top" ? "go" : "cta"} disabled={busy} aria-label={variant === "top" ? "Check this ASIN" : undefined} data-busy={busy || undefined}>
        {variant === "top" ? <Icon name="find" /> : busy ? "Checking…" : "Check my listing"}
      </button>
      {err && <div className="error" role="alert">{err}</div>}
    </form>
  );
}
