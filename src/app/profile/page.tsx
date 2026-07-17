import { redirect } from "next/navigation";
import {
  Award, CheckSquare, Sprout, TrendingUp, Target, Lock,
  Footprints, Hammer, Zap, Crown, TreePine, Flame, Sun, Star, HeartHandshake, Medal, Gem, Trophy, type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { getProfile, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { LevelRing, WeeklyBars, StatChip, SectionHeader, Avatar } from "@/components/ui";
import { LogoutButton } from "@/components/page-clients";
import { faNum, relativeFa, addDaysISO, todayISO } from "@/lib/fa";
import { levelInfo, levelTitle, levelAccent } from "@/lib/gamification";

export const dynamic = "force-dynamic";
export const metadata = { title: "پروفایل" };

const BADGE_ICONS: Record<string, LucideIcon> = {
  footprints: Footprints, hammer: Hammer, zap: Zap, crown: Crown,
  sprout: Sprout, tree: TreePine, flame: Flame, sun: Sun, target: Target,
  "trending-up": TrendingUp, star: Star, "heart-handshake": HeartHandshake,
  medal: Medal, gem: Gem, trophy: Trophy,
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [data, dash] = await Promise.all([getProfile(user.id), getDashboard(user.id)]);
  const u = data.user!;
  const li = levelInfo(u.totalPoints);
  const accent = levelAccent(li.level);

  const series = Array.from({ length: 14 }, (_, i) => {
    const iso = addDaysISO(todayISO(), -(13 - i));
    return data.chart.find((c) => c.d === iso)?.pts ?? 0;
  });

  const ownedCount = data.badges.filter((b) => b.awardedAt).length;

  return (
    <AppShell userName={u.name} userColor={u.avatarColor} unreadCount={dash.unreadCount} streakDays={u.streakDays}>
      {/* ─── کارت هویت ─── */}
      <section className="card p-5 mb-4 anim-rise">
        <div className="flex items-center gap-4">
          <Avatar name={u.name} color={u.avatarColor} size={64} ring />
          <div className="flex-1 min-w-0">
            <h1 className="display text-[19px] text-ink truncate">{u.name}</h1>
            <p className="text-[11px] text-taupe font-bold mt-0.5 ltr text-right">{u.phone}</p>
            {u.bio && <p className="text-[12px] text-ink2 mt-1.5 leading-5">{u.bio}</p>}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-5 pt-5 border-t border-line/70">
          <LevelRing progress={li.progress} size={76} stroke={6} color={accent}>
            <span className="num text-xl font-black text-ink">{faNum(li.level)}</span>
          </LevelRing>
          <div className="flex-1">
            <p className="text-[13px] font-black" style={{ color: accent }}>{levelTitle(li.level)}</p>
            <p className="text-[11px] text-taupe font-bold mt-0.5 num">
              {faNum(u.totalPoints)} امتیاز · {faNum(li.nextCeil - u.totalPoints)} تا سطح بعد
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-terra text-[13px] font-black num">
            <Flame size={15} fill="currentColor" strokeWidth={0} /> {faNum(u.streakDays)} روز
          </span>
        </div>
      </section>

      {/* ─── آمار ─── */}
      <section className="grid grid-cols-2 gap-2 mb-4 stagger">
        <StatChip icon={CheckSquare} label="تسک انجام‌شده" value={data.stats.tasksDone} color="#4A6741" />
        <StatChip icon={Sprout} label="ثبت عادت" value={data.stats.habitLogs} color="#7C8363" />
        <StatChip icon={TrendingUp} label="پیشرفت هدف" value={data.stats.goalUpdates} color="#E26645" />
        <StatChip icon={Target} label="هدف تکمیل‌شده" value={data.stats.goalsDone} color="#9B6B61" />
      </section>

      {/* ─── نمودار ۱۴ روز ─── */}
      <section className="card p-4 mb-4 anim-rise">
        <SectionHeader icon={TrendingUp} title="ریتم دو هفتهٔ اخیر" hint={`${faNum(series.reduce((a, b) => a + b, 0))} امتیاز`} />
        <WeeklyBars data={series} height={64} todayIdx={13} />
      </section>

      {/* ─── نشان‌ها ─── */}
      <section className="mb-4">
        <SectionHeader icon={Award} title="کلکسیون نشان‌ها" hint={`${faNum(ownedCount)} از ${faNum(data.badges.length)}`} />
        <div className="grid grid-cols-3 gap-2 stagger">
          {data.badges.map((b) => {
            const Icon = BADGE_ICONS[b.icon] ?? Award;
            const owned = !!b.awardedAt;
            return (
              <div
                key={b.id}
                className={`card p-3 flex flex-col items-center text-center min-h-[118px] ${owned ? "" : "opacity-60 grayscale-[0.6]"}`}
                title={b.description}
              >
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5"
                  style={{ background: owned ? "#4A674118" : "#F3EFE4", color: owned ? "#4A6741" : "#A79A88" }}
                >
                  {owned ? <Icon size={21} strokeWidth={2.1} /> : <Lock size={16} />}
                </span>
                <p className="text-[10.5px] font-black text-ink leading-4">{b.title}</p>
                <p className="text-[8.5px] text-taupe font-bold mt-1 leading-3.5 line-clamp-2">{b.description}</p>
                {owned && b.awardedAt && (
                  <p className="text-[8px] text-sage font-black mt-1">{relativeFa(b.awardedAt)}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── فعالیت‌های اخیر ─── */}
      {data.recentEvents.length > 0 && (
        <section className="mb-4">
          <SectionHeader icon={Star} title="آخرین امتیازها" />
          <div className="card divide-y divide-line/70 overflow-hidden">
            {data.recentEvents.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 anim-rise" style={{ animationDelay: `${i * 0.03}s` }}>
                <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                <p className="flex-1 text-[12px] font-bold text-ink truncate">{e.reason}</p>
                <p className="text-[9.5px] text-taupe">{relativeFa(e.createdAt)}</p>
                <span className="num text-[11px] font-black text-moss">+{faNum(e.points)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <LogoutButton />

      <p className="text-center text-[9.5px] text-taupe mt-4 mb-2">
        همبافت نسخهٔ α · Next.js + PostgreSQL — برای نصب: «Add to Home Screen»
      </p>
    </AppShell>
  );
}
