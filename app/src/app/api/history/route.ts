import { getCurrentUser } from "@/lib/auth";
import { getDb, type GenerationRow } from "@/lib/db";
import { jsonError, safeParseJson } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`,
    )
    .all(user.id) as GenerationRow[];

  const items = rows.map((r) => ({
    id: r.id,
    niche: r.niche,
    platform: r.platform,
    topic: r.topic,
    hook: r.hook,
    script: r.script,
    loopEnding: r.loop_ending,
    breakdown: safeParseJson(r.breakdown, []),
    caption: r.caption,
    hashtags: safeParseJson<string[]>(r.hashtags, []),
    score: safeParseJson(r.score_breakdown, {
      hook: 0,
      emotion: 0,
      retention: 0,
      shareability: 0,
      total: r.score,
    }),
    watermarked: !!r.watermarked,
    createdAt: r.created_at,
  }));

  return Response.json({ items });
}
