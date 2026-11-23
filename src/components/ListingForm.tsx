"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETPLACES } from "@/contract";
import type { Finding } from "@/contract";

type Mode = "check" | "analyze";
const empty = { marketplace: "amazon.in", asin: "", brand: "", title: "", highlights: "", bullets: ["", "", "", "", ""], description: "", backendTerms: "", attributes: "", aplus: "", notes: "" };

const bytes = (s: string) => new TextEncoder().encode(s).length;

export default function ListingForm({ mode, asinEnabled = false, cost }: { mode: Mode; asinEnabled?: boolean; cost?: { paste: number; asin: number } }) {
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [source, setSource] = useState<"paste" | "asin">("paste");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ findings: Finding[]; stats: Record<string, string | number> } | null>(null);

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
        const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, listing }) });
        const j = await r.json();
        if (r.status === 401) return router.push("/login");
        if (!r.ok) throw new Error(j.error + (j.needCredits ? " Buy credits on the Billing page." : ""));
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
      <textarea value={f.title} onChange={set("title")} required={source === "paste"} />
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
        {mode === "analyze" && asinEnabled && (
          <div className="tabs">
            <button type="button" className={source === "paste" ? "on" : ""} onClick={() => setSource("paste")}>Paste listing{cost ? ` · ${cost.paste} credit` : ""}</button>
            <button type="button" className={source === "asin" ? "on" : ""} onClick={() => setSource("asin")}>Fetch by ASIN{cost ? ` · ${cost.asin} credits` : ""}</button>
          </div>
        )}
        <label>Marketplace</label>
        <select value={f.marketplace} onChange={set("marketplace")}>
          {MARKETPLACES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <label>ASIN {source === "paste" && <span className="count">optional</span>}</label>
        <input value={f.asin} onChange={set("asin")} placeholder="B0XXXXXXXX" required={source === "asin"} maxLength={10} />

        {source === "paste" ? pasteFields : <p className="muted">We&apos;ll fetch the live title, bullets, details, images and description for this ASIN.</p>}

        <label>Backend search terms <span className={`count ${bytes(f.backendTerms) > 200 ? "over" : ""}`}>{bytes(f.backendTerms)}/200 bytes</span></label>
        <textarea value={f.backendTerms} onChange={set("backendTerms")} placeholder="From Seller Central → Edit listing → Keywords" />
        {mode === "analyze" && (
          <>
            {source === "paste" && (
              <>
                <label>Attributes / product details / ingredients / nutrition <span className="count">optional, improves the score</span></label>
                <textarea value={f.attributes} onChange={set("attributes")} style={{ minHeight: 110 }} />
              </>
            )}
            <label>A+ content text <span className="count">optional</span></label>
            <textarea value={f.aplus} onChange={set("aplus")} />
            <label>Anything else we should know <span className="count">optional</span></label>
            <textarea value={f.notes} onChange={set("notes")} placeholder="e.g. certified NPOP organic; target buyers are diabetics' families; competitor ASINs…" />
          </>
        )}
        {err && <div className="error">{err}</div>}
        <p>
          <button className="btn" disabled={busy}>
            {busy ? (mode === "check" ? "Checking…" : "Analysing… this takes 1–3 minutes") : mode === "check" ? "Run free check" : "Run full analysis"}
          </button>
        </p>
      </form>

      {result && (
        <section className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>{result.findings.filter((x) => x.severity === "P0").length} critical · {result.findings.length} total issues</h2>
          <table className="simple"><tbody>{Object.entries(result.stats).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
          <table className="simple" style={{ marginTop: 14 }}>
            <thead><tr><th></th><th>Field</th><th>Issue</th></tr></thead>
            <tbody>
              {result.findings.map((x, i) => (
                <tr key={i}>
                  <td><b style={{ color: x.severity === "P0" ? "#c62828" : x.severity === "P1" ? "#e08a00" : "#4a6fa5" }}>{x.severity}</b></td>
                  <td>{x.field}</td>
                  <td>{x.message}{x.evidence ? <div className="muted">{x.evidence}</div> : null}{x.fix ? <div className="muted">{x.fix}</div> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 16 }}>The free check catches rule breaks. The <a href="/app/new">full analysis</a> gives your Listing SEO Score and writes the fixed listing.</p>
        </section>
      )}
    </>
  );
}
