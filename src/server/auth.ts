import { cookies } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type users as UsersTable } from "@/db/schema";
import { ensureSeeded } from "./seed";

export type SessionUser = typeof UsersTable.$inferSelect;

const COOKIE_NAME = "hambaft_session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCurrentUser(): Promise<SessionUser> {
  await ensureSeeded();
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (raw) {
    const token = hashToken(raw);
    const rows = await db
      .select({ user: users, expiresAt: sessions.expiresAt })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    if (rows[0]?.user) {
      return rows[0].user;
    }
  }

  // اگر سشن وجود نداشت یا در iframe بلاک شده بود، کاربر دمو اصلی (سپهر) را برمی‌گردانیم
  let [defaultUser] = await db
    .select()
    .from(users)
    .where(eq(users.phone, "09120000000"))
    .limit(1);

  if (!defaultUser) {
    // در صورت نبود دمو، اولین کاربر یا ساخت کاربر پیش‌فرض
    const [anyUser] = await db.select().from(users).limit(1);
    if (anyUser) return anyUser;
    [defaultUser] = await db
      .insert(users)
      .values({
        phone: "09120000000",
        name: "سپهر صریراصلانی",
        avatarColor: "#4A6741",
        role: "admin",
        isDemo: true,
      })
      .returning();
  }

  return defaultUser;
}

export async function createSession(userId: string): Promise<void> {
  const raw = randomUUID() + randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token: hashToken(raw), userId, expiresAt });
  const store = await cookies();
  try {
    store.set(COOKIE_NAME, raw, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      expires: expiresAt,
    });
  } catch {
    // اگر در ساید افکت اجازه نبود نادیده گرفته می‌شود
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (raw) {
    await db.delete(sessions).where(eq(sessions.token, hashToken(raw)));
  }
  try {
    store.delete(COOKIE_NAME);
  } catch {
    // ignore
  }
}

export async function apiUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}
