import Link from "next/link";
import { publicConfig as config, CREDIT_PACKS, rupees } from "@/lib/public-config";
import { requireUserId, meFor } from "@/lib/session";
import AppShell from "@/components/AppShell";
import AsinBox from "@/components/AsinBox";
import ActivityChart, { type Bucket } from "@/components/ActivityChart";
import Icon from "@/components/Icon";
import Meters from "@/components/Meters";
import ReportTable from "@/components/ReportTable";
import { band } from "@/components/format";
import { MARKETPLACES } from "@/contract";
import type { ReportSummary } from "@/contract/api";
import { core } from "@/core";

const DAY = 86_400_000;
const PERIODS: Record<string, { label: string; days: number }> = { "30": { label: "Last 30 days", days: 30 }, "90": { label: "Last 90 days", days: 90 }, "365": { label: "Last 12 months", days: 365 } };
const isFull = (r: ReportSummary) => r.unlocked && r.totalScore !== null;
const avg = (n: number[]) => (n.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length) : null);

/** Everything on this page comes from the user's own reports; there is never placeholder data. */
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ asin?: string; mk?: string; p?: string }> }) {
  const userId = await requireUserId();
  const q = await searchParams;
  const asin = /^[A-Za-z0-9]{10}$/.test(q.asin ?? "") ? q.asin!.toUpperCase() : undefined;
  const marketplace = MARKETPLACES.some((m) => m.id === q.mk) ? q.mk : undefined;
  const [me, reports] = await Promise.all([meFor(userId), core.listReports(userId, { doneOnly: true, take: 100 })]);
  const full = reports.filter(isFull);
  const body = reports.length === 0 ? <NewUser asinEnabled={me.asinEnabled} asin={asin} marketplace={marketplace} /> : full.length === 0 ? <FirstScore reports={reports} credits={me.credits} asinEnabled={me.asinEnabled} /> : <Full reports={reports} credits={me.credits} asinEnabled={me.asinEnabled} p={PERIODS[q.p ?? ""] ? q.p! : "30"} />;
  return <AppShell userId={userId} page="dashboard" prefill={{ asin, marketplace }}>{body}</AppShell>;
}

function NewUser({ asinEnabled, asin, marketplace }: { asinEnabled: boolean; asin?: string; marketplace?: string }) {
  return (
    <>
      <section className="welcome">
        <h1>Welcome to {config.appName}</h1>
        <p>Find out why your listing isn&apos;t ranking. {asinEnabled ? "Enter one ASIN" : "Paste one listing"} to see its score meters. No payment needed.</p>
        {asinEnabled ? (
          <><AsinBox variant="hero" defaultAsin={asin} defaultMarketplace={marketplace} /><Link href="/app/new">Listing not live yet? Paste it instead</Link></>
        ) : (
          <Link className="cta" href="/app/new">Paste your listing</Link>
        )}
      </section>
      <div className="steps3">
        <div className="card"><i>1</i><b>Check a listing</b><p className="muted">Score meters for your title, bullets, description, images and rules.</p></div>
        <div className="card"><i>2</i><b>Unlock the full report</b><p className="muted">{config.cost.unlock} credit shows every problem, its fix and a paste-ready rewrite.</p></div>
        <div className="card"><i>3</i><b>Update your listing</b><p className="muted">Copy the fixed version into Seller Central.</p></div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="row between"><h2>What a check looks like</h2><span className="tag">Sample product</span></div>
          <p className="muted small">An example, not your listing.</p>
          <Meters meters={[{ key: "title", label: "Title", score: 42 }, { key: "bullets", label: "Bullets", score: 71 }, { key: "images", label: "Images & video", score: 85 }]} />
        </div>
        {config.billingEnabled && <Plans />}
      </div>
    </>
  );
}

function Plans() {
  return (
    <div className="card">
      <h2>Plans</h2>
      {CREDIT_PACKS.map((p) => <div className="row between plan" key={p.id}><div><b>{p.name}</b><div className="muted small">{p.note}</div></div><b>{rupees(p.pricePaise)}</b></div>)}
      <Link className="cta wide" href="/app/billing">Buy credits</Link>
    </div>
  );
}

const CheckAnother = ({ asinEnabled }: { asinEnabled: boolean }) => (
  <div className="card">
    <h2>Quick analyze</h2>
    {asinEnabled ? <><p className="muted small">Enter an ASIN to see its score meters.</p><AsinBox variant="card" /><Link className="small" href="/app/new">Listing not live yet? Paste it instead</Link></> : <><p className="muted small">Paste a listing to see its score meters.</p><Link className="cta wide" href="/app/new">Paste a listing</Link></>}
  </div>
);

