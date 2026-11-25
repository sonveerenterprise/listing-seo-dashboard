import Link from "next/link";

/** Logo and name. A name ending in "SEO" gets the two-colour treatment. */
export default function Brand({ name, href }: { name: string; href: string }) {
  const seo = name.endsWith("SEO");
  return (
    <Link href={href} className="brandmark">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="6" fill="#ff8a00" /><path d="M6 18v-4M11 18v-7M16 18V8" stroke="#0f1b2d" strokeWidth="3" strokeLinecap="round" /><circle cx="20" cy="7" r="2.400" fill="#0f1b2d" /></svg>
      <span>{seo ? <>{name.slice(0, -3)}<em>SEO</em></> : name}</span>
    </Link>
  );
}
