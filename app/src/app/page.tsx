import Link from "next/link";
import {
  Sparkles,
  Flame,
  Gauge,
  CalendarRange,
  Hash,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PLANS, PLAN_ORDER } from "@/lib/plans";

export default function LandingPage() {
  return (
    <main className="app-shell">
      <header className="px-6 lg:px-12 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span>AI Content Factory</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost">
            Login
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Start free
          </Link>
        </nav>
      </header>

      <section className="px-6 lg:px-12 pt-12 pb-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 chip mb-6">
          <Flame className="w-3.5 h-3.5" /> Built for Reels, Shorts & Reels
        </div>
        <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight mb-6">
          Generate <span className="bg-gradient-to-r from-primary-500 to-accent bg-clip-text text-transparent">viral-ready</span>
          <br />
          short-form content in seconds.
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto mb-8">
          Pick a niche. Get a hook, 10–15 second script, scene-by-scene shot
          list, captions with hashtags, a virality score, and a 7-day plan —
          tuned for Instagram Reels, YouTube Shorts, and Facebook Reels.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/signup" className="btn btn-primary">
            Generate your first reel <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn btn-secondary">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="px-6 lg:px-12 pb-20 max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Flame,
            title: "Viral Hook Engine",
            body: "Niche-aware hooks tuned for the first 1–2 seconds, where 80% of retention is decided.",
          },
          {
            icon: Gauge,
            title: "Virality Score 1–100",
            body: "Hook, emotion, retention, and shareability scored independently. See exactly what's working.",
          },
          {
            icon: CalendarRange,
            title: "7-Day Content Plan",
            body: "Auto-rotated niches and platforms. Never wonder what to post next.",
          },
          {
            icon: Hash,
            title: "Captions + Hashtags",
            body: "Per-platform captions with engagement triggers and hand-curated hashtag stacks.",
          },
          {
            icon: Sparkles,
            title: "Scene-by-Scene Breakdown",
            body: "5-shot storyboard with motion direction and stock footage suggestions.",
          },
          {
            icon: ShieldCheck,
            title: "Production Ready",
            body: "Email/password auth, plan billing, usage quotas, watermarking, exports.",
          },
        ].map((f) => (
          <div key={f.title} className="card p-6 animate-fade-in">
            <div className="w-10 h-10 rounded-lg bg-primary-500/15 text-primary-400 flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <section
        id="pricing"
        className="px-6 lg:px-12 pb-24 max-w-6xl mx-auto"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold mb-2">Pricing built to scale</h2>
          <p className="text-muted">
            Start free. Upgrade when you're ready to remove watermarks and
            unlock the planner.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const featured = id === "pro";
            return (
              <div
                key={id}
                className={
                  "card p-6 flex flex-col " +
                  (featured
                    ? "border-primary-500/40 shadow-glow"
                    : "")
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    {p.name}
                  </span>
                  {featured && <span className="chip">Most popular</span>}
                </div>
                <div className="text-3xl font-semibold mb-1">
                  ${p.price}
                  <span className="text-sm text-muted font-normal">/mo</span>
                </div>
                <p className="text-sm text-muted mb-4">{p.blurb}</p>
                <ul className="text-sm space-y-2 mb-6 flex-1">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-1 text-primary-400">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={"btn " + (featured ? "btn-primary" : "btn-secondary")}
                >
                  {p.price === 0 ? "Start free" : "Upgrade"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t border-border text-sm text-muted text-center">
        © {new Date().getFullYear()} AI Content Factory · Built to ship reels.
      </footer>
    </main>
  );
}
