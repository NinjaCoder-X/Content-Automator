import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable, scriptsTable, videosTable } from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const [topics, scripts, videos] = await Promise.all([
    db.select().from(topicsTable),
    db.select().from(scriptsTable),
    db.select().from(videosTable),
  ]);

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const topicsByNiche: Record<string, number> = {};
  for (const t of topics) {
    topicsByNiche[t.niche] = (topicsByNiche[t.niche] ?? 0) + 1;
  }

  const scriptsByNiche: Record<string, number> = {};
  for (const s of scripts) {
    scriptsByNiche[s.niche] = (scriptsByNiche[s.niche] ?? 0) + 1;
  }

  const videosByPlatform: Record<string, number> = {};
  for (const v of videos) {
    videosByPlatform[v.platform] = (videosByPlatform[v.platform] ?? 0) + 1;
  }

  res.json({
    totalTopics: topics.length,
    totalScripts: scripts.length,
    totalVideos: videos.length,
    approvedScripts: scripts.filter((s) => s.status === "approved").length,
    publishedVideos: videos.filter((v) => v.status === "published").length,
    readyVideos: videos.filter((v) => v.status === "ready").length,
    topicsByNiche,
    scriptsByNiche,
    videosByPlatform,
    recentTopicsCount: topics.filter((t) => t.createdAt >= oneDayAgo).length,
    recentScriptsCount: scripts.filter((s) => s.createdAt >= oneDayAgo).length,
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
