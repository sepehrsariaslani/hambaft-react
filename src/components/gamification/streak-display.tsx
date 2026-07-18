"use client";

import React from "react";

export function StreakDisplay({ current, best }: { current: number; best: number }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-l from-orange-50 to-amber-50 border border-orange-200/80 text-right">
      <div className="text-3xl">🔥</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-orange-600 font-bold">بهترین: {best} روز</span>
          <span className="text-sm font-black text-orange-700">{current} روز استریک</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-orange-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-orange-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((current / 30) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
