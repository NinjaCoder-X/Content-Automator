export type PlanId = "free" | "starter" | "pro" | "agency";

export type PlanFeatures = {
  niches: "limited" | "all";
  watermark: boolean;
  viralScore: boolean;
  planner: boolean;
  exports: boolean;
  prioritySpeed: boolean;
  multiClient: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  price: number; // USD per month
  blurb: string;
  features: PlanFeatures;
  // Quotas. -1 means unlimited.
  dailyGenerations: number;
  monthlyGenerations: number;
  highlights: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    blurb: "Try the Viral Engine. Watermarked outputs.",
    features: {
      niches: "limited",
      watermark: true,
      viralScore: false,
      planner: false,
      exports: false,
      prioritySpeed: false,
      multiClient: false,
    },
    dailyGenerations: 3,
    monthlyGenerations: 90,
    highlights: [
      "3 generations per day",
      "Limited niches",
      "Watermarked outputs",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 9,
    blurb: "Remove watermarks and unlock every niche.",
    features: {
      niches: "all",
      watermark: false,
      viralScore: false,
      planner: false,
      exports: false,
      prioritySpeed: false,
      multiClient: false,
    },
    dailyGenerations: -1,
    monthlyGenerations: 50,
    highlights: [
      "50 generations / month",
      "No watermarks",
      "All niches unlocked",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19,
    blurb: "Virality scoring + 7-day content planner.",
    features: {
      niches: "all",
      watermark: false,
      viralScore: true,
      planner: true,
      exports: false,
      prioritySpeed: false,
      multiClient: false,
    },
    dailyGenerations: -1,
    monthlyGenerations: 200,
    highlights: [
      "200 generations / month",
      "Virality score 1–100",
      "7-day content planner",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    price: 49,
    blurb: "Unlimited output, priority generation, exports.",
    features: {
      niches: "all",
      watermark: false,
      viralScore: true,
      planner: true,
      exports: true,
      prioritySpeed: true,
      multiClient: true,
    },
    dailyGenerations: -1,
    monthlyGenerations: -1,
    highlights: [
      "Unlimited generations",
      "Multi-client workspace",
      "Export packs (JSON / CSV)",
      "Priority generation speed",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "agency"];

export function getPlan(id: string): Plan {
  if (id in PLANS) return PLANS[id as PlanId];
  return PLANS.free;
}

export const ALLOWED_NICHES_FREE = new Set([
  "motivation",
  "psychology",
  "tech",
]);

export function isNicheAllowed(plan: PlanId, niche: string): boolean {
  if (PLANS[plan].features.niches === "all") return true;
  return ALLOWED_NICHES_FREE.has(niche);
}
