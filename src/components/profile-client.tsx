"use client";

import { useState } from "react";
import { User, Trophy, Bell, Shield, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LevelProgressBar } from "@/components/gamification/level-progress-bar";
import { StreakDisplay } from "@/components/gamification/streak-display";
import { StatsGrid } from "@/components/gamification/stats-grid";
import { BadgeGrid } from "@/components/gamification/badge-grid";
import { PointsHistory } from "@/components/gamification/points-history";
import { NotificationSettingsDisplay } from "@/components/gamification/notification-settings-display";
import { PartnerComparisonDisplay } from "@/components/gamification/partner-comparison-display";
import { ModerationPanel } from "@/components/moderation/moderation-panel";
import { LogoutButton } from "@/components/page-clients";

const TABS = [
  { id: "gamification", label: "پروفایل و گیمیفیکیشن", icon: Trophy },
  { id: "settings", label: "اعلان‌ها", icon: Bell },
  { id: "moderation", label: "ایمنی و نظارت", icon: Shield },
] as const;

export function ProfileClient({
  user,
  stats,
  badges,
  recentEvents,
}: {
  user: {
    id: string;
    name: string;
    phone: string;
    bio: string;
    avatarColor: string;
    level: number;
    totalPoints: number;
    streakDays: number;
  };
  stats: { tasksCompleted: number; proofsUploaded: number; commentsPosted: number };
  badges: any[];
  recentEvents: any[];
}) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("gamification");

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ─── کارت هویت ─── */}
      <section className="p-5 rounded-3xl bg-white border border-[#E6DFD3] text-right shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-inner"
            style={{ background: user.avatarColor || "#4A6741" }}
          >
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-[#2D3025] truncate">{user.name}</h1>
            <p className="text-[10px] text-[#8D7F72] font-bold mt-0.5 dir-ltr text-right">{user.phone}</p>
            {user.bio && <p className="text-[11px] text-[#2D3025] mt-1 leading-5">{user.bio}</p>}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E6DFD3]">
          <LevelProgressBar
            level={user.level}
            totalPoints={user.totalPoints}
            pointsToNext={user.level * 500}
          />
        </div>
      </section>

      {/* ─── سوییچر تب‌ها ─── */}
      <div className="flex bg-[#F9F6EE] p-1 rounded-2xl border border-[#E6DFD3] gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === t.id
                  ? "bg-[#2D3025] text-white shadow-sm"
                  : "text-[#8D7F72] hover:text-[#2D3025]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── محتوای تب‌ها ─── */}
      <AnimatePresence mode="wait">
        {activeTab === "gamification" && (
          <motion.div
            key="gamification"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <StreakDisplay current={user.streakDays} best={Math.max(user.streakDays, 7)} />
            <StatsGrid stats={stats} />

            {/* Badges section */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-[#2D3025]">نشان‌های افتخار</h3>
              <BadgeGrid badges={badges} />
            </div>

            {/* Points history */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-[#2D3025]">آخرین تغییرات امتیاز</h3>
              <PointsHistory transactions={recentEvents} />
            </div>

            <LogoutButton />
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <NotificationSettingsDisplay />
          </motion.div>
        )}

        {activeTab === "moderation" && (
          <motion.div
            key="moderation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ModerationPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
