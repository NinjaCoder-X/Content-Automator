import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, type GenerationRow } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { jsonError, safeParseJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const planId = (user.plan as keyof typeof PLANS) ?? "free";
  if (!PLANS[planId].features.exports) {
    return jsonError("Exports are included in the Agency plan.", 402);
  }

  const fmt = req.nextUrl.searchParams.get("format") ?? "json";
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC`,
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
    score: r.score,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  if (fmt === "csv") {
    const headers = [
      "id",
      "createdAt",
      "niche",
      "platform",
      "topic",
      "hook",
      "score",
      "caption",
      "hashtags",
      "script",
      "loopEnding",
    ];
    const escape = (v: unknown) => {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      return `"${(s ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
    };
    const csv = [
      headers.join(","),
      ...items.map((it) =>
        [
          it.id,
          it.createdAt,
          it.niche,
          it.platform,
          it.topic,
          it.hook,
          it.score,
          it.caption,
          it.hashtags.join(" "),
          it.script,
          it.loopEnding,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ai-content-factory-${Date.now()}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify({ items }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ai-content-factory-${Date.now()}.json"`,
    },
  });
}
