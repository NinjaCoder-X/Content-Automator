"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { PLAN_ORDER, type Plan, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingClient({
  currentPlan,
  stripeEnabled,
  plans,
}: {
  currentPlan: string;
  stripeEnabled: boolean;
  plans: Record<PlanId, Plan>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function choose(id: PlanId) {
    setBusy(id);
    setMsg(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: id }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Failed to switch plan");
      return;
    }
    setMsg(
      stripeEnabled
        ? "Plan updated."
        : `Plan switched to ${plans[id].name} (demo mode — wire STRIPE_SECRET_KEY for real billing).`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="text-muted mt-1">
          {stripeEnabled
            ? "Pick a plan. Billing is handled by Stripe."
            : "Demo mode — selecting a plan instantly flips your account so you can try every gated feature."}
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {PLAN_ORDER.map((id) => {
          const p = plans[id];
          const featured = id === "pro";
          const isCurrent = currentPlan === id;
          return (
            <div
              key={id}
              className={cn(
                "card p-6 flex flex-col",
                featured && "border-primary-500/40 shadow-glow",
                isCurrent && "ring-1 ring-primary-500/40",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {p.name}
                </span>
                {featured && <span className="chip">Most popular</span>}
                {isCurrent && <span className="chip">Current</span>}
              </div>
              <div className="text-3xl font-semibold mb-1">
                ${p.price}
                <span className="text-sm text-muted font-normal">/mo</span>
              </div>
              <p className="text-sm text-muted mb-4">{p.blurb}</p>
              <ul className="text-sm space-y-2 mb-6 flex-1">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={busy !== null || isCurrent}
                onClick={() => choose(id)}
                className={cn(
                  "btn",
                  featured ? "btn-primary" : "btn-secondary",
                  isCurrent && "opacity-50",
                )}
              >
                {isCurrent
                  ? "Active"
                  : busy === id
                    ? "Switching…"
                    : p.price === 0
                      ? "Switch to free"
                      : `Upgrade to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {msg && (
        <div className="card p-4 text-sm text-primary-400">{msg}</div>
      )}
    </div>
  );
}
