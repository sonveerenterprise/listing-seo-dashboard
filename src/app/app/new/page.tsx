import ListingForm from "@/components/ListingForm";
import AppShell from "@/components/AppShell";
import AsinBox from "@/components/AsinBox";
import { requireUserId, meFor } from "@/lib/session";
import { publicConfig as config } from "@/lib/public-config";

export const metadata = { title: "Listing Analyzer" };

export default async function NewAnalysis() {
  const userId = await requireUserId();
  const me = await meFor(userId);
  return (
    <AppShell userId={userId} page="new">
      <div className="pagehead"><div><h1>Listing Analyzer</h1><p className="muted">See the score meters first{config.billingEnabled ? ` (no charge). The full report costs ${config.cost.unlock} credit.` : "."}</p></div></div>
      {me.asinEnabled && <div className="card narrow"><h2>By ASIN</h2><AsinBox variant="card" /></div>}
      <div className="card narrow"><h2>Paste a listing</h2><p className="muted small">For a listing that isn&apos;t live yet, or to add data the ASIN lookup can&apos;t see. More detail gives a better full report.</p><ListingForm mode="analyze" /></div>
    </AppShell>
  );
}
