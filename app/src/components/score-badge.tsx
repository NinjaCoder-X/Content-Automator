import { cn } from "@/lib/utils";

export type Score = {
  hook: number;
  emotion: number;
  retention: number;
  shareability: number;
  total: number;
};

function ringColor(n: number) {
  if (n >= 80) return "from-success to-accent";
  if (n >= 60) return "from-primary-500 to-accent";
  if (n >= 40) return "from-warning to-primary-400";
  return "from-danger to-warning";
}

export function ScoreBadge({
  score,
  full,
}: {
  score: Score;
  full?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-4", full && "w-full")}>
      <div
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br p-1",
          ringColor(score.total),
        )}
      >
        <div className="w-full h-full rounded-full bg-elevated flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">{score.total}</span>
          <span className="text-[10px] text-muted uppercase tracking-wider">
            virality
          </span>
        </div>
      </div>
      {full && (
        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
          <Bar label="Hook" v={score.hook} />
          <Bar label="Emotion" v={score.emotion} />
          <Bar label="Retention" v={score.retention} />
          <Bar label="Share" v={score.shareability} />
        </div>
      )}
    </div>
  );
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex justify-between text-muted">
        <span>{label}</span>
        <span className="text-text">{v}</span>
      </div>
      <div className="progress mt-1">
        <span style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
