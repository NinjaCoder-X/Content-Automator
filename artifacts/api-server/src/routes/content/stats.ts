import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Offloaded aggregation to database to avoid fetching full tables into memory.
  const [
    [topicsAgg],
    [scriptsAgg],
    [videosAgg],
    topicsByNicheData,
    scriptsByNicheData,
    videosByPlatformData,
  ] = await Promise.all([
    // Topic stats
    db
      .select({
        total: count(topicsTable.id),
        recent: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as int), 0)`,
      })
      .from(topicsTable),

    // Script stats
    db
      .select({
        total: count(scriptsTable.id),
        recent: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as int), 0)`,
        approved: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as int), 0)`,
      })
      .from(scriptsTable),

    // Video stats
    db
      .select({
        total: count(videosTable.id),
        published: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as int), 0)`,
        ready: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as int), 0)`,
      })
      .from(videosTable),

    // Grouping
    db
      .select({
        niche: topicsTable.niche,
        count: count(topicsTable.id),
      })
      .from(topicsTable)
      .groupBy(topicsTable.niche),

    db
      .select({
        niche: scriptsTable.niche,
        count: count(scriptsTable.id),
      })
      .from(scriptsTable)
      .groupBy(scriptsTable.niche),

    db
      .select({
        platform: videosTable.platform,
        count: count(videosTable.id),
      })
      .from(videosTable)
      .groupBy(videosTable.platform),
  ]);

  const topicsByNiche: Record<string, number> = {};
  for (const row of topicsByNicheData) {
    topicsByNiche[row.niche] = row.count;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const row of scriptsByNicheData) {
    scriptsByNiche[row.niche] = row.count;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const row of videosByPlatformData) {
    videosByPlatform[row.platform] = row.count;
  }

  res.json({
    totalTopics: topicsAgg.total,
    totalScripts: scriptsAgg.total,
    totalVideos: videosAgg.total,
    approvedScripts: scriptsAgg.approved,
    publishedVideos: videosAgg.published,
    readyVideos: videosAgg.ready,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicsAgg.recent,
    recentScriptsCount: scriptsAgg.recent,
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
