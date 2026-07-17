import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { notifications, partnerships } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { POINTS } from "@/lib/gamification";
import { awardPoints } from "@/server/gamification";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.action === "nudge") {
    const partnerId = String(body.partnerId ?? "");
    const [p] = await db
      .select({ id: partnerships.id })
      .from(partnerships)
      .where(and(eq(partnerships.userId, user.id), eq(partnerships.partnerId, partnerId), eq(partnerships.status, "active")))
      .limit(1);
    if (!p) return Response.json({ error: "پارتنر نیست" }, { status: 403 });

    // محدودیت: حداکثر یک ناج هر ۴ ساعت
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const [recent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, partnerId),
        eq(notifications.actorId, user.id),
        eq(notifications.type, "nudge"),
        gte(notifications.createdAt, fourHoursAgo),
      ));
    if ((recent?.n ?? 0) > 0) {
      return Response.json({ error: "همین چند ساعت پیش ناجش زدی — کمی استراحت بده :)", cooldown: true }, { status: 429 });
    }

    const messages = [
      "یادت نره امروزت رو ببافی ✦",
      "من سرجامم، نوبت توئه!",
      "یه قدم کوچیک هم عالیه — شروع کن",
      "امروز را با هم می‌بریم جلو",
      "بشور و بپاش، هدف‌هات منتظرن :)",
    ];
    const msg = String(body.message ?? "") || messages[Math.floor(Math.random() * messages.length)];
    await db.insert(notifications).values({
      userId: partnerId, actorId: user.id, type: "nudge",
      title: `${user.name} ناجت زد`, body: msg, refType: "nudge", refId: "0",
    });
    await awardPoints(user.id, POINTS.NUDGE_SENT, "ناج به پارتنر", "nudge", partnerId);
    return Response.json({ ok: true, message: msg });
  }

  if (body.action === "partners") {
    // معرفی پارتنرهای بالقوه (کاربران دیگر)
    const rows = await db.execute(sql`
      select u.id, u.name, u.avatar_color as color, u.level, u.total_points, u.streak_days,
        exists(select 1 from partnerships pp where pp.user_id = ${user.id} and pp.partner_id = u.id and pp.status = 'active') as bonded
      from users u where u.id <> ${user.id} order by u.total_points desc limit 12
    `);
    return Response.json({ ok: true, users: rows.rows });
  }

  if (body.action === "bond") {
    const partnerId = String(body.partnerId ?? "");
    if (partnerId === user.id) return Response.json({ error: "invalid" }, { status: 400 });
    await db.insert(partnerships).values({ userId: user.id, partnerId }).onConflictDoNothing();
    await db.insert(notifications).values({
      userId: partnerId, actorId: user.id, type: "partner",
      title: `${user.name} تو را پارتنر هم‌مسیر خود کرد`, body: "از حالا فید هم را می‌بینید", refType: "partner", refId: user.id,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
