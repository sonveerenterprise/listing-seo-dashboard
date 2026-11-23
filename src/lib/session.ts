// Who is signed in. Sign-in happens only at the core; the browser holds the
// core-issued access and refresh tokens in httpOnly cookies and the dashboard forwards the access token. The
// dashboard never decides who the user is and has no database, NextAuth or local-user mode.
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Unauthorized } from "@/core/errors";
import { core } from "@/core";
import type { UserRef } from "@/contract/api";
import { names } from "./auth-cookies";

/** The access token from the cookie (contract `UserRef`), or null. Not verified here — the core verifies it. */
export async function currentUserId(): Promise<UserRef | null> {
  return (await cookies()).get(names().access)?.value || null;
}

/** core.me once per request (React cache) — shared by the session checks and AppShell. */
export const meFor = cache((ref: UserRef) => core.me(ref));

/** The signed-in user, checked by the core: a revoked session or an expired token gives null, not an error page. */
export async function validUser(): Promise<UserRef | null> {
  const ref = await currentUserId();
  if (!ref) return null;
  try {
    await meFor(ref);
    return ref;
  } catch (err) {
    if (err instanceof Unauthorized) return null;
    throw err;
  }
}

/**
 * For pages under /app: the signed-in user, or a redirect to /login.
 * Each page checks for itself — Next.js renders layouts and pages in parallel, so a layout redirect alone isn't enough.
 */
export async function requireUserId(): Promise<UserRef> {
  const id = await validUser();
  if (!id) redirect("/login");
  return id;
}
