import Link from "next/link";
import { publicConfig as config, CREDIT_PACKS, rupees } from "@/lib/public-config";
import { requireUserId } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { MARKETPLACES } from "@/contract";
import { core } from "@/core";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ asin?: string; mk?: string }> }) {
  const userId = await requireUserId();
  const q = await searchParams;
  const asin = /^[A-Za-z0-9]{10}$/.test(q.asin ?? "") ? q.asin!.toUpperCase() : undefined;
  const marketplace = MARKETPLACES.some((m) => m.id === q.mk) ? q.mk : undefined;
  const reports = await core.listReports(userId, { take: 50 });
  return (
    <AppShell userId={userId} page="dashboard" prefill={{ asin, marketplace }}>
      <div className="pagehead">
        <div>
          <h1>Your ASINs</h1>
          <p className="muted">Enter an ASIN above to get its Listing SEO Score, then open each section for problems and solutions.</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="panel">
          <h3>Get started</h3>
          <ol className="steps">
            <li><b>Enter an ASIN</b> in the box above — or <Link href="/app/new">paste a listing</Link> that isn&apos;t live yet.</li>
            <li><b>See your score</b> and one suggestion per section{config.billingEnabled ? " for free" : ""}.</li>
            <li><b>Open each section</b> on the left — title, bullets, A+ Basic, A+ Premium and more — for the problem and the fix.</li>
            {config.billingEnabled && <li><b>Unlock the full report</b> for {CREDIT_PACKS.map((p) => `${rupees(p.pricePaise)} (${p.name})`).join(" or ")}.</li>}
          </ol>
        </div>
      ) : (
        <div className="panel">
          <div className="tw">
            <table className="simple">
              <thead><tr><th>ASIN / title</th><th>Marketplace</th><th>Score</th><th>Access</th><th>Date</th></tr></thead>
              <tbody>
                {reports.map((r) => {
                  const name = r.asin ?? (r.title ?? "").slice(0, 60);
                  return (
                    <tr key={r.id}>
                      <td>{r.status === "done" ? <Link href={`/app/reports/${r.id}`}>{name}</Link> : name}</td>
                      <td>{r.marketplace}</td>
                      <td><b>{r.totalScore ?? "–"}</b></td>
                      <td>{r.status === "done" ? (r.unlocked ? "Full report" : "🔒 Free preview") : r.status === "failed" ? `Failed — ${r.error ?? ""}` : "Running…"}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
