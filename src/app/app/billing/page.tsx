import { redirect } from "next/navigation";
import { publicConfig as config, CREDIT_PACKS, MAX_QUANTITY } from "@/lib/public-config";
import { requireUserId, meFor } from "@/lib/session";
import { core } from "@/core";
import BuyCard from "@/components/BuyCard";
import AppShell from "@/components/AppShell";
import { dateTimeIST } from "@/components/format";

export const metadata = { title: "Credits & Billing" };

// Balance and history come from the core; the dashboard has no database.
export default async function Billing() {
  if (!config.billingEnabled) redirect("/app");
  const user = await requireUserId();
  const [b, me] = await Promise.all([core.billing(user), meFor(user)]);
  if (!b.ok) redirect(b.status === 401 ? "/login" : "/app");
  const { credits, history } = b.data;
  return (
    <AppShell userId={user} page="billing">
      <div className="pagehead"><div><h1>Credits &amp; Billing</h1><p className="muted">You have <b>{credits}</b> credit{credits === 1 ? "" : "s"}. {me.cost.unlock} credit = 1 full ASIN report. Prices include GST; credits don&apos;t expire.</p></div></div>
      <div className="plans">{CREDIT_PACKS.map((p) => <BuyCard key={p.id} pack={p} max={MAX_QUANTITY} appName={config.appName} email={me.email} />)}</div>
      <div className="card">
        <h2>History</h2>
        {history.length === 0 ? <p className="muted">No credit movements yet.</p> : (
          <div className="tw"><table className="simple">
            <thead><tr><th>Date (IST)</th><th>Change</th><th>Reason</th></tr></thead>
            <tbody>{history.map((l) => <tr key={l.id}><td>{dateTimeIST(l.createdAt)}</td><td>{l.delta > 0 ? `+${l.delta}` : l.delta}</td><td>{l.reason}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </AppShell>
  );
}
