"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Plus, CalendarCheck2 } from "lucide-react";
import { HabitWeekRow, type HabitDay } from "@/components/widgets/habit-week";
import { EmptyState, ProgressBar } from "@/components/ui";
import { faNum } from "@/lib/fa";

interface HabitRow {
  habit: { id: string; title: string; color: string; icon: string; targetPerDay: number };
  streak: number;
  totalLogs: number;
  days: HabitDay[];
}

export function HabitsClient({
  rows,
  weekRate,
  doneToday,
  habitsCount,
}: {
  rows: HabitRow[];
  weekRate: number;
  doneToday: number;
  habitsCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(1);
  const [pending, start] = useTransition();

  const add = () => {
    if (!title.trim()) return;
    start(async () => {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, targetPerDay: target }),
      });
      if (res.ok) {
        setTitle("");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 anim-rise">
        <h1 className="display text-[22px] text-ink flex items-center gap-2">
          <Sprout className="text-moss" size={22} /> عادت‌ها
        </h1>
        <button
          onClick={() => setOpen(!open)}
          className="h-9 px-3.5 rounded-xl bg-moss text-white text-[11px] font-black flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Plus size={14} strokeWidth={2.6} /> عادت تازه
        </button>
      </div>

      {/* ─── خلاصهٔ هفته ─── */}
      <div className="card p-4 mb-4 anim-rise">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-mist text-moss flex items-center justify-center">
            <CalendarCheck2 size={18} />
          </span>
          <div className="flex-1">
            <p className="text-[13px] font-black text-ink">تعهد هفتهٔ جاری</p>
            <p className="text-[10.5px] text-taupe font-bold mt-0.5 num">
              {faNum(doneToday)}/{faNum(habitsCount)} عادت امروز ثبت شده
            </p>
          </div>
          <span className="num text-2xl font-black text-moss">{faNum(weekRate)}٪</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={weekRate / 100} height={7} />
        </div>
      </div>

      {/* ─── فرم عادت تازه ─── */}
      {open && (
        <div className="card p-4 mb-4 anim-rise">
          <p className="text-[13px] font-black text-ink mb-2">عادت تازه بساز</p>
          <input
            className="input"
            placeholder="مثلاً: ۱۰ دقیقه مطالعه‌ی زبان"
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-black text-taupe me-1">تکرار روزانه:</span>
            {[1, 3, 8].map((n) => (
              <button
                key={n}
                onClick={() => setTarget(n)}
                className={`text-[10.5px] font-black px-2.5 py-1.5 rounded-lg border num transition-all ${
                  target === n ? "border-moss text-moss bg-moss/10" : "border-line text-taupe"
                }`}
              >
                {faNum(n)}×
              </button>
            ))}
            <button
              onClick={add}
              disabled={pending || !title.trim()}
              className="ms-auto h-9 px-4 rounded-xl bg-moss text-white text-[11px] font-black disabled:opacity-40 active:scale-95 transition-transform"
            >
              {pending ? "…" : "ساخت"}
            </button>
          </div>
        </div>
      )}

      {/* ─── لیست ─── */}
      {rows.length > 0 ? (
        <div className="space-y-2.5 stagger">
          {rows.map((r) => (
            <div key={r.habit.id}>
              <HabitWeekRow habit={r.habit} days={r.days} streak={r.streak} />
              <p className="text-[9.5px] text-taupe font-bold mt-1 px-2 num">
                مجموع ثبت: {faNum(r.totalLogs)} روز
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={Sprout}
            title="باغ عادتت خالی است"
            hint="اولین عادتت را بساز؛ هر روز که آن را ثبت کنی، زنجیره‌ات بلندتر می‌شود"
          />
        </div>
      )}
    </div>
  );
}
