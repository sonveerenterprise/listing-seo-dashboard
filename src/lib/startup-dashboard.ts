// Dashboard startup check: run once when the server starts (src/instrumentation.ts). If the configuration is unusable
// the process refuses to start instead of failing on the first request. Only setting NAMES and reasons are reported,
// never values.
import { optsFromEnv, assertSecureCoreUrl } from "@/core/http";
import { appBase } from "@/lib/auth-cookies";

/** Problems with the dashboard's environment; empty = OK. */
export function dashboardConfigProblems(): string[] {
  const problems: string[] = [];
  const attempt = (label: string, fn: () => unknown) => {
    try {
      fn();
    } catch (err) {
      problems.push(`${label}: ${err instanceof Error ? err.message : "invalid"}`);
    }
  };
  if (!process.env.CORE_URL) problems.push("CORE_URL: not set (the dashboard needs the core service)");
  else attempt("core connection", () => optsFromEnv()); // https-only CORE_URL, signing key, no core-only secrets
  attempt("CORE_PUBLIC_URL", () => assertSecureCoreUrl(process.env.CORE_PUBLIC_URL));
  attempt("APP_URL", () => {
    if (!process.env.APP_URL) throw new Error("not set");
    appBase();
  });
  return problems;
}

/** Logs and exits when the configuration is unusable. */
export function runDashboardStartup(): void {
  const problems = dashboardConfigProblems();
  if (problems.length) {
    console.error(`dashboard: startup check failed — refusing to start:\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  console.log("dashboard: startup check passed");
}
