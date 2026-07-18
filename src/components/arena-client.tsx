"use client";

import { useState } from "react";
import { Trophy, Swords, Users2, Waves, Crown } from "lucide-react";
import { Avatar } from "@/components/ui";
import { FeedList } from "@/components/widgets/display";
import { DailyChallengesDisplay } from "@/components/challenges/challenge-card";
import { PartnerManager } from "@/components/social/partner-manager";
import { PartnerComparisonDisplay } from "@/components/gamification/partner-comparison-display";
import { faNum, faCompact } from "@/lib/fa";
import { levelTitle } from "@/lib/gamification";

interface Leader {
  id: string;
  name: string;
  color: string;
  totalPoints: number;
  level: number;
  streakDays: number;
  isDemo: boolean;
}

interface Partner {
  id: string;
  name: string;
  color: string;
  level: number;
  totalPoints: number;
  streakDays: number;
  bio: string;
  weekPoints: number;
}

const TABS = [
  { id: "leaders", fa: "لیدربورد", icon: Trophy },
  { id: "challenges", fa: "چالش‌های روزانه", icon: Swords },
  { id: "partners", fa: "پارتنرها و مقایسه", icon: Users2 },
  { id: "feed", fa: "فید هم‌مسیرها", icon: Waves },
] as const;

export function ArenaClient({
  leaders,
  myId,
  myWeekPoints,
  myLevel,
  partners,
  feed,
}: {
  leaders: Leader[];
  myId: string;
  myWeekPoints: number;
  myLevel: number;
  challenges: any[];
  partners: Partner[];
  feed: { ev: { id: string; points: number; reason: string; createdAt: Date }; name: string; color: string }[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("leaders");
  const myRank = leaders.findIndex((l) => l.id === myId) + 1;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ─── هدر باشگاه ─── */}
      <div className="flex items-center justify-between mb-2 anim-rise">
        <h1 className="display text-[22px] text-[#2D3025] flex items-center gap-2">
          <Trophy className="text-[#E26645]" size={22} /> باشگاه همبافت
        </h1>
        {myRank > 0 && (
          <span className="text-[10.5px] font-black text-[#E26645] bg-[#E26645]/10 px-3 py-1 rounded-xl num">
            رتبهٔ {faNum(myRank)}
          </span>
        )}
      </div>

      {/* ─── تب‌ها ─── */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#F9F6EE] border border-[#E6DFD3] sticky top-[62px] z-30">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all cursor-pointer ${
              tab === t.id ? "bg-[#2D3025] text-white shadow-sm" : "text-[#8D7F72]"
            }`}
          >
            <t.icon size={15} strokeWidth={tab === t.id ? 2.4 : 2} />
            <span className="text-[9px] font-black">{t.fa}</span>
          </button>
        ))}
      </div>

      {tab === "leaders" && <LeadersTab leaders={leaders} myId={myId} />}
      {tab === "challenges" && <DailyChallengesDisplay />}
      {tab === "partners" && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3]">
            <PartnerManager />
          </div>

          {partners.length > 0 && (
            <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-3">
              <h3 className="text-xs font-black text-[#2D3025]">مقایسهٔ زنده با پارتنرها</h3>
              <PartnerComparisonDisplay partnerEmail={partners[0]?.name || ""} partnerName={partners[0]?.name || "پارتنر"} />
            </div>
          )}
        </div>
      )}
      {tab === "feed" && <FeedList rows={feed} />}
    </div>
  );
}

const RANK_COLORS = ["#D6A94B", "#9D978B", "#9B6B61"];

function LeadersTab({ leaders, myId }: { leaders: Leader[]; myId: string }) {
  return (
    <div className="space-y-2 text-right">
      {leaders.map((l, i) => {
        const me = l.id === myId;
        return (
          <div
            key={l.id}
            className={`card flex items-center gap-3 px-4 py-3 rounded-2xl border ${
              me ? "!border-[#4A6741] !bg-[#E8ECE0]/50 ring-1 ring-[#4A6741]/30" : "bg-white border-[#E6DFD3]"
            }`}
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
              <p className="text-[13px] font-black text-[#2D3025] truncate">{me ? "تو" : l.name}</p>
              <p className="text-[10px] text-[#8D7F72] font-bold mt-0.5">
                سطح {faNum(l.level)} · {levelTitle(l.level)}
              </p>
            </div>
            <div className="text-left shrink-0">
              <p className="num text-[15px] font-black text-[#2D3025]">{faCompact(l.totalPoints)}</p>
              <p className="text-[9px] text-[#4A6741] font-black num">
                {l.streakDays > 0 ? `${faNum(l.streakDays)} روز پیاپی` : "—"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
