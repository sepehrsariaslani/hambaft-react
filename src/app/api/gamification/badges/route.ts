import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { badges, userBadges } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const RARITY_MAP: Record<string, string> = {
  first_step: "Common",
  task_10: "Common",
  task_50: "Rare",
  task_200: "Epic",
  habit_hero: "Rare",
  habit_master: "Epic",
  streak_7: "Common",
  streak_30: "Epic",
  goal_getter: "Common",
  progress_25: "Rare",
  social_star: "Rare",
  supportive: "Rare",
  point_500: "Common",
  point_2000: "Epic",
  point_5000: "Legendary",
};

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const allBadges = await db.select().from(badges);
  const earnedRows = await db
    .select({ badgeId: userBadges.badgeId, awardedAt: userBadges.awardedAt })
    .from(userBadges)
    .where(eq(userBadges.userId, user.id));

  const earnedMap = new Map(earnedRows.map((r) => [r.badgeId, r.awardedAt]));

  const items = allBadges.map((b) => {
    const isEarned = earnedMap.has(b.id);
    return {
      badge_id: b.id,
      badge_name: b.title,
      badge_name_fa: b.title,
      icon: b.icon,
      description: b.description,
      description_fa: b.description,
      rarity: RARITY_MAP[b.id] || "Common",
      points_awarded: b.points,
      earned: isEarned,
      awarded_at: earnedMap.get(b.id) || null,
    };
  });

  return Response.json({
    ok: true,
    data: {
      badges: items,
      earned_count: earnedRows.length,
    },
  });
}
