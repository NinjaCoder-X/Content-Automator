import { useState } from "react";
import { useListVideos } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Video, Trash2, Upload, CheckCircle2, Clock, Zap, Loader2, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoDetailsDialog } from "@/components/videos/VideoDetailsDialog";

const PLATFORMS = ["instagram", "youtube", "facebook", "all"];

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  queued: { icon: <Clock className="w-4 h-4" />, color: "bg-muted text-muted-foreground border-muted-foreground/20", label: "Queued" },
  processing: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "bg-yellow-900/30 text-yellow-400 border-yellow-800", label: "Processing" },
  ready: { icon: <Zap className="w-4 h-4" />, color: "bg-primary/20 text-primary border-primary/30", label: "Ready" },
  published: { icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-green-900/30 text-green-400 border-green-800", label: "Published" },
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  all: "All Platforms",
};

export type VideoItem = {
  id: number;
  scriptId: number;
  niche: string;
  title: string;
  caption: string;
  hashtags: string;
  platform: string;
  status: string;
  voiceStyle: string;
  subtitlesEnabled: boolean;
  createdAt: string;
};

export default function VideosPage() {
  const [platformFilter, setPlatformFilter] = useState<string>("all_filter");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [generatingMetadata, setGeneratingMetadata] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: videos, isLoading } = useListVideos({
    platform: platformFilter !== "all_filter" ? platformFilter as "instagram" | "youtube" | "facebook" | "all" : undefined,
    status: statusFilter !== "all" ? (statusFilter as "queued" | "processing" | "ready" | "published") : undefined,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/content/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: (data) => {
      setSelected(data);
      qc.invalidateQueries({ queryKey: ["listVideos"] });
      qc.invalidateQueries({ queryKey: ["getContentStats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/content/videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["listVideos"] });
    },
  });

  const generateMetadata = async (video: VideoItem) => {
    setGeneratingMetadata(true);
    try {
      const res = await fetch("/api/content/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: video.scriptId, platform: video.platform }),
      });
      if (!res.ok) throw new Error("Metadata generation failed");
      const meta = await res.json();
      setSelected((prev) =>
        prev ? { ...prev, title: meta.title, caption: meta.caption, hashtags: meta.hashtags } : prev
      );
      qc.invalidateQueries({ queryKey: ["listVideos"] });
      toast({ title: "Metadata generated", description: "AI-optimized title, caption, and hashtags ready." });
    } catch {
      toast({ title: "Error", description: "Failed to generate metadata", variant: "destructive" });
    } finally {
      setGeneratingMetadata(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: "Copied to clipboard." });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Videos</h1>
          <p className="text-muted-foreground uppercase text-sm tracking-widest mt-1">
            {videos?.length ?? 0} videos in pipeline
          </p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-44 uppercase text-xs tracking-wider">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_filter">All Platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p} className="uppercase">{PLATFORM_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 uppercase text-xs tracking-wider">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-secondary" />
          ))}
        </div>
      ) : !videos?.length ? (
        <div className="p-16 text-center border border-dashed border-border text-muted-foreground space-y-2">
          <Video className="w-10 h-10 mx-auto opacity-30" />
          <p className="uppercase tracking-widest text-sm">No videos queued</p>
          <p className="text-xs">Approve scripts and queue them for export to see videos here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video as VideoItem}
              onClick={() => setSelected(video as VideoItem)}
              statusConfig={STATUS_CONFIG}
              platformLabels={PLATFORM_LABELS}
            />
          ))}
        </div>
      )}

      <VideoDetailsDialog
        selected={selected}
        onClose={() => setSelected(null)}
        copyToClipboard={copyToClipboard}
        generateMetadata={generateMetadata}
        generatingMetadata={generatingMetadata}
        updateStatusMutation={updateStatusMutation}
        deleteMutation={deleteMutation}
        statusConfig={STATUS_CONFIG}
        platformLabels={PLATFORM_LABELS}
      />
    </div>
  );
}
