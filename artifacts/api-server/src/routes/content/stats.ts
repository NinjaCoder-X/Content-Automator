import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Offload aggregations to the database to prevent in-memory processing of full tables
  const [topicStats, scriptStats, videoStats, topicsDistribution, scriptsDistribution, videosDistribution] = await Promise.all([
    // Topic aggregates
    db.select({
      total: sql<number>`coalesce(cast(count(*) as integer), 0)`,
      recent: sql<number>`coalesce(cast(sum(case when ${topicsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
    }).from(topicsTable),

    // Script aggregates
    db.select({
      total: sql<number>`coalesce(cast(count(*) as integer), 0)`,
      recent: sql<number>`coalesce(cast(sum(case when ${scriptsTable.createdAt} >= ${oneDayAgo} then 1 else 0 end) as integer), 0)`,
      approved: sql<number>`coalesce(cast(sum(case when ${scriptsTable.status} = 'approved' then 1 else 0 end) as integer), 0)`,
    }).from(scriptsTable),

    // Video aggregates
    db.select({
      total: sql<number>`coalesce(cast(count(*) as integer), 0)`,
      published: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'published' then 1 else 0 end) as integer), 0)`,
      ready: sql<number>`coalesce(cast(sum(case when ${videosTable.status} = 'ready' then 1 else 0 end) as integer), 0)`,
    }).from(videosTable),

    // Group by aggregations
    db.select({
      niche: topicsTable.niche,
      count: sql<number>`coalesce(cast(count(*) as integer), 0)`
    }).from(topicsTable).groupBy(topicsTable.niche),

    db.select({
      niche: scriptsTable.niche,
      count: sql<number>`coalesce(cast(count(*) as integer), 0)`
    }).from(scriptsTable).groupBy(scriptsTable.niche),

    db.select({
      platform: videosTable.platform,
      count: sql<number>`coalesce(cast(count(*) as integer), 0)`
    }).from(videosTable).groupBy(videosTable.platform),
  ]);

  const topicsByNiche: Record<string, number> = {};
  for (const t of topicsDistribution) {
    topicsByNiche[t.niche] = t.count;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const s of scriptsDistribution) {
    scriptsByNiche[s.niche] = s.count;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const v of videosDistribution) {
    videosByPlatform[v.platform] = v.count;
  }

  res.json({
    totalTopics: topicStats[0]?.total ?? 0,
    totalScripts: scriptStats[0]?.total ?? 0,
    totalVideos: videoStats[0]?.total ?? 0,
    approvedScripts: scriptStats[0]?.approved ?? 0,
    publishedVideos: videoStats[0]?.published ?? 0,
    readyVideos: videoStats[0]?.ready ?? 0,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicStats[0]?.recent ?? 0,
    recentScriptsCount: scriptStats[0]?.recent ?? 0,
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
