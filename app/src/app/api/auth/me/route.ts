import { getCurrentUser, toSafeUser } from "@/lib/auth";
import { getUsageSnapshot } from "@/lib/usage";
import { PLANS } from "@/lib/plans";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ user: null });
  const usage = getUsageSnapshot(u.id, (u.plan as keyof typeof PLANS) ?? "free");
  return Response.json({
    user: toSafeUser(u),
    plan: PLANS[(u.plan as keyof typeof PLANS) ?? "free"],
    usage,
  });
}
