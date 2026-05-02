"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarRange, Sparkles, Lock, Check } from "lucide-react";

type Item = {
  id: number;
  dayOffset: number;
  niche: string;
  platform: string;
  hook: string;
  angle: string;
  cta: string;
  done: boolean;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PlannerClient({
  initial,
  planAllows,
}: {
  initial: Item[];
  planAllows: boolean;
}) {
  const [items, setItems] = useState<Item[]>(initial);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function regen() {
    if (!planAllows) return;
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Failed to generate plan");
      return;
    }
    // Refetch to get IDs and done flags
    const r2 = await fetch("/api/planner");
    const j2 = await r2.json();
    setItems(j2.items ?? []);
  }

  async function toggleDone(id: number, done: boolean) {
    setItems((xs) =>
      xs.map((x) => (x.id === id ? { ...x, done: !done } : x)),
    );
    await fetch(`/api/planner/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !done }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <CalendarRange className="w-7 h-7 text-primary-400" /> 7-day content plan
          </h1>
          <p className="text-muted mt-1">
            Niche-rotated, platform-balanced, ready to film.
          </p>
        </div>
        <button
          onClick={regen}
          disabled={!planAllows || loading}
          className="btn btn-primary"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Generating…" : "Generate fresh plan"}
        </button>
      </div>

      {!planAllows && (
        <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-warning" /> Planner is included in
              Pro and Agency.
            </p>
            <p className="text-sm text-muted">
              Upgrade to auto-generate a 7-day rotation across niches and
              platforms.
            </p>
          </div>
          <Link href="/pricing" className="btn btn-primary">
            Upgrade to Pro
          </Link>
        </div>
      )}

      {err && <p className="text-sm text-danger">{err}</p>}

      {items.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No plan yet.{" "}
          {planAllows ? (
            <>Click "Generate fresh plan" to build one.</>
          ) : (
            <>Upgrade to unlock the planner.</>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <article
              key={it.id}
              className={
                "card p-5 flex flex-col gap-3 " +
                (it.done ? "opacity-60" : "")
              }
            >
              <header className="flex items-center justify-between">
                <span className="text-xs text-muted uppercase tracking-wider">
                  Day {it.dayOffset + 1} ·{" "}
                  {DAY_NAMES[it.dayOffset % DAY_NAMES.length]}
                </span>
                <button
                  onClick={() => toggleDone(it.id, it.done)}
                  className={
                    "w-6 h-6 rounded-md border flex items-center justify-center " +
                    (it.done
                      ? "bg-success/20 border-success/50 text-success"
                      : "border-border hover:border-primary-500/40")
                  }
                  aria-label="toggle done"
                >
                  {it.done && <Check className="w-3.5 h-3.5" />}
                </button>
              </header>
              <div className="flex flex-wrap gap-1.5">
                <span className="chip">{it.niche}</span>
                <span className="chip">{it.platform}</span>
              </div>
              <h3 className="font-medium leading-snug">{it.hook}</h3>
              <p className="text-sm text-muted">Angle: {it.angle}</p>
              <p className="text-xs text-primary-400">CTA: {it.cta}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
