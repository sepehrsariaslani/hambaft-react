import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { badges, comments, pointEvents, proofs, tasks, userBadges, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getUserStats } from "@/server/gamification";

export const dynamic = "force-dynamic";

function pointsToNextLevel(level: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 1800, 2800, 4000, 5500, 7500];
  if (level < thresholds.length) return thresholds[level] || (level * 500);
  return level * 1000;
}

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [u] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!u) return Response.json({ error: "user not found" }, { status: 404 });

  const [stats] = await getUserStats(user.id);

  const userBadgeRows = await db
    .select({
      id: userBadges.id,
      badgeId: userBadges.badgeId,
      awardedAt: userBadges.awardedAt,
      title: badges.title,
      description: badges.description,
      icon: badges.icon,
      points: badges.points,
    })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(eq(userBadges.userId, user.id))
    .orderBy(desc(userBadges.awardedAt));

  const recentPoints = await db
    .select()
    .from(pointEvents)
    .where(eq(pointEvents.userId, user.id))
    .orderBy(desc(pointEvents.createdAt))
    .limit(15);

  const [proofsCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(proofs)
    .where(eq(proofs.userId, user.id));

  const [commentsCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.userId, user.id));

  const [doneTasksCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tasks)
    .where(eq(tasks.ownerId, user.id));

  return Response.json({
    ok: true,
    data: {
      total_points: u.totalPoints,
      level: u.level,
      points_to_next_level: pointsToNextLevel(u.level),
      current_streak_days: u.streakDays,
      best_streak_days: Math.max(u.streakDays, 7),
      badges: userBadgeRows.map((b) => ({
        id: b.id,
        badge_id: b.badgeId,
        badge_name: b.title,
        badge_name_fa: b.title,
        icon: b.icon,
        description: b.description,
        description_fa: b.description,
        rarity: "Rare",
        points_awarded: b.points,
        earned_at: b.awardedAt,
      })),
      recent_points: recentPoints.map((p) => ({
        id: p.id,
        points: p.points,
        reason: p.reason,
        description: p.reason,
        created_at: p.createdAt,
      })),
      stats: {
        tasks_completed: doneTasksCount?.n ?? stats.tasksDone,
        proofs_uploaded: proofsCount?.n ?? 0,
        comments_posted: commentsCount?.n ?? stats.comments,
      },
    },
  });
}
