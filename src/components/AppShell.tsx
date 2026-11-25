import { publicConfig as config } from "@/lib/public-config";
import { meFor } from "@/lib/session";
import ShellFrame from "./ShellFrame";

/** Loads the signed-in user's data (via the core API) and renders the app frame. */
export default async function AppShell({ userId, page, prefill, children }: { userId: string; page?: string; prefill?: { asin?: string; marketplace?: string }; children: React.ReactNode }) {
  const me = await meFor(userId);
  return (
    <ShellFrame appName={config.appName} page={page} billing={me.billing} credits={me.credits} asinEnabled={me.asinEnabled} email={me.email} prefill={prefill}>
      {children}
    </ShellFrame>
  );
}
