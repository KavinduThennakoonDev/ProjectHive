import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/token";
import type { AdminDTO } from "@/lib/types";

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Returns the logged-in admin, or null. The session is checked against the
 * database on every request, so deleted admins and changed passwords take
 * effect immediately. Never returns the password hash.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminDTO | null> => {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, name: true, email: true, sessionVersion: true },
  });
  if (!admin || admin.sessionVersion !== session.sessionVersion) return null;

  return { id: admin.id, name: admin.name, email: admin.email };
});

/** For pages: redirects to the login page when nobody is logged in. */
export async function requireAdmin(): Promise<AdminDTO> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}
