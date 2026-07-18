import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getProjectDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const data = await getProjectDetail(id, user.id);
  if (!data) return Response.json({ error: "not found" }, { status: 404 });

  return Response.json({ ok: true, project: data });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};

  if (body.title !== undefined) patch.title = String(body.title).trim();
  if (body.status !== undefined) patch.status = String(body.status);
  if (body.color !== undefined) patch.color = String(body.color);
  if (body.goalId !== undefined) patch.goalId = body.goalId || null;
  if (body.areaId !== undefined) patch.areaId = body.areaId || null;

  await db
    .update(projects)
    .set(patch)
    .where(and(eq(projects.id, id), eq(projects.ownerId, user.id)));

  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.ownerId, user.id)));

  return Response.json({ ok: true });
}
