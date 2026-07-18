import Link from "next/link";
import {
  Lock, Users, CheckCircle2, ChevronLeft, Swords, CircleDot, Megaphone, Flame, Hand, Heart, Sparkles,
} from "lucide-react";
import { faNum, relativeFa } from "@/lib/fa";
import { GOAL_CATEGORY, goalProgress, goalHealthColor, REACTION_KINDS } from "@/lib/gamification";
import { Avatar, ProgressBar } from "@/components/ui";

/* ─── کارت چالش روزانه ─── */
const DIFF_META: Record<string, { fa: string; color: string }> = {
  easy: { fa: "ساده", color: "#7C8363" },
  medium: { fa: "متوسط", color: "#D6A94B" },
  hard: { fa: "سخت", color: "#E26645" },
};

export function ChallengeCard({
  challenge,
}: {
  challenge: {
    id: string;
    progress: number;
    targetCount: number;
    status: string;
    challenge: { title: string; description: string; points: number; difficulty: string };
  };
}) {
  const d = DIFF_META[challenge.challenge.difficulty] ?? DIFF_META.easy;
  const done = challenge.status === "completed";
  const p = Math.min(1, challenge.progress / Math.max(1, challenge.targetCount));
  return (
    <div
      className={`card px-4 py-3.5 flex items-center gap-3 ${done ? "bg-mist/50 border-sage/40" : ""}`}
    >
      <span
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${done ? "bg-moss text-white" : "bg-mist text-moss"}`}
      >
        {done ? <CheckCircle2 size={20} strokeWidth={2.2} /> : <Swords size={18} strokeWidth={2.2} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-[13px] font-black truncate ${done ? "text-taupe" : "text-ink"}`}>
            {challenge.challenge.title}
          </p>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: d.color + "16", color: d.color }}>
            {d.fa}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1">
            <ProgressBar value={p} color={done ? "#4A6741" : "#E26645"} height={5} />
          </div>
          <span className="text-[10px] font-black text-taupe num whitespace-nowrap">
            {faNum(Math.min(challenge.progress, challenge.targetCount))}/{faNum(challenge.targetCount)}
          </span>
        </div>
      </div>
      <span
        className={`shrink-0 text-[11px] font-black num px-2 py-1 rounded-xl flex items-center gap-0.5 ${done ? "bg-moss/15 text-moss" : "bg-gold/15 text-gold"}`}
      >
        {done ? <CheckCircle2 size={12} /> : "+"}{faNum(challenge.challenge.points)}
      </span>
    </div>
  );
}

/* ─── کارت هدف ─── */
export function GoalCard({
  goal,
  areaName,
  areaColor,
  memberCount = 0,
  ownerName,
  delay = 0,
}: {
  goal: {
    id: string; title: string; category: string; privacy: string; status: string;
    currentValue: number; targetValue: number; unit: string; totalPoints: number;
  };
  areaName?: string | null;
  areaColor?: string | null;
  memberCount?: number;
  ownerName?: string | null;
  delay?: number;
}) {
  const cat = GOAL_CATEGORY[goal.category] ?? GOAL_CATEGORY.personal;
  const p = goalProgress(goal.currentValue, goal.targetValue);
  const health = goal.status === "completed" ? "#4A6741" : goalHealthColor(p);
  return (
    <Link
      href={`/goals/${goal.id}`}
      className="card card-hover card-press block p-4 anim-rise"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg" style={{ background: cat.color + "14", color: cat.color }}>
          {cat.fa}
        </span>
        {areaName && (
          <span className="text-[10px] font-bold text-taupe flex items-center gap-1">
            <CircleDot size={9} fill={areaColor ?? "#8D7F72"} strokeWidth={0} color={areaColor ?? "#8D7F72"} />
            {areaName}
          </span>
        )}
        <span className="ms-auto flex items-center gap-1.5 text-taupe">
          {goal.privacy === "shared" ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-sage">
              <Users size={11} /> {memberCount > 0 ? faNum(memberCount + 1) : ""} نفر
            </span>
          ) : (
            <Lock size={11} />
          )}
        </span>
      </div>
      <p className={`text-[15px] font-black leading-6 mb-1.5 ${goal.status === "completed" ? "text-taupe line-through decoration-sand" : "text-ink"}`}>
        {goal.title}
      </p>
      {ownerName && <p className="text-[10.5px] text-taupe font-bold mb-2">هدفِ {ownerName}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar value={p} color={health} height={7} />
        </div>
        <span className="text-[10px] font-black num text-ink2 whitespace-nowrap">
          {faNum(goal.currentValue)}
          <span className="text-taupe">/{faNum(goal.targetValue)}</span>
          {goal.unit ? <span className="text-taupe"> {goal.unit}</span> : null}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="coin w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-ink num">
          {faNum(goal.totalPoints)}
        </span>
        <span className="text-[10px] font-black text-sage flex items-center gap-0.5">
          جزئیات <ChevronLeft size={12} />
        </span>
      </div>
    </Link>
  );
}

/* ─── فید فعالیت ─── */
export function FeedList({
  rows,
}: {
  rows: { ev: { id: string; points: number; reason: string; createdAt: Date }; name: string; color: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="card divide-y divide-line/70 overflow-hidden">
      {rows.map((r, i) => (
        <div key={r.ev.id} className="flex items-center gap-3 px-4 py-3 anim-rise" style={{ animationDelay: `${i * 0.05}s` }}>
          <Avatar name={r.name} color={r.color} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-ink truncate">
              <span className="font-black">{r.name}</span> — {r.ev.reason}
            </p>
            <p className="text-[10px] text-taupe mt-0.5">{relativeFa(r.ev.createdAt)}</p>
          </div>
          <span className="text-[11px] font-black text-moss num bg-mist rounded-lg px-1.5 py-0.5">+{faNum(r.ev.points)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── آیکون واکنش ─── */
export function ReactionIcon({ kind, size = 13 }: { kind: string; size?: number }) {
  switch (kind) {
    case "cheer": return <Megaphone size={size} />;
    case "fire": return <Flame size={size} />;
    case "clap": return <Hand size={size} />;
    case "heart": return <Heart size={size} />;
    default: return <Sparkles size={size} />;
  }
}

export { REACTION_KINDS };
