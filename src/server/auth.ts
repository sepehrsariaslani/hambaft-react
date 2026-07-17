import { cookies } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type users as UsersTable } from "@/db/schema";

export type SessionUser = typeof UsersTable.$inferSelect;

const COOKIE_NAME = "hambaft_session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const token = hashToken(raw);
  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function createSession(userId: string): Promise<void> {
  const raw = randomUUID() + randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token: hashToken(raw), userId, expiresAt });
  const store = await cookies();
  store.set(COOKIE_NAME, raw, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (raw) {
    await db.delete(sessions).where(eq(sessions.token, hashToken(raw)));
  }
  store.delete(COOKIE_NAME);
}

/** برای APIها — اگر کاربر لاگین نبود null برمی‌گرداند */
export async function apiUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}
