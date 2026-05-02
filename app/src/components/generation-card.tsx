"use client";
import { useState } from "react";
import { Copy, Check, Film } from "lucide-react";
import { ScoreBadge, type Score } from "./score-badge";
import { cn, formatRelative } from "@/lib/utils";

export type Scene = {
  index: number;
  durationSec: number;
  voiceover: string;
  visualIdea: string;
  motion: string;
  stockQuery: string;
};

export type Generation = {
  id?: number;
  niche: string;
  platform: string;
  topic: string;
  hook: string;
  script: string;
  loopEnding: string;
  breakdown: Scene[];
  caption: string;
  hashtags: string[];
  score: Score;
  watermarked: boolean;
  createdAt?: number;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard may be unavailable in insecure contexts */
        }
      }}
      className="btn btn-ghost text-xs"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function GenerationCard({
  g,
  showScore,
}: {
  g: Generation;
  showScore: boolean;
}) {
  return (
    <article className="card p-6 animate-fade-in space-y-6">
      <header className="flex flex-wrap items-start gap-4 justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="chip">{g.niche}</span>
            <span className="chip" style={{ background: "rgba(34,211,238,0.12)", color: "#a5f3fc", borderColor: "rgba(34,211,238,0.25)" }}>
              {g.platform}
            </span>
            {g.watermarked && (
              <span className="chip" style={{ background: "rgba(251,191,36,0.12)", color: "#fde68a", borderColor: "rgba(251,191,36,0.25)" }}>
                watermark
              </span>
            )}
            {g.createdAt && (
              <span className="text-xs text-muted">{formatRelative(g.createdAt)}</span>
            )}
          </div>
          <h3 className="text-xl font-semibold">{g.topic}</h3>
        </div>
        {showScore && <ScoreBadge score={g.score} full />}
      </header>

      <Section title="Hook (first 1–2s)" copy={g.hook}>
        <p className="text-lg font-medium leading-snug">{g.hook}</p>
      </Section>

      <Section title="Full script" copy={g.script}>
        <p className="leading-relaxed">{g.script}</p>
      </Section>

      <Section title="Loop ending" copy={g.loopEnding}>
        <p className="leading-relaxed">{g.loopEnding}</p>
      </Section>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="label flex items-center gap-2">
            <Film className="w-3.5 h-3.5" /> Scene-by-scene breakdown
          </h4>
        </div>
        <ol className="space-y-3">
          {g.breakdown.map((s) => (
            <li
              key={s.index}
              className={cn(
                "rounded-lg border border-border bg-elevated/60 p-3 flex gap-3",
              )}
            >
              <div className="text-xs text-muted w-14 shrink-0 pt-0.5">
                <div className="font-mono text-primary-400">
                  #{s.index + 1}
                </div>
                <div>{s.durationSec.toFixed(1)}s</div>
              </div>
              <div className="flex-1">
                <p className="text-sm leading-snug">{s.voiceover}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted">
                  <span className="chip">stock: {s.stockQuery}</span>
                  <span className="chip">{s.motion}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Section title="Caption" copy={g.caption}>
        <p className="whitespace-pre-line leading-relaxed">{g.caption}</p>
      </Section>

      <Section title="Hashtags" copy={g.hashtags.join(" ")}>
        <div className="flex flex-wrap gap-1.5">
          {g.hashtags.map((h) => (
            <span key={h} className="chip">{h}</span>
          ))}
        </div>
      </Section>
    </article>
  );
}

function Section({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="label">{title}</h4>
        <CopyButton text={copy} />
      </div>
      <div>{children}</div>
    </div>
  );
}
