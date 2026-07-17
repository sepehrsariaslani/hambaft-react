"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, Swords, Users2, Waves, Crown, Zap, ZapOff, Scale, Plus,
} from "lucide-react";
import { Avatar, ProgressBar, EmptyState } from "@/components/ui";
import { ChallengeCard, FeedList } from "@/components/widgets/display";
import { faNum, faCompact } from "@/lib/fa";
import { levelTitle } from "@/lib/gamification";

interface Leader {
  id: string; name: string; color: string; totalPoints: number; level: number; streakDays: number; isDemo: boolean;
}
interface Partner {
  id: string; name: string; color: string; level: number; totalPoints: number; streakDays: number; bio: string; weekPoints: number;
}
interface Challenge {
  id: string; progress: number; targetCount: number; status: string;
  challenge: { title: string; description: string; points: number; difficulty: string };
}

const TABS = [
  { id: "leaders", fa: "لیدربورد", icon: Trophy },
  { id: "partners", fa: "پارتنرها", icon: Users2 },
  { id: "challenges", fa: "چالش‌های امروز", icon: Swords },
  { id: "feed", fa: "فید", icon: Waves },
] as const;

export function ArenaClient({
  leaders,
  myId,
  myWeekPoints,
  myLevel,
  challenges,
  partners,
  feed,
}: {
  leaders: Leader[];
  myId: string;
  myWeekPoints: number;
  myLevel: number;
  challenges: Challenge[];
  partners: Partner[];
  feed: { ev: { id: string; points: number; reason: string; createdAt: Date }; name: string; color: string }[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("leaders");
  const myRank = leaders.findIndex((l) => l.id === myId) + 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 anim-rise">
        <h1 className="display text-[22px] text-ink flex items-center gap-2">
          <Trophy className="text-gold" size={22} /> باشگاه
        </h1>
        {myRank > 0 && (
          <span className="text-[10.5px] font-black text-terra bg-terra/10 px-2.5 py-1 rounded-xl num">
            رتبهٔ {faNum(myRank)}
          </span>
        )}
      </div>

      {/* ─── تب‌ها ─── */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-mist/60 mb-4 sticky top-[62px] z-30 backdrop-blur bg-mist/80">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all ${
              tab === t.id ? "bg-paper text-ink shadow-sm" : "text-taupe"
            }`}
          >
            <t.icon size={15} strokeWidth={tab === t.id ? 2.4 : 2} />
            <span className="text-[9px] font-black">{t.fa}</span>
          </button>
        ))}
      </div>

      {tab === "leaders" && <LeadersTab leaders={leaders} myId={myId} />}
      {tab === "partners" && (
        <PartnersTab partners={partners} myWeekPoints={myWeekPoints} myLevel={myLevel} />
      )}
      {tab === "challenges" && (
        <div className="space-y-2 stagger">
          <p className="text-[11px] text-taupe font-bold px-1 leading-5">
            هر روز یک ساده، یک متوسط و یک سخت — انتخاب خودکار همبافت بر اساس عادت‌های توست.
          </p>
          {challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          {challenges.length === 0 && <div className="card"><EmptyState icon={Swords} title="چالشی نیست" /></div>}
        </div>
      )}
      {tab === "feed" && <FeedList rows={feed} />}
    </div>
  );
}

/* ═══════ لیدربورد ═══════ */
const RANK_COLORS = ["#D6A94B", "#9D978B", "#9B6B61"];

function LeadersTab({ leaders, myId }: { leaders: Leader[]; myId: string }) {
  return (
    <div className="space-y-2 stagger">
      {leaders.map((l, i) => {
        const me = l.id === myId;
        return (
          <div
            key={l.id}
            className={`card flex items-center gap-3 px-4 py-3 ${me ? "!border-moss !bg-mist/40 ring-1 ring-moss/30" : ""}`}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black num shrink-0"
              style={{
                background: i < 3 ? RANK_COLORS[i] : "#F3EFE4",
                color: i < 3 ? "#fff" : "#8D7F72",
              }}
            >
              {i === 0 ? <Crown size={14} /> : faNum(i + 1)}
            </span>
            <Avatar name={l.name} color={l.color} size={38} ring={me} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-ink truncate">
                {me ? "تو" : l.name}
              </p>
              <p className="text-[10px] text-taupe font-bold mt-0.5">
                سطح {faNum(l.level)} · {levelTitle(l.level)}
              </p>
            </div>
            <div className="text-left shrink-0">
              <p className="num text-[15px] font-black text-ink">{faCompact(l.totalPoints)}</p>
              <p className="text-[9px] text-sage font-black num">
                {l.streakDays > 0 ? `${faNum(l.streakDays)} روز پیاپی` : "—"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════ پارتنرها ═══════ */
function PartnersTab({ partners, myWeekPoints, myLevel }: { partners: Partner[]; myWeekPoints: number; myLevel: number }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; color: string; level: number; total_points: number; streak_days: number; bonded: boolean }[] | null>(null);
  const [loadingSugg, setLoadingSugg] = useState(false);

  const loadSuggestions = async () => {
    setLoadingSugg(true);
    const res = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "partners" }),
    });
    const data = await res.json().catch(() => ({}));
    setSuggestions(data.users ?? []);
    setLoadingSugg(false);
  };

  const bond = (id: string) => {
    fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bond", partnerId: id }),
    }).then(() => router.refresh());
  };

  return (
    <div className="space-y-3">
      <div className="card p-3.5 flex items-center gap-3 anim-rise">
        <span className="w-9 h-9 rounded-xl bg-mist text-moss flex items-center justify-center shrink-0">
          <Scale size={17} />
        </span>
        <p className="text-[11px] text-ink2 font-bold leading-5">
          مقایسهٔ «امتیاز این هفته» با هر پارتنر — چون کسی که تنها می‌دود، زودتر می‌ایستد.
        </p>
      </div>

      {partners.length === 0 && (
        <div className="card">
          <EmptyState
            icon={Users2}
            title="هنوز پارتنری نداری"
            hint="پارتنر هم‌مسیر، اعتماد-به-نفسِ ادامه دادن است؛ از پیشنهادهای پایین یکی را انتخاب کن"
          />
        </div>
      )}

      <div className="space-y-2.5 stagger">
        {partners.map((p) => (
          <PartnerCard key={p.id} partner={p} myWeekPoints={myWeekPoints} />
        ))}
      </div>

      <div className="pt-2">
        <button
          onClick={loadSuggestions}
          className="w-full card card-press flex items-center justify-center gap-2 py-3 text-[12px] font-black text-sage"
        >
          <Plus size={14} /> {loadingSugg ? "در حال یافتن…" : suggestions ? "بروزرسانی پیشنهادها" : "یافتن هم‌راه تازه"}
        </button>
        {suggestions && (
          <div className="space-y-2 mt-3 stagger">
            {suggestions.filter((s) => !s.bonded && s.id !== (typeof window !== "undefined" ? "" : "")).map((s) => (
              <div key={s.id} className="card flex items-center gap-3 px-4 py-3">
                <Avatar name={s.name} color={s.color} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-black text-ink truncate">{s.name}</p>
                  <p className="text-[10px] text-taupe font-bold">سطح {faNum(s.level)} · {faNum(s.streak_days)} روز پیاپی</p>
                </div>
                <button
                  onClick={() => bond(s.id)}
                  className="text-[10.5px] font-black text-white bg-moss rounded-xl px-3 py-2 active:scale-95 transition-transform"
                >
                  هم‌راه شو
                </button>
              </div>
            ))}
            {suggestions.length === 0 && <p className="text-[11px] text-taupe text-center py-2">فعلاً کسی تازه نیست</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnerCard({ partner, myWeekPoints }: { partner: Partner; myWeekPoints: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [pending, start] = useTransition();
  const max = Math.max(1, myWeekPoints, partner.weekPoints);
  const ahead = myWeekPoints >= partner.weekPoints;

  const nudge = () => {
    start(async () => {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nudge", partnerId: partner.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(data.message ?? "ناجت رسید");
        setTimeout(() => setMsg(null), 4000);
      } else if (res.status === 429) {
        setCooldown(true);
        setTimeout(() => setCooldown(false), 4000);
      }
    });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={partner.name} color={partner.color} size={42} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-black text-ink truncate">{partner.name}</p>
          <p className="text-[10px] text-taupe font-bold mt-0.5 truncate">{partner.bio || `سطح ${faNum(partner.level)}`}</p>
        </div>
        <button
          onClick={nudge}
          disabled={pending || cooldown}
          className="h-9 px-3 rounded-xl bg-terra/10 text-terra text-[11px] font-black flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-all shrink-0"
        >
          {cooldown ? <ZapOff size={13} /> : <Zap size={13} fill="currentColor" />}
          {cooldown ? "کمی صبر…" : "ناج بزن"}
        </button>
      </div>
      {msg && (
        <p className="text-[11px] text-moss font-black bg-moss/10 rounded-xl px-3 py-2 mb-3 anim-rise">
          ناجت با این پیام رفت: «{msg}»
        </p>
      )}
      {/* مقایسه */}
      <div className="space-y-2">
        <CompareRow label="تو" value={myWeekPoints} max={max} color="#4A6741" />
        <CompareRow label={partner.name.split(" ")[0]} value={partner.weekPoints} max={max} color={partner.color} />
      </div>
      <p className="text-[10px] font-bold mt-2.5" style={{ color: ahead ? "#4A6741" : "#E26645" }}>
        {ahead
          ? myWeekPoints - partner.weekPoints > 0
            ? `${faNum(myWeekPoints - partner.weekPoints)} امتیاز جلویی — خفن!`
            : "مساوی‌اید؛ هفتهٔ جنگ!"
          : `${faNum(partner.weekPoints - myWeekPoints)} امتیاز عقبی — هنوز وقته`}
      </p>
    </div>
  );
}

function CompareRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-taupe w-14 truncate">{label}</span>
      <div className="flex-1">
        <ProgressBar value={value / max} color={color} height={8} />
      </div>
      <span className="num text-[11px] font-black text-ink w-12 text-left">{faNum(value)}</span>
    </div>
  );
}
