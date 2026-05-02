import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb, type PlannerRow } from "@/lib/db";
import { generatePlanner } from "@/lib/engine";
import { NICHES, PLATFORMS, type Niche, type Platform } from "@/lib/engine/data";
import { PLANS } from "@/lib/plans";
import { jsonError } from "@/lib/utils";

const generateSchema = z.object({
  niches: z.array(z.enum(NICHES)).optional(),
  platforms: z.array(z.enum(PLATFORMS)).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM planner_items WHERE user_id = ? ORDER BY day_offset ASC`,
    )
    .all(user.id) as PlannerRow[];
  return Response.json({
    items: rows.map((r) => ({
      id: r.id,
      dayOffset: r.day_offset,
      niche: r.niche,
      platform: r.platform,
      hook: r.hook,
      angle: r.angle,
      cta: r.cta,
      done: !!r.done,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const planId = (user.plan as keyof typeof PLANS) ?? "free";
  if (!PLANS[planId].features.planner) {
    return jsonError(
      "The 7-day content planner is included in Pro and Agency.",
      402,
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request", 400);

  const items = generatePlanner({
    niches: parsed.data.niches as Niche[] | undefined,
    platforms: parsed.data.platforms as Platform[] | undefined,
  });

  const db = getDb();
  const now = Date.now();
  const tx = db.transaction((rows: typeof items) => {
    db.prepare("DELETE FROM planner_items WHERE user_id = ?").run(user.id);
    const insert = db.prepare(
      `INSERT INTO planner_items
        (user_id, day_offset, niche, platform, hook, angle, cta, done, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    );
    for (const r of rows) {
      insert.run(
        user.id,
        r.dayOffset,
        r.niche,
        r.platform,
        r.hook,
        r.angle,
        r.cta,
        now,
      );
    }
  });
  tx(items);

  return Response.json({ items });
}
