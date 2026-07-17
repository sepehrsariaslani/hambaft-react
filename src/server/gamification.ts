import { db } from "@/db";
import {
  badges,
  comments,
  goalUpdates,
  goals,
  habitLogs,
  habits,
  notifications,
  pointEvents,
  reactions,
  tasks,
  userBadges,
  userChallenges,
  challenges,
  users,
} from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { POINTS, levelForPoints, computeStreak } from "@/lib/gamification";
import { todayISO } from "@/lib/fa";

/* ─── اعطای امتیاز + بروزرسانی سطح + بررسی نشان‌ها ─── */
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  refType = "",
  refId = "",
): Promise<{ leveledUp: boolean; newLevel: number }> {
  await db.insert(pointEvents).values({ userId, points, reason, refType, refId });
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { leveledUp: false, newLevel: 1 };
  const total = u.totalPoints + points;
  const newLevel = levelForPoints(total);
  const leveledUp = newLevel > u.level;
  await db
    .update(users)
    .set({ totalPoints: total, level: newLevel, lastActiveDate: todayISO() })
    .where(eq(users.id, userId));
  if (leveledUp) {
    await db.insert(notifications).values({
      userId,
      type: "points",
      title: `سطح ${newLevel} رسیدی!`,
      body: "هم‌بافته‌ای که تو هستی هر روز تازه‌تر می‌شود.",
    });
  }
  await updateStreak(userId);
  await checkBadges(userId);
  return { leveledUp, newLevel };
}

/* ─── زنجیرهٔ روزهای متوالی ─── */
export async function updateStreak(userId: string): Promise<number> {
  const today = todayISO();
  const evts = await db
    .select({ d: sql<string>`(${pointEvents.createdAt})::date::text` })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId));
  const logs = await db
    .select({ logDate: habitLogs.logDate })
    .from(habitLogs)
    .where(eq(habitLogs.userId, userId));
  const doneTasks = await db
    .select({ d: sql<string>`(${tasks.completedAt})::date::text` })
    .from(tasks)
    .where(and(eq(tasks.ownerId, userId), sql`${tasks.completedAt} is not null`));
  const dates = [...evts.map((e) => e.d), ...logs.map((l) => l.logDate), ...doneTasks.map((t) => t.d)];
  const streak = computeStreak(dates, today);
  await db.update(users).set({ streakDays: streak }).where(eq(users.id, userId));
  return streak;
}

/* ─── بررسی و اعطای نشان‌ها ─── */
export async function checkBadges(userId: string): Promise<string[]> {
  const all = await db.select().from(badges);
  const owned = new Set(
    (await db.select({ b: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId))).map(
      (r) => r.b,
    ),
  );
  const [stats] = await getUserStats(userId);
  const awarded: string[] = [];
  for (const b of all) {
    if (owned.has(b.id)) continue;
    let ok = false;
    switch (b.id) {
      case "first_step": ok = stats.tasksDone >= 1; break;
      case "task_10": ok = stats.tasksDone >= 10; break;
      case "task_50": ok = stats.tasksDone >= 50; break;
      case "task_200": ok = stats.tasksDone >= 200; break;
      case "habit_hero": ok = stats.habitLogs >= 30; break;
      case "habit_master": ok = stats.habitLogs >= 100; break;
      case "streak_7": ok = stats.streak >= 7; break;
      case "streak_30": ok = stats.streak >= 30; break;
      case "goal_getter": ok = stats.goalsDone >= 1; break;
      case "progress_25": ok = stats.goalUpdates >= 25; break;
      case "social_star": ok = stats.reactionsGiven >= 10; break;
      case "supportive": ok = stats.comments >= 10; break;
      case "point_500": ok = stats.total >= 500; break;
      case "point_2000": ok = stats.total >= 2000; break;
      case "point_5000": ok = stats.total >= 5000; break;
      default: ok = false;
    }
    if (ok) {
      await db.insert(userBadges).values({ userId, badgeId: b.id }).onConflictDoNothing();
      await db.insert(notifications).values({
        userId,
        type: "badge",
        title: `نشان «${b.title}» گرفتی!`,
        body: b.description,
        refType: "badge",
        refId: b.id,
      });
      awarded.push(b.id);
      if (b.points > 0) {
        await db.insert(pointEvents).values({ userId, points: b.points, reason: `نشان ${b.title}`, refType: "badge", refId: b.id });
        await db.update(users).set({ totalPoints: sql`${users.totalPoints} + ${b.points}` }).where(eq(users.id, userId));
      }
    }
  }
  return awarded;
}

