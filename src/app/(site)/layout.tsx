import Link from "next/link";
import { publicConfig as config } from "@/lib/public-config";
import { currentUserId } from "@/lib/session";
import Brand from "@/components/Brand";

// Public pages (home, pricing, legal, free check, login): marketing header and footer.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserId().catch(() => null);
  return (
    <>
      <header className="top">
        <div className="wrap">
          <Brand name={config.appName} href="/" />
          <nav>
            <Link href="/check">Check a listing</Link>
            {config.billingEnabled && <Link href="/pricing">Pricing</Link>}
            {userId ? <Link className="cta" href="/app">Dashboard</Link> : <Link className="cta" href="/login">Sign in</Link>}
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
