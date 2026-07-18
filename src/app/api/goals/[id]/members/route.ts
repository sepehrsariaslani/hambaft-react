import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { goalMembers, goals, notifications, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canViewGoal } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await canViewGoal(id, user.id))) return Response.json({ error: "forbidden" }, { status: 403 });

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      avatarColor: users.avatarColor,
      phone: users.phone,
      level: users.level,
      totalPoints: users.totalPoints,
      role: goalMembers.role,
      status: goalMembers.status,
      joinedAt: goalMembers.joinedAt,
    })
    .from(goalMembers)
    .innerJoin(users, eq(users.id, goalMembers.userId))
    .where(and(eq(goalMembers.goalId, id), eq(goalMembers.status, "active")));

  return Response.json({ ok: true, members });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const [goal] = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  if (!goal) return Response.json({ error: "goal not found" }, { status: 404 });
  if (goal.ownerId !== user.id) return Response.json({ error: "only goal owner can manage members" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const targetIdentifier = String(body.targetUser ?? body.phone ?? body.userId ?? "").trim();
  if (!targetIdentifier) return Response.json({ error: "کاربر مقصد مشخص نشده" }, { status: 400 });

  // Find target user by id or phone
  const [targetUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, targetIdentifier)))
    .limit(1) ||
    await db
    .select()
    .from(users)
    .where(and(eq(users.phone, targetIdentifier)))
    .limit(1);

  if (!targetUser) return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });

  await db.insert(goalMembers).values({
    goalId: id,
    userId: targetUser.id,
    role: "partner",
    status: "active",
  }).onConflictDoNothing();

  await db.insert(notifications).values({
    userId: targetUser.id,
    actorId: user.id,
    type: "partner",
    title: `${user.name} شما را به هدف «${goal.title}» افزود`,
    body: "از حالا پیشرفت این هدف را با هم پیش می‌برید",
    refType: "goal",
    refId: id,
  });

  return Response.json({ ok: true, member: { id: targetUser.id, name: targetUser.name } });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const [goal] = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  if (!goal) return Response.json({ error: "goal not found" }, { status: 404 });

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId") || user.id;

  if (goal.ownerId !== user.id && targetUserId !== user.id) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  await db
    .delete(goalMembers)
    .where(and(eq(goalMembers.goalId, id), eq(goalMembers.userId, targetUserId)));

  return Response.json({ ok: true });
}
