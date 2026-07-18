import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { partnerships, userBlocks, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const blockedRows = await db
    .select({
      id: userBlocks.id,
      blockedId: userBlocks.blockedId,
      blockedName: users.name,
      blockedPhone: users.phone,
      reason: userBlocks.reason,
      createdAt: userBlocks.createdAt,
    })
    .from(userBlocks)
    .innerJoin(users, eq(users.id, userBlocks.blockedId))
    .where(eq(userBlocks.blockerId, user.id));

  const items = blockedRows.map((b) => ({
    block_id: b.id,
    reason: b.reason || "مسدودسازی کاربر",
    created_at: b.createdAt,
    user_info: {
      id: b.blockedId,
      fullName: b.blockedName,
      email: b.blockedPhone,
      phone: b.blockedPhone,
    },
  }));

  return Response.json({ ok: true, blocked_users: items });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetId = String(body.blocked_user || body.userId || body.blockedUser || "").trim();
  const reason = String(body.reason || "تخلف کاربر");
  const notes = String(body.notes || "");

  if (!targetId) return Response.json({ error: "کاربر مورد نظر مشخص نشده است" }, { status: 400 });

  // Find user by id or phone
  const [targetUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, targetId)))
    .limit(1) ||
    await db
    .select()
    .from(users)
    .where(and(eq(users.phone, targetId)))
    .limit(1);

  if (!targetUser) return Response.json({ error: "کاربر یافت نشد" }, { status: 404 });
  if (targetUser.id === user.id) return Response.json({ error: "نمی‌توانید خودتان را مسدود کنید" }, { status: 400 });

  // Add block record
  await db
    .insert(userBlocks)
    .values({
      blockerId: user.id,
      blockedId: targetUser.id,
      reason,
      notes,
    })
    .onConflictDoNothing();

  // Remove partnership if exists
  await db.delete(partnerships).where(and(eq(partnerships.userId, user.id), eq(partnerships.partnerId, targetUser.id)));
  await db.delete(partnerships).where(and(eq(partnerships.userId, targetUser.id), eq(partnerships.partnerId, user.id)));

  return Response.json({ ok: true, status: "blocked" });
}

export async function DELETE(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const targetId = url.searchParams.get("userId") || url.searchParams.get("blockedUser");

  if (!targetId) return Response.json({ error: "userId required" }, { status: 400 });

  await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, user.id), eq(userBlocks.blockedId, targetId)));

  return Response.json({ ok: true, status: "unblocked" });
}
