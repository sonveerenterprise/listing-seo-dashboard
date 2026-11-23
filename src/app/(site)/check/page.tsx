import ListingForm from "@/components/ListingForm";
export const metadata = { title: "Free Amazon listing check" };
export default function Check() {
  return (
    <main className="wrap section" style={{ maxWidth: 820 }}>
      <h1>Free Amazon listing check</h1>
      <p className="muted">Instant rule checks — title limit, banned characters, repeated words, bullet format, price/contact in bullets, risky health and certification claims, backend bytes. Nothing is stored.</p>
      <ListingForm mode="check" />
    </main>
  );
}
