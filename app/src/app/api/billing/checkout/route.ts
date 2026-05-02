import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { jsonError } from "@/lib/utils";

const bodySchema = z.object({
  plan: z.enum(["free", "starter", "pro", "agency"]),
});

/**
 * Mock checkout. In production, swap this for a Stripe Checkout Session
 * (using STRIPE_SECRET_KEY + STRIPE_PRICE_*). For now we flip the user's
 * plan in-place so the rest of the app is fully exercisable end-to-end.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid plan", 400);

  const newPlan = parsed.data.plan;
  if (!PLAN_ORDER.includes(newPlan)) return jsonError("Unknown plan", 400);

  const db = getDb();
  const now = Date.now();
  const renews = now + 30 * 24 * 60 * 60 * 1000;

  db.prepare(
    `UPDATE users SET plan = ?, plan_renews_at = ?, updated_at = ? WHERE id = ?`,
  ).run(newPlan, newPlan === "free" ? null : renews, now, user.id);

  return Response.json({
    ok: true,
    plan: PLANS[newPlan],
    mock: !process.env.STRIPE_SECRET_KEY,
  });
}
