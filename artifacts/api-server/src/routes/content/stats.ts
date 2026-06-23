import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, sql, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt Performance Optimization:
  // Instead of fetching all rows into memory and counting them with .filter().length,
  // we offload the aggregations to the database using Drizzle ORM's count() and conditional sum().
  // This drastically reduces memory usage, network payload, and processing time,
  // as the dataset grows.
  const [topicsStats, scriptsStats, videosStats] = await Promise.all([
    db
      .select({
        niche: topicsTable.niche,
        total: count(),
        recent: sql<number>`cast(coalesce(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end), 0) as integer)`,
      })
      .from(topicsTable)
      .groupBy(topicsTable.niche),
    db
      .select({
        niche: scriptsTable.niche,
        total: count(),
        recent: sql<number>`cast(coalesce(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end), 0) as integer)`,
        approved: sql<number>`cast(coalesce(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end), 0) as integer)`,
      })
      .from(scriptsTable)
      .groupBy(scriptsTable.niche),
    db
      .select({
        platform: videosTable.platform,
        total: count(),
        published: sql<number>`cast(coalesce(sum(case when ${videosTable.status} = 'published' then 1 else 0 end), 0) as integer)`,
        ready: sql<number>`cast(coalesce(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end), 0) as integer)`,
      })
      .from(videosTable)
      .groupBy(videosTable.platform),
  ]);

  const topicsByNiche: Record<string, number> = {};
  let totalTopics = 0;
  let recentTopicsCount = 0;
  for (const stat of topicsStats) {
    topicsByNiche[stat.niche] = stat.total;
    totalTopics += stat.total;
    recentTopicsCount += stat.recent;
  }

  const scriptsByNiche: Record<string, number> = {};
  let totalScripts = 0;
  let recentScriptsCount = 0;
  let approvedScripts = 0;
  for (const stat of scriptsStats) {
    scriptsByNiche[stat.niche] = stat.total;
    totalScripts += stat.total;
    recentScriptsCount += stat.recent;
    approvedScripts += stat.approved;
  }

  const videosByPlatform: Record<string, number> = {};
  let totalVideos = 0;
  let publishedVideos = 0;
  let readyVideos = 0;
  for (const stat of videosStats) {
    videosByPlatform[stat.platform] = stat.total;
    totalVideos += stat.total;
    publishedVideos += stat.published;
    readyVideos += stat.ready;
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
