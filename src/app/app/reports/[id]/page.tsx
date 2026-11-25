import { notFound } from "next/navigation";
import Link from "next/link";
import { publicConfig as config, CREDIT_PACKS, rupees } from "@/lib/public-config";
import { requireUserId, meFor } from "@/lib/session";
import { core } from "@/core";
import AppShell from "@/components/AppShell";
import AutoRefresh from "@/components/AutoRefresh";
import Meters from "@/components/Meters";
import SectionBlocks from "@/components/SectionBlocks";
import UnlockButton from "@/components/UnlockButton";
import { dateIST } from "@/components/format";

export const metadata = { title: "Report" };

const INCLUDED = ["Every problem with its solution", "Paste-ready title, bullets and description", "Backend search terms", "A+ Basic and Premium plans", "Claims and compliance risks", "28-point Listing SEO Score"];

export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string }> }) {
  const userId = await requireUserId();
  const [{ id }, { s }] = await Promise.all([params, searchParams]);
  // The core returns the report already gated: locked content never reaches this page.
  const res = await core.getReport(userId, id);
  if (!res.ok) notFound();
  const r = res.data;
  const me = await meFor(userId);
  const active = r.sections.find((x) => x.id === s) ?? r.sections[0];
  const unlockBox = r.locked && config.billingEnabled && (
    <div className="card lock">
      <h2>🔒 Full report · {me.cost.unlock} credit{me.cost.unlock === 1 ? "" : "s"}</h2>
      <ul>{INCLUDED.map((t) => <li key={t}>{t}</li>)}</ul>
      {r.preparing ? (
        <><AutoRefresh seconds={10} /><b>Your report is being prepared.</b><p className="muted small">It takes 2–4 minutes and appears here by itself.</p></>
      ) : (
        <div className="row"><UnlockButton reportId={r.id} cost={me.cost.unlock} balance={me.credits ?? 0} runsAi={r.kind === "score"} />{(me.credits ?? 0) < me.cost.unlock && <span className="muted">From {rupees(CREDIT_PACKS[0].pricePaise)}</span>}</div>
      )}
    </div>
  );
  return (
    <AppShell userId={userId} page="reports">
      <div className="pagehead">
        <div><h1>{r.kind === "score" ? "Listing score" : active?.label ?? "Report"}</h1><p className="muted">{r.label} · {r.marketplace} · {dateIST(r.createdAt)}</p></div>
        {!r.locked && <a className="btn2" href={`/api/reports/${r.id}/download`}>Download report</a>}
      </div>
      {r.kind === "score" ? (
        <>
          {r.meters && <div className="card"><div className="row between"><h2>Quick score{r.quickScore !== null && <>: {r.quickScore}/100</>}</h2><span className="muted small">From rule checks. The full report adds the AI analysis.</span></div><Meters meters={r.meters} /></div>}
          {unlockBox}
        </>
      ) : (
        <>
          {unlockBox}
          <nav className="tabs" aria-label="Report sections">{r.sections.map((x) => <Link key={x.id} href={`/app/reports/${r.id}?s=${x.id}`} aria-current={x.id === active?.id ? "true" : undefined}>{x.label}{x.count > 0 && <span className="badge">{x.count}</span>}</Link>)}</nav>
          {active && <SectionBlocks blocks={active.blocks} />}
        </>
      )}
    </AppShell>
  );
}
