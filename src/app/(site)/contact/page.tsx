import { LegalPage, BIZ } from "@/components/Legal";
export const metadata = { title: "Contact" };
export default function C() {
  return (
    <LegalPage title="Contact us">
      <p><b>{BIZ.name}</b><br />{BIZ.address}</p>
      <p>Email: {BIZ.email}{BIZ.phone ? <><br />Phone: {BIZ.phone}</> : null}</p>
      <p>We reply within 2 working days.</p>
    </LegalPage>
  );
}
