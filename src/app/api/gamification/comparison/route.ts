import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { habitLogs, proofs, tasks, users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const partnerIdentifier = url.searchParams.get("partner") || url.searchParams.get("email") || url.searchParams.get("partner_email");

  let partnerUser = null;
  if (partnerIdentifier) {
    [partnerUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.phone, partnerIdentifier), eq(users.id, partnerIdentifier)))
      .limit(1);
  }

  if (!partnerUser) {
    [partnerUser] = await db
      .select()
      .from(users)
      .where(sql`${users.id} <> ${user.id}`)
      .limit(1);
  }

  if (!partnerUser) {
    return Response.json({ error: "پارتنری برای مقایسه یافت نشد" }, { status: 404 });
  }

  const [meUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

  const [meTasks] = await db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(eq(tasks.ownerId, user.id));
  const [meHabits] = await db.select({ n: sql<number>`count(*)::int` }).from(habitLogs).where(eq(habitLogs.userId, user.id));
  const [meProofs] = await db.select({ n: sql<number>`count(*)::int` }).from(proofs).where(eq(proofs.userId, user.id));

  const [pTasks] = await db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(eq(tasks.ownerId, partnerUser.id));
  const [pHabits] = await db.select({ n: sql<number>`count(*)::int` }).from(habitLogs).where(eq(habitLogs.userId, partnerUser.id));
  const [pProofs] = await db.select({ n: sql<number>`count(*)::int` }).from(proofs).where(eq(proofs.userId, partnerUser.id));

  const compare = (meVal: number, pVal: number) => {
    if (meVal > pVal) return "me";
    if (pVal > meVal) return "partner";
    return "tie";
  };

  const comparisonRows = [
    {
      field: "points",
      label: "امتیاز کل",
      icon: "star",
      me: meUser?.totalPoints ?? 0,
      partner: partnerUser.totalPoints,
      ahead: compare(meUser?.totalPoints ?? 0, partnerUser.totalPoints),
    },
    {
      field: "level",
      label: "سطح",
      icon: "level",
      me: meUser?.level ?? 1,
      partner: partnerUser.level,
      ahead: compare(meUser?.level ?? 1, partnerUser.level),
    },
    {
      field: "streak",
      label: "روزهای استریک",
      icon: "streak",
      me: meUser?.streakDays ?? 0,
      partner: partnerUser.streakDays,
      ahead: compare(meUser?.streakDays ?? 0, partnerUser.streakDays),
    },
    {
      field: "tasks",
      label: "تسک‌های کامل‌شده",
      icon: "tasks",
      me: meTasks?.n ?? 0,
      partner: pTasks?.n ?? 0,
      ahead: compare(meTasks?.n ?? 0, pTasks?.n ?? 0),
    },
    {
      field: "habits",
      label: "چک‌این عادت‌ها",
      icon: "habits",
      me: meHabits?.n ?? 0,
      partner: pHabits?.n ?? 0,
      ahead: compare(meHabits?.n ?? 0, pHabits?.n ?? 0),
    },
    {
      field: "proofs",
      label: "اثبات‌ها",
      icon: "proofs",
      me: meProofs?.n ?? 0,
      partner: pProofs?.n ?? 0,
      ahead: compare(meProofs?.n ?? 0, pProofs?.n ?? 0),
    },
  ];

  return Response.json({
    ok: true,
    data: {
      me: {
        total_points: meUser?.totalPoints ?? 0,
        level: meUser?.level ?? 1,
        current_streak: meUser?.streakDays ?? 0,
      },
      partner: {
        total_points: partnerUser.totalPoints,
        level: partnerUser.level,
        current_streak: partnerUser.streakDays,
      },
      comparison: comparisonRows,
    },
  });
}
