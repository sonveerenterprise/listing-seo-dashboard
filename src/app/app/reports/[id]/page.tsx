import { notFound } from "next/navigation";
import { publicConfig as config } from "@/lib/public-config";
import { requireUserId } from "@/lib/session";
import { core } from "@/core";
import AppShell from "@/components/AppShell";
import SectionBlocks from "@/components/SectionBlocks";
import UnlockButton from "@/components/UnlockButton";
import Link from "next/link";

export const metadata = { title: "Report" };

export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string }> }) {
  const userId = await requireUserId();
  const [{ id }, { s }] = await Promise.all([params, searchParams]);
  // The core returns sections already gated: locked content never reaches this page.
  const res = await core.getReport(userId, id);
  if (!res.ok) notFound();
  const r = res.data;

  const locked = r.locked;
  const sections = r.sections;
  const active = sections.find((x) => x.id === s) ?? sections[0];
  const credits = locked && config.billingEnabled ? ((await core.me(userId)).credits ?? 0) : 0;
  const label = r.label;

  return (
    <AppShell
      userId={userId}
      report={{ id: r.id, label, marketplace: r.marketplace, asin: r.asin, locked, active: active.id, sections: sections.map(({ id, label, group, count }) => ({ id, label, group, count })) }}
    >
      <div className="pagehead">
        <div>
          <h1>{active.label}</h1>
          <p className="muted">{label} · {r.marketplace} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
        {!locked && <a className="btn ghost" href={`/api/reports/${r.id}/download`}>Download report</a>}
      </div>

      {locked && (
        <div className="panel unlock">
          <div>
            <b>Free preview.</b> You see the score and one suggestion per section. Unlock every problem and solution, the paste-ready rewrite,
            A+ Basic and Premium plans, claims, Rufus answers and the download.
          </div>
          <div className="row">
            <UnlockButton reportId={r.id} cost={config.cost.unlock} balance={credits} />
            {config.byokEnabled && <Link href="/app/settings" className="small">or use your own Anthropic key</Link>}
          </div>
        </div>
      )}

      <SectionBlocks blocks={active.blocks} />
    </AppShell>
  );
}
