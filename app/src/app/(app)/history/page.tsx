import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb, type GenerationRow } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { safeParseJson } from "@/lib/utils";
import { GenerationCard, type Generation } from "@/components/generation-card";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const u = await requireUser();
  const planId = (u.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[planId];
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    )
    .all(u.id) as GenerationRow[];

  const items: Generation[] = rows.map((r) => ({
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">History</h1>
          <p className="text-muted mt-1">
            Every script and shot list you've generated.
          </p>
        </div>
        {plan.features.exports && (
          <div className="flex gap-2">
            <a
              href="/api/history/export?format=json"
              className="btn btn-secondary"
            >
              Export JSON
            </a>
            <a
              href="/api/history/export?format=csv"
              className="btn btn-secondary"
            >
              Export CSV
            </a>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted mb-4">Nothing here yet.</p>
          <Link href="/generate" className="btn btn-primary">
            <Sparkles className="w-4 h-4" /> Generate your first reel
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((g) => (
            <GenerationCard
              key={g.id}
              g={g}
              showScore={plan.features.viralScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
