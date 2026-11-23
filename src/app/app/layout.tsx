import { redirect } from "next/navigation";
import { validUser } from "@/lib/session";
// Each app page renders its own <AppShell> (sidebar + ASIN box) so the sidebar can show the open report's sections.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await validUser())) redirect("/login");
  return <>{children}</>;
}
