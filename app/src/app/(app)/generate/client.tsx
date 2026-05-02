"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Wand2, Lock } from "lucide-react";
import {
  NICHE_LABELS,
  NICHES,
  PLATFORMS,
  PLATFORM_LABELS,
  type Niche,
  type Platform,
} from "@/lib/engine/data";
import {
  ALLOWED_NICHES_FREE,
  type Plan,
} from "@/lib/plans";
import { GenerationCard, type Generation } from "@/components/generation-card";
import { UsageMeter, type Usage } from "@/components/usage-meter";

export function GenerateClient({
  plan,
  initialUsage,
}: {
  plan: Plan;
  initialUsage: Usage;
}) {
  const [niche, setNiche] = useState<Niche>(
    plan.id === "free" ? "motivation" : "money",
  );
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [topicHint, setTopicHint] = useState("");
  const [usage, setUsage] = useState<Usage>(initialUsage);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Generation | null>(null);

  async function generate() {
    if (loading) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, platform, topicHint: topicHint || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Generation failed");
      if (data.usage) setUsage(data.usage);
      return;
    }
    setResult(data.generation);
    if (data.usage) setUsage(data.usage);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <Wand2 className="w-7 h-7 text-primary-400" /> Generate
          </h1>
          <p className="text-muted mt-1">
            Hook · 10–15s script · scene breakdown · captions · hashtags · score.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-5">
          <div>
            <label className="label">Niche</label>
            <div className="grid sm:grid-cols-3 gap-2 mt-2">
              {NICHES.map((n) => {
                const locked =
                  plan.features.niches !== "all" && !ALLOWED_NICHES_FREE.has(n);
                return (
                  <button
                    key={n}
                    onClick={() => !locked && setNiche(n)}
                    disabled={locked}
                    className={
                      "px-3 py-2.5 rounded-lg border text-sm text-left transition-colors flex items-center justify-between " +
                      (niche === n
                        ? "border-primary-500/50 bg-primary-500/10 text-white"
                        : "border-border hover:border-primary-500/30") +
                      (locked ? " opacity-50 cursor-not-allowed" : "")
                    }
                  >
                    <span>{NICHE_LABELS[n]}</span>
                    {locked && <Lock className="w-3.5 h-3.5 text-muted" />}
                  </button>
                );
              })}
            </div>
            {plan.features.niches !== "all" && (
              <p className="text-xs text-muted mt-2">
                Money & Fitness niches are unlocked on Starter.{" "}
                <Link href="/pricing" className="text-primary-400 hover:underline">
                  Upgrade →
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className="label">Platform</label>
            <div className="grid sm:grid-cols-3 gap-2 mt-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={
                    "px-3 py-2.5 rounded-lg border text-sm transition-colors " +
                    (platform === p
                      ? "border-primary-500/50 bg-primary-500/10 text-white"
                      : "border-border hover:border-primary-500/30")
                  }
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Topic hint (optional)</label>
            <input
              className="input mt-2"
              placeholder="e.g. compound interest, push-ups vs pull-ups, AI replacing jobs…"
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              maxLength={200}
            />
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={generate}
            disabled={loading || usage.blocked}
          >
            <Sparkles className="w-4 h-4" />
            {loading
              ? "Generating…"
              : usage.blocked
                ? "Quota reached — upgrade to continue"
                : "Generate viral content"}
          </button>
          {err && <p className="text-sm text-danger">{err}</p>}
        </div>

        <div className="space-y-4">
          <UsageMeter usage={usage} />
          {!plan.features.viralScore && (
            <div className="card p-4">
              <p className="text-sm">
                Virality scoring is included on{" "}
                <span className="text-primary-400 font-medium">Pro</span>.
              </p>
              <Link href="/pricing" className="btn btn-secondary w-full mt-3">
                Unlock scoring
              </Link>
            </div>
          )}
        </div>
      </div>

      {result && (
        <GenerationCard g={result} showScore={plan.features.viralScore} />
      )}
    </div>
  );
}
