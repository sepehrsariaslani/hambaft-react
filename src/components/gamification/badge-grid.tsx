"use client";

import React from "react";
import { motion } from "framer-motion";

export type BadgeRarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface BadgeDefinition {
  badgeId: string;
  badgeNameFa: string;
  icon: string;
  descriptionFa: string;
  rarity: BadgeRarity;
  earned: boolean;
  awardedAt?: string | null;
}

const RARITY_CONFIG: Record<
  BadgeRarity,
  { bg: string; border: string; text: string; label: string; shadow: string }
> = {
  Common: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-700", label: "معمولی", shadow: "" },
  Rare: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", label: "کمیاب", shadow: "shadow-blue-100" },
  Epic: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", label: "حماسی", shadow: "shadow-purple-200" },
  Legendary: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", label: "افسانه‌ای", shadow: "shadow-amber-200 shadow-md" },
};

export function BadgeCard({ badge }: { badge: BadgeDefinition }) {
  const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.Common;

  return (
    <motion.div
      className={`relative p-3 rounded-2xl border text-center transition-all ${
        badge.earned
          ? `${rarity.bg} ${rarity.border} ${rarity.shadow}`
          : "bg-gray-50 border-gray-200 opacity-50 grayscale"
      }`}
      whileHover={badge.earned ? { scale: 1.05 } : {}}
      whileTap={badge.earned ? { scale: 0.95 } : {}}
    >
      <div className="text-3xl mb-1">{badge.icon || "🏆"}</div>
      <div className={`text-[10px] font-black leading-tight ${badge.earned ? rarity.text : "text-gray-400"}`}>
        {badge.badgeNameFa}
      </div>
      {badge.earned ? (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px] font-black">
          ✓
        </div>
      ) : (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-[8px] font-black">
          🔒
        </div>
      )}
      <div className={`text-[8px] mt-0.5 font-bold ${badge.earned ? "text-[#8D7F72]" : "text-gray-400"}`}>
        {rarity.label}
      </div>
    </motion.div>
  );
}

export function BadgeGrid({ badges }: { badges: BadgeDefinition[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {badges.map((b) => (
        <BadgeCard key={b.badgeId} badge={b} />
      ))}
    </div>
  );
}
