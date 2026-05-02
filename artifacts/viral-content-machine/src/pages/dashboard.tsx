import { useHealthCheck, useGetContentStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Activity, CheckCircle2, Clock, PlayCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetContentStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: health } = useHealthCheck();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Mission Control</h1>
          <p className="text-muted-foreground uppercase text-sm tracking-widest mt-1">
            System Status: {health?.status === "ok" ? <span className="text-primary">Online</span> : <span className="text-destructive">Degraded</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Topics Mined" value={stats?.totalTopics} icon={Activity} loading={statsLoading} />
        <StatCard title="Scripts Approved" value={stats?.approvedScripts} icon={CheckCircle2} loading={statsLoading} />
        <StatCard title="Videos Ready" value={stats?.readyVideos} icon={PlayCircle} loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-wider border-b border-border pb-2">Activity Feed</h2>
          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-secondary" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {activity?.map((item) => (
                <div key={item.id} className="p-4 border border-border bg-card flex items-start gap-4">
                  <div className="p-2 bg-secondary text-primary">
                    {item.type === 'topic' ? <Activity className="w-4 h-4" /> : 
                     item.type === 'script' ? <CheckCircle2 className="w-4 h-4" /> : 
                     <PlayCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-bold text-primary uppercase">{item.action}</span> - {item.title}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground uppercase tracking-wider">
                      <span className="bg-secondary px-2 py-0.5">{item.niche}</span>
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!activity?.length && (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border">
                  No activity detected. Generate content to start the pipeline.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-wider border-b border-border pb-2">Niche Performance</h2>
          <div className="p-6 border border-border bg-card space-y-6">
            {statsLoading ? (
              <Skeleton className="h-48 w-full bg-secondary" />
            ) : (
              Object.entries(stats?.topicsByNiche || {}).map(([niche, count]) => (
                <div key={niche} className="space-y-2">
                  <div className="flex justify-between text-sm uppercase tracking-wider">
                    <span>{niche}</span>
                    <span className="text-primary">{count} topics</span>
                  </div>
                  <div className="h-2 w-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.min(100, (Number(count) / Math.max(1, stats?.totalTopics || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string, value?: number, icon: any, loading: boolean }) {
  return (
    <div className="p-6 border border-border bg-card flex flex-col gap-4 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-secondary/50 group-hover:text-primary/10 transition-colors">
        <Icon className="w-32 h-32" />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</h3>
      <div className="text-4xl font-bold tracking-tighter text-foreground">
        {loading ? <Skeleton className="h-10 w-24 bg-secondary" /> : (value || 0)}
      </div>
    </div>
  );
}
