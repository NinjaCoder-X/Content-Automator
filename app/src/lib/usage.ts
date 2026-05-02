import { getDb } from "./db";
import { getPlan, type PlanId } from "./plans";

const DAY_MS = 24 * 60 * 60 * 1000;

export type UsageSnapshot = {
  plan: PlanId;
  dayCount: number;
  monthCount: number;
  dailyLimit: number; // -1 = unlimited
  monthlyLimit: number; // -1 = unlimited
  dayRemaining: number; // Infinity if unlimited
  monthRemaining: number;
  blocked: boolean;
  reason?: string;
};

export function recordUsage(
  userId: number,
  kind: "generate" | "planner" | "export",
  metadata: Record<string, unknown> = {},
) {
  const db = getDb();
  db.prepare(
    "INSERT INTO usage_events (user_id, kind, metadata, created_at) VALUES (?, ?, ?, ?)",
  ).run(userId, kind, JSON.stringify(metadata), Date.now());
}

export function getUsageSnapshot(userId: number, planId: PlanId): UsageSnapshot {
  const db = getDb();
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMs = startOfDay.getTime();
  const startOfMonthMs = now - 30 * DAY_MS;

  const dayRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM usage_events
       WHERE user_id = ? AND kind = 'generate' AND created_at >= ?`,
    )
    .get(userId, startOfDayMs) as { c: number };

  const monthRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM usage_events
       WHERE user_id = ? AND kind = 'generate' AND created_at >= ?`,
    )
    .get(userId, startOfMonthMs) as { c: number };

  const plan = getPlan(planId);
  const dayCount = dayRow.c;
  const monthCount = monthRow.c;
  const dailyLimit = plan.dailyGenerations;
  const monthlyLimit = plan.monthlyGenerations;

  const dayRemaining =
    dailyLimit === -1 ? Infinity : Math.max(0, dailyLimit - dayCount);
  const monthRemaining =
    monthlyLimit === -1 ? Infinity : Math.max(0, monthlyLimit - monthCount);

  let blocked = false;
  let reason: string | undefined;
  if (dailyLimit !== -1 && dayCount >= dailyLimit) {
    blocked = true;
    reason = `Daily limit of ${dailyLimit} reached. Upgrade for more.`;
  } else if (monthlyLimit !== -1 && monthCount >= monthlyLimit) {
    blocked = true;
    reason = `Monthly limit of ${monthlyLimit} reached. Upgrade for more.`;
  }

  return {
    plan: plan.id,
    dayCount,
    monthCount,
    dailyLimit,
    monthlyLimit,
    dayRemaining,
    monthRemaining,
    blocked,
    reason,
  };
}
