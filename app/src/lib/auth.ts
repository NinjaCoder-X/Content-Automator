import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import { getDb, type UserRow } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me-in-production-please-12345",
);
const COOKIE = "acf_session";
const TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80).default(""),
  password: z.string().min(8).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(120),
});

export type SafeUser = {
  id: number;
  email: string;
  name: string;
  plan: string;
  plan_renews_at: number | null;
  created_at: number;
};

export function toSafeUser(u: UserRow): SafeUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    plan: u.plan,
    plan_renews_at: u.plan_renews_at,
    created_at: u.created_at,
  };
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSessionToken(userId: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SEC)
    .sign(SECRET);
}

export async function verifySessionToken(
  token: string,
): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const uid = (payload as { uid?: unknown }).uid;
    return typeof uid === "number" ? uid : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  const jar = cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SEC,
  });
}

export function clearSessionCookie() {
  const jar = cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const jar = cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const uid = await verifySessionToken(token);
  if (!uid) return null;
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(uid) as UserRow | undefined;
  return row ?? null;
}

export async function requireUser(): Promise<UserRow> {
  const u = await getCurrentUser();
  if (!u) throw new AuthError("Not authenticated");
  return u;
}

export class AuthError extends Error {
  status = 401;
}

export const SESSION_COOKIE_NAME = COOKIE;
