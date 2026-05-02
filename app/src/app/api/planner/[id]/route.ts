import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/utils";

const patchSchema = z.object({
  done: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const id = Number(params.id);
  if (!Number.isFinite(id)) return jsonError("Invalid id", 400);

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400);

  const db = getDb();
  if (parsed.data.done !== undefined) {
    db.prepare(
      `UPDATE planner_items SET done = ? WHERE id = ? AND user_id = ?`,
    ).run(parsed.data.done ? 1 : 0, id, user.id);
  }
  return Response.json({ ok: true });
}
