import { requireUser, toSafeUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { PricingClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const u = await requireUser();
  const safe = toSafeUser(u);
  return (
    <PricingClient
      currentPlan={safe.plan}
      stripeEnabled={!!process.env.STRIPE_SECRET_KEY}
      plans={PLANS}
    />
  );
}
