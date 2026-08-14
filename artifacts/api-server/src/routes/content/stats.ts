import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, sql, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  // ⚡ Bolt: Offload aggregations to the database to prevent loading full tables in memory
  const [
    [topicStats],
    [scriptStats],
    [videoStats],
    topicsByNicheRaw,
    scriptsByNicheRaw,
    videosByPlatformRaw
  ] = await Promise.all([
    db.select({
      total: count(),
      recent: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= now() - interval '1 day' then 1 else 0 end) as integer), 0)`,
    }).from(topicsTable),
    db.select({
      total: count(),
      recent: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= now() - interval '1 day' then 1 else 0 end) as integer), 0)`,
      approved: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as integer), 0)`,
    }).from(scriptsTable),
    db.select({
      total: count(),
      published: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as integer), 0)`,
      ready: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as integer), 0)`,
    }).from(videosTable),
    db.select({ niche: topicsTable.niche, count: count() }).from(topicsTable).groupBy(topicsTable.niche),
    db.select({ niche: scriptsTable.niche, count: count() }).from(scriptsTable).groupBy(scriptsTable.niche),
    db.select({ platform: videosTable.platform, count: count() }).from(videosTable).groupBy(videosTable.platform),
  ]);

  const topicsByNiche: Record<string, number> = {};
  for (const t of topicsByNicheRaw) topicsByNiche[t.niche] = t.count;

  const scriptsByNiche: Record<string, number> = {};
  for (const s of scriptsByNicheRaw) scriptsByNiche[s.niche] = s.count;

  const videosByPlatform: Record<string, number> = {};
  for (const v of videosByPlatformRaw) videosByPlatform[v.platform] = v.count;

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