function FirstScore({ reports, credits, asinEnabled }: { reports: ReportSummary[]; credits: number | null; asinEnabled: boolean }) {
  const r = reports[0];
  return (
    <>
      <div className="pagehead"><div><h1>Dashboard</h1><p className="muted">Your listing is checked. Unlock its report to see the fixes.</p></div></div>
      <div className="kpis three">
        <div className="card kpi"><div>Listings checked<b>{reports.length}</b></div></div>
        <div className="card kpi"><div>Latest quick score<b>{r.quickScore ?? "–"}{r.quickScore !== null && <small>/100</small>}</b></div></div>
        {credits !== null && <div className="card kpi"><div>Available credits<b>{credits}</b><Link href="/app/billing">Buy credits →</Link></div></div>}
      </div>
      <div className="card">
        <div className="row between"><div><b>{(r.title ?? "").slice(0, 70) || "Your listing"}</b><div className="muted small">{[r.asin, r.marketplace].filter(Boolean).join(" · ")}</div></div><Link className="cta" href={`/app/reports/${r.id}`}>Unlock full report</Link></div>
        {r.meters && <Meters meters={r.meters} />}
      </div>
      <div className="g2 even">
        <CheckAnother asinEnabled={asinEnabled} />
        <div className="card"><h2>Your checks</h2><ReportTable reports={reports.slice(0, 5)} /><p className="muted small">The activity chart and improvement areas appear after your first full report.</p></div>
      </div>
    </>
  );
}

function Full({ reports, credits, asinEnabled, p }: { reports: ReportSummary[]; credits: number | null; asinEnabled: boolean; p: string }) {
  const { days } = PERIODS[p];
  const now = Date.now();
  const at = (r: ReportSummary) => Date.parse(r.createdAt);
  const start = now - days * DAY;
  const inPeriod = reports.filter((r) => at(r) >= start);
  const before = reports.filter((r) => at(r) < start && at(r) >= start - days * DAY);
  const scores = (list: ReportSummary[]) => list.filter(isFull).map((r) => r.totalScore!);
  const now_ = avg(scores(inPeriod));
  const prev = avg(scores(before));
  const good = scores(inPeriod).filter((n) => n >= 80).length;
  const N = 10;
  const width = (days * DAY) / N;
  const buckets: Bucket[] = Array.from({ length: N }, (_, i) => {
    const s = start + i * width;
    const list = inPeriod.filter((r) => at(r) >= s && at(r) < s + width);
    return { start: s, count: list.length, avg: avg(scores(list)) };
  });
  const areas = new Map<string, number[]>();
  for (const r of inPeriod) for (const a of r.areas ?? []) if (a.percent !== null) areas.set(a.name, [...(areas.get(a.name) ?? []), a.percent]);
  const worst = [...areas].map(([name, v]) => ({ name, percent: avg(v)! })).sort((a, b) => a.percent - b.percent).slice(0, 4);
  const diff = (a: number, b: number, unit: string) => (a === b ? null : <span className={`small ${a > b ? "ok" : "bad"}`}>{a > b ? "↑" : "↓"} {Math.abs(a - b)} {unit}</span>);
  return (
    <>
      <div className="pagehead">
        <div><h1>Dashboard</h1><p className="muted">Analyze, optimize and improve your Amazon listings</p></div>
        <nav className="seg" aria-label="Period">{Object.entries(PERIODS).map(([k, v]) => <Link key={k} href={`/app?p=${k}`} aria-current={k === p ? "true" : undefined}>{v.label}</Link>)}</nav>
      </div>
      <div className="kpis">
        <div className="card kpi"><Icon name="doc" className="blue" /><div>Listings checked<b>{inPeriod.length}</b>{before.length > 0 && diff(inPeriod.length, before.length, "vs before")}</div></div>
        <div className="card kpi"><Icon name="cup" className="gold" /><div>Average SEO score<b>{now_ ?? "–"}{now_ !== null && <small>/100</small>}</b>{now_ !== null && prev !== null && diff(now_, prev, "points")}</div></div>
        <div className="card kpi good"><Icon name="tick" className="ok" /><div>Excellent listings<b>{good}</b><span className="muted small">Score 80 or more</span></div></div>
        <div className="card kpi poor"><Icon name="tri" className="gold" /><div>Improvement required<b>{scores(inPeriod).length - good}</b><span className="muted small">Score below 80</span></div></div>
        {credits !== null && <div className="card kpi"><Icon name="coin" className="blue" /><div>Available credits<b>{credits}</b><Link href="/app/billing">Buy more credits →</Link></div></div>}
      </div>
      <div className="g2">
        <div className="card"><div className="row between"><h2>SEO analysis activity</h2><span className="small"><span className="lg b">■</span> Checked <span className="lg o">●</span> Average score</span></div><ActivityChart buckets={buckets} /></div>
        <CheckAnother asinEnabled={asinEnabled} />
      </div>
      <div className="g2">
        <div className="card"><div className="row between"><h2>Recent reports</h2><Link href="/app/reports">View all reports →</Link></div><ReportTable reports={reports.slice(0, 5)} /></div>
        <div className="card"><h2>Top improvement areas</h2>{worst.length === 0 ? <p className="muted small">Appears with your next full report.</p> : worst.map((w) => <div className="imp" key={w.name}><span>{w.name}</span><i><u className={`bg-${band(w.percent)}`} style={{ width: `${w.percent}%` }} /></i><b>{w.percent}%</b></div>)}</div>
      </div>
    </>
  );
}
