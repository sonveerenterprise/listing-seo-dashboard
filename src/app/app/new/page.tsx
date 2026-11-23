import Link from "next/link";
import ListingForm from "@/components/ListingForm";
import AppShell from "@/components/AppShell";
import { publicConfig as config } from "@/lib/public-config";
import { requireUserId, meFor } from "@/lib/session";

async function planNote(userId: string) {
  if (!config.billingEnabled) return null;
  const me = await meFor(userId);
  if (me.ownKey) return <>Using <b>your own Anthropic key</b> — full report, no credits (ASIN lookup still {config.cost.asinFetch} credit).</>;
  const credits = me.credits ?? 0;
  if (credits >= config.cost.analysis) return <>You have <b>{credits} credit{credits === 1 ? "" : "s"}</b>. A full report costs {config.cost.analysis} credit.</>;
  const left = Math.max(0, config.freePerMonth - me.freeUsed);
  return left > 0
    ? <>No credits — you&apos;ll get a <b>free preview</b> (score, blockers, top fixes). {left} of {config.freePerMonth} free previews left this month. <Link href="/pricing">Buy credits</Link>{config.byokEnabled && <> or <Link href="/app/settings">add your own key</Link></>} for the full report.</>
    : <>You&apos;ve used this month&apos;s free previews. <Link href="/app/billing">Buy credits</Link>{config.byokEnabled && <> or <Link href="/app/settings">add your own key</Link></>}.</>;
}

export default async function NewAnalysis() {
  const userId = await requireUserId();
  const me = await meFor(userId);
  const cost = config.billingEnabled ? { paste: config.cost.analysis, asin: config.cost.analysis + config.cost.asinFetch } : undefined;
  const note = await planNote(userId);
  return (
    <AppShell userId={userId} page="new">
      <div style={{ maxWidth: 820 }}>
        <h1>Paste a listing</h1>
        {note && <p className="panel" style={{ padding: 12 }}>{note}</p>}
        <p className="muted">For a listing that isn&apos;t live yet, or to add data the ASIN lookup can&apos;t see (attributes, nutrition table, A+ text, backend terms).</p>
        <ListingForm mode="analyze" asinEnabled={me.asinEnabled} cost={cost} />
      </div>
    </AppShell>
  );
}
