"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";

export function LevelUpCelebration({ level, onClose }: { level: number; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#F9F6EE] rounded-3xl p-8 text-center mx-6 max-w-sm shadow-2xl border border-[#E6DFD3]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          className="text-6xl mb-3"
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.6, repeat: 2 }}
        >
          🎉
        </motion.div>
        <h2 className="text-lg font-black text-[#2D3025] mb-1">ارتقای سطح!</h2>
        <p className="text-3xl font-black text-[#4A6741] mb-2">سطح {level}</p>
        <p className="text-xs text-[#8D7F72] mb-5">تبریک! هم‌بافته‌ای که تو هستی هر روز تازه‌تر می‌شود.</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-[#2D3025] text-white rounded-2xl text-xs font-black cursor-pointer hover:opacity-90"
        >
          ادامه مسیر 💪
        </button>
      </motion.div>
    </motion.div>
  );
}

export function BadgeEarnedCelebration({
  badge,
  onClose,
}: {
  badge: { icon: string; badge_name_fa: string; rarity?: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#F9F6EE] rounded-3xl p-6 text-center mx-6 max-w-xs shadow-2xl border border-[#E6DFD3]"
        initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <motion.div
          className="text-5xl mb-3"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          {badge.icon || "🏆"}
        </motion.div>
        <h2 className="text-sm font-black text-[#2D3025] mb-1">نشان جدید کسب کردی!</h2>
        <p className="text-base font-black text-[#4A6741]">{badge.badge_name_fa}</p>
      </motion.div>
    </motion.div>
  );
}
