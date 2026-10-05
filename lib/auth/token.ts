import { SignJWT, jwtVerify } from "jose";

// Session tokens are signed JWTs kept in an httpOnly cookie. This file has no
// Next.js imports so it can be used from both proxy.ts and server code.

export const SESSION_COOKIE = "projecthive_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface SessionPayload {
  adminId: string;
  sessionVersion: number;
}

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. Set it in your .env file.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ v: payload.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.v !== "number") return null;
    return { adminId: payload.sub, sessionVersion: payload.v };
  } catch {
    return null;
  }
}
