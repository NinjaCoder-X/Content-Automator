import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, sql, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    [topicsAgg],
    topicsGrouped,
    [scriptsAgg],
    scriptsGrouped,
    [videosAgg],
    videosGrouped
  ] = await Promise.all([
    db.select({
      total: count(),
      recent: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`
    }).from(topicsTable),
    db.select({ niche: topicsTable.niche, count: count() }).from(topicsTable).groupBy(topicsTable.niche),

    db.select({
      total: count(),
      approved: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as integer), 0)`,
      recent: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`
    }).from(scriptsTable),
    db.select({ niche: scriptsTable.niche, count: count() }).from(scriptsTable).groupBy(scriptsTable.niche),

    db.select({
      total: count(),
      published: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as integer), 0)`,
      ready: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as integer), 0)`
    }).from(videosTable),
    db.select({ platform: videosTable.platform, count: count() }).from(videosTable).groupBy(videosTable.platform)
  ]);

  const topicsByNiche: Record<string, number> = {};
  for (const row of topicsGrouped) {
    topicsByNiche[row.niche] = row.count;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const row of scriptsGrouped) {
    scriptsByNiche[row.niche] = row.count;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const row of videosGrouped) {
    videosByPlatform[row.platform] = row.count;
  }

  res.json({
    // ⚡ Bolt: Offloaded aggregations to the database using Drizzle native functions (count, sum, groupBy)
    // to avoid fetching full tables into memory and performing O(n) JS loops, reducing memory pressure
    // and speeding up API responses.
    totalTopics: topicsAgg?.total ?? 0,
    totalScripts: scriptsAgg?.total ?? 0,
    totalVideos: videosAgg?.total ?? 0,
    approvedScripts: scriptsAgg?.approved ?? 0,
    publishedVideos: videosAgg?.published ?? 0,
    readyVideos: videosAgg?.ready ?? 0,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicsAgg?.recent ?? 0,
    recentScriptsCount: scriptsAgg?.recent ?? 0,
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
