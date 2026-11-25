import { redirect } from "next/navigation";
import { validUser } from "@/lib/session";
export const metadata = { title: "Sign in" };
// Sign-in happens at the core service: /auth/start sends the browser there.
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await validUser()) redirect("/app");
  const failed = (await searchParams).error === "signin";
  return (
    <main className="wrap section" style={{ maxWidth: 440, textAlign: "center" }}>
      <h1>Sign in</h1>
      <p className="muted">Save reports and run full analyses.</p>
      {failed && <p className="error">Sign-in didn&apos;t complete. Please try again.</p>}
      <form action="/auth/start" method="get">
        <button className="cta">Continue with Google</button>
      </form>
    </main>
  );
}
