"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface DailyChallengeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  progress: number;
  targetCount: number;
  pointsReward: number;
  status: "active" | "completed" | "expired";
}

const DIFFICULTY_CONFIG = {
  easy: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "from-emerald-400 to-emerald-500", label: "آسان" },
  medium: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "from-amber-400 to-amber-500", label: "متوسط" },
  hard: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", bar: "from-red-400 to-red-500", label: "سخت" },
};

export function ChallengeCard({ challenge }: { challenge: DailyChallengeItem }) {
  const diff = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.easy;
  const isCompleted = challenge.status === "completed";
  const progressPct = challenge.targetCount > 0 ? Math.min((challenge.progress / challenge.targetCount) * 100, 100) : 0;

  return (
    <motion.div
      className={`relative p-3.5 rounded-2xl border transition-all text-right ${
        isCompleted ? "bg-[#E8ECE0] border-[#4A6741]/30" : `${diff.bg} ${diff.border}`
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {isCompleted && (
        <motion.div
          className="absolute top-2 left-2 w-6 h-6 bg-[#4A6741] rounded-full flex items-center justify-center text-white text-xs font-black"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          ✓
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5">{challenge.icon || "🎯"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={`text-xs font-black ${isCompleted ? "text-[#8D7F72] line-through" : "text-[#2D3025]"}`}>
              {challenge.title}
            </h4>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${diff.bg} ${diff.text}`}>
              {diff.label}
            </span>
          </div>

          <p className="text-[10px] text-[#8D7F72] mb-2">{challenge.description}</p>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className={`font-bold ${isCompleted ? "text-[#4A6741]" : diff.text}`}>
                {isCompleted ? "تکمیل شد! 🎉" : `${challenge.progress} از ${challenge.targetCount}`}
              </span>
              <span className="text-[#8D7F72] font-black">+{challenge.pointsReward} ⭐</span>
            </div>
            <div className="h-2 bg-white/70 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-l ${isCompleted ? "from-[#4A6741] to-[#7C8363]" : diff.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DailyChallengesDisplay() {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<DailyChallengeItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/gamification/challenges").then((r) => r.json());
      if (res?.data?.challenges) {
        setChallenges(
          res.data.challenges.map((c: any) => ({
            id: c.id,
            title: c.title_fa || c.title,
            description: c.description_fa || c.description,
            icon: c.icon || "🎯",
            difficulty: c.difficulty,
            progress: c.progress,
            targetCount: c.target_count,
            pointsReward: c.points_reward,
            status: c.status === "تکمیل‌شده" ? "completed" : "active",
          }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch challenges", e);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/gamification/challenges?history=true").then((r) => r.json());
      if (res?.data?.challenges) setHistory(res.data.challenges);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchChallenges(), fetchHistory()]).finally(() => setLoading(false));
  }, [fetchChallenges, fetchHistory]);

  if (loading) return <div className="text-center py-10 text-xs text-[#8D7F72]">در حال دریافت چالش‌ها...</div>;

  const completedCount = challenges.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-3 text-right" dir="rtl">
      {/* Tab Switcher */}
      <div className="flex bg-[#F9F6EE] p-1 rounded-2xl border border-[#E6DFD3] gap-1">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex-1 py-2 text-[10px] font-black rounded-xl cursor-pointer transition-all ${
            activeTab === "today" ? "bg-[#4A6741] text-white" : "text-[#8D7F72]"
          }`}
        >
          🎯 چالش‌های امروز ({completedCount}/{challenges.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 text-[10px] font-black rounded-xl cursor-pointer transition-all ${
            activeTab === "history" ? "bg-[#2D3025] text-white" : "text-[#8D7F72]"
          }`}
        >
          📋 تاریخچه چالش‌ها
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "today" ? (
          <motion.div key="today" className="space-y-2">
            {challenges.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8D7F72]">چالشی برای امروز تعریف نشده است</div>
            ) : (
              challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)
            )}
          </motion.div>
        ) : (
          <motion.div key="history" className="space-y-1.5">
            {history.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8D7F72]">تاریخچه خالی است</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 bg-white border border-[#E6DFD3] rounded-xl">
                  <div className="text-xl">{item.icon || "🎯"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-[#2D3025] truncate">{item.title_fa || item.title}</div>
                    <div className="text-[8px] text-[#8D7F72]">{item.challenge_date}</div>
                  </div>
                  <span
                    className={`text-xs font-black ${item.status === "تکمیل‌شده" ? "text-[#4A6741]" : "text-[#8D7F72]"}`}
                  >
                    {item.status === "تکمیل‌شده" ? "✓" : "✗"}
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
