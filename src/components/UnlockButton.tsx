"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockButton({ reportId, cost, balance, runsAi }: { reportId: string; cost: number; balance: number; runsAi: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const credits = `${cost} credit${cost === 1 ? "" : "s"}`;
  if (balance < cost) return <a className="cta" href="/app/billing">Buy credits to unlock</a>;
  async function unlock() {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/reports/${reportId}/unlock`, { method: "POST" }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (!r?.ok && r?.status !== 409) {
      // A dropped connection doesn't stop the report: the page shows it when it's ready.
      setErr(r && r.status !== 504 ? (j?.error ?? "Couldn't unlock") : "Still preparing. Refresh this page in a few minutes.");
      setBusy(false);
    }
    router.refresh();
  }
  return (
    <>
      <button className="cta" onClick={unlock} disabled={busy} data-busy={busy || undefined}>{busy ? (runsAi ? "Preparing your report… 2–4 minutes" : "Unlocking…") : `Unlock full report · ${credits}`}</button>
      {busy && runsAi && <div className="muted small">You can keep this page open; if you leave, the report continues and appears under My Reports.</div>}
      {err && <div className="error" role="alert">{err}</div>}
    </>
  );
}
