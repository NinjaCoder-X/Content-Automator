import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, count, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Performance optimization: Offload aggregations to the database
  // instead of fetching all records and processing in-memory.
  const [topicsStats, scriptsStats, videosStats] = await Promise.all([
    db
      .select({
        niche: topicsTable.niche,
        count: count(),
        recentCount: sql<number>`coalesce(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end)::int, 0)`,
      })
      .from(topicsTable)
      .groupBy(topicsTable.niche),
    db
      .select({
        niche: scriptsTable.niche,
        count: count(),
        approvedCount: sql<number>`coalesce(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end)::int, 0)`,
        recentCount: sql<number>`coalesce(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end)::int, 0)`,
      })
      .from(scriptsTable)
      .groupBy(scriptsTable.niche),
    db
      .select({
        platform: videosTable.platform,
        count: count(),
        publishedCount: sql<number>`coalesce(sum(case when ${videosTable.status} = 'published' then 1 else 0 end)::int, 0)`,
        readyCount: sql<number>`coalesce(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end)::int, 0)`,
      })
      .from(videosTable)
      .groupBy(videosTable.platform),
  ]);

  let totalTopics = 0;
  let recentTopicsCount = 0;
  const topicsByNiche: Record<string, number> = {};
  for (const row of topicsStats) {
    totalTopics += row.count;
    recentTopicsCount += row.recentCount;
    topicsByNiche[row.niche] = row.count;
  }

  let totalScripts = 0;
  let approvedScripts = 0;
  let recentScriptsCount = 0;
  const scriptsByNiche: Record<string, number> = {};
  for (const row of scriptsStats) {
    totalScripts += row.count;
    approvedScripts += row.approvedCount;
    recentScriptsCount += row.recentCount;
    scriptsByNiche[row.niche] = row.count;
  }

  let totalVideos = 0;
  let publishedVideos = 0;
  let readyVideos = 0;
  const videosByPlatform: Record<string, number> = {};
  for (const row of videosStats) {
    totalVideos += row.count;
    publishedVideos += row.publishedCount;
    readyVideos += row.readyCount;
    videosByPlatform[row.platform] = row.count;
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
