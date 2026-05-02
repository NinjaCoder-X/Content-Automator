import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateTopicBody,
  ListTopicsQueryParams,
  GetTopicParams,
  DeleteTopicParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/topics", async (req, res) => {
  const parsed = ListTopicsQueryParams.safeParse(req.query);
  const query = parsed.success ? parsed.data : {};

  let topics = db
    .select()
    .from(topicsTable)
    .orderBy(desc(topicsTable.createdAt));

  const results = await topics;

  const filtered = results.filter((t) => {
    if (query.niche && t.niche !== query.niche) return false;
    if (query.status && t.status !== query.status) return false;
    return true;
  });

  res.json(filtered);
});

router.post("/topics", async (req, res) => {
  const parsed = CreateTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [topic] = await db
    .insert(topicsTable)
    .values({ ...parsed.data, status: "pending" })
    .returning();

  res.status(201).json(topic);
});

router.get("/topics/:id", async (req, res) => {
  const parsed = GetTopicParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [topic] = await db
    .select()
    .from(topicsTable)
    .where(eq(topicsTable.id, parsed.data.id));

  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  res.json(topic);
});

router.delete("/topics/:id", async (req, res) => {
  const parsed = DeleteTopicParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(topicsTable).where(eq(topicsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
