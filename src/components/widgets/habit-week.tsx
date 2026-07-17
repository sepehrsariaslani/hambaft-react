"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Leaf, BookOpen, Dumbbell, Flower, Droplets, PenLine, Sun, Moon, Heart, Music, Flame,
} from "lucide-react";
import { faNum } from "@/lib/fa";

const ICONS: Record<string, typeof Leaf> = {
  leaf: Leaf, "book-open": BookOpen, dumbbell: Dumbbell, flower: Flower,
  droplets: Droplets, "pen-line": PenLine, sun: Sun, moon: Moon, heart: Heart, music: Music,
};

export interface HabitDay {
  iso: string;
  weekday: string;
  dayNum: string;
  logged: boolean;
  count: number;
  isToday: boolean;
  future: boolean;
}

export function HabitWeekRow({
  habit,
  days,
  streak,
}: {
  habit: { id: string; title: string; color: string; icon: string; targetPerDay: number };
  days: HabitDay[];
  streak: number;
}) {
  const router = useRouter();
  const [logMap, setLogMap] = useState<Record<string, boolean>>(
    Object.fromEntries(days.map((d) => [d.iso, d.logged])),
  );
  const [float, setFloat] = useState(false);
  const [pending, start] = useTransition();
  const Icon = ICONS[habit.icon] ?? Leaf;

  const toggle = (d: HabitDay) => {
    if (d.future) return;
    const next = !logMap[d.iso];
    setLogMap((m) => ({ ...m, [d.iso]: next }));
    if (next) {
      setFloat(true);
      setTimeout(() => setFloat(false), 1400);
    }
    start(async () => {
      const res = await fetch(`/api/habits/${habit.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: d.iso }),
      });
      if (!res.ok) setLogMap((m) => ({ ...m, [d.iso]: !next }));
      else router.refresh();
    });
  };

  const loggedDays = days.filter((d) => logMap[d.iso]).length;

  return (
    <div className={`card px-4 py-3.5 relative transition-opacity ${pending ? "opacity-80" : ""}`}>
      {float && (
        <span className="absolute -top-3 left-6 text-[12px] font-black text-moss anim-rise num z-10">
          +۸ امتیاز
        </span>
      )}
      <div className="flex items-center gap-3 mb-2.5">
        <span
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: habit.color + "1a", color: habit.color }}
        >
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-black text-ink truncate">{habit.title}</p>
          <p className="text-[10.5px] text-taupe font-bold mt-0.5">
            {habit.targetPerDay > 1 ? `${faNum(habit.targetPerDay)}× در روز · ` : ""}
            {streak > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-terra font-black">
                <Flame size={11} fill="currentColor" strokeWidth={0} /> {faNum(streak)} روز پیاپی
              </span>
            ) : "امروز شروعش کن"}
          </p>
        </div>
        <span className="text-[10px] font-black text-sage bg-mist rounded-lg px-2 py-1 num">
          {faNum(loggedDays)}/۷
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" dir="ltr">
        {days.map((d) => {
          const on = !!logMap[d.iso];
          return (
            <button
              key={d.iso}
              onClick={() => toggle(d)}
              disabled={d.future}
              className="habit-dot flex flex-col items-center gap-1 rounded-xl py-1.5 disabled:opacity-20"
              data-on={on}
              style={{
                background: on ? habit.color + "14" : d.isToday ? "#F3EFE4" : "transparent",
                outline: d.isToday ? `1.5px dashed ${habit.color}55` : "none",
              }}
              aria-label={d.iso}
            >
              <span className="text-[8px] font-bold text-taupe">{d.weekday}</span>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black num transition-colors"
                style={{
                  background: on ? habit.color : "#EBE5D8",
                  color: on ? "#fff" : "#A79A88",
                }}
              >
                {d.dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
