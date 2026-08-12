import { cn } from "@/lib/utils";
import { VideoItem } from "@/pages/videos";

export function VideoCard({
  video,
  onClick,
  statusConfig,
  platformLabels,
}: {
  video: VideoItem;
  onClick: () => void;
  statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }>;
  platformLabels: Record<string, string>;
}) {
  const config = statusConfig[video.status] ?? statusConfig.queued;
  return (
    <div
      className="p-5 border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-2 bg-secondary text-primary shrink-0">
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight">{video.title}</p>
            {video.caption && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{video.caption}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs uppercase tracking-wider bg-secondary px-2 py-0.5 text-muted-foreground">
                {video.niche}
              </span>
              <span className={cn("text-xs uppercase tracking-wider px-2 py-0.5 border", config.color)}>
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {platformLabels[video.platform] ?? video.platform}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
