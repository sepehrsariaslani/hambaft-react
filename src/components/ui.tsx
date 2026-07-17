import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { faNum } from "@/lib/fa";

/* ─── آواتار حروفی ─── */
export function Avatar({
  name,
  color,
  size = 40,
  ring = false,
}: {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div
      className="flex items-center justify-center rounded-full font-black text-white shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        fontSize: size * 0.36,
        boxShadow: ring ? `0 0 0 2.5px #FDFBF7, 0 0 0 4.5px ${color}66` : undefined,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── حلقهٔ سطح ─── */
export function LevelRing({
  progress,
  size = 92,
  stroke = 7,
  color = "#4A6741",
  track = "#E6DFD3",
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="ring-anim"
          style={{ ["--offset-from" as string]: c }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ─── نوار پیشرفت ─── */
export function ProgressBar({
  value,
  color = "#4A6741",
  height = 8,
  track = "#E6DFD3",
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: track, height }}>
      <div
        className="h-full rounded-full bar-fill"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, background: color }}
      />
    </div>
  );
}

/* ─── سرگروه سکشن ─── */
export function SectionHeader({
  icon: Icon,
  title,
  hint,
  href,
  actionFa = "همه",
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  href?: string;
  actionFa?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="w-7 h-7 rounded-xl bg-mist text-moss flex items-center justify-center">
            <Icon size={15} strokeWidth={2.4} />
          </span>
        )}
        <h2 className="text-[15px] font-black text-ink">{title}</h2>
        {hint && <span className="text-[11px] text-taupe font-medium">{hint}</span>}
      </div>
      {href && (
        <Link href={href} className="text-[11px] font-bold text-sage hover:text-moss transition-colors">
          {actionFa} ←
        </Link>
      )}
    </div>
  );
}

/* ─── وضعیت خالی ─── */
export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-3xl bg-mist text-sage flex items-center justify-center mb-3 floaty">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <p className="text-sm font-black text-ink">{title}</p>
      {hint && <p className="text-xs text-taupe mt-1 max-w-[240px] leading-5">{hint}</p>}
    </div>
  );
}

/* ─── مینی آمار ─── */
export function StatChip({
  icon: Icon,
  label,
  value,
  color = "#4A6741",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="card px-3.5 py-3 flex items-center gap-3">
      <span className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: color + "1a", color }}>
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <div>
        <div className="num text-lg font-black text-ink leading-5">{faNum(value)}</div>
        <div className="text-[10px] text-taupe font-bold">{label}</div>
      </div>
    </div>
  );
}

/* ─── نمودار میله‌ای هفته ─── */
export function WeeklyBars({
  data,
  color = "#4A6741",
  height = 56,
  todayIdx = 6,
  labels,
}: {
  data: number[];
  color?: string;
  height?: number;
  todayIdx?: number;
  labels?: string[];
}) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-1.5" style={{ height: height + 16 }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md rounded-b-[3px] bar-fill"
            style={{
              height: Math.max(3, (v / max) * height),
              background: i === todayIdx ? color : color + "40",
            }}
            title={faNum(v)}
          />
          {labels && (
            <span className="text-[8.5px] font-bold text-taupe">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── شعلهٔ زنجیره ─── */
export function StreakFlame({ days, size = 15 }: { days: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-terra font-black num">
      <svg width={size} height={size} viewBox="0 0 24 24" fill={days > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
      {faNum(days)}
      روز
    </span>
  );
}