export async function getUserStats(userId: string) {
  const today = todayISO();
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const td = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tasks)
    .where(and(eq(tasks.ownerId, userId), eq(tasks.status, "done")));
  const hl = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(habitLogs)
    .where(eq(habitLogs.userId, userId));
  const gu = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(goalUpdates)
    .where(eq(goalUpdates.userId, userId));
  const gd = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(goals)
    .where(and(eq(goals.ownerId, userId), eq(goals.status, "completed")));
  const rg = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reactions)
    .where(eq(reactions.userId, userId));
  const cm = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.userId, userId));
  return [{
    tasksDone: td[0]?.n ?? 0,
    habitLogs: hl[0]?.n ?? 0,
    goalUpdates: gu[0]?.n ?? 0,
    goalsDone: gd[0]?.n ?? 0,
    reactionsGiven: rg[0]?.n ?? 0,
    comments: cm[0]?.n ?? 0,
    streak: u?.streakDays ?? 0,
    total: u?.totalPoints ?? 0,
    today,
  }];
}

/* ─── چالش‌های روزانه ─── */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export async function ensureDailyChallenges(userId: string): Promise<void> {
  const today = todayISO();
  const existing = await db
    .select({ id: userChallenges.id })
    .from(userChallenges)
    .where(and(eq(userChallenges.userId, userId), eq(userChallenges.assignedDate, today)));
  if (existing.length > 0) return;
  const all = await db.select().from(challenges);
  if (all.length === 0) return;
  const seed = hashStr(userId + today);
  // یک ساده، یک متوسط، یک سخت — چرخشی بر اساس seed روز
  const byDiff = (d: string) => all.filter((c) => c.difficulty === d);
  const pick = (list: typeof all, i: number) => list[(seed + i) % list.length];
  const chosen = [
    pick(byDiff("easy"), 0),
    pick(byDiff("medium"), 1),
    pick(byDiff("hard"), 2),
  ].filter(Boolean);
  for (const c of chosen) {
    await db
      .insert(userChallenges)
      .values({ userId, challengeId: c.id, assignedDate: today, targetCount: c.targetCount })
      .onConflictDoNothing();
  }
}

/** محاسبهٔ زندهٔ پیشرفت چالش‌های امروز + اعطای امتیاز هنگام تکمیل */
export async function syncDailyChallenges(userId: string): Promise<void> {
  const today = todayISO();
  await ensureDailyChallenges(userId);
  const rows = await db
    .select({ uc: userChallenges, ch: challenges })
    .from(userChallenges)
    .innerJoin(challenges, eq(challenges.id, userChallenges.challengeId))
    .where(and(eq(userChallenges.userId, userId), eq(userChallenges.assignedDate, today)));
  for (const { uc, ch } of rows) {
    if (uc.status === "completed") continue;
    const progress = await measureMetric(userId, ch.metric, today);
    if (progress !== uc.progress) {
      await db.update(userChallenges).set({ progress }).where(eq(userChallenges.id, uc.id));
    }
    if (progress >= uc.targetCount) {
      await db
        .update(userChallenges)
        .set({ status: "completed", completedAt: new Date(), progress: uc.targetCount })
        .where(eq(userChallenges.id, uc.id));
      await db.insert(pointEvents).values({ userId, points: ch.points, reason: `چالش: ${ch.title}`, refType: "challenge", refId: ch.id });
      await db.update(users).set({ totalPoints: sql`${users.totalPoints} + ${ch.points}` }).where(eq(users.id, userId));
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (u) {
        const nl = levelForPoints(u.totalPoints);
        if (nl > u.level) {
          await db.update(users).set({ level: nl }).where(eq(users.id, userId));
          await db.insert(notifications).values({ userId, type: "points", title: `سطح ${nl} رسیدی!`, body: "" });
        }
      }
      await db.insert(notifications).values({
        userId,
        type: "challenge",
        title: `چالش «${ch.title}» کامل شد`,
        body: `+${ch.points} امتیاز`,
      });
      await checkBadges(userId);
    }
  }
}

