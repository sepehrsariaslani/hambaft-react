"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

export interface NotificationSettings {
  pushEnabled: boolean;
  levelUp: boolean;
  badgeEarned: boolean;
  challengeCompleted: boolean;
  partnerInvite: boolean;
  partnerAccepted: boolean;
  reactionReceived: boolean;
  nudgeReceived: boolean;
  dailyReminder: boolean;
  streakMilestone: boolean;
  goalDeadline: boolean;
  system: boolean;
}

const TOGGLE_ITEMS: { key: keyof NotificationSettings; label: string; icon: string }[] = [
  { key: "pushEnabled", label: "پوش نوتیفیکیشن مرورگر", icon: "🔔" },
  { key: "levelUp", label: "اعلان ارتقای سطح", icon: "🎉" },
  { key: "badgeEarned", label: "اعلان دریافت نشان", icon: "🏆" },
  { key: "challengeCompleted", label: "اعلان تکمیل چالش", icon: "🎯" },
  { key: "partnerInvite", label: "دعوتنامه‌های پارتنر", icon: "🤝" },
  { key: "partnerAccepted", label: "تأیید پارتنر جدید", icon: "✅" },
  { key: "reactionReceived", label: "واکنش پارتنرها", icon: "❤️" },
  { key: "nudgeReceived", label: "ناج‌های تشویقی", icon: "💪" },
  { key: "dailyReminder", label: "یادآوری خلاصه روزانه", icon: "📋" },
  { key: "streakMilestone", label: "نقاط عطف استریک", icon: "🔥" },
  { key: "goalDeadline", label: "مهلت‌های پیش‌رو اهداف", icon: "⏳" },
  { key: "system", label: "اطلاعیه‌های سیستمی", icon: "⚙️" },
];

export function NotificationSettingsDisplay() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/settings").then((r) => r.json());
      const d = res?.data;
      if (d) {
        setSettings({
          pushEnabled: !!d.push_enabled,
          levelUp: !!d.level_up,
          badgeEarned: !!d.badge_earned,
          challengeCompleted: !!d.challenge_completed,
          partnerInvite: !!d.partner_invite,
          partnerAccepted: !!d.partner_accepted,
          reactionReceived: !!d.reaction_received,
          nudgeReceived: !!d.nudge_received,
          dailyReminder: !!d.daily_reminder,
          streakMilestone: !!d.streak_milestone,
          goalDeadline: !!d.goal_deadline,
          system: !!d.system,
        });
      }
    } catch (e) {
      console.error("Failed to fetch notification settings", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!settings || saving) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSaving(true);
    try {
      await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          push_enabled: newSettings.pushEnabled,
          level_up: newSettings.levelUp,
          badge_earned: newSettings.badgeEarned,
          challenge_completed: newSettings.challengeCompleted,
          partner_invite: newSettings.partnerInvite,
          partner_accepted: newSettings.partnerAccepted,
          reaction_received: newSettings.reactionReceived,
          nudge_received: newSettings.nudgeReceived,
          daily_reminder: newSettings.dailyReminder,
          streak_milestone: newSettings.streakMilestone,
          goal_deadline: newSettings.goalDeadline,
          system: newSettings.system,
        }),
      });
    } catch (e) {
      console.error("Failed to update settings", e);
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-xs text-[#8D7F72]">در حال بارگذاری تنظیمات...</div>;
  if (!settings) return <div className="text-center py-8 text-xs text-[#8D7F72]">خطا در بارگذاری</div>;

  return (
    <div className="space-y-2 text-right" dir="rtl">
      {TOGGLE_ITEMS.map((item) => {
        const isOn = settings[item.key];
        return (
          <div
            key={item.key}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E6DFD3]"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1 text-[11px] font-black text-[#2D3025]">{item.label}</span>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                isOn ? "bg-[#4A6741]" : "bg-[#D6CFC3]"
              }`}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                animate={{ left: isOn ? "1.25rem" : "0.25rem" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
