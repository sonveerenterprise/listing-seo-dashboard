import Link from "next/link";
import type { ReportSummary } from "@/contract/api";
import { band, dateIST } from "./format";

export default function ReportTable({ reports }: { reports: ReportSummary[] }) {
  return (
    <div className="tw">
      <table className="simple">
        <thead><tr><th>Product</th><th>ASIN</th><th>Score</th><th>Checked on</th><th>Action</th></tr></thead>
        <tbody>
          {reports.map((r) => {
            const full = r.unlocked && r.totalScore !== null;
            const n = full ? r.totalScore : (r.quickScore ?? null);
            return (
              <tr key={r.id}>
                <td>{(r.title ?? "").slice(0, 60) || "Listing"}</td>
                <td>{r.asin ?? "–"}</td>
                <td>{n === null ? "–" : <><span className={`scorepill ${band(n)}`}>{n}/100</span>{!full && <span className="muted small"> quick</span>}</>}</td>
                <td>{dateIST(r.createdAt)}</td>
                <td>
                  {r.status === "done"
                    ? <Link className={r.unlocked ? "btn2" : "cta small"} href={`/app/reports/${r.id}`}>{r.unlocked ? "View report" : "View & unlock"}</Link>
                    : r.status === "failed" ? <span className="bad small">Failed: {r.error ?? ""}</span> : <Link className="btn2" href={`/app/reports/${r.id}`}>Preparing…</Link>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
