import { useState } from "react";
import { useListTopics } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Activity, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const NICHES = ["facts", "psychology", "money", "tech", "body", "dark"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  scripted: "bg-primary/20 text-primary border-primary/30",
  published: "bg-green-900/30 text-green-400 border-green-800",
};

export default function TopicsPage() {
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: topics, isLoading } = useListTopics({
    niche: nicheFilter !== "all" ? nicheFilter : undefined,
    status: statusFilter !== "all" ? (statusFilter as "pending" | "scripted" | "published") : undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/content/topics/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listTopics"] }),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Topics</h1>
          <p className="text-muted-foreground uppercase text-sm tracking-widest mt-1">
            {topics?.length ?? 0} topics in pipeline
          </p>
        </div>
        <Button
          className="uppercase tracking-widest text-xs"
          onClick={() => navigate("/generate")}
        >
          Generate Topics
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={nicheFilter} onValueChange={setNicheFilter}>
          <SelectTrigger className="w-40 uppercase text-xs tracking-wider">
            <SelectValue placeholder="All Niches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Niches</SelectItem>
            {NICHES.map((n) => (
              <SelectItem key={n} value={n} className="uppercase">{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 uppercase text-xs tracking-wider">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scripted">Scripted</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-secondary" />
          ))}
        </div>
      ) : !topics?.length ? (
        <div className="p-16 text-center border border-dashed border-border text-muted-foreground space-y-2">
          <Activity className="w-10 h-10 mx-auto opacity-30" />
          <p className="uppercase tracking-widest text-sm">No topics found</p>
          <p className="text-xs">Generate topics from the Generate page to fill the pipeline.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="p-5 border border-border bg-card flex items-start justify-between gap-4 group hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="p-2 bg-secondary text-primary shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm leading-tight">{topic.title}</p>
                  {topic.hook && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{topic.hook}"</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs uppercase tracking-wider bg-secondary px-2 py-0.5 text-muted-foreground">
                      {topic.niche}
                    </span>
                    <span
                      className={cn(
                        "text-xs uppercase tracking-wider px-2 py-0.5 border",
                        STATUS_COLORS[topic.status] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {topic.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {topic.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="uppercase text-xs tracking-wider h-8"
                    onClick={() => navigate(`/generate?topicId=${topic.id}&title=${encodeURIComponent(topic.title)}&hook=${encodeURIComponent(topic.hook ?? "")}&niche=${topic.niche}`)}
                  >
                    Script <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(topic.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
