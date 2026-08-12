import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Zap, Upload, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoItem } from "@/pages/videos";

export function VideoDetailsDialog({
  selected,
  onClose,
  copyToClipboard,
  generateMetadata,
  generatingMetadata,
  updateStatusMutation,
  deleteMutation,
  statusConfig,
  platformLabels,
}: {
  selected: VideoItem | null;
  onClose: () => void;
  copyToClipboard: (text: string, label: string) => void;
  generateMetadata: (video: VideoItem) => void;
  generatingMetadata: boolean;
  updateStatusMutation: any;
  deleteMutation: any;
  statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }>;
  platformLabels: Record<string, string>;
}) {
  return (
    <Dialog open={!!selected} onOpenChange={(o) => !o && onClose()}>
      {selected && (
        <DialogContent className="max-w-xl bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wider text-sm font-bold">{selected.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider bg-secondary px-2 py-0.5 text-muted-foreground">{selected.niche}</span>
              <span className={cn(
                "text-xs uppercase tracking-wider px-2 py-0.5 border",
                statusConfig[selected.status]?.color ?? "bg-muted"
              )}>{statusConfig[selected.status]?.label ?? selected.status}</span>
              <span className="text-xs text-muted-foreground uppercase">{platformLabels[selected.platform]}</span>
            </div>

            <div className="space-y-3">
              {selected.caption && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Caption</p>
                    <button onClick={() => copyToClipboard(selected.caption, "Caption")} className="text-muted-foreground hover:text-foreground">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm bg-secondary p-3 leading-relaxed">{selected.caption}</p>
                </div>
              )}

              {selected.hashtags && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Hashtags</p>
                    <button onClick={() => copyToClipboard(selected.hashtags, "Hashtags")} className="text-muted-foreground hover:text-foreground">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm bg-secondary p-3 leading-relaxed text-primary">{selected.hashtags}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="uppercase text-xs tracking-wider"
                onClick={() => generateMetadata(selected)}
                disabled={generatingMetadata}
              >
                {generatingMetadata ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                AI Metadata
              </Button>

              {selected.status === "ready" && (
                <Button
                  size="sm"
                  className="uppercase text-xs tracking-wider"
                  onClick={() => updateStatusMutation.mutate({ id: selected.id, status: "published" })}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                  Mark Published
                </Button>
              )}

              {selected.status === "queued" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="uppercase text-xs tracking-wider"
                  onClick={() => updateStatusMutation.mutate({ id: selected.id, status: "ready" })}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  Mark Ready
                </Button>
              )}

              <button
                onClick={() => deleteMutation.mutate(selected.id)}
                disabled={deleteMutation.isPending}
                className="ml-auto p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
