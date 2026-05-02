import { getCurrentUser } from "@/lib/auth";
import { getUsageSnapshot } from "@/lib/usage";
import { PLANS } from "@/lib/plans";
import { jsonError } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const planId = (user.plan as keyof typeof PLANS) ?? "free";
  return Response.json({
    plan: PLANS[planId],
    usage: getUsageSnapshot(user.id, planId),
  });
}
