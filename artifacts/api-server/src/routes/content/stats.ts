import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ⚡ Bolt: Execute aggregation queries directly in the database instead of pulling all rows into memory
  const [
    totalTopicsQuery,
    totalScriptsQuery,
    totalVideosQuery,
    approvedScriptsQuery,
    publishedVideosQuery,
    readyVideosQuery,
    topicsByNicheQuery,
    scriptsByNicheQuery,
    videosByPlatformQuery,
    recentTopicsQuery,
    recentScriptsQuery,
  ] = await Promise.all([
    db.select({ count: count() }).from(topicsTable),
    db.select({ count: count() }).from(scriptsTable),
    db.select({ count: count() }).from(videosTable),
    db.select({ count: count() }).from(scriptsTable).where(eq(scriptsTable.status, "approved")),
    db.select({ count: count() }).from(videosTable).where(eq(videosTable.status, "published")),
    db.select({ count: count() }).from(videosTable).where(eq(videosTable.status, "ready")),
    db.select({ niche: topicsTable.niche, count: count() }).from(topicsTable).groupBy(topicsTable.niche),
    db.select({ niche: scriptsTable.niche, count: count() }).from(scriptsTable).groupBy(scriptsTable.niche),
    db.select({ platform: videosTable.platform, count: count() }).from(videosTable).groupBy(videosTable.platform),
    db.select({ count: count() }).from(topicsTable).where(gte(topicsTable.createdAt, oneDayAgo)),
    db.select({ count: count() }).from(scriptsTable).where(gte(scriptsTable.createdAt, oneDayAgo)),
  ]);

  const topicsByNiche = topicsByNicheQuery.reduce((acc, curr) => {
    acc[curr.niche] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  const scriptsByNiche = scriptsByNicheQuery.reduce((acc, curr) => {
    acc[curr.niche] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  const videosByPlatform = videosByPlatformQuery.reduce((acc, curr) => {
    acc[curr.platform] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    totalTopics: totalTopicsQuery[0]?.count ?? 0,
    totalScripts: totalScriptsQuery[0]?.count ?? 0,
    totalVideos: totalVideosQuery[0]?.count ?? 0,
    approvedScripts: approvedScriptsQuery[0]?.count ?? 0,
    publishedVideos: publishedVideosQuery[0]?.count ?? 0,
    readyVideos: readyVideosQuery[0]?.count ?? 0,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: recentTopicsQuery[0]?.count ?? 0,
    recentScriptsCount: recentScriptsQuery[0]?.count ?? 0,
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
