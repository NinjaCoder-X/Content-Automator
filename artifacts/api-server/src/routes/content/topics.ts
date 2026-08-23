import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
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

  // ⚡ Bolt: Offload filtering to database where clauses rather than in-memory filtering
  const conditions = [];
  if (query.niche) conditions.push(eq(topicsTable.niche, query.niche));
  if (query.status) conditions.push(eq(topicsTable.status, query.status));

  let dbQuery = db.select().from(topicsTable);
  if (conditions.length > 0) {
    dbQuery = dbQuery.where(and(...conditions)) as any;
  }

  const topics = await dbQuery.orderBy(desc(topicsTable.createdAt));

  res.json(topics);
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
