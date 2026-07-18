import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { goalMembers, notifications, partnerships, users } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  // Partner list
  const activePartners = await db
    .select({
      connectionId: partnerships.id,
      partnerId: users.id,
      partnerName: users.name,
      partnerPhone: users.phone,
      partnerAvatar: users.avatarColor,
      partnerLevel: users.level,
      partnerPoints: users.totalPoints,
      partnerStreak: users.streakDays,
    })
    .from(partnerships)
    .innerJoin(users, eq(users.id, partnerships.partnerId))
    .where(and(eq(partnerships.userId, user.id), eq(partnerships.status, "active")));

  // Get shared goals count per partner
  const sharedCounts: Record<string, number> = {};
  for (const p of activePartners) {
    const members = await db
      .select({ id: goalMembers.id })
      .from(goalMembers)
      .where(and(eq(goalMembers.userId, p.partnerId), eq(goalMembers.status, "active")));
    sharedCounts[p.partnerId] = members.length;
  }

  const partnerList = activePartners.map((p) => ({
    id: p.connectionId,
    partner: {
      id: p.partnerId,
      fullName: p.partnerName,
      phone: p.partnerPhone,
      email: p.partnerPhone,
      avatarUrl: "",
      color: p.partnerAvatar,
      level: p.partnerLevel,
      points: p.partnerPoints,
      streak: p.partnerStreak,
    },
    sharedGoalsCount: sharedCounts[p.partnerId] || 0,
  }));

  return Response.json({
    ok: true,
    data: {
      partners: partnerList,
      sent: [],
      received: [],
    },
  });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const identifier = String(body.username || body.email || body.phone || body.partner_id || "").trim();
  const goalId = body.goal_id || body.goalId;
  const message = String(body.message || "");

  if (!identifier) {
    // Generate a code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return Response.json({ ok: true, invite_code: inviteCode, message: "کد دعوت تولید شد" });
  }

  // Find user
  const [targetUser] = await db
    .select()
    .from(users)
    .where(or(eq(users.phone, identifier), eq(users.id, identifier)))
    .limit(1);

  if (!targetUser) {
    return Response.json({ error: "کاربری با این مشخصات یافت نشد" }, { status: 404 });
  }

  if (targetUser.id === user.id) {
    return Response.json({ error: "نمی‌توانید خودتان را دعوت کنید" }, { status: 400 });
  }

  // Add partnership both ways
  await db
    .insert(partnerships)
    .values({ userId: user.id, partnerId: targetUser.id, status: "active" })
    .onConflictDoNothing();

  await db
    .insert(partnerships)
    .values({ userId: targetUser.id, partnerId: user.id, status: "active" })
    .onConflictDoNothing();

  if (goalId) {
    await db.insert(goalMembers).values({ goalId, userId: targetUser.id, status: "active" }).onConflictDoNothing();
  }

  await db.insert(notifications).values({
    userId: targetUser.id,
    actorId: user.id,
    type: "partner",
    title: `${user.name} شما را به عنوان پارتنر اضافه کرد`,
    body: message || "از حالا با هم در مسیر پیشرفت همراهید! 💪",
    refType: "partner",
    refId: user.id,
  });

  return Response.json({ ok: true, message: "پارتنر با موفقیت اضافه شد" });
}

export async function DELETE(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const connectionId = url.searchParams.get("id") || url.searchParams.get("connectionId");

  if (connectionId) {
    const [p] = await db.select().from(partnerships).where(eq(partnerships.id, connectionId)).limit(1);
    if (p && p.userId === user.id) {
      await db.delete(partnerships).where(and(eq(partnerships.userId, user.id), eq(partnerships.partnerId, p.partnerId)));
      await db.delete(partnerships).where(and(eq(partnerships.userId, p.partnerId), eq(partnerships.partnerId, user.id)));
    }
  }

  return Response.json({ ok: true });
}