async function measureMetric(userId: string, metric: string, today: string): Promise<number> {
  const doneToday = async (extra?: ReturnType<typeof sql>) => {
    const base = and(
      eq(tasks.ownerId, userId),
      eq(tasks.status, "done"),
      sql`(${tasks.completedAt})::date = ${today}`,
    );
    const r = await db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(extra ? and(base, extra) : base);
    return r[0]?.n ?? 0;
  };
  switch (metric) {
    case "task_done": return doneToday();
    case "high_priority": return doneToday(sql`${tasks.priority} in ('high','urgent')`);
    case "highlight_done": return doneToday(sql`${tasks.isDailyHighlight} = true`);
    case "habit_log": {
      const r = await db.select({ n: sql<number>`count(*)::int` }).from(habitLogs)
        .where(and(eq(habitLogs.userId, userId), eq(habitLogs.logDate, today)));
      return r[0]?.n ?? 0;
    }
    case "all_habits": {
      const total = await db.select({ n: sql<number>`count(*)::int` }).from(habits)
        .where(and(eq(habits.userId, userId), eq(habits.active, true)));
      const logged = await db.select({ n: sql<number>`count(distinct ${habitLogs.habitId})::int` }).from(habitLogs)
        .where(and(eq(habitLogs.userId, userId), eq(habitLogs.logDate, today)));
      const ok = (total[0]?.n ?? 0) > 0 && (logged[0]?.n ?? 0) >= (total[0]?.n ?? 0);
      return ok ? 1 : 0;
    }
    case "goal_update": {
      const r = await db.select({ n: sql<number>`count(*)::int` }).from(goalUpdates)
        .where(and(eq(goalUpdates.userId, userId), sql`(${goalUpdates.createdAt})::date = ${today}`));
      return r[0]?.n ?? 0;
    }
    case "shared_goal": {
      const r = await db.select({ n: sql<number>`count(*)::int` }).from(goalUpdates)
        .innerJoin(goals, eq(goals.id, goalUpdates.goalId))
        .where(and(eq(goalUpdates.userId, userId), sql`(${goalUpdates.createdAt})::date = ${today}`, eq(goals.privacy, "shared")));
      return r[0]?.n ?? 0;
    }
    case "reaction_given": {
      const r = await db.select({ n: sql<number>`count(*)::int` }).from(reactions)
        .where(and(eq(reactions.userId, userId), sql`(${reactions.createdAt})::date = ${today}`));
      return r[0]?.n ?? 0;
    }
    case "comment": {
      const r = await db.select({ n: sql<number>`count(*)::int` }).from(comments)
        .where(and(eq(comments.userId, userId), sql`(${comments.createdAt})::date = ${today}`));
      return r[0]?.n ?? 0;
    }
    case "points_earned": {
      const r = await db.select({ n: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` }).from(pointEvents)
        .where(and(eq(pointEvents.userId, userId), sql`(${pointEvents.createdAt})::date = ${today}`, sql`${pointEvents.refType} <> 'challenge'`));
      return r[0]?.n ?? 0;
    }
    default: return 0;
  }
}

/* امتیاز انجام تسک */
export async function awardTaskCompletion(userId: string, task: { id: string; priority: string; isDailyHighlight: boolean; title: string }) {
  let total = POINTS.TASK_DONE;
  if (task.priority === "high") total += POINTS.TASK_HIGH_PRIORITY_BONUS;
  if (task.priority === "urgent") total += POINTS.TASK_URGENT_BONUS;
  if (task.isDailyHighlight) total += POINTS.DAILY_HIGHLIGHT_BONUS;
  const res = await awardPoints(userId, total, `انجام «${task.title}»`, "task", task.id);
  await syncDailyChallenges(userId);
  return { points: total, ...res };
}
