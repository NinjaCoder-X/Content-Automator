import { requireUser, toSafeUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const u = await requireUser();
  const user = toSafeUser(u);
  const planId = (u.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[planId];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted mt-1">Account and plan details.</p>
      </div>

      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <Row label="Name" value={user.name || "—"} />
        <Row label="Email" value={user.email} />
        <Row label="Member since" value={formatDate(user.created_at)} />
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Plan</h2>
        <Row label="Current plan" value={plan.name} />
        <Row
          label="Monthly limit"
          value={
            plan.monthlyGenerations === -1
              ? "Unlimited"
              : `${plan.monthlyGenerations} generations`
          }
        />
        <Row
          label="Daily limit"
          value={
            plan.dailyGenerations === -1
              ? "Unlimited"
              : `${plan.dailyGenerations} generations`
          }
        />
        <Row
          label="Renews"
          value={
            user.plan_renews_at ? formatDate(user.plan_renews_at) : "—"
          }
        />
        <a href="/pricing" className="btn btn-secondary w-fit mt-2">
          Change plan
        </a>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-2">Danger zone</h2>
        <p className="text-sm text-muted mb-4">
          Need to step away? You can sign out from any page using the sidebar.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
