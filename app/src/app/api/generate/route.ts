import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generate } from "@/lib/engine";
import { NICHES, PLATFORMS, type Niche, type Platform } from "@/lib/engine/data";
import { isNicheAllowed, PLANS } from "@/lib/plans";
import { getUsageSnapshot, recordUsage } from "@/lib/usage";
import { jsonError } from "@/lib/utils";

const bodySchema = z.object({
  niche: z.enum(NICHES),
  platform: z.enum(PLATFORMS),
  topicHint: z.string().max(200).optional(),
});

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
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues.map((i) => i.message).join("; "),
      400,
    );
  }

  const planId = (user.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[planId];

  if (!isNicheAllowed(planId, parsed.data.niche)) {
    return jsonError(
      `The "${parsed.data.niche}" niche requires Starter or higher.`,
      402,
    );
  }

  const usage = getUsageSnapshot(user.id, planId);
  if (usage.blocked) {
    return Response.json(
      { error: usage.reason ?? "Quota exceeded", usage },
      { status: 429 },
    );
  }

  const result = generate({
    niche: parsed.data.niche as Niche,
    platform: parsed.data.platform as Platform,
    topicHint: parsed.data.topicHint,
    watermark: plan.features.watermark,
  });

  // Strip the score for plans that don't include it (UI hides it anyway).
  const persistedScore = plan.features.viralScore
    ? result.score
    : { ...result.score, total: 0 };

  const db = getDb();
  const now = Date.now();
  const insert = db
    .prepare(
      `INSERT INTO generations
        (user_id, niche, platform, topic, hook, script, loop_ending,
         breakdown, caption, hashtags, score, score_breakdown, watermarked, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      user.id,
      result.niche,
      result.platform,
      result.topic,
      result.hook,
      result.script,
      result.loopEnding,
      JSON.stringify(result.breakdown),
      result.caption,
      JSON.stringify(result.hashtags),
      persistedScore.total,
      JSON.stringify(persistedScore),
      result.watermarked ? 1 : 0,
      now,
    );

  recordUsage(user.id, "generate", {
    niche: result.niche,
    platform: result.platform,
  });

  const newUsage = getUsageSnapshot(user.id, planId);

  return Response.json({
    id: Number(insert.lastInsertRowid),
    generation: {
      ...result,
      // Replace score with the persisted (possibly stripped) version so the
      // UI matches what the plan sees.
      score: persistedScore,
    },
    usage: newUsage,
  });
}
