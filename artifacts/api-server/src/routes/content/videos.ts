import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, scriptsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateVideoBody,
  UpdateVideoBody,
  ListVideosQueryParams,
  GetVideoParams,
  UpdateVideoParams,
  DeleteVideoParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/videos", async (req, res) => {
  const parsed = ListVideosQueryParams.safeParse(req.query);
  const query = parsed.success ? parsed.data : {};

  const conditions = [];
  if (query.status) conditions.push(eq(videosTable.status, query.status));
  if (query.platform) conditions.push(eq(videosTable.platform, query.platform));

  // ⚡ Bolt Performance Optimization:
  // Pushed query filters down to the database using `where` and `and()` instead of fetching
  // the entire table and filtering in-memory via JavaScript. This reduces memory overhead,
  // network payload, and speeds up execution significantly for large datasets.
  const results = await db
    .select()
    .from(videosTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(videosTable.createdAt));

  res.json(results);
});

router.post("/videos", async (req, res) => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [script] = await db
    .select()
    .from(scriptsTable)
    .where(eq(scriptsTable.id, parsed.data.scriptId));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  const [video] = await db
    .insert(videosTable)
    .values({
      scriptId: parsed.data.scriptId,
      niche: script.niche,
      title: script.title,
      caption: "",
      hashtags: "",
      platform: parsed.data.platform,
      status: "queued",
      voiceStyle: parsed.data.voiceStyle ?? "energetic",
      subtitlesEnabled: parsed.data.subtitlesEnabled ?? true,
    })
    .returning();

  await db
    .update(scriptsTable)
    .set({ status: "approved" })
    .where(eq(scriptsTable.id, parsed.data.scriptId));

  res.status(201).json(video);
});

router.get("/videos/:id", async (req, res) => {
  const parsed = GetVideoParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [video] = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.id, parsed.data.id));

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  res.json(video);
});

router.patch("/videos/:id", async (req, res) => {
  const idParsed = UpdateVideoParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateVideoBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [video] = await db
    .update(videosTable)
    .set(bodyParsed.data)
    .where(eq(videosTable.id, idParsed.data.id))
    .returning();

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  res.json(video);
});

router.delete("/videos/:id", async (req, res) => {
  const parsed = DeleteVideoParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(videosTable).where(eq(videosTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
