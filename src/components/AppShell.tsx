import { publicConfig as config } from "@/lib/public-config";
import { meFor } from "@/lib/session";
import { core } from "@/core";
import ShellFrame, { type ReportNav } from "./ShellFrame";

/** Loads the signed-in user's data (via the core API) and renders the app frame. */
export default async function AppShell({ userId, page, report, prefill, children }: { userId: string; page?: string; report?: ReportNav; prefill?: { asin?: string; marketplace?: string }; children: React.ReactNode }) {
  const [recent, me] = await Promise.all([core.listReports(userId, { doneOnly: true, take: 12 }), meFor(userId)]);
  return (
    <ShellFrame
      appName={config.appName}
      page={page}
      report={report}
      recent={recent.map((r) => ({ id: r.id, name: r.asin ?? (r.title ?? "Listing").slice(0, 28), score: r.totalScore }))}
      billing={me.billing}
      byok={me.byok}
      credits={me.credits}
      lowCredits={me.billing && !me.ownKey && me.credits !== null && me.credits < me.cost.analysis}
      freeLeft={Math.max(0, me.freePerMonth - me.freeUsed)}
      freePerMonth={me.freePerMonth}
      asinEnabled={me.asinEnabled}
      prefill={prefill}
      account={
        <form action="/auth/signout" method="post">
          <button className="navitem linklike" title="Sign out">{me.email ?? "Sign out"} · Sign out</button>
        </form>
      }
    >
      {children}
    </ShellFrame>
  );
}
