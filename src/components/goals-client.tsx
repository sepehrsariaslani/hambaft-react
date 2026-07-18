"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Target, Plus, X, Check } from "lucide-react";
import { GoalCard } from "@/components/widgets/display";
import { EmptyState } from "@/components/ui";
import { GOAL_CATEGORY, POINTS } from "@/lib/gamification";
import { faNum } from "@/lib/fa";

export interface GoalVM {
  id: string; title: string; category: string; privacy: string; status: string;
  currentValue: number; targetValue: number; unit: string; totalPoints: number;
  description: string;
}

const SCOPE_FA: Record<string, string> = { annual: "سالانه", quarterly: "فصلی", monthly: "ماهانه", custom: "بدون دوره" };
const TYPE_FA: Record<string, string> = { outcome: "نتیجه‌محور", metric: "سنجه‌محور", habit_driven: "عادت‌محور", savings: "مالی" };

export function GoalsClient({
  areas,
  myGoals,
  memberGoals,
  memberCounts,
  openNew,
}: {
  areas: { id: string; name: string; color: string }[];
  myGoals: { goal: GoalVM; areaName: string | null; areaColor: string | null }[];
  memberGoals: { goal: GoalVM; ownerName: string | null; areaName: string | null }[];
  memberCounts: Record<string, number>;
  openNew: boolean;
}) {
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(openNew);

  const filtered = useMemo(
    () => (areaFilter ? myGoals.filter((g) => g.areaName === areas.find((a) => a.id === areaFilter)?.name) : myGoals),
    [areaFilter, myGoals, areas],
  );

  const active = filtered.filter((g) => g.goal.status !== "completed");
  const completed = filtered.filter((g) => g.goal.status === "completed");

  return (
    <div>
      <div className="flex items-center justify-between mb-4 anim-rise">
        <h1 className="display text-[22px] text-ink flex items-center gap-2">
          <Target className="text-terra" size={22} /> اهداف
        </h1>
        <button
          onClick={() => setNewOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-terra text-white text-[11px] font-black flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Plus size={14} strokeWidth={2.6} /> هدف تازه
        </button>
      </div>

      {/* ─── فیلتر حوزه‌ها ─── */}
      {areas.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1 anim-rise" style={{ scrollbarWidth: "none" }}>
          <FilterChip active={areaFilter === null} onClick={() => setAreaFilter(null)}>همه</FilterChip>
          {areas.map((a) => (
            <FilterChip key={a.id} active={areaFilter === a.id} color={a.color} onClick={() => setAreaFilter(areaFilter === a.id ? null : a.id)}>
              {a.name}
            </FilterChip>
          ))}
        </div>
      )}

      {/* ─── اهداف فعال ─── */}
      {active.length + completed.length > 0 || memberGoals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {active.map((g, i) => (
              <GoalCard key={g.goal.id} goal={g.goal} areaName={g.areaName} areaColor={g.areaColor} memberCount={memberCounts[g.goal.id] ?? 0} delay={i * 0.05} />
            ))}
          </div>

          {memberGoals.length > 0 && (
            <>
              <p className="text-[12px] font-black text-taupe mt-6 mb-2.5 px-1">هم‌هدفی‌ها — عضوش هستی</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {memberGoals.map((g, i) => (
                  <GoalCard key={g.goal.id} goal={g.goal} areaName={g.areaName} ownerName={g.ownerName} delay={i * 0.05} />
                ))}
              </div>
            </>
          )}

          {completed.length > 0 && (
            <>
              <p className="text-[12px] font-black text-taupe mt-6 mb-2.5 px-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-moss" />
                <span>تکمیل‌شده‌ها</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 opacity-75">
                {completed.map((g, i) => (
                  <GoalCard key={g.goal.id} goal={g.goal} areaName={g.areaName} areaColor={g.areaColor} memberCount={memberCounts[g.goal.id] ?? 0} delay={i * 0.05} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon={Target}
            title="هنوز هدفی نساختی"
            hint={`اولین هدفت را بساز — هر پیشرفت +${faNum(POINTS.GOAL_UPDATE)} امتیاز و تکمیلش +${faNum(POINTS.GOAL_COMPLETED)} امتیاز دارد`}
          />
        </div>
      )}

      {newOpen && <NewGoalModal areas={areas} onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function FilterChip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5"
      style={{
        borderColor: active ? (color ?? "#4A6741") : "#E6DFD3",
        background: active ? (color ?? "#4A6741") + "14" : "#FDFBF7",
        color: active ? (color ?? "#4A6741") : "#8D7F72",
      }}
    >
      {color && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

/* ═══════ مودال هدف تازه ═══════ */
function NewGoalModal({ areas, onClose }: { areas: { id: string; name: string; color: string }[]; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("personal");
  const [goalType, setGoalType] = useState("outcome");
  const [unit, setUnit] = useState("");
  const [target, setTarget] = useState("100");
  const [privacy, setPrivacy] = useState<"private" | "shared">("private");
  const [areaId, setAreaId] = useState<string>("");
  const [scope, setScope] = useState("custom");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim()) return setError("عنوان هدف را بنویس");
    setError("");
    start(async () => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, category, goalType, unit,
          targetValue: Number(target) || 100,
          privacy, areaId: areaId || null, scope,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        router.push(`/goals/${data.id}`);
        router.refresh();
      } else {
        setError(data.error ?? "خطا در ساخت هدف");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-night/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-paper rounded-t-[28px] sm:rounded-[28px] border border-line shadow-2xl anim-rise max-h-[88dvh] overflow-y-auto safe-b">
        <div className="sticky top-0 bg-paper/95 backdrop-blur px-5 pt-4 pb-3 border-b border-line/60 flex items-center justify-between z-10">
          <p className="text-[15px] font-black text-ink flex items-center gap-2">
            <Target size={17} className="text-terra" /> هدف تازه
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-mist flex items-center justify-center text-taupe">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <Label>این هدف چیست؟</Label>
            <input className="input" placeholder="مثلاً: دویدن ۱۰۰ کیلومتر تابستان" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              className="input mt-2 min-h-[64px] resize-none"
              placeholder="چرا این هدف مهم است؟ (اختیاری)"
              value={description}
              maxLength={300}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label>دسته</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(GOAL_CATEGORY).map(([k, v]) => (
                <ChoiceChip key={k} active={category === k} color={v.color} onClick={() => setCategory(k)}>{v.fa}</ChoiceChip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>نوع مدیریت</Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TYPE_FA).map(([k, v]) => (
                  <ChoiceChip key={k} active={goalType === k} onClick={() => setGoalType(k)}>{v}</ChoiceChip>
                ))}
              </div>
            </div>
            <div>
              <Label>دوره</Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SCOPE_FA).map(([k, v]) => (
                  <ChoiceChip key={k} active={scope === k} onClick={() => setScope(k)}>{v}</ChoiceChip>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>هدف عددی</Label>
              <input className="input num" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
            <div>
              <Label>واحد</Label>
              <input className="input" placeholder="کیلومتر / کتاب / ٪" value={unit} maxLength={12} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>

          {areas.length > 0 && (
            <div>
              <Label>حوزهٔ زندگی</Label>
              <div className="flex flex-wrap gap-1.5">
                <ChoiceChip active={areaId === ""} onClick={() => setAreaId("")}>بدون حوزه</ChoiceChip>
                {areas.map((a) => (
                  <ChoiceChip key={a.id} active={areaId === a.id} color={a.color} onClick={() => setAreaId(a.id)}>{a.name}</ChoiceChip>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>حریم</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPrivacy("private")}
                className={`rounded-2xl border-2 p-3 text-right transition-all ${privacy === "private" ? "border-moss bg-moss/5" : "border-line"}`}
              >
                <p className="text-[12px] font-black text-ink">خصوصی</p>
                <p className="text-[10px] text-taupe mt-0.5">فقط خودم می‌بینم</p>
              </button>
              <button
                onClick={() => setPrivacy("shared")}
                className={`rounded-2xl border-2 p-3 text-right transition-all ${privacy === "shared" ? "border-terra bg-terra/5" : "border-line"}`}
              >
                <p className="text-[12px] font-black text-ink">اشتراکی</p>
                <p className="text-[10px] text-taupe mt-0.5">پارتنرها هم می‌بینند و پیش می‌برند</p>
              </button>
            </div>
          </div>

          {error && <p className="text-[12px] text-terra font-bold anim-rise">{error}</p>}

          <button
            onClick={submit}
            disabled={pending || !title.trim()}
            className="w-full h-12 rounded-2xl bg-terra text-white font-black text-[14px] disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {pending ? "در حال ساخت…" : "ساخت هدف"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-black text-ink2 mb-1.5">{children}</p>;
}

function ChoiceChip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  const c = color ?? "#4A6741";
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-black px-2.5 py-1.5 rounded-xl border transition-all"
      style={{ borderColor: active ? c : "#E6DFD3", color: active ? c : "#8D7F72", background: active ? c + "12" : "transparent" }}
    >
      {children}
    </button>
  );
}
