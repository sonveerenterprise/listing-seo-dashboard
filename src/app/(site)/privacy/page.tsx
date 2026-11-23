import { LegalPage, BIZ } from "@/components/Legal";
export const metadata = { title: "Privacy Policy" };
export default function P() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we collect</h2><p>Your name, email and profile image from Google sign-in; listings you submit and the reports we generate; payment records (Razorpay processes card/UPI details — we never see them).</p>
      <h2>Who processes it</h2><p>Anthropic (AI analysis of the listing text and images you submit), DataForSEO (only when you fetch a listing by ASIN), Razorpay (payments), and our hosting provider. We don&apos;t sell your data.</p>
      <h2>The free check</h2><p>Free checks are processed in memory and not stored.</p>
      <h2>Retention and deletion</h2><p>Reports stay in your account until you ask us to delete them or your account. Email {BIZ.email}.</p>
      <h2>Your rights</h2><p>You may request access, correction or deletion of your personal data under India&apos;s Digital Personal Data Protection Act, 2023, by writing to {BIZ.email}.</p>
    </LegalPage>
  );
}
