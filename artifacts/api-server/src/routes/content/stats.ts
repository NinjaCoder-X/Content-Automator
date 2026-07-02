import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, sql, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Offloading computations to the database using native SQL aggregations
  // instead of fetching full tables and doing in-memory counting (e.g. `.length` / `.filter()`).
  // This reduces memory overhead, avoids full table scans for stats, and significantly
  // speeds up the request for large datasets. Coalesce is used for sums to ensure `0` fallback.

  // Run all independent queries concurrently to minimize network latency round-trips
  const [
    [topicStats],
    [scriptStats],
    [videoStats],
    topicsNicheRows,
    scriptsNicheRows,
    videosPlatformRows
  ] = await Promise.all([
    // 1. Get base counts and conditional aggregations for Topics
    db.select({
      total: count(),
      recent: sql<number>`cast(coalesce(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo.toISOString()} then 1 else 0 end), 0) as integer)`,
    }).from(topicsTable),

    // 2. Get base counts and conditional aggregations for Scripts
    db.select({
      total: count(),
      recent: sql<number>`cast(coalesce(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo.toISOString()} then 1 else 0 end), 0) as integer)`,
      approved: sql<number>`cast(coalesce(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end), 0) as integer)`,
    }).from(scriptsTable),

    // 3. Get base counts and conditional aggregations for Videos
    db.select({
      total: count(),
      published: sql<number>`cast(coalesce(sum(case when ${videosTable.status} = 'published' then 1 else 0 end), 0) as integer)`,
      ready: sql<number>`cast(coalesce(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end), 0) as integer)`,
    }).from(videosTable),

    // 4. Get group counts
    db.select({
      niche: topicsTable.niche,
      count: count(),
    }).from(topicsTable).groupBy(topicsTable.niche),

    db.select({
      niche: scriptsTable.niche,
      count: count(),
    }).from(scriptsTable).groupBy(scriptsTable.niche),

    db.select({
      platform: videosTable.platform,
      count: count(),
    }).from(videosTable).groupBy(videosTable.platform)
  ]);

  // Transform grouped query rows into Record<string, number> objects
  const topicsByNiche: Record<string, number> = {};
  for (const row of topicsNicheRows) {
    topicsByNiche[row.niche] = row.count;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const row of scriptsNicheRows) {
    scriptsByNiche[row.niche] = row.count;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const row of videosPlatformRows) {
    videosByPlatform[row.platform] = row.count;
  }

  res.json({
    totalTopics: topicStats.total,
    totalScripts: scriptStats.total,
    totalVideos: videoStats.total,
    approvedScripts: scriptStats.approved,
    publishedVideos: videoStats.published,
    readyVideos: videoStats.ready,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicStats.recent,
    recentScriptsCount: scriptStats.recent,
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
