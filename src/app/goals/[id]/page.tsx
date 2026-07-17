import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Users, TrendingUp, MessageCircle, FolderGit2, CheckSquare } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { canViewGoal, getGoalDetail, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { Avatar, ProgressBar, SectionHeader } from "@/components/ui";
import { ProgressForm, ReactionBar, CommentForm } from "@/components/engage";
import { faNum, relativeFa, formatJalaliShort } from "@/lib/fa";
import { GOAL_CATEGORY, goalProgress, goalHealthColor } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!(await canViewGoal(id, user.id))) notFound();
  const [data, dash] = await Promise.all([getGoalDetail(id, user.id), getDashboard(user.id)]);
  if (!data) notFound();

  const g = data.g;
  const cat = GOAL_CATEGORY[g.category] ?? GOAL_CATEGORY.personal;
  const p = goalProgress(g.currentValue, g.targetValue);
  const health = g.status === "completed" ? "#4A6741" : goalHealthColor(p);
  const religiousDates = g.deadline ? formatJalaliShort(g.deadline) : null;

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <Link href="/goals" className="inline-flex items-center gap-1.5 text-[12px] font-black text-taupe hover:text-moss transition-colors mb-3 anim-rise">
        <ArrowRight size={14} /> همهٔ اهداف
      </Link>

      {/* ─── هیرو ─── */}
      <section className="card p-5 mb-4 anim-rise">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg" style={{ background: cat.color + "14", color: cat.color }}>
            {cat.fa}
          </span>
          {data.areaName && (
            <span className="text-[10px] font-bold text-taupe bg-mist px-2 py-0.5 rounded-lg">{data.areaName}</span>
          )}
          <span className="ms-auto text-[10px] font-bold text-taupe flex items-center gap-1">
            {g.privacy === "shared" ? (
              <>
                <Users size={11} className="text-sage" /> اشتراکی
              </>
            ) : (
              <>
                <Lock size={11} /> خصوصی
              </>
            )}
          </span>
        </div>

        <h1 className={`display text-[21px] leading-8 ${g.status === "completed" ? "text-taupe" : "text-ink"}`}>
          {g.title}
          {g.status === "completed" && <span className="ms-2 text-[11px] text-moss align-middle">✓ تکمیل‌شده</span>}
        </h1>
        {g.description && <p className="text-[12.5px] text-taupe leading-6 mt-2">{g.description}</p>}
        {!data.isOwner && <p className="text-[11px] font-bold text-sage mt-2">هدفِ {data.ownerName}</p>}

        <div className="flex items-end justify-between mt-5 mb-2">
          <div>
            <p className="num text-4xl font-black" style={{ color: health }}>
              {faNum(Math.round(p * 100))}
              <span className="text-lg">٪</span>
            </p>
          </div>
          <p className="num text-[13px] font-black text-ink2">
            {faNum(g.currentValue)}
            <span className="text-taupe"> / {faNum(g.targetValue)}</span>
            {g.unit ? <span className="text-taupe"> {g.unit}</span> : null}
          </p>
        </div>
        <ProgressBar value={p} color={health} height={10} />

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="coin w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-ink num">
              {faNum(g.totalPoints)}
            </span>
            <span className="text-[10px] text-taupe font-bold">امتیاز جمع‌شدهٔ هدف</span>
          </div>
          {religiousDates && <span className="text-[10px] font-black text-clay">موعد: {religiousDates}</span>}
        </div>

        {/* اعضا */}
        {data.members.length > 0 && (
          <div className="mt-4 pt-4 border-t border-line/70">
            <p className="text-[11px] font-black text-ink2 mb-2">هم‌راهان هدف</p>
            <div className="flex flex-wrap gap-2">
              <MemberPill name={data.ownerName} color={data.ownerColor} level={0} me={data.isOwner} owner />
              {data.members.map((m) => (
                <MemberPill key={m.id} name={m.name} color={m.color} level={m.level} me={m.id === user.id} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── ثبت پیشرفت ─── */}
      {g.status === "active" && (
        <section className="mb-4 anim-rise">
          <ProgressForm goalId={id} unit={g.unit} targetValue={g.targetValue} currentValue={g.currentValue} />
        </section>
      )}

      {/* ─── واکنش‌ها ─── */}
      <section className="mb-4 anim-rise">
        <ReactionBar
          goalId={id}
          initial={data.reactions.map((r) => ({ kind: r.kind, count: r.n, mine: data.myReactions.includes(r.kind) }))}
        />
      </section>

      {/* ─── پیوندها ─── */}
      {(data.linkedProjects.length > 0 || data.linkedTasks.length > 0) && (
        <section className="card p-4 mb-4 anim-rise">
          {data.linkedProjects.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-black text-ink2 mb-2 flex items-center gap-1.5">
                <FolderGit2 size={12} className="text-sage" /> پروژه‌های مرتبط
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.linkedProjects.map((pr) => (
                  <span key={pr.id} className="text-[10.5px] font-bold px-2 py-1 rounded-lg" style={{ background: pr.color + "14", color: pr.color }}>
                    {pr.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.linkedTasks.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-ink2 mb-2 flex items-center gap-1.5">
                <CheckSquare size={12} className="text-sage" /> تسک‌های مرتبط
              </p>
              <div className="space-y-1.5">
                {data.linkedTasks.map((t) => (
                  <p key={t.id} className={`text-[12px] font-bold flex items-center gap-2 ${t.status === "done" ? "text-taupe line-through" : "text-ink"}`}>
                    <span className={`w-3.5 h-3.5 rounded-[5px] border-2 shrink-0 ${t.status === "done" ? "bg-moss border-moss" : "border-sand"}`} />
                    {t.title}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── تایم‌لاین پیشرفت ─── */}
      {data.updates.length > 0 && (
        <section className="mb-4">
          <SectionHeader icon={TrendingUp} title="تاریخچهٔ پیشرفت" />
          <div className="card overflow-hidden">
            <div className="divide-y divide-line/70">
              {data.updates.map((u, i) => (
                <div key={u.u.id} className="flex items-start gap-3 px-4 py-3 anim-rise" style={{ animationDelay: `${i * 0.04}s` }}>
                  <Avatar name={u.name} color={u.color} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-ink">
                      <span className="font-black">{u.name}</span>
                      <span className="num text-moss font-black"> +{faNum(u.u.valueDelta)} {g.unit}</span>
                    </p>
                    {u.u.note && <p className="text-[11.5px] text-ink2 mt-0.5 leading-5">{u.u.note}</p>}
                    <p className="text-[10px] text-taupe mt-0.5">{relativeFa(u.u.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── دیدگاه‌ها ─── */}
      <section className="mb-2">
        <SectionHeader icon={MessageCircle} title="گفت‌وگو" hint={data.comments.length > 0 ? faNum(data.comments.length) : undefined} />
        <div className="space-y-2 mb-3">
          {data.comments.map((c, i) => (
            <div key={c.c.id} className="flex items-start gap-2.5 anim-rise" style={{ animationDelay: `${i * 0.04}s` }}>
              <Avatar name={c.name} color={c.color} size={30} />
              <div className="card px-3.5 py-2.5 flex-1 !rounded-2xl !rounded-tr-md">
                <p className="text-[10.5px] font-black text-sage">{c.name}</p>
                <p className="text-[12.5px] text-ink leading-5 mt-0.5">{c.c.body}</p>
                <p className="text-[9px] text-taupe mt-1">{relativeFa(c.c.createdAt)}</p>
              </div>
            </div>
          ))}
          {data.comments.length === 0 && (
            <p className="text-[11.5px] text-taupe text-center py-3">هنوز حرفی گفته نشده — تو اولین نفر باش</p>
          )}
        </div>
        <CommentForm goalId={id} />
      </section>
    </AppShell>
  );
}

function MemberPill({ name, color, level, me, owner }: { name: string; color: string; level: number; me?: boolean; owner?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 bg-mist/70 rounded-full pl-3 pr-1 py-1">
      <Avatar name={name} color={color} size={22} />
      <span className="text-[10.5px] font-black text-ink">
        {me ? "تو" : name.split(" ")[0]}
        {owner && <span className="text-taupe font-bold"> · صاحب</span>}
        {level > 0 && <span className="text-sage num"> · س.{faNum(level)}</span>}
      </span>
    </span>
  );
}
