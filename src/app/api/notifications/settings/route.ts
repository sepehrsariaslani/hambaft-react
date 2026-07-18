import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { notificationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let [settings] = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, user.id))
    .limit(1);

  if (!settings) {
    [settings] = await db
      .insert(notificationSettings)
      .values({ userId: user.id })
      .returning();
  }

  return Response.json({
    ok: true,
    data: {
      push_enabled: settings.badge,
      level_up: settings.points,
      badge_earned: settings.badge,
      challenge_completed: settings.challenge,
      partner_invite: settings.partner,
      partner_accepted: settings.partner,
      reaction_received: settings.reaction,
      nudge_received: settings.nudge,
      daily_reminder: settings.summary,
      streak_milestone: settings.streak,
      goal_deadline: settings.goal,
      system: true,
    },
  });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  await db
    .insert(notificationSettings)
    .values({
      userId: user.id,
      nudge: body.nudge_received !== undefined ? Boolean(body.nudge_received) : true,
      badge: body.badge_earned !== undefined ? Boolean(body.badge_earned) : true,
      points: body.level_up !== undefined ? Boolean(body.level_up) : true,
      reaction: body.reaction_received !== undefined ? Boolean(body.reaction_received) : true,
      comment: true,
      challenge: body.challenge_completed !== undefined ? Boolean(body.challenge_completed) : true,
      partner: body.partner_invite !== undefined ? Boolean(body.partner_invite) : true,
      goal: body.goal_deadline !== undefined ? Boolean(body.goal_deadline) : true,
      habit: true,
      task: true,
      streak: body.streak_milestone !== undefined ? Boolean(body.streak_milestone) : true,
      summary: body.daily_reminder !== undefined ? Boolean(body.daily_reminder) : true,
    })
    .onConflictDoUpdate({
      target: notificationSettings.userId,
      set: {
        nudge: body.nudge_received !== undefined ? Boolean(body.nudge_received) : undefined,
        badge: body.badge_earned !== undefined ? Boolean(body.badge_earned) : undefined,
        points: body.level_up !== undefined ? Boolean(body.level_up) : undefined,
        reaction: body.reaction_received !== undefined ? Boolean(body.reaction_received) : undefined,
        challenge: body.challenge_completed !== undefined ? Boolean(body.challenge_completed) : undefined,
        partner: body.partner_invite !== undefined ? Boolean(body.partner_invite) : undefined,
        goal: body.goal_deadline !== undefined ? Boolean(body.goal_deadline) : undefined,
        streak: body.streak_milestone !== undefined ? Boolean(body.streak_milestone) : undefined,
        summary: body.daily_reminder !== undefined ? Boolean(body.daily_reminder) : undefined,
        updatedAt: new Date(),
      },
    });

  return Response.json({ ok: true, message: "تنظیمات بروزرسانی شد" });
}
