import { NextRequest } from "next/server";
import {
  createSessionToken,
  loginSchema,
  setSessionCookie,
  toSafeUser,
  verifyPassword,
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
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid email or password", 400);

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(parsed.data.email.toLowerCase()) as UserRow | undefined;
  if (!user) return jsonError("Invalid email or password", 401);

  const ok = await verifyPassword(parsed.data.password, user.password_hash);
  if (!ok) return jsonError("Invalid email or password", 401);

  const token = await createSessionToken(user.id);
  setSessionCookie(token);
  return Response.json({ user: toSafeUser(user) });
}
