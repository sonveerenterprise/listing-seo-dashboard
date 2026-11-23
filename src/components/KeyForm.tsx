"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KeyForm({ masked }: { masked: string | null }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function call(method: "POST" | "DELETE") {
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/byok", { method, headers: { "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify({ key }) : undefined });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? "Something went wrong");
    setKey("");
    router.refresh();
  }

  return (
    <form className="listing" onSubmit={(e) => { e.preventDefault(); call("POST"); }}>
      {masked ? (
        <p>Saved key: <code>{masked}</code> — your analyses are free and run on this key.</p>
      ) : (
        <p className="muted">No key saved. Analyses use credits or your free monthly previews.</p>
      )}
      <label>{masked ? "Replace key" : "Anthropic API key"}</label>
      <input type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" placeholder="Paste your key from console.anthropic.com" />
      {err && <div className="error">{err}</div>}
      <p style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy || key.trim().length < 20}>{busy ? "Checking…" : "Save key"}</button>
        {masked && <button type="button" className="btn ghost" disabled={busy} onClick={() => call("DELETE")}>Remove key</button>}
      </p>
    </form>
  );
}
