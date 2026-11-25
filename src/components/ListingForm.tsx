"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETPLACES } from "@/contract";
import type { Meter } from "@/contract";
import Meters from "./Meters";

type Mode = "check" | "analyze";
const empty = { marketplace: "amazon.in", asin: "", brand: "", title: "", highlights: "", bullets: ["", "", "", "", ""], description: "", backendTerms: "", attributes: "", aplus: "", notes: "" };

const bytes = (s: string) => new TextEncoder().encode(s).length;

export default function ListingForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ meters: Meter[]; overall: number } | null>(null);

  const limit = MARKETPLACES.find((m) => m.id === f.marketplace)?.titleLimit ?? 200;
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const setBullet = (i: number) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const b = [...f.bullets];
    b[i] = e.target.value;
    setF({ ...f, bullets: b });
  };

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const listing = { ...f, asin: f.asin.trim() || undefined };
      if (mode === "check") {
        const r = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(listing) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setResult(j);
      } else {
        const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "paste", listing }) });
        const j = await r.json();
        if (r.status === 401) return router.push("/login");
        if (!r.ok) throw new Error(j.error);
        router.push(`/app/reports/${j.id}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const pasteFields = (
    <>
      <label>Brand</label>
      <input value={f.brand} onChange={set("brand")} />
      <label>Title <span className={`count ${f.title.length > limit ? "over" : ""}`}>{f.title.length}/{limit}</span></label>
      <textarea value={f.title} onChange={set("title")} required />
      <label>Item Highlights <span className="count">{f.highlights.length}</span></label>
      <input value={f.highlights} onChange={set("highlights")} />
      {f.bullets.map((b, i) => (
        <div key={i}>
          <label>Bullet {i + 1} <span className="count">{b.length}</span></label>
          <textarea value={b} onChange={setBullet(i)} />
        </div>
      ))}
      <label>Description <span className={`count ${f.description.length > 2000 ? "over" : ""}`}>{f.description.length}/2000</span></label>
      <textarea value={f.description} onChange={set("description")} style={{ minHeight: 110 }} />
    </>
  );

  return (
    <>
      <form className="listing" onSubmit={submit}>
        <label>Marketplace</label>
        <select value={f.marketplace} onChange={set("marketplace")}>
          {MARKETPLACES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <label>ASIN <span className="count">optional</span></label>
        <input value={f.asin} onChange={set("asin")} placeholder="10 characters" maxLength={10} />

        {pasteFields}

        <label>Backend search terms <span className={`count ${bytes(f.backendTerms) > 200 ? "over" : ""}`}>{bytes(f.backendTerms)}/200 bytes</span></label>
        <textarea value={f.backendTerms} onChange={set("backendTerms")} placeholder="From Seller Central → Edit listing → Keywords" />
        {mode === "analyze" && (
          <>
            <label>Attributes / product details / ingredients / nutrition <span className="count">optional, improves the full report</span></label>
            <textarea value={f.attributes} onChange={set("attributes")} style={{ minHeight: 110 }} />
            <label>A+ content text <span className="count">optional</span></label>
            <textarea value={f.aplus} onChange={set("aplus")} />
            <label>Anything else we should know <span className="count">optional</span></label>
            <textarea value={f.notes} onChange={set("notes")} placeholder="e.g. certified NPOP organic; target buyers are diabetics' families; competitor ASINs…" />
          </>
        )}
        {err && <div className="error" role="alert">{err}</div>}
        <p>
          <button className="cta" disabled={busy} data-busy={busy || undefined}>{busy ? "Checking…" : "Check my listing"}</button>
        </p>
      </form>

      {result && (
        <section className="card" aria-live="polite">
          <h2>Quick score: {result.overall}/100</h2>
          <Meters meters={result.meters} />
          <p className="muted">Want to know what to fix? <a href="/app/new">Sign in</a> for the full report with every problem, its solution and a paste-ready rewrite.</p>
        </section>
      )}
    </>
  );
}
