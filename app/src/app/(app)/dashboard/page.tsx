import Link from "next/link";
import { Sparkles, BarChart3, History, CalendarRange } from "lucide-react";
import { requireUser, toSafeUser } from "@/lib/auth";
import { getDb, type GenerationRow } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { getUsageSnapshot } from "@/lib/usage";
import { UsageMeter } from "@/components/usage-meter";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const u = await requireUser();
  const user = toSafeUser(u);
  const planId = (u.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[planId];
  const usage = getUsageSnapshot(u.id, planId);
  const db = getDb();
  const recent = db
    .prepare(
      `SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
    )
    .all(u.id) as GenerationRow[];

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total, AVG(score) AS avg_score
       FROM generations WHERE user_id = ?`,
    )
    .get(u.id) as { total: number; avg_score: number | null };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome back{user.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="text-muted mt-1">
            You're on the{" "}
            <span className="text-primary-400 font-medium uppercase">
              {plan.name}
            </span>{" "}
            plan. Let's ship the next reel.
          </p>
        </div>
        <Link href="/generate" className="btn btn-primary">
          <Sparkles className="w-4 h-4" /> Generate now
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Total generations" value={totals.total ?? 0} icon={Sparkles} />
        <Stat
          label="Average score"
          value={Math.round(totals.avg_score ?? 0) || "—"}
          icon={BarChart3}
        />
        <Stat
          label="High-virality (≥80)"
          value={
            db
              .prepare(
                `SELECT COUNT(*) AS c FROM generations WHERE user_id = ? AND score >= 80`,
              )
              .get(u.id) as { c: number }
              ? (
                  db
                    .prepare(
                      `SELECT COUNT(*) AS c FROM generations WHERE user_id = ? AND score >= 80`,
                    )
                    .get(u.id) as { c: number }
                ).c
              : 0
          }
          icon={CalendarRange}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-4 h-4" /> Recent generations
          </h2>
          {recent.length === 0 ? (
            <div className="card p-8 text-center text-muted">
              <p className="mb-4">No generations yet. Run your first one — it takes ~1 second.</p>
              <Link href="/generate" className="btn btn-primary">
                Generate your first reel
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="card p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.topic}</p>
                    <p className="text-sm text-muted truncate">{r.hook}</p>
                    <div className="flex gap-2 mt-1.5 text-xs">
                      <span className="chip">{r.niche}</span>
                      <span className="chip">{r.platform}</span>
                      <span className="text-muted">
                        {formatRelative(r.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {plan.features.viralScore && (
                      <div className="text-2xl font-semibold text-primary-400">
                        {r.score}
                      </div>
                    )}
                    <Link
                      href={`/history`}
                      className="text-xs text-muted hover:text-white"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <UsageMeter usage={usage} />
          <div className="card p-4">
            <h3 className="text-sm font-medium mb-2">Plan</h3>
            <div className="text-2xl font-semibold mb-1">
              ${plan.price}
              <span className="text-sm text-muted font-normal">/mo</span>
            </div>
            <p className="text-sm text-muted mb-3">{plan.blurb}</p>
            <Link href="/pricing" className="btn btn-secondary w-full">
              {plan.id === "agency" ? "Manage plan" : "Upgrade"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
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
