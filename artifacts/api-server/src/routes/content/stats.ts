import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, count, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Offload aggregation to the database to prevent loading full tables into memory.
  // We use Drizzle's count() and conditional SUM(CASE WHEN ...) to count specific rows.
  // Coalesce is used to ensure we always get an integer back (0 instead of null).
  const [topicsStats, scriptsStats, videosStats] = await Promise.all([
    db
      .select({
        niche: topicsTable.niche,
        total: count(),
        recent: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
      })
      .from(topicsTable)
      .groupBy(topicsTable.niche),
    db
      .select({
        niche: scriptsTable.niche,
        total: count(),
        recent: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
        approved: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as integer), 0)`,
      })
      .from(scriptsTable)
      .groupBy(scriptsTable.niche),
    db
      .select({
        platform: videosTable.platform,
        total: count(),
        published: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as integer), 0)`,
        ready: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as integer), 0)`,
      })
      .from(videosTable)
      .groupBy(videosTable.platform),
  ]);

  const topicsByNiche: Record<string, number> = {};
  let totalTopics = 0;
  let recentTopicsCount = 0;
  for (const t of topicsStats) {
    topicsByNiche[t.niche] = t.total;
    totalTopics += t.total;
    recentTopicsCount += t.recent;
  }

  const scriptsByNiche: Record<string, number> = {};
  let totalScripts = 0;
  let recentScriptsCount = 0;
  let approvedScripts = 0;
  for (const s of scriptsStats) {
    scriptsByNiche[s.niche] = s.total;
    totalScripts += s.total;
    recentScriptsCount += s.recent;
    approvedScripts += s.approved;
  }

  const videosByPlatform: Record<string, number> = {};
  let totalVideos = 0;
  let publishedVideos = 0;
  let readyVideos = 0;
  for (const v of videosStats) {
    videosByPlatform[v.platform] = v.total;
    totalVideos += v.total;
    publishedVideos += v.published;
    readyVideos += v.ready;
  }

  res.json({
    totalTopics,
    totalScripts,
    totalVideos,
    approvedScripts,
    publishedVideos,
    readyVideos,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount,
    recentScriptsCount,
  });
});

router.get("/recent", async (req, res) => {
  const [topics, scripts, videos] = await Promise.all([
    db.select().from(topicsTable).orderBy(desc(topicsTable.createdAt)).limit(10),
    db.select().from(scriptsTable).orderBy(desc(scriptsTable.createdAt)).limit(10),
    db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(10),
  ]);

  const items = [
    ...topics.map((t) => ({
      id: `topic-${t.id}`,
      type: "topic" as const,
      action: "Topic generated",
      niche: t.niche,
      title: t.title,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    ...scripts.map((s) => ({
      id: `script-${s.id}`,
      type: "script" as const,
      action: "Script written",
      niche: s.niche,
      title: s.title,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
    ...videos.map((v) => ({
      id: `video-${v.id}`,
      type: "video" as const,
      action: "Video queued",
      niche: v.niche,
      title: v.title,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
    })),
  ];

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json(items.slice(0, 20));
});

export default router;
