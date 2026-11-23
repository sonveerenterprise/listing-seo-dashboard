import { currentUserId } from "@/lib/session";
import { core } from "@/core";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return new Response("Please sign in", { status: 401 });
  const { id } = await params;
  const r = await core.download(userId, id);
  if (!r.ok) return new Response(r.error, { status: r.status });
  // Defensive: a safe filename even if the core ever sent an odd one, no MIME sniffing, and a sandbox policy so the
  // report's own scripts can never run in the dashboard's origin if a browser or proxy shows it inline.
  const filename = r.data.filename.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 120) || "listing_seo_report.html";
  return new Response(r.data.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
