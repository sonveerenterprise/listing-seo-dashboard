// TEMPLATE TEXT — review with your CA / lawyer before going live. Razorpay checks these pages during activation.
export const BIZ = {
  name: process.env.LEGAL_BUSINESS_NAME ?? "Sonveer Enterprise",
  address: process.env.LEGAL_ADDRESS ?? "Veraval, Gujarat, India",
  email: process.env.CONTACT_EMAIL ?? "support@example.com",
  phone: process.env.CONTACT_PHONE ?? "",
  updated: "18 November 2026",
};
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="wrap section legal" style={{ maxWidth: 780 }}>
      <h1>{title}</h1>
      <p className="muted">Last updated {BIZ.updated}. Operated by {BIZ.name}, {BIZ.address}.</p>
      {children}
    </main>
  );
}
