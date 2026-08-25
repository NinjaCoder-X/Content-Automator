import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, sql, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Offload aggregations to the database using Drizzle ORM native SQL functions
  // Impact: Vastly reduces memory usage and data transfer by preventing full table fetches.
  const [
    [topicStats],
    [scriptStats],
    [videoStats],
    topicsByNicheResult,
    scriptsByNicheResult,
    videosByPlatformResult,
  ] = await Promise.all([
    db.select({
      total: count(),
      recent: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
    }).from(topicsTable),

    db.select({
      total: count(),
      approved: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as integer), 0)`,
      recent: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
    }).from(scriptsTable),

    db.select({
      total: count(),
      published: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as integer), 0)`,
      ready: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as integer), 0)`,
    }).from(videosTable),

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
    }).from(videosTable).groupBy(videosTable.platform),
  ]);

  const topicsByNiche = Object.fromEntries(
    topicsByNicheResult.map(r => [r.niche, r.count])
  );

  const scriptsByNiche = Object.fromEntries(
    scriptsByNicheResult.map(r => [r.niche, r.count])
  );

  const videosByPlatform = Object.fromEntries(
    videosByPlatformResult.map(r => [r.platform, r.count])
  );

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
