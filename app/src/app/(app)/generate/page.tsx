import { requireUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { getUsageSnapshot } from "@/lib/usage";
import { GenerateClient } from "./client";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const u = await requireUser();
  const planId = (u.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[planId];
  const usage = getUsageSnapshot(u.id, planId);
  return <GenerateClient plan={plan} initialUsage={usage} />;
}
