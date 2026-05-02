import { useState } from "react";
import { useListScripts } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { FileText, Trash2, ChevronRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const NICHES = ["facts", "psychology", "money", "tech", "body", "dark"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  approved: <CheckCircle2 className="w-4 h-4 text-primary" />,
};

type Script = {
  id: number;
  niche: string;
  title: string;
  hook: string;
  body: string;
  reveal: string;
  loopEnding: string;
  fullScript: string;
  durationSeconds: number;
  status: string;
  createdAt: string;
};

export default function ScriptsPage() {
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Script | null>(null);
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: scripts, isLoading } = useListScripts({
    niche: nicheFilter !== "all" ? nicheFilter : undefined,
    status: statusFilter !== "all" ? (statusFilter as "draft" | "approved") : undefined,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/content/scripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listScripts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/content/scripts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["listScripts"] });
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: async ({ scriptId, platform }: { scriptId: number; platform: string }) => {
      const res = await fetch(`/api/content/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId, platform }),
      });
      if (!res.ok) throw new Error("Failed to queue video");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listVideos"] });
      qc.invalidateQueries({ queryKey: ["getContentStats"] });
      setSelected(null);
      navigate("/videos");
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Scripts</h1>
          <p className="text-muted-foreground uppercase text-sm tracking-widest mt-1">
            {scripts?.length ?? 0} scripts generated
          </p>
        </div>
        <Button
          className="uppercase tracking-widest text-xs"
          onClick={() => navigate("/generate")}
        >
          Generate Script
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full bg-secondary" />
          ))}
        </div>
      ) : !scripts?.length ? (
        <div className="p-16 text-center border border-dashed border-border text-muted-foreground space-y-2">
          <FileText className="w-10 h-10 mx-auto opacity-30" />
          <p className="uppercase tracking-widest text-sm">No scripts yet</p>
          <p className="text-xs">Generate scripts from topics on the Generate page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="p-5 border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setSelected(script as Script)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="p-2 bg-secondary text-primary shrink-0">
                    {STATUS_ICONS[script.status] ?? <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-tight">{script.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{script.hook}"</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs uppercase tracking-wider bg-secondary px-2 py-0.5 text-muted-foreground">
                        {script.niche}
                      </span>
                      <span
                        className={cn(
                          "text-xs uppercase tracking-wider px-2 py-0.5 border",
                          script.status === "approved"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground border-muted-foreground/20"
                        )}
                      >
                        {script.status}
                      </span>
                      <span className="text-xs text-muted-foreground">~{script.durationSeconds}s</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-wider text-sm font-bold">{selected.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider bg-secondary px-2 py-0.5 text-muted-foreground">{selected.niche}</span>
                <span className={cn(
                  "text-xs uppercase tracking-wider px-2 py-0.5 border",
                  selected.status === "approved"
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-muted-foreground/20"
                )}>{selected.status}</span>
                <span className="text-xs text-muted-foreground">~{selected.durationSeconds}s</span>
              </div>

              {[
                { label: "Hook", value: selected.hook },
                { label: "Build", value: selected.body },
                { label: "Reveal", value: selected.reveal },
                { label: "Loop Ending", value: selected.loopEnding },
              ].map(({ label, value }) => value && (
                <div key={label} className="space-y-1">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm bg-secondary p-3 leading-relaxed">{value}</p>
                </div>
              ))}

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Full Script</p>
                <p className="text-sm bg-secondary p-3 leading-relaxed whitespace-pre-wrap">{selected.fullScript}</p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                {selected.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="uppercase text-xs tracking-wider"
                    onClick={() => approveMutation.mutate(selected.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                    Approve
                  </Button>
                )}
                {selected.status === "approved" && (
                  <Button
                    size="sm"
                    className="uppercase text-xs tracking-wider"
                    onClick={() => createVideoMutation.mutate({ scriptId: selected.id, platform: "all" })}
                    disabled={createVideoMutation.isPending}
                  >
                    {createVideoMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                    Queue Video
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
    </div>
  );
}
