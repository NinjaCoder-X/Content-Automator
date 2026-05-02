"use client";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export type Usage = {
  plan: string;
  dayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  blocked: boolean;
  reason?: string;
};

function pct(used: number, limit: number) {
  if (limit === -1) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function UsageMeter({ usage, compact }: { usage: Usage; compact?: boolean }) {
  const dayPct = pct(usage.dayCount, usage.dailyLimit);
  const monthPct = pct(usage.monthCount, usage.monthlyLimit);

  return (
    <div className={cn("card p-4", compact && "p-3")}>
      <div className="flex items-center gap-2 text-sm font-medium mb-3">
        <Gauge className="w-4 h-4 text-primary-400" />
        Usage this {usage.dailyLimit === -1 ? "month" : "day"}
      </div>
      {usage.dailyLimit !== -1 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>Today</span>
            <span>
              {usage.dayCount} / {usage.dailyLimit}
            </span>
          </div>
          <div className="progress">
            <span style={{ width: `${dayPct}%` }} />
          </div>
        </div>
      )}
      {usage.monthlyLimit !== -1 && (
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>This month</span>
            <span>
              {usage.monthCount} / {usage.monthlyLimit}
            </span>
          </div>
          <div className="progress">
            <span style={{ width: `${monthPct}%` }} />
          </div>
        </div>
      )}
      {usage.dailyLimit === -1 && usage.monthlyLimit === -1 && (
        <p className="text-sm text-muted">Unlimited generations.</p>
      )}
      {usage.blocked && (
        <p className="text-xs text-danger mt-3">{usage.reason}</p>
      )}
    </div>
  );
}
