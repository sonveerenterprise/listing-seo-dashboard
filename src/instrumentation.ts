// Runs once when the dashboard server starts (not during `next build`): refuses to start when the configuration is
// unusable — missing or insecure CORE_URL / CORE_PUBLIC_URL / APP_URL, no signing key, or database / service secrets
// present (the dashboard must not hold them).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { runDashboardStartup } = await import("./lib/startup-dashboard");
  runDashboardStartup();
}
