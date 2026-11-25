import Link from "next/link";
import AsinBox from "./AsinBox";
import Brand from "./Brand";
import Icon from "./Icon";
import MenuButton from "./MenuButton";

export interface FrameProps {
  appName: string;
  page?: string;
  billing: boolean;
  credits: number | null;
  asinEnabled: boolean;
  email: string | null;
  /** Pre-fill the ASIN box (e.g. from a downloaded report's "Check ASIN" link). */
  prefill?: { asin?: string; marketplace?: string };
  children: React.ReactNode;
}

/** Pure layout of the app (no data access): top bar, left menu, content. */
export default function ShellFrame(p: FrameProps) {
  const item = (id: string, href: string, icon: string, label: string) => (
    <Link href={href} className="navitem" aria-current={p.page === id ? "page" : undefined}><Icon name={icon} />{label}</Link>
  );
  return (
    <>
      <header className="apptop">
        <MenuButton />
        <Brand name={p.appName} href="/app" />
        <span className="tagline">Listing SEO Analysis for Amazon sellers</span>
        {p.asinEnabled && <AsinBox variant="top" defaultAsin={p.prefill?.asin} defaultMarketplace={p.prefill?.marketplace} />}
        <div className="topright">
          <Link href="/contact" className="iconbtn" aria-label="Help"><Icon name="help" /></Link>
          {p.billing && p.credits !== null && <Link href="/app/billing" className="creditpill">Credits: <b>{p.credits}</b></Link>}
          <Link href="/app/account" className="avatar" aria-label="Account">{(p.email ?? "?").slice(0, 1).toUpperCase()}</Link>
        </div>
      </header>
      <div className="shell" id="shell">
        <nav className="side" aria-label="Main">
          {item("dashboard", "/app", "home", "Dashboard")}
          {item("new", "/app/new", "find", "Listing Analyzer")}
          {item("reports", "/app/reports", "doc", "My Reports")}
          <hr />
          {p.billing && item("billing", "/app/billing", "card", "Credits & Billing")}
          {item("account", "/app/account", "user", "Account")}
        </nav>
        <main className="content">{p.children}</main>
      </div>
    </>
  );
}
