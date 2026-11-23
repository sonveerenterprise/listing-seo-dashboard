import Link from "next/link";
import AsinBox from "./AsinBox";
import type { SectionView } from "@/contract";

export interface ReportNav {
  id: string;
  label: string;
  marketplace: string;
  asin?: string | null;
  locked: boolean;
  sections: Pick<SectionView, "id" | "label" | "group" | "count">[];
  active: string;
}

export interface FrameProps {
  appName: string;
  page?: string;
  report?: ReportNav;
  recent: { id: string; name: string; score: number | null }[];
  billing: boolean;
  byok: boolean;
  credits: number | null;
  /** Show the "no credits" banner. */
  lowCredits: boolean;
  freeLeft: number;
  freePerMonth: number;
  asinEnabled: boolean;
  /** Pre-fill the ASIN box (e.g. from a downloaded report's "Check ASIN" link). */
  prefill?: { asin?: string; marketplace?: string };
  /** Sign-out control (a server-action form in the app). */
  account?: React.ReactNode;
  children: React.ReactNode;
}

/** Pure layout of the app (no data access) — OpenSEO-style sidebar, banner and ASIN box. */
export default function ShellFrame(p: FrameProps) {
  const { report } = p;
  const groups = report ? [...new Set(report.sections.map((s) => s.group))] : [];
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/app" className="brand">🔎 {p.appName}</Link>

        <details className="switcher">
          <summary>
            <span><b>{report ? report.label : "Choose a report"}</b><br /><span className="muted small">{report ? report.marketplace : `${p.recent.length} recent`}</span></span>
          </summary>
          <div className="menu">
            {p.recent.map((r) => (
              <Link key={r.id} href={`/app/reports/${r.id}`}>{r.name} <span className="muted small">{r.score ?? "–"}</span></Link>
            ))}
            <Link href="/app/new">+ Paste a listing</Link>
          </div>
        </details>

        {report ? (
          groups.map((g) => (
            <div key={g}>
              <div className="navhead">{g}</div>
              {report.sections.filter((s) => s.group === g).map((s) => (
                <Link key={s.id} href={`/app/reports/${report.id}?s=${s.id}`} className={`navitem ${report.active === s.id ? "on" : ""}`}>
                  <span>{s.label}</span>
                  {s.count > 0 && <span className="badge">{s.count}</span>}
                </Link>
              ))}
            </div>
          ))
        ) : (
          <>
            <div className="navhead">Overview</div>
            <Link href="/app" className={`navitem ${p.page === "dashboard" ? "on" : ""}`}>Dashboard</Link>
            <Link href="/app/new" className={`navitem ${p.page === "new" ? "on" : ""}`}>Paste a listing</Link>
          </>
        )}

        <div className="sidefoot">
          {report && <Link href="/app" className="navitem">All reports</Link>}
          {p.billing && <Link href="/app/billing" className={`navitem ${p.page === "billing" ? "on" : ""}`}><span>Billing</span>{p.credits !== null && <span className="badge plain">{p.credits} cr</span>}</Link>}
          {p.billing && p.byok && <Link href="/app/settings" className={`navitem ${p.page === "settings" ? "on" : ""}`}>Settings</Link>}
          <Link href="/contact" className="navitem">Help</Link>
          {p.account}
        </div>
      </aside>

      <div className="mainpane">
        {p.lowCredits && (
          <div className="banner">
            {report?.locked
              ? <>You&apos;re viewing a free preview. <Link href="/pricing">Buy a full report</Link> to see every problem, the rewrite and A+ plans.</>
              : <>You have no credits — new ASINs get a free preview ({p.freeLeft} of {p.freePerMonth} left this month). <Link href="/pricing">Buy credits</Link> for full reports.</>}
          </div>
        )}
        <div className="topbar">
          <AsinBox enabled={p.asinEnabled} defaultAsin={p.prefill?.asin} defaultMarketplace={p.prefill?.marketplace ?? report?.marketplace} />
        </div>
        <main className="content">{p.children}</main>
      </div>
    </div>
  );
}
