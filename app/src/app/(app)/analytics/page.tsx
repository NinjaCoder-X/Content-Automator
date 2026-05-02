import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { BarChart3, TrendingUp, Award, Hash } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const u = await requireUser();
  const db = getDb();

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total, AVG(score) AS avg_score,
              SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END) AS high
       FROM generations WHERE user_id = ?`,
    )
    .get(u.id) as { total: number; avg_score: number | null; high: number };

  const byNiche = db
    .prepare(
      `SELECT niche, COUNT(*) AS c, AVG(score) AS s
       FROM generations WHERE user_id = ?
       GROUP BY niche ORDER BY c DESC`,
    )
    .all(u.id) as { niche: string; c: number; s: number | null }[];

  const byPlatform = db
    .prepare(
      `SELECT platform, COUNT(*) AS c
       FROM generations WHERE user_id = ?
       GROUP BY platform ORDER BY c DESC`,
    )
    .all(u.id) as { platform: string; c: number }[];

  const dayMs = 24 * 60 * 60 * 1000;
  const series: { date: string; count: number }[] = [];
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
      .get(u.id, start.getTime(), end) as { c: number };
    series.push({
      date: start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count: row.c,
    });
  }
  const max = Math.max(1, ...series.map((s) => s.count));
  const planId = (u.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[planId];
  const showScore = plan.features.viralScore;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="text-muted mt-1">
          See how your generated content stacks up.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={BarChart3} label="Total generations" value={totals.total ?? 0} />
        <Stat
          icon={TrendingUp}
          label="Average score"
          value={
            showScore ? Math.round(totals.avg_score ?? 0) || "—" : "Pro only"
          }
        />
        <Stat
          icon={Award}
          label="High-virality (≥80)"
          value={showScore ? totals.high ?? 0 : "Pro only"}
        />
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Last 14 days</h2>
        <div className="flex items-end gap-1 h-40">
          {series.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-primary-500 to-accent"
                style={{
                  height: `${(s.count / max) * 100}%`,
                  minHeight: s.count > 0 ? 4 : 0,
                }}
                title={`${s.count} generations`}
              />
              <span className="text-[10px] text-muted truncate w-full text-center">
                {s.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4" /> By niche
          </h2>
          {byNiche.length === 0 ? (
            <p className="text-sm text-muted">No data yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {byNiche.map((n) => (
                <li key={n.niche} className="flex items-center justify-between">
                  <span className="capitalize">{n.niche}</span>
                  <span className="text-sm">
                    {n.c} {showScore && <span className="text-muted ml-2">avg {Math.round(n.s ?? 0)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">By platform</h2>
          {byPlatform.length === 0 ? (
            <p className="text-sm text-muted">No data yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {byPlatform.map((p) => (
                <li
                  key={p.platform}
                  className="flex items-center justify-between"
                >
                  <span className="capitalize">{p.platform}</span>
                  <span className="text-sm">{p.c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary-500/15 text-primary-400 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
