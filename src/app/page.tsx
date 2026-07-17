import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { LevelRing, StreakFlame, WeeklyBars, SectionHeader, EmptyState, StatChip } from "@/components/ui";
import { TaskRow } from "@/components/widgets/task-row";
import { HabitWeekRow } from "@/components/widgets/habit-week";
import { ChallengeCard, FeedList } from "@/components/widgets/display";
import { faNum, formatJalaliFull, greetingByHour, addDaysISO, gregorianToJalali, } from "@/lib/fa";
import { levelInfo, levelTitle, levelAccent, computeStreak, POINTS } from "@/lib/gamification";
import { ListChecks, Sprout, Swords, Users2, Zap, CheckCircle2, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

const DAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboard(user.id);
  const u = data.user!;

  /* روزهای هفتهٔ جاری (جلالی) */
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(data.today, -(6 - i));
    const d = new Date(iso + "T00:00:00");
    const { jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return {
      iso,
      weekday: DAY_SHORT[(d.getDay() + 1) % 7],
      dayNum: faNum(jd),
      isToday: iso === data.today,
      future: iso > data.today,
    };
  });

  /* مپ لاگ‌ها بر اساس عادت */
  const logsByHabit = new Map<string, Map<string, number>>();
  for (const l of data.habitLogsWeek) {
    if (!logsByHabit.has(l.habitId)) logsByHabit.set(l.habitId, new Map());
    logsByHabit.get(l.habitId)!.set(l.logDate, l.count);
  }

  const li = levelInfo(u.totalPoints);
  const accent = levelAccent(li.level);

  const weekSeries = weekDays.map((d) => data.weekPoints.find((w) => w.d === d.iso)?.pts ?? 0);

  return (
    <AppShell
      userName={u.name}
      userColor={u.avatarColor}
      unreadCount={data.unreadCount}
      streakDays={u.streakDays}
    >
      {/* ─── سلام صبح ─── */}
      <div className="mb-4 anim-rise">
        <p className="text-[12px] font-bold text-taupe">{formatJalaliFull()}</p>
        <h1 className="display text-[26px] text-ink mt-0.5">
          {greetingByHour()}، <span className="text-moss">{u.name.split(" ")[0]}</span>
        </h1>
      </div>

      {/* ─── کارت سطح (قهرمان) ─── */}
      <section className="relative overflow-hidden rounded-[26px] bg-night text-cream p-5 mb-4 anim-rise">
        <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-moss/15" />
        <div className="absolute -left-4 top-20 w-24 h-24 rounded-full bg-terra/10" />
        <div className="absolute right-1/3 -bottom-20 w-56 h-56 rounded-full bg-sage/10" />

        <div className="relative flex items-center gap-5">
          <LevelRing progress={li.progress} size={104} stroke={8} color={accent === "#4A6741" ? "#9ECE9A" : accent} track="rgba(253,251,247,0.12)">
            <div className="text-center">
              <div className="num text-3xl font-black leading-6">{faNum(li.level)}</div>
              <div className="text-[8.5px] font-bold text-cream/60 mt-0.5">سطح</div>
            </div>
          </LevelRing>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-sage-soft">{levelTitle(li.level)}</p>
            <p className="display text-lg mt-0.5">{faNum(u.totalPoints)} امتیاز</p>
            <div className="flex items-center gap-3 mt-2">
              <StreakFlame days={u.streakDays} />
              <span className="inline-flex items-center gap-1 text-gold text-[12px] font-black num">
                <Zap size={13} fill="currentColor" strokeWidth={0} /> {faNum(data.pointsToday)} امروز
              </span>
            </div>
            <p className="text-[10px] text-cream/50 font-bold mt-2 num">
              {faNum(Math.max(0, li.nextCeil - u.totalPoints))} امتیاز تا سطح بعد
            </p>
          </div>
        </div>

        {/* مینی آمار‌ها */}
        <div className="relative grid grid-cols-3 gap-2 mt-4">
          <DarkStat label="انجام‌شدهٔ امروز" value={faNum(data.doneTodayCount)} fa="تسک" />
          <DarkStat label="عادت‌های فعال" value={faNum(data.habits.length)} fa="عادت" />
          <DarkStat label="چالش امروز" value={`${faNum(data.challenges.filter((c) => c.status === "completed").length)}/${faNum(data.challenges.length)}`} fa="تکمیل" />
        </div>
      </section>

      {/* ─── نبض هفته ─── */}
      <section className="card p-4 mb-5 anim-rise">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-black text-ink flex items-center gap-2">
            <Activity size={15} className="text-moss" /> نبض هفته
          </p>
          <p className="text-[10.5px] font-black text-sage num">{faNum(weekSeries.reduce((a, b) => a + b, 0))} امتیاز این هفته</p>
        </div>
        <WeeklyBars data={weekSeries} labels={weekDays.map((d) => d.weekday)} todayIdx={6} />
      </section>

      {/* ─── چالش‌های امروز ─── */}
      <section className="mb-5">
        <SectionHeader icon={Swords} title="چالش‌های امروز" hint="هر روز تازه می‌شوند" href="/arena" actionFa="باشگاه" />
        <div className="space-y-2 stagger">
          {data.challenges.length > 0 ? (
            data.challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)
          ) : (
            <EmptyState icon={Swords} title="چالشی هنوز نیامده" hint="کمی بعد دوباره سر بزن" />
          )}
        </div>
      </section>

      {/* ─── تسک‌های امروز ─── */}
      <section className="mb-5">
        <SectionHeader icon={ListChecks} title="برنامهٔ امروز" hint={`${faNum(data.todaysTasks.length)} مانده`} href="/tasks" />
        {data.todaysTasks.length > 0 ? (
          <div className="space-y-2 stagger">
            {data.todaysTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState
              icon={CheckCircle2}
              title="امروز عالی خالی است"
              hint={`یا همه چیز انجام شده، یا با دکمهٔ + یک تسک برای امروز بساز (+${faNum(POINTS.TASK_DONE)} امتیاز)`}
            />
          </div>
        )}
      </section>

      {/* ─── عادت‌ها ─── */}
      <section className="mb-5">
        <SectionHeader icon={Sprout} title="عادت‌های روزانه" href="/habits" />
        {data.habits.length > 0 ? (
          <div className="space-y-2.5 stagger">
            {data.habits.map((h) => {
              const hLogs = logsByHabit.get(h.id) ?? new Map<string, number>();
              const dates = [...hLogs.keys()];
              const streak = computeStreak(dates, data.today);
              const days = weekDays.map((d) => ({
                ...d,
                logged: (hLogs.get(d.iso) ?? 0) >= 1,
                count: hLogs.get(d.iso) ?? 0,
              }));
              return <HabitWeekRow key={h.id} habit={h} days={days} streak={streak} />;
            })}
          </div>
        ) : (
          <div className="card">
            <EmptyState icon={Sprout} title="هنوز عادتی نداری" hint="با دکمهٔ + اولین عادت روزانه‌ات را بساز" />
          </div>
        )}
      </section>

      {/* ─── فید ─── */}
      <section className="mb-2">
        <SectionHeader icon={Users2} title="نبض هم‌بافته‌ها" href="/arena" actionFa="باشگاه" />
        <FeedList rows={data.feed} />
      </section>
    </AppShell>
  );
}

function DarkStat({ label, value, fa }: { label: string; value: string; fa: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-center">
      <p className="num text-lg font-black leading-5">{value}</p>
      <p className="text-[9px] text-cream/55 font-bold mt-1">
        {fa} · {label}
      </p>
    </div>
  );
}

export const metadata = { title: "امروز" };
