"use client";

import React from "react";

export function StatsGrid({
  stats,
}: {
  stats: { tasksCompleted: number; proofsUploaded: number; commentsPosted: number };
}) {
  const items = [
    { label: "تسک‌ها", value: stats.tasksCompleted, icon: "✅" },
    { label: "اثبات‌ها", value: stats.proofsUploaded, icon: "📸" },
    { label: "دیدگاه‌ها", value: stats.commentsPosted, icon: "💬" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((s) => (
        <div key={s.label} className="p-3 rounded-2xl bg-white border border-[#E6DFD3] text-center">
          <div className="text-xl mb-0.5">{s.icon}</div>
          <div className="text-sm font-black text-[#2D3025]">{s.value}</div>
          <div className="text-[9px] text-[#8D7F72] font-bold">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
