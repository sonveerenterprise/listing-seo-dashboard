import AppShell from "@/components/AppShell";
import { requireUserId, meFor } from "@/lib/session";

export const metadata = { title: "Account" };

export default async function Account() {
  const userId = await requireUserId();
  const me = await meFor(userId);
  return (
    <AppShell userId={userId} page="account">
      <div className="pagehead"><h1>Account</h1></div>
      <div className="card narrow row between">
        <div><b>Signed in with Google</b><div className="muted">{me.email ?? ""}</div></div>
        <form action="/auth/signout" method="post"><button className="btn2">Sign out</button></form>
      </div>
    </AppShell>
  );
}
