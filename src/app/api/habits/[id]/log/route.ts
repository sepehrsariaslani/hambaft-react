import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { habitLogs, habits, pointEvents, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { todayISO } from "@/lib/fa";
import { POINTS } from "@/lib/gamification";
import { awardPoints, syncDailyChallenges } from "@/server/gamification";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const [habit] = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, id), eq(habits.userId, user.id)))
    .limit(1);
  if (!habit) return Response.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "") ? body.date : todayISO();
  if (date > todayISO()) return Response.json({ error: "آینده را نمی‌شود ثبت کرد" }, { status: 400 });

  const [existing] = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.logDate, date)))
    .limit(1);

  if (existing) {
    // حذف لاگ + برگرداندن امتیاز همان روز
    await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
    const evts = await db
      .select({ n: sql<number>`coalesce(sum(${pointEvents.points}),0)::int` })
      .from(pointEvents)
      .where(and(eq(pointEvents.userId, user.id), eq(pointEvents.refType, "habit"), eq(pointEvents.refId, id), sql`(${pointEvents.createdAt})::date = ${date}`));
    const deducted = evts[0]?.n ?? 0;
    if (deducted > 0) {
      await db.delete(pointEvents).where(and(eq(pointEvents.userId, user.id), eq(pointEvents.refType, "habit"), eq(pointEvents.refId, id), sql`(${pointEvents.createdAt})::date = ${date}`));
      await db.update(users).set({ totalPoints: sql`greatest(0, ${users.totalPoints} - ${deducted})` }).where(eq(users.id, user.id));
    }
    return Response.json({ ok: true, logged: false, deducted });
  }

  await db.insert(habitLogs).values({ habitId: id, userId: user.id, logDate: date, count: habit.targetPerDay }).onConflictDoNothing();
  const res = await awardPoints(user.id, POINTS.HABIT_CHECK, `عادت «${habit.title}»`, "habit", id);
  await syncDailyChallenges(user.id);
  return Response.json({ ok: true, logged: true, points: POINTS.HABIT_CHECK, ...res });
}
