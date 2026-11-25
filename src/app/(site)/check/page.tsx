import ListingForm from "@/components/ListingForm";

export const metadata = { title: "Check an Amazon listing" };

export default function Check() {
  return (
    <main className="wrap section narrow">
      <h1>Check your listing</h1>
      <p className="muted">Paste a listing to see its score meters. Nothing is stored.</p>
      <div className="card"><ListingForm mode="check" /></div>
    </main>
  );
}
