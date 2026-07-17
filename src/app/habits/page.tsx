import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getHabitsPage, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { HabitsClient } from "@/components/habits-client";
import { faNum, addDaysISO, gregorianToJalali } from "@/lib/fa";
import { computeStreak } from "@/lib/gamification";

export const dynamic = "force-dynamic";
export const metadata = { title: "عادت‌ها" };

const DAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export default async function HabitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [data, dash] = await Promise.all([getHabitsPage(user.id), getDashboard(user.id)]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(data.today, -(6 - i));
    const d = new Date(iso + "T00:00:00");
    const { jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return { iso, weekday: DAY_SHORT[(d.getDay() + 1) % 7], dayNum: faNum(jd), isToday: iso === data.today, future: iso > data.today };
  });

  const logsByHabit = new Map<string, Map<string, number>>();
  for (const l of data.logs) {
    if (!logsByHabit.has(l.habitId)) logsByHabit.set(l.habitId, new Map());
    logsByHabit.get(l.habitId)!.set(l.logDate, l.count);
  }

  const rows = data.habits.map((h) => {
    const hLogs = logsByHabit.get(h.id) ?? new Map<string, number>();
    return {
      habit: { id: h.id, title: h.title, color: h.color, icon: h.icon, targetPerDay: h.targetPerDay },
      streak: computeStreak([...hLogs.keys()], data.today),
      totalLogs: hLogs.size,
      days: weekDays.map((d) => ({ ...d, logged: (hLogs.get(d.iso) ?? 0) >= 1, count: hLogs.get(d.iso) ?? 0 })),
    };
  });

  const doneThisWeek = rows.reduce((a, r) => a + r.days.filter((d) => d.logged && !d.future).length, 0);
  const possibleThisWeek = rows.length * weekDays.filter((d) => !d.future).length;
  const weekRate = possibleThisWeek > 0 ? Math.round((doneThisWeek / possibleThisWeek) * 100) : 0;

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <HabitsClient rows={rows} weekRate={weekRate} doneToday={rows.filter((r) => r.days.find((d) => d.isToday)?.logged).length} habitsCount={rows.length} />
    </AppShell>
  );
}
