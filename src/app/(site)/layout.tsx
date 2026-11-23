import Link from "next/link";
import { publicConfig as config } from "@/lib/public-config";
import { currentUserId } from "@/lib/session";

// Public pages (home, pricing, legal, free check, login): marketing header and footer.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserId().catch(() => null);
  return (
    <>
      <header className="top">
        <div className="wrap">
          <Link href="/" className="logo">🔎 {config.appName}</Link>
          <nav>
            <Link href="/check">Free check</Link>
            {config.billingEnabled && <Link href="/pricing">Pricing</Link>}
            {userId ? <Link className="btn" href="/app">Dashboard</Link> : <Link className="btn" href="/login">Sign in</Link>}
          </nav>
        </div>
      </header>
      {children}
      <footer>
        <div className="wrap">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refund">Refunds</Link>
          <Link href="/contact">Contact</Link>
          <div style={{ marginTop: 8 }}>{config.appName} is an independent service and is not affiliated with Amazon.</div>
        </div>
      </footer>
    </>
  );
}
