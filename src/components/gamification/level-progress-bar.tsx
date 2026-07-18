"use client";

import React from "react";
import { motion } from "framer-motion";

export function LevelProgressBar({
  level,
  totalPoints,
  pointsToNext,
}: {
  level: number;
  totalPoints: number;
  pointsToNext: number;
}) {
  const prevThreshold = level <= 1 ? 0 : Math.round((pointsToNext * (level - 1)) / level);
  const range = Math.max(1, pointsToNext - prevThreshold);
  const progress = Math.min(100, Math.max(0, ((totalPoints - prevThreshold) / range) * 100));

  return (
    <div className="space-y-1.5 text-right">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-black text-[#2D3025] dark:text-[#E8ECE0]">سطح {level}</span>
        <span className="text-[#8D7F72] font-bold">
          {totalPoints} / {pointsToNext} امتیاز
        </span>
      </div>
      <div className="h-2.5 bg-[#E6DFD3] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-l from-[#4A6741] to-[#7C8363] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
