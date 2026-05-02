import { NextRequest } from "next/server";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
  signupSchema,
  toSafeUser,
} from "@/lib/auth";
import { getDb, type UserRow } from "@/lib/db";
import { jsonError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues.map((i) => i.message).join("; "),
      400,
    );
  }
  const { email, name, password } = parsed.data;
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);
  if (existing) return jsonError("Email already in use", 409);

  const hash = await hashPassword(password);
  const now = Date.now();
  const result = db
    .prepare(
      `INSERT INTO users (email, name, password_hash, plan, created_at, updated_at)
       VALUES (?, ?, ?, 'free', ?, ?)`,
    )
    .run(email.toLowerCase(), name ?? "", hash, now, now);

  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(result.lastInsertRowid) as UserRow;

  const token = await createSessionToken(user.id);
  setSessionCookie(token);

  return Response.json({ user: toSafeUser(user) });
}
