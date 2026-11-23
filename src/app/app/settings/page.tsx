import { redirect } from "next/navigation";
import { publicConfig as config } from "@/lib/public-config";
import { requireUserId } from "@/lib/session";
import { core } from "@/core";
import KeyForm from "@/components/KeyForm";
import AppShell from "@/components/AppShell";

export const metadata = { title: "Settings" };

// The saved key stays in the core; the dashboard only ever sees its masked form.
export default async function Settings() {
  if (!config.billingEnabled || !config.byokEnabled) redirect("/app");
  const user = await requireUserId();
  const k = await core.getKey(user);
  if (!k.ok) redirect(k.status === 401 ? "/login" : "/app");
  return (
    <AppShell userId={user} page="settings">
    <div style={{ maxWidth: 720 }}>
      <h1>Settings</h1>
      <h2>Use your own Anthropic key</h2>
      <p>
        Add your own key and every analysis gives you the <b>full report for free</b> — you pay Anthropic directly for the tokens
        (model: <code>{config.model}</code>).{config.cost.asinFetch > 0 && <> Fetching a listing by ASIN still uses {config.cost.asinFetch} credit, because that lookup runs on our data provider.</>}
      </p>
      <p className="muted">
        Your key is checked with Anthropic, then stored encrypted (AES-256-GCM). It is only used for analyses you start, and you can remove it any time.
        Tip: create a separate key with a spending limit at console.anthropic.com.
      </p>
      <KeyForm masked={k.data.masked} />
    </div>
    </AppShell>
  );
}
