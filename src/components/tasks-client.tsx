"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListTodo, Plus, Undo2, Star } from "lucide-react";
import { TaskRow, type TaskLite } from "@/components/widgets/task-row";
import { EmptyState } from "@/components/ui";
import { PRIORITY_META, POINTS } from "@/lib/gamification";
import { faNum, formatJalaliShort, addDaysISO } from "@/lib/fa";

export interface TaskFull extends TaskLite {
  dueDate: string | null;
  scheduledDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  projectColor?: string | null;
  description: string;
}

const TABS = [
  { id: "today", fa: "امروز" },
  { id: "upcoming", fa: "پیش‌رو" },
  { id: "done", fa: "انجام‌شده‌ها" },
] as const;

export function TasksClient({
  tasks,
  projects,
  today,
}: {
  tasks: TaskFull[];
  projects: { id: string; title: string; color: string }[];
  today: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("today");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [when, setWhen] = useState<"today" | "tomorrow" | "none">("today");
  const [highlight, setHighlight] = useState(false);
  const [pending, start] = useTransition();

  const tomorrow = addDaysISO(today, 1);

  const groups = useMemo(() => {
    const alive = tasks.filter((t) => t.status !== "done");
    const done = tasks.filter((t) => t.status === "done");
    if (tab === "done") return [{ label: "", items: done }];
    if (tab === "today") {
      const t = alive.filter((x) => x.scheduledDate === today || (x.scheduledDate !== null && x.scheduledDate < today));
      const overdue = t.filter((x) => x.scheduledDate !== null && x.scheduledDate < today);
      const todayOnes = t.filter((x) => x.scheduledDate === today);
      return [
        ...(overdue.length ? [{ label: "عقب‌مانده", items: overdue }] : []),
        { label: overdue.length ? "امروز" : "", items: todayOnes },
      ];
    }
    const next = alive.filter((x) => x.scheduledDate && x.scheduledDate > today);
    const backlog = alive.filter((x) => !x.scheduledDate);
    return [
      ...(next.length ? [{ label: "برنامه‌ریزی‌شده", items: next }] : []),
      ...(backlog.length ? [{ label: "بدون تاریخ", items: backlog }] : []),
    ];
  }, [tasks, tab, today]);

  const add = () => {
    if (!title.trim()) return;
    start(async () => {
      const scheduledDate = when === "today" ? today : when === "tomorrow" ? tomorrow : null;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, scheduledDate, isDailyHighlight: highlight }),
      });
      if (res.ok) {
        setTitle("");
        setHighlight(false);
        router.refresh();
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 anim-rise">
        <h1 className="display text-[22px] text-ink flex items-center gap-2">
          <ListTodo className="text-moss" size={22} /> تسک‌ها
        </h1>
        <span className="text-[10.5px] font-black text-taupe num">
          {faNum(tasks.filter((t) => t.status === "done").length)} انجام‌شده
        </span>
      </div>

      {/* ─── افزودن سریع ─── */}
      <div className="card p-3.5 mb-4 anim-rise">
        <div className="flex gap-2">
          <input
            className="input !py-2.5 flex-1"
            placeholder="یک کار تازه… (مثلاً: پرداخت قبض برق)"
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button
            onClick={add}
            disabled={pending || !title.trim()}
            className="w-11 h-11 rounded-2xl bg-moss text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shrink-0"
            aria-label="افزودن"
          >
            <Plus size={20} strokeWidth={2.6} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {(["today", "tomorrow", "none"] as const).map((w) => (
            <SegBtn key={w} active={when === w} onClick={() => setWhen(w)}>
              {w === "today" ? "امروز" : w === "tomorrow" ? `فردا ${formatJalaliShort(tomorrow)}` : "بدون تاریخ"}
            </SegBtn>
          ))}
          <span className="w-px h-4 bg-line mx-0.5" />
          {(Object.keys(PRIORITY_META) as (keyof typeof PRIORITY_META)[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className="text-[10px] font-black px-2 py-1.5 rounded-lg border transition-all"
              style={{
                borderColor: priority === p ? PRIORITY_META[p].color : "#E6DFD3",
                color: priority === p ? PRIORITY_META[p].color : "#8D7F72",
                background: priority === p ? PRIORITY_META[p].color + "12" : "transparent",
              }}
            >
              {PRIORITY_META[p].fa}
            </button>
          ))}
          <button
            onClick={() => setHighlight(!highlight)}
            className={`text-[10px] font-black px-2 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
              highlight ? "border-gold text-gold bg-gold/10" : "border-line text-taupe"
            }`}
          >
            <Star size={10} fill={highlight ? "currentColor" : "none"} /> نکتهٔ روز
          </button>
        </div>
        <p className="text-[9.5px] text-taupe mt-2 num">
          انجام تسک: +{faNum(POINTS.TASK_DONE)} امتیاز · اولویت مهم: +{faNum(POINTS.TASK_HIGH_PRIORITY_BONUS)} · فوری: +{faNum(POINTS.TASK_URGENT_BONUS)} · نکتهٔ روز: +{faNum(POINTS.DAILY_HIGHLIGHT_BONUS)}
        </p>
      </div>

      {/* ─── تب‌ها ─── */}
      <div className="flex gap-1.5 mb-4 p-1 rounded-2xl bg-mist/60 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-xl text-[12px] font-black transition-all ${
              tab === t.id ? "bg-paper text-ink shadow-sm" : "text-taupe"
            }`}
          >
            {t.fa}
          </button>
        ))}
      </div>

      {/* ─── لیست ─── */}
      {groups.some((g) => g.items.length > 0) ? (
        groups.map((g, gi) =>
          g.items.length === 0 ? null : (
            <div key={gi} className="mb-4">
              {g.label && (
                <p className="text-[11px] font-black text-taupe mb-2 px-1 flex items-center gap-1.5">
                  {g.label === "عقب‌مانده" && <Undo2 size={11} className="text-terra" />}
                  {g.label}
                  <span className="num">{faNum(g.items.length)}</span>
                </p>
              )}
              <div className="space-y-2 stagger">
                {g.items.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            </div>
          ),
        )
      ) : (
        <div className="card">
          <EmptyState
            icon={ListTodo}
            title={tab === "done" ? "هنوز تسکی تمام نشده" : "خبری نیست"}
            hint="از فرم بالا یک تسک تازه بساز و شروع کن"
          />
        </div>
      )}
    </div>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-black px-2 py-1.5 rounded-lg border transition-all ${
        active ? "border-moss text-moss bg-moss/10" : "border-line text-taupe"
      }`}
    >
      {children}
    </button>
  );
}
