"use client";

import React from "react";

export interface PointTransaction {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

export function PointsHistory({ transactions }: { transactions: PointTransaction[] }) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-6 text-[#8D7F72] text-xs">هنوز تراکنش امتیازی ثبت نشده است.</div>;
  }

  return (
    <div className="space-y-1.5 text-right">
      {transactions.map((t) => (
        <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#E6DFD3]">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
              t.points > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {t.points > 0 ? `+${t.points}` : t.points}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-[#2D3025] truncate">{t.reason}</div>
            <div className="text-[8px] text-[#8D7F72]">{new Date(t.createdAt).toLocaleDateString("fa-IR")}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
