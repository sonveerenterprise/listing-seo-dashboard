"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inr } from "./format";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Razorpay"));
    document.body.appendChild(s);
  });
}

export interface Pack { id: string; name: string; credits: number; pricePaise: number; note: string }

/** One plan with a quantity. The browser sends only the plan and the quantity; the core decides the price. */
export default function BuyCard({ pack, max, appName, email }: { pack: Pack; max: number; appName: string; email?: string | null }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const credits = pack.credits * qty;

  async function buy() {
    setBusy(true);
    setMsg(null);
    try {
      await loadCheckout();
      const r = await fetch("/api/billing/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packId: pack.id, quantity: qty }) });
      const o = await r.json().catch(() => ({}));
      if (r.status === 401) return router.push("/login");
      if (!r.ok) throw new Error(o.error ?? "Payment failed");
      // Never open a payment window for a different amount than the one shown here.
      if (o.amount !== pack.pricePaise * qty) throw new Error("The price has changed. Please refresh the page.");
      const rzp = new window.Razorpay!({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency,
        name: appName,
        description: `${o.packName} × ${o.quantity} (${o.credits} credits)`,
        prefill: { email: email ?? undefined },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/billing/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) }).catch(() => null);
          setMsg(v?.ok ? "Payment received — credits added." : "Payment received; credits will appear within a minute.");
          setBusy(false);
          router.refresh();
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Payment failed");
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>{pack.name}</h2>
      <div className="price">{inr(pack.pricePaise)}</div>
      <div className="muted">{pack.note}</div>
      <div className="row between">
        <div className="qty" role="group" aria-label={`Quantity of ${pack.name}`}>
          <button type="button" aria-label="Fewer" onClick={() => setQty(qty - 1)} disabled={busy || qty <= 1}>−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" aria-label="More" onClick={() => setQty(qty + 1)} disabled={busy || qty >= max}>+</button>
        </div>
        <div className="right"><b>{inr(pack.pricePaise * qty)}</b><div className="muted small">{credits} credit{credits === 1 ? "" : "s"}</div></div>
      </div>
      <button className="cta wide" onClick={buy} disabled={busy} data-busy={busy || undefined}>{busy ? "Opening…" : "Buy"}</button>
      {msg && <p className="muted" role="status">{msg}</p>}
    </div>
  );
}
