import { db } from "@/db";
import {
  areas,
  badges,
  challenges,
  comments,
  goalMembers,
  goalUpdates,
  goals,
  habitLogs,
  habits,
  notifications,
  partnerships,
  pointEvents,
  projects,
  reactions,
  tasks,
  userBadges,
  userChallenges,
  users,
} from "@/db/schema";
import { and, desc, eq, gte, inArray, ne, or, sql, asc } from "drizzle-orm";
import { addDaysISO, todayISO } from "@/lib/fa";
import { syncDailyChallenges, getUserStats } from "./gamification";

/* ─── دسترسی به هدف (معادل RLS در نسخهٔ Supabase) ─── */
export async function canViewGoal(goalId: string, userId: string): Promise<boolean> {
  const [g] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!g) return false;
  if (g.ownerId === userId) return true;
  if (g.privacy === "shared") {
    const [m] = await db.select({ id: goalMembers.id }).from(goalMembers)
      .where(and(eq(goalMembers.goalId, goalId), eq(goalMembers.userId, userId), eq(goalMembers.status, "active"))).limit(1);
    return !!m;
  }
  return false;
}

/* ─── داشبورد ─── */
export async function getDashboard(userId: string) {
  const today = todayISO();
  await syncDailyChallenges(userId);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  const todaysTasks = await db
    .select({
      task: tasks,
      projectTitle: projects.title,
    })
    .from(tasks)
    .leftJoin(projects, eq(projects.id, tasks.projectId))
    .where(
      and(
        eq(tasks.ownerId, userId),
        or(
          eq(tasks.scheduledDate, today),
          eq(tasks.dueDate, today),
          eq(tasks.isDailyHighlight, true),
        ),
        ne(tasks.status, "done"),
      ),
    )
    .orderBy(desc(tasks.isDailyHighlight), asc(tasks.sortOrder))
    .limit(8);

  const doneToday = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tasks)
    .where(and(eq(tasks.ownerId, userId), sql`(${tasks.completedAt})::date = ${today}`));

  const habitRows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.active, true)));

  const recentStart = addDaysISO(today, -29);
  const logs = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), gte(habitLogs.logDate, recentStart)));

  const todayChallenges = await db
    .select({ uc: userChallenges, ch: challenges })
    .from(userChallenges)
    .innerJoin(challenges, eq(challenges.id, userChallenges.challengeId))
    .where(and(eq(userChallenges.userId, userId), eq(userChallenges.assignedDate, today)));

  const partnerIds = await db
    .select({ p: partnerships.partnerId })
    .from(partnerships)
    .where(and(eq(partnerships.userId, userId), eq(partnerships.status, "active")));

  const feedActors = [userId, ...partnerIds.map((p) => p.p)];
  const feed = await db
    .select({ ev: pointEvents, name: users.name, color: users.avatarColor })
    .from(pointEvents)
    .innerJoin(users, eq(users.id, pointEvents.userId))
    .where(inArray(pointEvents.userId, feedActors))
    .orderBy(desc(pointEvents.createdAt))
    .limit(6);

  const weekPoints = await db
    .select({
      d: sql<string>`(${pointEvents.createdAt})::date::text`,
      pts: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int`,
    })
    .from(pointEvents)
    .where(and(eq(pointEvents.userId, userId), gte(sql`(${pointEvents.createdAt})::date`, addDaysISO(today, -6))))
    .groupBy(sql`(${pointEvents.createdAt})::date`);

  const [unread] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  const [ptsTodayRow] = await db
    .select({ n: sql<number>`coalesce(sum(${pointEvents.points}),0)::int` })
    .from(pointEvents)
    .where(and(eq(pointEvents.userId, userId), sql`(${pointEvents.createdAt})::date = ${today}`));

  return {
    user,
    today,
    pointsToday: ptsTodayRow?.n ?? 0,
    todaysTasks: todaysTasks.map((t) => ({ ...t.task, projectTitle: t.projectTitle })),
    doneTodayCount: doneToday[0]?.n ?? 0,
    habits: habitRows,
    habitLogsWeek: logs,
    challenges: todayChallenges.map(({ uc, ch }) => ({ ...uc, challenge: ch })),
    feed,
    weekPoints,
    unreadCount: unread?.n ?? 0,
  };
}

/* ─── اهداف ─── */
export async function getGoalsPage(userId: string) {
  const areaRows = await db.select().from(areas).where(eq(areas.userId, userId)).orderBy(asc(areas.sortOrder));
  const myGoals = await db
    .select({ g: goals, areaName: areas.name, areaColor: areas.color })
    .from(goals)
    .leftJoin(areas, eq(areas.id, goals.areaId))
    .where(and(eq(goals.ownerId, userId), ne(goals.status, "archived")))
    .orderBy(desc(goals.createdAt));

  const memberGoals = await db
    .select({ g: goals, ownerName: users.name, areaName: areas.name })
    .from(goalMembers)
    .innerJoin(goals, eq(goals.id, goalMembers.goalId))
    .innerJoin(users, eq(users.id, goals.ownerId))
    .leftJoin(areas, eq(areas.id, goals.areaId))
    .where(and(eq(goalMembers.userId, userId), eq(goalMembers.status, "active"), ne(goals.ownerId, userId)));

  const memberCounts = await db
    .select({ goalId: goalMembers.goalId, n: sql<number>`count(*)::int` })
    .from(goalMembers)
    .where(eq(goalMembers.status, "active"))
    .groupBy(goalMembers.goalId);

  return { areas: areaRows, myGoals, memberGoals, memberCounts: Object.fromEntries(memberCounts.map((m) => [m.goalId, m.n])) };
}

export async function getGoalDetail(goalId: string, userId: string) {
  const [g] = await db
    .select({ g: goals, areaName: areas.name, areaColor: areas.color, ownerName: users.name, ownerColor: users.avatarColor })
    .from(goals)
    .leftJoin(areas, eq(areas.id, goals.areaId))
    .innerJoin(users, eq(users.id, goals.ownerId))
    .where(eq(goals.id, goalId))
    .limit(1);
  if (!g) return null;

  const members = await db
    .select({ id: users.id, name: users.name, color: users.avatarColor, level: users.level, totalPoints: users.totalPoints })
    .from(goalMembers)
    .innerJoin(users, eq(users.id, goalMembers.userId))
    .where(and(eq(goalMembers.goalId, goalId), eq(goalMembers.status, "active")));

  const updates = await db
    .select({ u: goalUpdates, name: users.name, color: users.avatarColor })
    .from(goalUpdates)
    .innerJoin(users, eq(users.id, goalUpdates.userId))
    .where(eq(goalUpdates.goalId, goalId))
    .orderBy(desc(goalUpdates.createdAt))
    .limit(10);

  const commentRows = await db
    .select({ c: comments, name: users.name, color: users.avatarColor })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(and(eq(comments.targetType, "goal"), eq(comments.targetId, goalId)))
    .orderBy(asc(comments.createdAt));

  const reactionRows = await db
    .select({ kind: reactions.kind, n: sql<number>`count(*)::int` })
    .from(reactions)
    .where(and(eq(reactions.targetType, "goal"), eq(reactions.targetId, goalId)))
    .groupBy(reactions.kind);

  const myReactions = await db
    .select({ kind: reactions.kind })
    .from(reactions)
    .where(and(eq(reactions.targetType, "goal"), eq(reactions.targetId, goalId), eq(reactions.userId, userId)));

  const linkedTasks = await db
    .select({ id: tasks.id, title: tasks.title, status: tasks.status, priority: tasks.priority })
    .from(tasks)
    .where(eq(tasks.goalId, goalId))
    .orderBy(asc(tasks.sortOrder))
    .limit(8);

  const linkedProjects = await db
    .select({ id: projects.id, title: projects.title, color: projects.color })
    .from(projects)
    .where(eq(projects.goalId, goalId))
    .limit(6);

  return { ...g, members, updates, comments: commentRows, reactions: reactionRows, myReactions: myReactions.map((r) => r.kind), linkedTasks, linkedProjects, isOwner: g.g.ownerId === userId };
}

/* ─── تسک‌ها ─── */
export async function getTasksPage(userId: string) {
  const rows = await db
    .select({ t: tasks, projectTitle: projects.title, projectColor: projects.color })
    .from(tasks)
    .leftJoin(projects, eq(projects.id, tasks.projectId))
    .where(eq(tasks.ownerId, userId))
    .orderBy(sql`case when ${tasks.status} = 'done' then 1 else 0 end`, desc(tasks.scheduledDate), asc(tasks.sortOrder))
    .limit(60);
  const projRows = await db.select().from(projects).where(eq(projects.ownerId, userId)).limit(12);
  return { tasks: rows.map((r) => ({ ...r.t, projectTitle: r.projectTitle, projectColor: r.projectColor })), projects: projRows };
}

/* ─── عادت‌ها ─── */
export async function getHabitsPage(userId: string) {
  const today = todayISO();
  const start = addDaysISO(today, -34);
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.active, true)))
    .orderBy(asc(habits.createdAt));
  const logs = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), gte(habitLogs.logDate, start)));
  return { habits: rows, logs, today };
}

/* ─── باشگاه (Arena) ─── */
export async function getArena(userId: string) {
  const today = todayISO();
  await syncDailyChallenges(userId);
  const weekStart = addDaysISO(today, -6);

  const leaders = await db
    .select({
      id: users.id, name: users.name, color: users.avatarColor,
      totalPoints: users.totalPoints, level: users.level, streakDays: users.streakDays, isDemo: users.isDemo,
    })
    .from(users)
    .orderBy(desc(users.totalPoints))
    .limit(12);

  const todayChallengeRows = await db
    .select({ uc: userChallenges, ch: challenges })
    .from(userChallenges)
    .innerJoin(challenges, eq(challenges.id, userChallenges.challengeId))
    .where(and(eq(userChallenges.userId, userId), eq(userChallenges.assignedDate, today)));

  const partnerRows = await db
    .select({
      id: users.id, name: users.name, color: users.avatarColor, level: users.level,
      totalPoints: users.totalPoints, streakDays: users.streakDays, bio: users.bio,
    })
    .from(partnerships)
    .innerJoin(users, eq(users.id, partnerships.partnerId))
    .where(and(eq(partnerships.userId, userId), eq(partnerships.status, "active")));

  const partnerWeek: Record<string, number> = {};
  for (const p of partnerRows) {
    const [r] = await db
      .select({ n: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` })
      .from(pointEvents)
      .where(and(eq(pointEvents.userId, p.id), gte(sql`(${pointEvents.createdAt})::date`, weekStart)));
    partnerWeek[p.id] = r?.n ?? 0;
  }
  const [myWeek] = await db
    .select({ n: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` })
    .from(pointEvents)
    .where(and(eq(pointEvents.userId, userId), gte(sql`(${pointEvents.createdAt})::date`, weekStart)));

  const feedActors = [userId, ...partnerRows.map((p) => p.id)];
  const feed = await db
    .select({ ev: pointEvents, name: users.name, color: users.avatarColor })
    .from(pointEvents)
    .innerJoin(users, eq(users.id, pointEvents.userId))
    .where(inArray(pointEvents.userId, feedActors))
    .orderBy(desc(pointEvents.createdAt))
    .limit(14);

  return {
    leaders, myId: userId, myWeekPoints: myWeek?.n ?? 0,
    challenges: todayChallengeRows.map(({ uc, ch }) => ({ ...uc, challenge: ch })),
    partners: partnerRows.map((p) => ({ ...p, weekPoints: partnerWeek[p.id] ?? 0 })),
    feed,
  };
}

/* ─── اعلان‌ها ─── */
export async function getNotifications(userId: string) {
  const rows = await db
    .select({ n: notifications, actorName: users.name, actorColor: users.avatarColor })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(30);
  return rows;
}

/* ─── پروفایل ─── */
export async function getProfile(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const stats = (await getUserStats(userId))[0];
  const badgeRows = await db.select().from(badges);
  const ownedRows = await db
    .select({ badgeId: userBadges.badgeId, awardedAt: userBadges.awardedAt })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const owned = new Map(ownedRows.map((r) => [r.badgeId, r.awardedAt]));

  const recent = await db
    .select()
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId))
    .orderBy(desc(pointEvents.createdAt))
    .limit(10);

  const weekStart = addDaysISO(todayISO(), -13);
  const chart = await db
    .select({ d: sql<string>`(${pointEvents.createdAt})::date::text`, pts: sql<number>`coalesce(sum(${pointEvents.points}),0)::int` })
    .from(pointEvents)
    .where(and(eq(pointEvents.userId, userId), gte(sql`(${pointEvents.createdAt})::date`, weekStart)))
    .groupBy(sql`(${pointEvents.createdAt})::date`);

  return {
    user, stats,
    badges: badgeRows.map((b) => ({ ...b, awardedAt: owned.get(b.id) ?? null })),
    recentEvents: recent,
    chart,
  };
}

/* ─── پروژه‌ها ─── */
export async function getProjectsPage(userId: string) {
  const areaRows = await db.select().from(areas).where(eq(areas.userId, userId)).orderBy(asc(areas.sortOrder));
  const projectRows = await db
    .select({
      p: projects,
      goalTitle: goals.title,
      areaName: areas.name,
      areaColor: areas.color,
    })
    .from(projects)
    .leftJoin(goals, eq(goals.id, projects.goalId))
    .leftJoin(areas, eq(areas.id, projects.areaId))
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.createdAt));

  const projectTasks = await db
    .select({
      projectId: tasks.projectId,
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
    })
    .from(tasks)
    .where(eq(tasks.ownerId, userId));

  const taskGrouped: Record<string, typeof projectTasks> = {};
  for (const t of projectTasks) {
    if (t.projectId) {
      if (!taskGrouped[t.projectId]) taskGrouped[t.projectId] = [];
      taskGrouped[t.projectId].push(t);
    }
  }

  const items = projectRows.map((r) => ({
    ...r.p,
    goalTitle: r.goalTitle,
    areaName: r.areaName,
    areaColor: r.areaColor,
    tasks: taskGrouped[r.p.id] || [],
  }));

  return { areas: areaRows, projects: items };
}

export async function getProjectDetail(projectId: string, userId: string) {
  const [p] = await db
    .select({
      p: projects,
      goalTitle: goals.title,
      areaName: areas.name,
      areaColor: areas.color,
    })
    .from(projects)
    .leftJoin(goals, eq(goals.id, projects.goalId))
    .leftJoin(areas, eq(areas.id, projects.areaId))
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1);

  if (!p) return null;

  const projectTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.ownerId, userId)))
    .orderBy(asc(tasks.sortOrder));

  return { ...p, tasks: projectTasks };
}

/* ─── ورود/معرفی کاربران دمو ─── */
export async function getDemoUsers() {
  return db
    .select({ id: users.id, name: users.name, color: users.avatarColor, bio: users.bio, level: users.level, phone: users.phone })
    .from(users)
    .where(eq(users.isDemo, true))
    .orderBy(asc(users.createdAt))
    .limit(4);
}
