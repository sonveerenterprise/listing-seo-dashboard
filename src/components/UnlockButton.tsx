"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockButton({ reportId, cost, balance }: { reportId: string; cost: number; balance: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (balance < cost) {
    return <a className="btn" href="/app/billing">Buy credits to unlock ({cost} credit{cost === 1 ? "" : "s"})</a>;
  }
  async function unlock() {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/reports/${reportId}/unlock`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(j.error ?? "Couldn't unlock");
      setBusy(false);
      return;
    }
    router.refresh();
  }
  return (
    <>
      <button className="btn" onClick={unlock} disabled={busy}>{busy ? "Unlocking…" : `Unlock full report · ${cost} credit${cost === 1 ? "" : "s"}`}</button>
      {err && <div className="error">{err}</div>}
    </>
  );
}
