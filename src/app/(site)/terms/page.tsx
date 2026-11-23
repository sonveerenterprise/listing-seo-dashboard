import { LegalPage, BIZ } from "@/components/Legal";
export const metadata = { title: "Terms of Service" };
export default function T() {
  return (
    <LegalPage title="Terms of Service">
      <h2>The service</h2><p>The service analyses Amazon product listings you provide and suggests improvements. Reports are generated automatically, partly by AI, and may contain errors. They are guidance, not legal, regulatory or compliance advice. You are responsible for what you publish on Amazon.</p>
      <h2>Accounts and credits</h2><p>Full analyses use prepaid credits. Credits have no cash value, are non-transferable and do not expire while the service operates. We may change prices for future purchases.</p>
      <h2>Acceptable use</h2><p>Don&apos;t submit content you don&apos;t have the right to use, attempt to overload or reverse-engineer the hosted service, or resell reports as a bulk service without written permission.</p>
      <h2>Not affiliated with Amazon</h2><p>Amazon and related marks belong to Amazon.com, Inc. or its affiliates. This service is independent.</p>
      <h2>Liability</h2><p>To the extent permitted by law, our total liability is limited to the amount you paid in the 3 months before the claim.</p>
      <h2>Law</h2><p>These terms are governed by the laws of India; courts in Gujarat have jurisdiction.</p>
      <p>Questions: {BIZ.email}</p>
    </LegalPage>
  );
}
