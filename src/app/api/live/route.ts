// Dashboard liveness for the hosting platform's health check: the process is up and passed its startup check.
// Doesn't call the core, so a core outage doesn't make the platform restart the dashboard. Reveals nothing.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
