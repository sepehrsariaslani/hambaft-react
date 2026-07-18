"use client";

import React from "react";
import { CheckCircle2, Camera, MessageCircle } from "lucide-react";

export function StatsGrid({
  stats,
}: {
  stats: { tasksCompleted: number; proofsUploaded: number; commentsPosted: number };
}) {
  const items = [
    { label: "تسک‌ها", value: stats.tasksCompleted, icon: CheckCircle2, color: "text-[#4A6741]" },
    { label: "اثبات‌ها", value: stats.proofsUploaded, icon: Camera, color: "text-[#E26645]" },
    { label: "دیدگاه‌ها", value: stats.commentsPosted, icon: MessageCircle, color: "text-[#7C8363]" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="p-3 rounded-2xl bg-white border border-[#E6DFD3] text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <div className="text-sm font-black text-[#2D3025]">{s.value}</div>
            <div className="text-[9px] text-[#8D7F72] font-bold">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
