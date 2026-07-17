import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { comments, goalUpdates, goals, notifications, reactions, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { canViewGoal } from "@/server/queries";
import { awardPoints, syncDailyChallenges } from "@/server/gamification";
import { POINTS, goalProgress } from "@/lib/gamification";

export const dynamic = "force-dynamic";

const KINDS = ["cheer", "fire", "clap", "heart"];
const KIND_FA: Record<string, string> = { cheer: "دمت گرم", fire: "آتشی", clap: "آفرین", heart: "دوستت دارم" };

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await canViewGoal(id, user.id))) return Response.json({ error: "forbidden" }, { status: 403 });
  const [goal] = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  if (!goal) return Response.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const isOwner = goal.ownerId === user.id;

  /* ─── ثبت پیشرفت ─── */
  if (body.type === "progress") {
    const delta = Math.max(1, Math.min(10000, Math.round(Number(body.delta) || 1)));
    const note = String(body.note ?? "").slice(0, 500);
    const before = goalProgress(goal.currentValue, goal.targetValue);
    const next = Math.min(goal.targetValue, goal.currentValue + delta);
    const after = goalProgress(next, goal.targetValue);
    await db.insert(goalUpdates).values({ goalId: id, userId: user.id, valueDelta: delta, note });
    await db.update(goals).set({ currentValue: next, totalPoints: sql`${goals.totalPoints} + ${POINTS.GOAL_UPDATE}` }).where(eq(goals.id, id));
    const res = await awardPoints(user.id, POINTS.GOAL_UPDATE, `پیشرفت «${goal.title}»`, "goal", id);

    let completed = false;
    if (before < 1 && after >= 1 && goal.status !== "completed") {
      completed = true;
      await db.update(goals).set({ status: "completed" }).where(eq(goals.id, id));
      await awardPoints(user.id, POINTS.GOAL_COMPLETED, `تکمیل هدف «${goal.title}»`, "goal", id);
      if (!isOwner) {
        await db.insert(notifications).values({
          userId: goal.ownerId, actorId: user.id, type: "partner",
          title: `${user.name} هدف مشترکتان را کامل رساند!`, body: goal.title, refType: "goal", refId: id,
        });
      }
    }
    await syncDailyChallenges(user.id);
    return Response.json({ ok: true, currentValue: next, completed, points: POINTS.GOAL_UPDATE, ...res });
  }

  /* ─── دیدگاه ─── */
  if (body.type === "comment") {
    const text = String(body.body ?? "").trim().slice(0, 600);
    if (!text) return Response.json({ error: "متن دیدگاه خالی است" }, { status: 400 });
    await db.insert(comments).values({ userId: user.id, targetType: "goal", targetId: id, body: text });
    await awardPoints(user.id, POINTS.COMMENT, "دیدگاه حمایتی", "comment", id);
    if (!isOwner) {
      await db.insert(notifications).values({
        userId: goal.ownerId, actorId: user.id, type: "comment",
        title: `${user.name} روی «${goal.title}» دیدگاه گذاشت`, body: text.slice(0, 80), refType: "goal", refId: id,
      });
    }
    await syncDailyChallenges(user.id);
    return Response.json({ ok: true, points: POINTS.COMMENT });
  }

  /* ─── واکنش ─── */
  if (body.type === "reaction") {
    const kind = String(body.kind ?? "");
    if (!KINDS.includes(kind)) return Response.json({ error: "kind invalid" }, { status: 400 });
    const [existing] = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.userId, user.id), eq(reactions.targetType, "goal"), eq(reactions.targetId, id), eq(reactions.kind, kind)))
      .limit(1);
    if (existing) {
      await db.delete(reactions).where(eq(reactions.id, existing.id));
      return Response.json({ ok: true, on: false });
    }
    await db.insert(reactions).values({ userId: user.id, targetType: "goal", targetId: id, kind }).onConflictDoNothing();
    await awardPoints(user.id, POINTS.REACTION_GIVEN, "واکنش تشویقی", "reaction", id);
    if (!isOwner) {
      await db.insert(notifications).values({
        userId: goal.ownerId, actorId: user.id, type: "reaction",
        title: `${user.name} برای «${goal.title}» «${KIND_FA[kind]}» فرستاد`, refType: "goal", refId: id,
      });
    }
    await syncDailyChallenges(user.id);
    return Response.json({ ok: true, on: true, points: POINTS.REACTION_GIVEN });
  }

  return Response.json({ error: "unknown type" }, { status: 400 });
}
