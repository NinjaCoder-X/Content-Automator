import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, count, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    [topicsStat],
    [scriptsStat],
    [videosStat],
    topicsByNicheData,
    scriptsByNicheData,
    videosByPlatformData,
  ] = await Promise.all([
    // Offload computation to DB to prevent in-memory processing of entire tables
    db.select({
      total: count(),
      recent: sql<number>`cast(coalesce(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo}::timestamp then 1 else 0 end), 0) as int)`,
    }).from(topicsTable),
    db.select({
      total: count(),
      recent: sql<number>`cast(coalesce(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo}::timestamp then 1 else 0 end), 0) as int)`,
      approved: sql<number>`cast(coalesce(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end), 0) as int)`,
    }).from(scriptsTable),
    db.select({
      total: count(),
      published: sql<number>`cast(coalesce(sum(case when ${videosTable.status} = 'published' then 1 else 0 end), 0) as int)`,
      ready: sql<number>`cast(coalesce(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end), 0) as int)`,
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

  const topicsByNiche = topicsByNicheData.reduce((acc, curr) => {
    acc[curr.niche] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  const scriptsByNiche = scriptsByNicheData.reduce((acc, curr) => {
    acc[curr.niche] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  const videosByPlatform = videosByPlatformData.reduce((acc, curr) => {
    acc[curr.platform] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    totalTopics: topicsStat.total,
    totalScripts: scriptsStat.total,
    totalVideos: videosStat.total,
    approvedScripts: scriptsStat.approved,
    publishedVideos: videosStat.published,
    readyVideos: videosStat.ready,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicsStat.recent,
    recentScriptsCount: scriptsStat.recent,
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
