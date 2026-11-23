import { redirect } from "next/navigation";
import { publicConfig as config, CREDIT_PACKS, rupees } from "@/lib/public-config";
import { requireUserId, meFor } from "@/lib/session";
import { core } from "@/core";
import BuyButton from "@/components/BuyButton";
import AppShell from "@/components/AppShell";

// Balance and history come from the core; the dashboard has no database.
export default async function Billing() {
  if (!config.billingEnabled) redirect("/app");
  const user = await requireUserId();
  const [b, me] = await Promise.all([core.billing(user), meFor(user)]);
  if (!b.ok) redirect(b.status === 401 ? "/login" : "/app");
  const { credits, history } = b.data;
  return (
    <AppShell userId={user} page="billing">
      <h1>Billing</h1>
      <p>You have <b>{credits}</b> credit{credits === 1 ? "" : "s"}. 1 credit = 1 full ASIN report (or unlocks one free preview).</p>
      <div className="grid">
        {CREDIT_PACKS.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.name}</h3>
            <div className="price">{rupees(p.pricePaise)}</div>
            <p className="muted">{p.note}</p>
            <BuyButton packId={p.id} label={`Buy ${p.name}`} email={me.email} />
          </div>
        ))}
      </div>
      <h2>History</h2>
      <div className="panel">
        <table className="simple">
          <thead><tr><th>Date</th><th>Change</th><th>Reason</th></tr></thead>
          <tbody>
            {history.map((l) => (
              <tr key={l.id}><td>{new Date(l.createdAt).toLocaleString("en-IN")}</td><td>{l.delta > 0 ? `+${l.delta}` : l.delta}</td><td>{l.reason}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
