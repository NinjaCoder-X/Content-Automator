import { Router } from "express";
import { db } from "@workspace/db";
import { scriptsTable, topicsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateScriptBody,
  UpdateScriptBody,
  ListScriptsQueryParams,
  GetScriptParams,
  UpdateScriptParams,
  DeleteScriptParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/scripts", async (req, res) => {
  const parsed = ListScriptsQueryParams.safeParse(req.query);
  const query = parsed.success ? parsed.data : {};

  const conditions = [];
  if (query.niche) conditions.push(eq(scriptsTable.niche, query.niche));
  if (query.status) conditions.push(eq(scriptsTable.status, query.status));

  // ⚡ Bolt: Offloaded filtering from in-memory .filter() to DB via WHERE clause
  const results = await db
    .select()
    .from(scriptsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(scriptsTable.createdAt));

  res.json(results);
});

router.post("/scripts", async (req, res) => {
  const parsed = CreateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [script] = await db
    .insert(scriptsTable)
    .values({ ...parsed.data, status: "draft" })
    .returning();

  if (parsed.data.topicId) {
    await db
      .update(topicsTable)
      .set({ status: "scripted" })
      .where(eq(topicsTable.id, parsed.data.topicId));
  }

  res.status(201).json(script);
});

router.get("/scripts/:id", async (req, res) => {
  const parsed = GetScriptParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [script] = await db
    .select()
    .from(scriptsTable)
    .where(eq(scriptsTable.id, parsed.data.id));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.json(script);
});

router.patch("/scripts/:id", async (req, res) => {
  const idParsed = UpdateScriptParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateScriptBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [script] = await db
    .update(scriptsTable)
    .set(bodyParsed.data)
    .where(eq(scriptsTable.id, idParsed.data.id))
    .returning();

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.json(script);
});

router.delete("/scripts/:id", async (req, res) => {
  const parsed = DeleteScriptParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(scriptsTable).where(eq(scriptsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
