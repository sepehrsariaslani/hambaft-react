"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Trash2, Star, ChevronLeft } from "lucide-react";
import { faNum } from "@/lib/fa";
import { PRIORITY_META } from "@/lib/gamification";

export interface TaskLite {
  id: string;
  title: string;
  priority: string;
  status: string;
  isDailyHighlight: boolean;
  estimatedMinutes: number | null;
  projectTitle?: string | null;
  scheduledDate?: string | null;
}

export function TaskRow({ task, compact = false }: { task: TaskLite; compact?: boolean }) {
  const router = useRouter();
  const [done, setDone] = useState(task.status === "done");
  const [float, setFloat] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [pending, start] = useTransition();
  const p = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

  const toggle = () => {
    const next = !done;
    setDone(next);
    start(async () => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (next && data.points) {
          setFloat(`+${faNum(data.points)}`);
          setTimeout(() => setFloat(null), 1400);
        }
        router.refresh();
      } else {
        setDone(!next);
      }
    });
  };

  const remove = () => {
    setRemoved(true);
    start(async () => {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else setRemoved(false);
    });
  };

  if (removed) return null;

  return (
    <div
      className={`card card-press relative flex items-center gap-3 px-3.5 ${compact ? "py-2.5" : "py-3"} transition-opacity ${pending ? "opacity-70" : ""} ${done ? "bg-mist/40" : ""}`}
    >
      {float && (
        <span className="absolute -top-3 right-6 text-[12px] font-black text-moss anim-rise num z-10">
          {float} امتیاز
        </span>
      )}
      <button
        onClick={toggle}
        aria-label={done ? "برگرداندن" : "انجام"}
        className="checkbox shrink-0 w-6 h-6 rounded-[9px] border-2 border-sand bg-paper flex items-center justify-center"
        data-done={done}
      >
        <Check size={14} strokeWidth={3.2} className="text-white" />
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={toggle}>
        <div className="flex items-center gap-1.5">
          {task.isDailyHighlight && !done && (
            <Star size={12} className="text-gold shrink-0" fill="currentColor" />
          )}
          <p
            className={`text-[13.5px] font-bold leading-5 truncate transition-all ${
              done ? "text-taupe line-through decoration-sand" : "text-ink"
            }`}
          >
            {task.title}
          </p>
        </div>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            {task.priority !== "medium" && (
              <span
                className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md"
                style={{ background: p.color + "16", color: p.color }}
              >
                {p.fa}
              </span>
            )}
            {task.projectTitle && (
              <span className="text-[9.5px] font-bold text-sage bg-mist px-1.5 py-0.5 rounded-md truncate max-w-[110px]">
                {task.projectTitle}
              </span>
            )}
            {task.estimatedMinutes ? (
              <span className="flex items-center gap-0.5 text-[9.5px] text-taupe font-bold num">
                <Clock size={10} /> {faNum(task.estimatedMinutes)} دقیقه
              </span>
            ) : null}
          </div>
        )}
      </div>

      <Link
        href={`/tasks/${task.id}`}
        title="جزئیات تسک"
        className="shrink-0 w-7 h-7 rounded-lg text-sand hover:text-moss hover:bg-mist flex items-center justify-center transition-colors"
      >
        <ChevronLeft size={14} />
      </Link>

      <button
        onClick={remove}
        aria-label="حذف"
        className="shrink-0 w-7 h-7 rounded-lg text-sand hover:text-terra hover:bg-terra/10 flex items-center justify-center transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
