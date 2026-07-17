import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, areas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, destroySession, getCurrentUser } from "@/server/auth";
import { ensureSeeded } from "@/server/seed";
import { getDemoUsers } from "@/server/queries";
import { todayISO } from "@/lib/fa";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = ["#4A6741", "#E26645", "#9B6B61", "#7C8363", "#8D7F72", "#2D3025"];

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  await ensureSeeded();
  if (action === "me") {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id, name, avatarColor, totalPoints, level, streakDays, bio, phone, role } = user;
    return Response.json({ id, name, avatarColor, totalPoints, level, streakDays, bio, phone, role });
  }
  if (action === "demo") {
    return Response.json({ users: await getDemoUsers() });
  }
  return Response.json({ error: "unknown action" }, { status: 404 });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;

  if (action === "login") {
    await ensureSeeded();
    const body = await req.json().catch(() => ({}));
    const phone = String(body.phone ?? "").replace(/[^0-9]/g, "");
    const name = String(body.name ?? "").trim();
    if (phone.length < 10 || phone.length > 11) {
      return Response.json({ error: "شمارهٔ موبایل معتبر نیست" }, { status: 400 });
    }
    let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (!user) {
      if (!name || name.length < 2) {
        return Response.json({ error: "برای ساخت حساب، نامت را هم بنویس", needName: true }, { status: 400 });
      }
      const color = AVATAR_COLORS[Math.abs(hashCode(phone)) % AVATAR_COLORS.length];
      [user] = await db
        .insert(users)
        .values({ phone, name, avatarColor: color, lastActiveDate: todayISO() })
        .returning();
      // حوزه‌های پیش‌فرض برای کاربر تازه
      await db.insert(areas).values([
        { userId: user.id, name: "شخصی", color: "#7C8363", icon: "leaf", sortOrder: 0 },
        { userId: user.id, name: "سلامت", color: "#4A6741", icon: "heart-pulse", sortOrder: 1 },
        { userId: user.id, name: "کار و رشد", color: "#2D3025", icon: "briefcase", sortOrder: 2 },
      ]).onConflictDoNothing();
    } else if (!user.isDemo && name && name !== user.name) {
      await db.update(users).set({ name }).where(eq(users.id, user.id));
    }
    await createSession(user.id);
    return Response.json({ ok: true, name: user.name });
  }

  if (action === "demo-login") {
    await ensureSeeded();
    const body = await req.json().catch(() => ({}));
    const phone = String(body.phone ?? "09120000000");
    const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (!user || !user.isDemo) return Response.json({ error: "not found" }, { status: 404 });
    await createSession(user.id);
    return Response.json({ ok: true });
  }

  if (action === "logout") {
    await destroySession();
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 404 });
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
