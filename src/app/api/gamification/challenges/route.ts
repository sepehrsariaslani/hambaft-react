import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { challenges, userChallenges } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { syncDailyChallenges } from "@/server/gamification";
import { todayISO } from "@/lib/fa";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const isHistory = url.searchParams.get("history") === "true";

  const today = todayISO();

  if (isHistory) {
    const historyRows = await db
      .select({
        id: userChallenges.id,
        challengeId: challenges.id,
        title: challenges.title,
        description: challenges.description,
        difficulty: challenges.difficulty,
        pointsReward: challenges.points,
        status: userChallenges.status,
        progress: userChallenges.progress,
        targetCount: userChallenges.targetCount,
        assignedDate: userChallenges.assignedDate,
      })
      .from(userChallenges)
      .innerJoin(challenges, eq(challenges.id, userChallenges.challengeId))
      .where(eq(userChallenges.userId, user.id))
      .orderBy(desc(userChallenges.assignedDate))
      .limit(30);

    const items = historyRows.map((h) => ({
      id: h.id,
      title: h.title,
      title_fa: h.title,
      challenge_date: h.assignedDate,
      difficulty: h.difficulty,
      points_reward: h.pointsReward,
      status: h.status === "completed" ? "تکمیل‌شده" : "در_حال_انجام",
      icon: "target",
    }));

    return Response.json({ ok: true, data: { challenges: items } });
  }

  // Daily active challenges
  await syncDailyChallenges(user.id);

  const activeRows = await db
    .select({
      uc: userChallenges,
      ch: challenges,
    })
    .from(userChallenges)
    .innerJoin(challenges, eq(challenges.id, userChallenges.challengeId))
    .where(and(eq(userChallenges.userId, user.id), eq(userChallenges.assignedDate, today)));

  const items = activeRows.map(({ uc, ch }) => ({
    id: uc.id,
    template_id: ch.id,
    title: ch.title,
    title_fa: ch.title,
    description: ch.description,
    description_fa: ch.description,
    icon: "target",
    challenge_type: ch.metric,
    difficulty: ch.difficulty,
    category: "productivity",
    status: uc.status === "completed" ? "تکمیل‌شده" : "در_حال_انجام",
    progress: uc.progress,
    target_count: uc.targetCount,
    points_reward: ch.points,
    completed_at: uc.completedAt,
  }));

  return Response.json({
    ok: true,
    data: {
      date: today,
      challenges: items,
    },
  });
}
