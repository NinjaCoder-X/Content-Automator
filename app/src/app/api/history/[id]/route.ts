import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, type GenerationRow } from "@/lib/db";
import { jsonError, safeParseJson } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const id = Number(params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id", 400);
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM generations WHERE id = ? AND user_id = ?`)
    .get(id, user.id) as GenerationRow | undefined;
  if (!row) return jsonError("Not found", 404);
  return Response.json({
    item: {
      id: row.id,
      niche: row.niche,
      platform: row.platform,
      topic: row.topic,
      hook: row.hook,
      script: row.script,
      loopEnding: row.loop_ending,
      breakdown: safeParseJson(row.breakdown, []),
      caption: row.caption,
      hashtags: safeParseJson<string[]>(row.hashtags, []),
      score: safeParseJson(row.score_breakdown, {
        hook: 0,
        emotion: 0,
        retention: 0,
        shareability: 0,
        total: row.score,
      }),
      watermarked: !!row.watermarked,
      createdAt: row.created_at,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const id = Number(params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id", 400);
  const db = getDb();
  db.prepare(`DELETE FROM generations WHERE id = ? AND user_id = ?`).run(
    id,
    user.id,
  );
  return Response.json({ ok: true });
}
