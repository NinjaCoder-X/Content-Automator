import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { jsonError } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const db = getDb();

  const totals = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         AVG(score) AS avg_score,
         SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END) AS high
       FROM generations WHERE user_id = ?`,
    )
    .get(user.id) as { total: number; avg_score: number | null; high: number };

  const byNiche = db
    .prepare(
      `SELECT niche, COUNT(*) AS c, AVG(score) AS s
       FROM generations WHERE user_id = ?
       GROUP BY niche ORDER BY c DESC`,
    )
    .all(user.id) as { niche: string; c: number; s: number | null }[];

  const byPlatform = db
    .prepare(
      `SELECT platform, COUNT(*) AS c
       FROM generations WHERE user_id = ?
       GROUP BY platform ORDER BY c DESC`,
    )
    .all(user.id) as { platform: string; c: number }[];

  // Last-14-day generation count series
  const dayBuckets: { date: string; count: number }[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 13; i >= 0; i -= 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setTime(start.getTime() - i * dayMs);
    const end = start.getTime() + dayMs;
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM generations
         WHERE user_id = ? AND created_at >= ? AND created_at < ?`,
      )
      .get(user.id, start.getTime(), end) as { c: number };
    dayBuckets.push({
      date: start.toISOString().slice(0, 10),
      count: row.c,
    });
  }

  const planId = (user.plan as keyof typeof PLANS) ?? "free";
  return Response.json({
    plan: PLANS[planId],
    totals: {
      total: totals.total,
      avgScore: Math.round(totals.avg_score ?? 0),
      high: totals.high,
    },
    byNiche: byNiche.map((r) => ({
      niche: r.niche,
      count: r.c,
      avgScore: Math.round(r.s ?? 0),
    })),
    byPlatform,
    series: dayBuckets,
  });
}
