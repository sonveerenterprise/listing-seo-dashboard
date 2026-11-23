import { LegalPage, BIZ } from "@/components/Legal";
export const metadata = { title: "Refund & Cancellation Policy" };
export default function R() {
  return (
    <LegalPage title="Refund & Cancellation Policy">
      <p>Credits are delivered instantly after payment; there is nothing to ship.</p>
      <ul>
        <li>If an analysis fails, its credits are returned to your account automatically.</li>
        <li>Unused credit packs can be refunded within 7 days of purchase. Partly used packs are refunded pro rata.</li>
        <li>If you were charged but received no credits, email {BIZ.email} with your Razorpay payment ID; we resolve this within 3 working days.</li>
        <li>Approved refunds go back to the original payment method within 5–7 working days.</li>
      </ul>
    </LegalPage>
  );
}
