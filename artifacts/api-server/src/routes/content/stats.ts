import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";

const router = Router();

// ⚡ Bolt: Offload aggregations to the database to avoid fetching full tables into memory.
// This prevents N+1 memory issues and significantly improves query performance.
router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Topics stats
  const topicsStatsPromise = db.select({
    total: sql<number>`coalesce(cast(count(${topicsTable.id}) as integer), 0)`,
    recent: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
  }).from(topicsTable);

  const topicsByNichePromise = db.select({
    niche: topicsTable.niche,
    count: sql<number>`coalesce(cast(count(${topicsTable.id}) as integer), 0)`,
  }).from(topicsTable).groupBy(topicsTable.niche);

  // 2. Scripts stats
  const scriptsStatsPromise = db.select({
    total: sql<number>`coalesce(cast(count(${scriptsTable.id}) as integer), 0)`,
    approved: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as integer), 0)`,
    recent: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
  }).from(scriptsTable);

  const scriptsByNichePromise = db.select({
    niche: scriptsTable.niche,
    count: sql<number>`coalesce(cast(count(${scriptsTable.id}) as integer), 0)`,
  }).from(scriptsTable).groupBy(scriptsTable.niche);

  // 3. Videos stats
  const videosStatsPromise = db.select({
    total: sql<number>`coalesce(cast(count(${videosTable.id}) as integer), 0)`,
    published: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as integer), 0)`,
    ready: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as integer), 0)`,
  }).from(videosTable);

  const videosByPlatformPromise = db.select({
    platform: videosTable.platform,
    count: sql<number>`coalesce(cast(count(${videosTable.id}) as integer), 0)`,
  }).from(videosTable).groupBy(videosTable.platform);

  const [
    [topicsStats],
    topicsByNicheRows,
    [scriptsStats],
    scriptsByNicheRows,
    [videosStats],
    videosByPlatformRows
  ] = await Promise.all([
    topicsStatsPromise,
    topicsByNichePromise,
    scriptsStatsPromise,
    scriptsByNichePromise,
    videosStatsPromise,
    videosByPlatformPromise
  ]);

  const topicsByNiche: Record<string, number> = {};
  for (const row of topicsByNicheRows) {
    topicsByNiche[row.niche] = row.count;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const row of scriptsByNicheRows) {
    scriptsByNiche[row.niche] = row.count;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const row of videosByPlatformRows) {
    videosByPlatform[row.platform] = row.count;
  }

  res.json({
    totalTopics: topicsStats?.total ?? 0,
    totalScripts: scriptsStats?.total ?? 0,
    totalVideos: videosStats?.total ?? 0,
    approvedScripts: scriptsStats?.approved ?? 0,
    publishedVideos: videosStats?.published ?? 0,
    readyVideos: videosStats?.ready ?? 0,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicsStats?.recent ?? 0,
    recentScriptsCount: scriptsStats?.recent ?? 0,
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
