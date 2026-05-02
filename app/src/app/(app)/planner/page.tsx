import { requireUser } from "@/lib/auth";
import { getDb, type PlannerRow } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { PlannerClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const u = await requireUser();
  const planId = (u.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[planId];
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM planner_items WHERE user_id = ? ORDER BY day_offset ASC`,
    )
    .all(u.id) as PlannerRow[];
  const items = rows.map((r) => ({
    id: r.id,
    dayOffset: r.day_offset,
    niche: r.niche,
    platform: r.platform,
    hook: r.hook,
    angle: r.angle,
    cta: r.cta,
    done: !!r.done,
  }));
  return <PlannerClient initial={items} planAllows={plan.features.planner} />;
}
