"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function BuyButton({ packId, label, email }: { packId: string; label: string; email?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setMsg(null);
    try {
      await loadCheckout();
      const r = await fetch("/api/billing/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packId }) });
      const o = await r.json();
      if (!r.ok) throw new Error(o.error);
      const rzp = new window.Razorpay!({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency,
        name: "Listing SEO for Amazon",
        description: `${o.packName} credit pack`,
        prefill: { email: email ?? undefined },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/billing/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
          setMsg(v.ok ? "Payment received — credits added." : "Payment received; credits will appear within a minute.");
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
    <>
      <button className="btn" onClick={buy} disabled={busy}>{busy ? "Opening…" : label}</button>
      {msg && <p className="muted">{msg}</p>}
    </>
  );
}
