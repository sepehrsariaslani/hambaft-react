import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { badges, reports, userBlocks, userChallenges, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [usersCount] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  const [reportsPending] = await db.select({ n: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "pending"));
  const [reportsTotal] = await db.select({ n: sql<number>`count(*)::int` }).from(reports);
  const [blocksTotal] = await db.select({ n: sql<number>`count(*)::int` }).from(userBlocks);
  const [badgesActive] = await db.select({ n: sql<number>`count(*)::int` }).from(badges);

  const today = new Date().toISOString().slice(0, 10);
  const [challengesCompletedToday] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userChallenges)
    .where(eq(userChallenges.status, "completed"));

  return Response.json({
    ok: true,
    data: {
      users: usersCount?.n ?? 0,
      reports_pending: reportsPending?.n ?? 0,
      reports_total: reportsTotal?.n ?? 0,
      blocks_total: blocksTotal?.n ?? 0,
      badges_active: badgesActive?.n ?? 0,
      challenges_completed_today: challengesCompletedToday?.n ?? 0,
    },
  });
}
