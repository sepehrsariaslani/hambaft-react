import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { pointEvents, tasks, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { awardTaskCompletion } from "@/server/gamification";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function ownedTask(ctx: Ctx, userId: string) {
  const { id } = await ctx.params;
  const [t] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, userId)))
    .limit(1);
  return t ?? null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const t = await ownedTask(ctx, user.id);
  if (!t) return Response.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));

  /* تغییر وضعیت انجام */
  if (body.action === "toggle") {
    if (t.status === "done") {
      // برگرداندن + حذف امتیازهای همین تسک
      await db.update(tasks).set({ status: "todo", completedAt: null }).where(eq(tasks.id, t.id));
      const evts = await db
        .select({ n: sql<number>`coalesce(sum(${pointEvents.points}),0)::int` })
        .from(pointEvents)
        .where(and(eq(pointEvents.userId, user.id), eq(pointEvents.refType, "task"), eq(pointEvents.refId, t.id)));
      const deducted = evts[0]?.n ?? 0;
      if (deducted > 0) {
        await db.delete(pointEvents).where(and(eq(pointEvents.userId, user.id), eq(pointEvents.refType, "task"), eq(pointEvents.refId, t.id)));
        await db.update(users).set({ totalPoints: sql`greatest(0, ${users.totalPoints} - ${deducted})` }).where(eq(users.id, user.id));
      }
      return Response.json({ ok: true, status: "todo", deducted });
    }
    await db.update(tasks).set({ status: "done", completedAt: new Date() }).where(eq(tasks.id, t.id));
    const res = await awardTaskCompletion(user.id, t);
    return Response.json({ ok: true, status: "done", ...res });
  }

  /* ویرایش فیلدها */
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (["low", "medium", "high", "urgent"].includes(body.priority)) patch.priority = body.priority;
  if (body.isDailyHighlight !== undefined) patch.isDailyHighlight = !!body.isDailyHighlight;
  if (typeof body.scheduledDate === "string" || body.scheduledDate === null) patch.scheduledDate = body.scheduledDate;
  if (typeof body.status === "string" && ["todo", "in_progress", "done"].includes(body.status)) {
    patch.status = body.status;
    if (body.status === "done" && !t.completedAt) patch.completedAt = new Date();
  }
  if (Object.keys(patch).length === 0) return Response.json({ error: "nothing to update" }, { status: 400 });
  await db.update(tasks).set(patch).where(eq(tasks.id, t.id));
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const t = await ownedTask(ctx, user.id);
  if (!t) return Response.json({ error: "not found" }, { status: 404 });
  await db.delete(tasks).where(eq(tasks.id, t.id));
  return Response.json({ ok: true });
}
