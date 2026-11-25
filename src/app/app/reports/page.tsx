import Link from "next/link";
import AppShell from "@/components/AppShell";
import ReportTable from "@/components/ReportTable";
import { requireUserId } from "@/lib/session";
import { core } from "@/core";

export const metadata = { title: "My Reports" };

export default async function Reports() {
  const userId = await requireUserId();
  const reports = await core.listReports(userId, { take: 100 });
  return (
    <AppShell userId={userId} page="reports">
      <div className="pagehead"><div><h1>My Reports</h1><p className="muted">Your latest 100 checks and reports</p></div><Link className="cta" href="/app/new">Check a listing</Link></div>
      <div className="card">{reports.length ? <ReportTable reports={reports} /> : <p className="muted">Nothing here yet. Check your first listing to see its score.</p>}</div>
    </AppShell>
  );
}
