"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Send, PartyPopper } from "lucide-react";
import { faNum } from "@/lib/fa";
import { REACTION_KINDS, POINTS } from "@/lib/gamification";
import { ReactionIcon } from "@/components/widgets/display";

/* ─── فرم ثبت پیشرفت ─── */
export function ProgressForm({
  goalId,
  unit,
  targetValue,
  currentValue,
}: {
  goalId: string;
  unit: string;
  targetValue: number;
  currentValue: number;
}) {
  const router = useRouter();
  const [delta, setDelta] = useState("1");
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [float, setFloat] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, start] = useTransition();

  const submit = () => {
    const d = Number(delta) || 1;
    start(async () => {
      const res = await fetch(`/api/goals/${goalId}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "progress", delta: d, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFloat(`+${faNum(data.points ?? POINTS.GOAL_UPDATE)}`);
        if (data.completed) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 5000);
        }
        setNote("");
        setExpanded(false);
        setTimeout(() => setFloat(null), 1600);
        router.refresh();
      }
    });
  };

  return (
    <div className="card p-4 relative">
      {celebrate && (
        <div className="absolute inset-0 rounded-[22px] bg-moss/95 z-20 flex flex-col items-center justify-center text-white anim-pop">
          <PartyPopper size={30} className="mb-2" />
          <p className="display text-lg">هدف کامل رسید!</p>
          <p className="text-[12px] font-bold text-white/80 mt-1 num">+{faNum(POINTS.GOAL_COMPLETED)} امتیاز تبریک</p>
        </div>
      )}
      {float && (
        <span className="absolute -top-3 left-5 text-[13px] font-black text-moss anim-rise num z-10">
          {float} امتیاز
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl bg-mist text-moss flex items-center justify-center shrink-0">
          <TrendingUp size={17} />
        </span>
        <div className="flex-1 flex items-center gap-1.5">
          {[1, 5].map((n) => (
            <button
              key={n}
              onClick={() => setDelta(String(n))}
              className={`num text-[11px] font-black px-2.5 py-2 rounded-xl border transition-all ${
                delta === String(n) ? "border-moss text-moss bg-moss/10" : "border-line text-taupe"
              }`}
            >
              +{faNum(n)}
            </button>
          ))}
          <input
            className="input !py-2 !rounded-xl w-[70px] text-center num"
            inputMode="numeric"
            value={delta}
            onChange={(e) => setDelta(e.target.value.replace(/[^0-9]/g, "").slice(0, 5) || "1")}
            aria-label="میزان پیشرفت"
          />
          <span className="text-[10px] text-taupe font-bold whitespace-nowrap">{unit}</span>
        </div>
        <button
          onClick={expanded ? submit : () => setExpanded(true)}
          disabled={pending}
          className="h-10 px-4 rounded-xl bg-moss text-white text-[12px] font-black disabled:opacity-50 active:scale-95 transition-transform shrink-0"
        >
          {pending ? "…" : expanded ? "ثبت نهایی" : "ثبت پیشرفت"}
        </button>
      </div>
      {expanded && (
        <div className="mt-2.5 anim-rise">
          <input
            className="input !py-2.5 !rounded-xl"
            placeholder="یادداشت این گام (اختیاری)…"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <p className="text-[9.5px] text-taupe mt-1.5 num">پیشرفت روی هدف: +{faNum(POINTS.GOAL_UPDATE)} امتیاز</p>
        </div>
      )}
    </div>
  );
}

/* ─── ردیف واکنش‌ها ─── */
export function ReactionBar({
  goalId,
  initial,
}: {
  goalId: string;
  initial: { kind: string; count: number; mine: boolean }[];
}) {
  const router = useRouter();
  const [state, setState] = useState(() =>
    Object.fromEntries(REACTION_KINDS.map((r) => [r.kind, initial.find((i) => i.kind === r.kind) ?? { kind: r.kind, count: 0, mine: false }])),
  );
  const [, start] = useTransition();

  const toggle = (kind: string) => {
    const cur = state[kind];
    setState((s) => ({ ...s, [kind]: { kind, count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine } }));
    start(async () => {
      const res = await fetch(`/api/goals/${goalId}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reaction", kind }),
      });
      if (res.ok) router.refresh();
      else setState((s) => ({ ...s, [kind]: cur }));
    });
  };

  return (
    <div className="card px-3 py-2.5 flex items-center gap-2">
      {REACTION_KINDS.map((r) => {
        const s = state[r.kind];
        return (
          <button
            key={r.kind}
            onClick={() => toggle(r.kind)}
            className="reaction-chip flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border border-transparent"
            data-on={s.mine}
            aria-label={r.fa}
          >
            <span className={s.mine ? "text-moss" : "text-taupe"}>
              <ReactionIcon kind={r.kind} size={17} />
            </span>
            <span className="text-[9px] font-black text-taupe">
              {r.fa}
              {s.count > 0 && <span className="num text-ink2"> · {faNum(s.count)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── فرم دیدگاه ─── */
export function CommentForm({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    start(async () => {
      const res = await fetch(`/api/goals/${goalId}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment", body }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex gap-2">
      <input
        className="input !rounded-2xl flex-1"
        placeholder="یک حرف تشویق بنویس…"
        value={body}
        maxLength={300}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button
        onClick={submit}
        disabled={pending || !body.trim()}
        className="w-11 h-11 rounded-2xl bg-ink text-cream flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform shrink-0 -scale-x-100"
        aria-label="ارسال"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
