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
  users,
} from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { levelForPoints } from "@/lib/gamification";
import { userBadges } from "@/db/schema";

const ago = (days: number, hour = 9, min = 0) =>
  new Date(Date.now() - days * 86400000 - (new Date().getHours() - hour) * 3600000 - min * 60000);

const isoAgo = (days: number) => {
  const d = new Date(Date.now() - days * 86400000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const BADGES = [
  { id: "first_step", title: "اولین قدم", description: "نخستین تسک را انجام دادی", icon: "footprints", category: "tasks", threshold: 1, points: 10 },
  { id: "task_10", title: "سازنده", description: "۱۰ تسک انجام دادی", icon: "hammer", category: "tasks", threshold: 10, points: 25 },
  { id: "task_50", title: "ماشین تسک", description: "۵۰ تسک را فتح کردی", icon: "zap", category: "tasks", threshold: 50, points: 50 },
  { id: "task_200", title: "افسانهٔ بهره‌وری", description: "۲۰۰ تسک انجام‌شده", icon: "crown", category: "tasks", threshold: 200, points: 150 },
  { id: "habit_hero", title: "قهرمان عادت", description: "۳۰ ثبت عادت روزانه", icon: "sprout", category: "habits", threshold: 30, points: 50 },
  { id: "habit_master", title: "استاد ثبات", description: "۱۰۰ ثبت عادت روزانه", icon: "tree", category: "habits", threshold: 100, points: 120 },
  { id: "streak_7", title: "هفتهٔ طلایی", description: "۷ روز متوالی فعال", icon: "flame", category: "consistency", threshold: 7, points: 40 },
  { id: "streak_30", title: "ماه آتشین", description: "۳۰ روز متوالی فعال", icon: "sun", category: "consistency", threshold: 30, points: 200 },
  { id: "goal_getter", title: "هدف‌گیر", description: "یک هدف را کامل رساندی", icon: "target", category: "goals", threshold: 1, points: 100 },
  { id: "progress_25", title: "گام‌به‌گام", description: "۲۵ بار پیشرفت ثبت کردی", icon: "trending-up", category: "goals", threshold: 25, points: 40 },
  { id: "social_star", title: "ستارهٔ اجتماعی", description: "۱۰ واکنش تشویقی فرستادی", icon: "star", category: "social", threshold: 10, points: 30 },
  { id: "supportive", title: "حامی", description: "۱۰ دیدگاه حمایتی نوشتی", icon: "heart-handshake", category: "social", threshold: 10, points: 30 },
  { id: "point_500", title: "نیم‌هزارتایی", description: "۵۰۰ امتیاز جمع کردی", icon: "medal", category: "points", threshold: 500, points: 0 },
  { id: "point_2000", title: "دوهزارتایی", description: "۲۰۰۰ امتیاز جمع کردی", icon: "gem", category: "points", threshold: 2000, points: 0 },
  { id: "point_5000", title: "اسطورهٔ امتیاز", description: "۵۰۰۰ امتیاز جمع کردی", icon: "trophy", category: "points", threshold: 5000, points: 0 },
];

const CHALLENGES = [
  { id: "c_three_tasks", title: "سه‌تایی", description: "۳ تسک را امروز انجام بده", metric: "task_done", targetCount: 3, points: 20, difficulty: "easy" },
  { id: "c_cheer_two", title: "تشویق‌گر", description: "برای ۲ نفر واکنش تشویقی بفرست", metric: "reaction_given", targetCount: 2, points: 15, difficulty: "easy" },
  { id: "c_goal_step", title: "یک قدم به جلو", description: "۱ پیشرفت روی اهدافت ثبت کن", metric: "goal_update", targetCount: 1, points: 15, difficulty: "easy" },
  { id: "c_kind_word", title: "حرف حمایت", description: "۱ دیدگاه حمایتی بنویس", metric: "comment", targetCount: 1, points: 15, difficulty: "easy" },
  { id: "c_one_habit", title: "جرقهٔ عادت", description: "۱ عادت را امروز ثبت کن", metric: "habit_log", targetCount: 1, points: 10, difficulty: "easy" },
  { id: "c_five_tasks", title: "پنج‌انگشتی", description: "۵ تسک را امروز فتح کن", metric: "task_done", targetCount: 5, points: 40, difficulty: "medium" },
  { id: "c_three_habits", title: "عادت‌های سرخط", description: "۳ عادت را امروز ثبت کن", metric: "habit_log", targetCount: 3, points: 35, difficulty: "medium" },
  { id: "c_priority", title: "اولویت‌دار", description: "۱ تسک مهم یا فوری را انجام بده", metric: "high_priority", targetCount: 1, points: 30, difficulty: "medium" },
  { id: "c_fifty_points", title: "نیم‌صدای امتیاز", description: "۵۰ امتیاز در یک روز جمع کن", metric: "points_earned", targetCount: 50, points: 35, difficulty: "medium" },
  { id: "c_shared_goal", title: "با هم بهتر", description: "۱ پیشرفت روی هدف اشتراکی ثبت کن", metric: "shared_goal", targetCount: 1, points: 40, difficulty: "medium" },
  { id: "c_all_habits", title: "روز کامل", description: "همهٔ عادت‌های امروز را ثبت کن", metric: "all_habits", targetCount: 1, points: 60, difficulty: "hard" },
  { id: "c_seven_tasks", title: "هفت‌رخشان", description: "۷ تسک در یک روز انجام بده", metric: "task_done", targetCount: 7, points: 70, difficulty: "hard" },
  { id: "c_highlight", title: "نکتهٔ برجسته", description: "تسکِ روزِ برجسته‌ات را تمام کن", metric: "highlight_done", targetCount: 1, points: 30, difficulty: "medium" },
];

/** سید ایدمپوتنت — اگر کاربری وجود نداشت، دنیای دمو را می‌سازد */
export async function ensureSeeded(): Promise<string | null> {
  await db.insert(badges).values(BADGES).onConflictDoNothing();
  await db.insert(challenges).values(CHALLENGES).onConflictDoNothing();

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  if (n > 0) {
    const [demo] = await db.select({ id: users.id }).from(users).where(eq(users.phone, "09120000000")).limit(1);
    return demo?.id ?? null;
  }

  /* ─── کاربران ─── */
  const [sepehr] = await db.insert(users).values({
    phone: "09120000000", name: "سپهر صریراصلانی", avatarColor: "#4A6741",
    bio: "سازندهٔ همبافت — هر روز کمی بهتر از دیروز", role: "admin", isDemo: true,
    totalPoints: 0, level: 1, streakDays: 9, lastActiveDate: isoAgo(0),
  }).returning({ id: users.id });
  const [nima] = await db.insert(users).values({
    phone: "09121111111", name: "نیما راد", avatarColor: "#E26645",
    bio: "کتاب‌خوان و دوند", isDemo: true, totalPoints: 890, level: 4, streakDays: 12, lastActiveDate: isoAgo(0),
  }).returning({ id: users.id });
  const [sara] = await db.insert(users).values({
    phone: "09122222222", name: "سارا محمدی", avatarColor: "#9B6B61",
    bio: "طراح، ورزشکار، و هم‌راهِ اهداف", isDemo: true, totalPoints: 1530, level: 6, streakDays: 5, lastActiveDate: isoAgo(0),
  }).returning({ id: users.id });
  const [maryam] = await db.insert(users).values({
    phone: "09123333333", name: "مریم احمدی", avatarColor: "#7C8363",
    bio: "متعادل و مداوم", isDemo: true, totalPoints: 640, level: 4, streakDays: 3, lastActiveDate: isoAgo(0),
  }).returning({ id: users.id });

  const S = sepehr.id, N = nima.id, SA = sara.id, M = maryam.id;

  /* ─── حوزه‌ها ─── */
  const areaDefs = [
    { name: "سلامت", color: "#4A6741", icon: "heart-pulse", sortOrder: 0 },
    { name: "حرفه", color: "#2D3025", icon: "briefcase", sortOrder: 1 },
    { name: "یادگیری", color: "#7C8363", icon: "book-open", sortOrder: 2 },
    { name: "مالی", color: "#9B6B61", icon: "wallet", sortOrder: 3 },
    { name: "روابط", color: "#E26645", icon: "users", sortOrder: 4 },
    { name: "آرامش", color: "#8D7F72", icon: "wind", sortOrder: 5 },
  ];
  const areaRows = await db.insert(areas).values(areaDefs.map((a) => ({ ...a, userId: S }))).returning();
  const A = Object.fromEntries(areaRows.map((r) => [r.name, r.id])) as Record<string, string>;

  /* ─── اهداف ─── */
  const goalDefs = [
    { title: "خواندن ۲۰ کتاب در سال", description: "میانگین ۲ کتاب در ماه؛ هر کتاب را با خلاصه‌ی ۱۰ خطی تمام می‌کنم.", category: "learning", goalType: "metric", unit: "کتاب", targetValue: 20, currentValue: 7, privacy: "shared", scope: "annual", areaId: A["یادگیری"], totalPoints: 210, deadline: null as string | null },
    { title: "دویدن ۱۰۰ کیلومتر تابستان", description: "سه جلسهٔ دویدن در هفته؛ ثبت هر جلسه در همبافت.", category: "health", goalType: "metric", unit: "کیلومتر", targetValue: 100, currentValue: 34, privacy: "shared", scope: "quarterly", areaId: A["سلامت"], totalPoints: 180, deadline: null },
    { title: "صندوق اضطراری ۵۰ میلیون", description: "هر ماه ۵ میلیون تومان کنار می‌گذارم تا امنیت مالی بسازم.", category: "finance", goalType: "savings", unit: "میلیون تومان", targetValue: 50, currentValue: 18, privacy: "private", scope: "annual", areaId: A["مالی"], totalPoints: 90, deadline: null },
    { title: "گفت‌وگوی روان ترکی استانبولی", description: "روزی ۲۰ دقیقه تمرین مکالمه + ۱۰ لغت تازه.", category: "learning", goalType: "outcome", unit: "٪", targetValue: 100, currentValue: 45, privacy: "private", scope: "custom", areaId: A["یادگیری"], totalPoints: 120, deadline: null },
    { title: "انتشار همبافت نسخهٔ موبایل", description: "مهاجرت از فراپ به React Native + Supabase و انتشار APK.", category: "career", goalType: "outcome", unit: "٪", targetValue: 100, currentValue: 60, privacy: "shared", scope: "quarterly", areaId: A["حرفه"], totalPoints: 260, deadline: null },
    { title: "۳۰ شب خواب منظم", description: "خواب قبل از ۲۳:۳۰ و بیداری قبل از ۷.", category: "health", goalType: "habit_driven", unit: "شب", targetValue: 30, currentValue: 12, privacy: "private", scope: "monthly", areaId: A["آرامش"], totalPoints: 60, deadline: null },
  ];
  const goalRows = await db.insert(goals).values(goalDefs.map((g) => ({ ...g, ownerId: S }))).returning();
  const G = goalRows.map((r) => r.id);

  /* اعضای اهداف مشترک */
  await db.insert(goalMembers).values([
    { goalId: G[0], userId: N, role: "partner" },
    { goalId: G[1], userId: SA, role: "partner" },
    { goalId: G[4], userId: N, role: "partner" },
    { goalId: G[4], userId: M, role: "partner" },
  ]).onConflictDoNothing();

  /* پیشرفت‌های اخیر */
  const updRows: { goalIdx: number; user: string; d: number; delta: number; note: string }[] = [
    { goalIdx: 0, user: S, d: 1, delta: 1, note: "کتاب «عادت‌های اتمی» تمام شد — خلاصه نوشته شد." },
    { goalIdx: 0, user: N, d: 2, delta: 1, note: "من هم «انسان خردمند» را تمام کردم!" },
    { goalIdx: 0, user: S, d: 6, delta: 1, note: "«تفکر، سریع و آهسته» — نیمهٔ دوم." },
    { goalIdx: 1, user: S, d: 0, delta: 6, note: "دو صبحگاهی پارک ملت" },
    { goalIdx: 1, user: SA, d: 1, delta: 8, note: "دوی طولانی شنبه" },
    { goalIdx: 1, user: S, d: 4, delta: 5, note: "" },
    { goalIdx: 4, user: S, d: 1, delta: 10, note: "اسکیمای PostgreSQL نهایی شد" },
    { goalIdx: 4, user: N, d: 3, delta: 5, note: "طراحی اولیهٔ صفحات در فیگما" },
    { goalIdx: 5, user: S, d: 2, delta: 2, note: "دو شب پیاپی حاضر به‌موقع" },
    { goalIdx: 3, user: S, d: 3, delta: 5, note: "مکالمهٔ ۲۵ دقیقه‌ای با بومی" },
  ];
  await db.insert(goalUpdates).values(updRows.map((u) => ({
    goalId: G[u.goalIdx], userId: u.user, valueDelta: u.delta, note: u.note, createdAt: ago(u.d, 20),
  })));

  /* ─── پروژه‌ها ─── */
  const projRows = await db.insert(projects).values([
    { ownerId: S, goalId: G[4], areaId: A["حرفه"], title: "همبافت موبایل", color: "#4A6741" },
    { ownerId: S, goalId: G[0], areaId: A["یادگیری"], title: "باشگاه کتاب", color: "#7C8363" },
    { ownerId: S, areaId: A["مالی"], title: "بودجهٔ خانوار", color: "#9B6B61" },
  ]).returning();
  const P = projRows.map((r) => r.id);

  /* ─── تسک‌ها ─── */
  const today = isoAgo(0), tm1 = isoAgo(1), tm2 = isoAgo(2);
  const taskDefs = [
    { title: "طراحی نهایی صفحهٔ ورود اپ", status: "todo", priority: "high", scheduledDate: today, isDailyHighlight: true, estimatedMinutes: 60, projectId: P[0], areaId: A["حرفه"], completedAt: null as Date | null, sortOrder: 0 },
    { title: "مرور ۲۰ صفحه از کتاب جدید", status: "todo", priority: "medium", scheduledDate: today, isDailyHighlight: false, estimatedMinutes: 30, projectId: P[1], completedAt: null, sortOrder: 1 },
    { title: "تمرین شنا ۴۵ دقیقه‌ای", status: "todo", priority: "high", scheduledDate: today, isDailyHighlight: false, estimatedMinutes: 45, areaId: A["سلامت"], completedAt: null, sortOrder: 2 },
    { title: "پاسخ به ایمیل‌های کاری", status: "todo", priority: "low", scheduledDate: today, isDailyHighlight: false, estimatedMinutes: 20, completedAt: null, sortOrder: 3 },
    { title: "مدیتیشن صبحگاهی ۱۰ دقیقه", status: "done", priority: "medium", scheduledDate: today, isDailyHighlight: false, estimatedMinutes: 10, areaId: A["آرامش"], completedAt: ago(0, 7), sortOrder: 4 },
    { title: "برنامه‌ریزی روز با همبافت", status: "done", priority: "medium", scheduledDate: today, isDailyHighlight: true, estimatedMinutes: 15, completedAt: ago(0, 8), sortOrder: 5 },
    { title: "جلسهٔ هماهنگی تیم محصول", status: "todo", priority: "medium", scheduledDate: tm1, isDailyHighlight: false, estimatedMinutes: 30, projectId: P[0], completedAt: null, sortOrder: 6 },
    { title: "ثبت هزینه‌های هفته", status: "todo", priority: "medium", scheduledDate: tm1, isDailyHighlight: false, estimatedMinutes: 15, projectId: P[2], completedAt: null, sortOrder: 7 },
    { title: "تمرین مکالمهٔ ترکی سری ۱۲", status: "todo", priority: "medium", scheduledDate: tm2, isDailyHighlight: false, estimatedMinutes: 25, goalId: G[3], completedAt: null, sortOrder: 8 },
    { title: "رفکتور لایهٔ API", status: "done", priority: "high", scheduledDate: isoAgo(1), isDailyHighlight: false, estimatedMinutes: 90, projectId: P[0], completedAt: ago(1, 18), sortOrder: 9 },
    { title: "خرید هدیهٔ مادر", status: "todo", priority: "low", isDailyHighlight: false, completedAt: null, sortOrder: 10 },
    { title: "به‌روزرسانی رزومه و لینکدین", status: "todo", priority: "medium", isDailyHighlight: false, estimatedMinutes: 40, areaId: A["حرفه"], completedAt: null, sortOrder: 11 },
    { title: "مطالعهٔ مقالهٔ KMP vs Compose", status: "todo", priority: "low", isDailyHighlight: false, estimatedMinutes: 20, projectId: P[0], completedAt: null, sortOrder: 12 },
    { title: "ثبت دامنهٔ hambaft.app", status: "done", priority: "high", scheduledDate: isoAgo(2), isDailyHighlight: false, estimatedMinutes: 15, projectId: P[0], completedAt: ago(2, 12), sortOrder: 13 },
  ];
  await db.insert(tasks).values(taskDefs.map((t) => ({ ownerId: S, ...t })));

  /* ─── عادت‌ها + لاگ ۱۴ روز ─── */
  const habitDefs = [
    { id: 0, title: "مطالعهٔ ۳۰ دقیقه", color: "#4A6741", icon: "book-open", targetPerDay: 1 },
    { id: 1, title: "تمرین ورزشی", color: "#E26645", icon: "dumbbell", targetPerDay: 1 },
    { id: 2, title: "مدیتیشن", color: "#7C8363", icon: "flower", targetPerDay: 1 },
    { id: 3, title: "آب کافی (۸ لیوان)", color: "#5B7E9B", icon: "droplets", targetPerDay: 8 },
    { id: 4, title: "ژورنال شب", color: "#8D7F72", icon: "pen-line", targetPerDay: 1 },
  ];
  const habitRows = await db.insert(habits).values(habitDefs.map((h) => ({ userId: S, title: h.title, color: h.color, icon: h.icon, targetPerDay: h.targetPerDay }))).returning();
  const logVals: { habitId: string; userId: string; logDate: string; count: number; createdAt: Date }[] = [];
  const pattern = [0.9, 0.75, 0.85, 0.6, 0.7];
  for (let h = 0; h < habitRows.length; h++) {
    for (let d = 0; d < 14; d++) {
      const done = ((d * 7 + h * 3) % 10) / 10 < pattern[h] && !(h === 1 && d % 3 === 2);
      if (done) logVals.push({ habitId: habitRows[h].id, userId: S, logDate: isoAgo(d), count: habitDefs[h].targetPerDay === 8 ? 8 : 1, createdAt: ago(d, 21) });
    }
  }
  await db.insert(habitLogs).values(logVals);

  /* ─── تاریخچهٔ امتیاز سپهر (~۱۴ روز → streak واقعی) ─── */
  const evts: [number, string, number, number][] = [
    // [points, reason, daysAgo, hour]
    [10, "انجام «مطالعهٔ معماری»", 13, 10], [8, "ثبت عادت مطالعه", 13, 22], [15, "پیشرفت هدف کتاب", 13, 22],
    [10, "انجام «تمرین قدرتی»", 12, 8], [8, "ثبت عادت مدیتیشن", 12, 7],
    [15, "پیشرفت دویدن +۶ کیلومتر", 11, 9], [10, "انجام «کدنویسی API»", 11, 15], [20, "چالش سه‌تایی", 11, 23],
    [8, "ثبت عادت مطالعه", 10, 21], [12, "انجام «جلسهٔ تیم»", 10, 11],
    [10, "انجام «تدوین بودجه»", 9, 19], [8, "ثبت عادت ژورنال", 9, 23], [30, "نشان هفتهٔ طلایی", 9, 23],
    [15, "پیشرفت هدف خواب", 8, 8], [10, "انجام «خرید خانه»", 8, 17],
    [8, "ثبت عادت ورزش", 7, 9], [10, "انجام «دوی ۵ کیلومتری»", 6, 8], [15, "پیشرفت دویدن", 6, 9],
    [25, "انجام «تحویل نسخهٔ آلفا»", 5, 19], [8, "ثبت عادت مطالعه", 5, 22],
    [10, "انجام «تمرین شنا»", 4, 8], [15, "پیشرفت ترکی", 4, 21],
    [12, "انجام «مکالمهٔ ترکی»", 3, 10], [35, "چالش عادت‌های سرخط", 3, 23],
    [10, "انجام «رفکتور API»", 2, 18], [8, "ثبت عادت مدیتیشن", 2, 7], [15, "ثبت دامنهٔ hambaft.app", 2, 12],
    [10, "انجام «مدیتیشن صبحگاهی»", 0, 7], [20, "انجام «برنامه‌ریزی روز»", 0, 8], [8, "ثبت عادت مطالعه", 0, 9],
    [10, "انجام «پیاده‌روی ساحلی»", 7, 9], [70, "چالش هفت‌رخشان", 7, 22],
    [45, "انجام «تحویل MVP داخلی»", 6, 18], [35, "چالش روز کامل", 5, 23], [50, "نشان قهرمان عادت", 4, 23],
  ];
  await db.insert(pointEvents).values(evts.map(([points, reason, d, hour]) => ({
    userId: S, points, reason, refType: "seed", refId: "", createdAt: ago(d, hour),
  })));
  const sumPoints = evts.reduce((a, [p]) => a + p, 0);
  await db.update(users).set({ totalPoints: sumPoints, level: levelForPoints(sumPoints) }).where(eq(users.id, S));

  /* نشان‌های از پیش کسب‌شدهٔ دمو */
  await db.insert(userBadges).values(
    ["first_step", "streak_7", "habit_hero", "point_500"].map((b, i) => ({
      userId: S, badgeId: b, awardedAt: ago(5 - i, 22),
    })),
  ).onConflictDoNothing();

  /* رویدادهای سبک برای دیگران (فید زنده) */
  await db.insert(pointEvents).values([
    { userId: N, points: 15, reason: "پیشرفت هدف کتاب", refType: "seed", refId: "", createdAt: ago(0, 19) },
    { userId: N, points: 10, reason: "انجام «دوی عصر»", refType: "seed", refId: "", createdAt: ago(0, 18) },
    { userId: SA, points: 15, reason: "پیشرفت دویدن +۸ کیلومتر", refType: "seed", refId: "", createdAt: ago(0, 12) },
    { userId: SA, points: 8, reason: "ثبت عادت یوگا", refType: "seed", refId: "", createdAt: ago(1, 8) },
    { userId: M, points: 10, reason: "انجام «کارت زبان»", refType: "seed", refId: "", createdAt: ago(1, 14) },
  ]);

  /* ─── پارتنرها ─── */
  await db.insert(partnerships).values([
    { userId: S, partnerId: N }, { userId: S, partnerId: SA }, { userId: S, partnerId: M },
  ]).onConflictDoNothing();

  /* ─── کامنت و واکنش روی اهداف مشترک ─── */
  await db.insert(comments).values([
    { userId: SA, targetType: "goal", targetId: G[1], body: "وای ۳۴ کیلومتر! عالی داری پیش می‌ری، نزدیک نصفی", createdAt: ago(0, 13) },
    { userId: S, targetType: "goal", targetId: G[1], body: "ممنون سارا! هفتهٔ آینده دوی مشترک؟", createdAt: ago(0, 15) },
    { userId: N, targetType: "goal", targetId: G[0], body: "خلاصه‌ات را برای کتاب‌بازها بفرست؛ بقیه هم استفاده کنند.", createdAt: ago(1, 21) },
  ]);
  await db.insert(reactions).values([
    { userId: N, targetType: "goal", targetId: G[0], kind: "fire" },
    { userId: SA, targetType: "goal", targetId: G[1], kind: "cheer" },
    { userId: M, targetType: "goal", targetId: G[4], kind: "heart" },
  ]).onConflictDoNothing();

  /* ─── اعلان‌ها ─── */
  await db.insert(notifications).values([
    { userId: S, actorId: SA, type: "comment", title: "سارا روی هدف دویدنت کامنت گذاشت", body: "«وای ۳۴ کیلومتر!»", refType: "goal", refId: G[1], read: false, createdAt: ago(0, 13) },
    { userId: S, actorId: N, type: "reaction", title: "نیما هدف کتابت را آتش گرفت", body: "", refType: "goal", refId: G[0], read: false, createdAt: ago(1, 20) },
    { userId: S, type: "badge", title: "نشان «هفتهٔ طلایی» گرفتی", body: "۹ روز متوالی فعال بودی", refType: "badge", refId: "streak_7", read: true, createdAt: ago(2, 23) },
  ]);

  return S;
}
