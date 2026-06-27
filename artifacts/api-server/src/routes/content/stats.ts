import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, count, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Replaced fetching three entire tables and performing in-memory JS array operations
  // with Drizzle ORM native database aggregations (count, groupBy, and conditional sum/coalesce).
  // This drastically reduces server memory usage and network payload between DB and server.
  const [
    topicsStats,
    scriptsStats,
    videosStats,
    topicsGrouped,
    scriptsGrouped,
    videosGrouped,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        recentCount: sql<number>`coalesce(cast(sum(case when ${
          topicsTable.createdAt
        } >= ${oneDayAgo.toISOString()} then 1 else 0 end) as integer), 0)`,
      })
      .from(topicsTable),

    db
      .select({
        total: count(),
        recentCount: sql<number>`coalesce(cast(sum(case when ${
          scriptsTable.createdAt
        } >= ${oneDayAgo.toISOString()} then 1 else 0 end) as integer), 0)`,
        approvedCount: sql<number>`coalesce(cast(sum(case when ${
          scriptsTable.status
        } = 'approved' then 1 else 0 end) as integer), 0)`,
      })
      .from(scriptsTable),

    db
      .select({
        total: count(),
        publishedCount: sql<number>`coalesce(cast(sum(case when ${
          videosTable.status
        } = 'published' then 1 else 0 end) as integer), 0)`,
        readyCount: sql<number>`coalesce(cast(sum(case when ${
          videosTable.status
        } = 'ready' then 1 else 0 end) as integer), 0)`,
      })
      .from(videosTable),

    db
      .select({ niche: topicsTable.niche, count: count() })
      .from(topicsTable)
      .groupBy(topicsTable.niche),
    db
      .select({ niche: scriptsTable.niche, count: count() })
      .from(scriptsTable)
      .groupBy(scriptsTable.niche),
    db
      .select({ platform: videosTable.platform, count: count() })
      .from(videosTable)
      .groupBy(videosTable.platform),
  ]);

  const topicsByNiche: Record<string, number> = {};
  for (const t of topicsGrouped) {
    topicsByNiche[t.niche] = t.count;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const s of scriptsGrouped) {
    scriptsByNiche[s.niche] = s.count;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const v of videosGrouped) {
    videosByPlatform[v.platform] = v.count;
  }

  res.json({
    totalTopics: topicsStats[0]?.total ?? 0,
    totalScripts: scriptsStats[0]?.total ?? 0,
    totalVideos: videosStats[0]?.total ?? 0,
    approvedScripts: scriptsStats[0]?.approvedCount ?? 0,
    publishedVideos: videosStats[0]?.publishedCount ?? 0,
    readyVideos: videosStats[0]?.readyCount ?? 0,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topicsStats[0]?.recentCount ?? 0,
    recentScriptsCount: scriptsStats[0]?.recentCount ?? 0,
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
