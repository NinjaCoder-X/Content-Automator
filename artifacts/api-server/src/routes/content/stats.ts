import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Offloaded in-memory `.length`, `.filter().length`, and loop aggregations
  // to the database using Drizzle ORM's native SQL aggregations (`count()`, `.groupBy()`,
  // conditional `SUM(CASE WHEN...)`) to eliminate O(N) payload scaling bottleneck.
  const [
    [topicStats],
    topicsByNicheRaw,
    [scriptStats],
    scriptsByNicheRaw,
    [videoStats],
    videosByPlatformRaw
  ] = await Promise.all([
    db.select({
      total: sql<number>`cast(count(*) as integer)`,
      recentCount: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
    }).from(topicsTable),
    db.select({
      niche: topicsTable.niche,
      count: sql<number>`cast(count(*) as integer)`,
    }).from(topicsTable).groupBy(topicsTable.niche),

    db.select({
      total: sql<number>`cast(count(*) as integer)`,
      approvedScripts: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as integer), 0)`,
      recentCount: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
    }).from(scriptsTable),
    db.select({
      niche: scriptsTable.niche,
      count: sql<number>`cast(count(*) as integer)`,
    }).from(scriptsTable).groupBy(scriptsTable.niche),

    db.select({
      total: sql<number>`cast(count(*) as integer)`,
      publishedVideos: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as integer), 0)`,
      readyVideos: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as integer), 0)`,
    }).from(videosTable),
    db.select({
      platform: videosTable.platform,
      count: sql<number>`cast(count(*) as integer)`,
    }).from(videosTable).groupBy(videosTable.platform)
  ]);

  const topicsByNiche: Record<string, number> = {};
  for (const { niche, count } of topicsByNicheRaw) {
    topicsByNiche[niche] = count;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const { niche, count } of scriptsByNicheRaw) {
    scriptsByNiche[niche] = count;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const { platform, count } of videosByPlatformRaw) {
    videosByPlatform[platform] = count;
  }

  res.json({
    totalTopics: topicStats?.total ?? 0,
    totalScripts: scriptStats?.total ?? 0,
    totalVideos: videoStats?.total ?? 0,
    approvedScripts: scriptStats?.approvedScripts ?? 0,
    publishedVideos: videoStats?.publishedVideos ?? 0,
    readyVideos: videoStats?.readyVideos ?? 0,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicStats?.recentCount ?? 0,
    recentScriptsCount: scriptStats?.recentCount ?? 0,
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
