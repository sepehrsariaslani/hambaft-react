"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame, Star, Medal, CheckCircle2, Sprout, Camera, type LucideIcon } from "lucide-react";

export interface ComparisonRow {
  field: string;
  label: string;
  icon: string;
  me: number;
  partner: number;
  ahead: "me" | "partner" | "tie";
}

const FIELD_LUCIDE_ICONS: Record<string, LucideIcon> = {
  points: Star,
  level: Medal,
  streak: Flame,
  tasks: CheckCircle2,
  habits: Sprout,
  proofs: Camera,
};

interface PartnerComparisonProps {
  partnerEmail: string;
  partnerName: string;
}

export function PartnerComparisonDisplay({ partnerEmail, partnerName }: PartnerComparisonProps) {
  const [data, setData] = useState<{
    me: { total_points: number; level: number; current_streak: number };
    partner: { total_points: number; level: number; current_streak: number };
    comparison: ComparisonRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComparison = useCallback(async () => {
    try {
      const res = await fetch(`/api/gamification/comparison?partner=${encodeURIComponent(partnerEmail)}`).then((r) =>
        r.json()
      );
      if (res?.data) setData(res.data);
    } catch (e) {
      console.error("Failed to fetch comparison", e);
    } finally {
      setLoading(false);
    }
  }, [partnerEmail]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  if (loading) {
    return <div className="text-center py-6 text-xs text-[#8D7F72]">در حال بارگذاری مقایسه...</div>;
  }

  if (!data) {
    return <div className="text-center py-6 text-xs text-[#8D7F72]">اطلاعاتی یافت نشد</div>;
  }

  const { me, partner, comparison } = data;
  const meAhead = comparison.filter((c) => c.ahead === "me").length;
  const partnerAhead = comparison.filter((c) => c.ahead === "partner").length;

  return (
    <div className="space-y-3 text-right" dir="rtl">
      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-bl from-[#4A6741] to-[#2D4025] text-white text-center">
          <div className="text-[10px] text-white/70 font-black">من</div>
          <div className="text-2xl font-black">{me.total_points}</div>
          <div className="text-[9px] text-white/80 flex items-center justify-center gap-1">
            سطح {me.level} • {me.current_streak} <Flame className="w-3 h-3 text-orange-400 inline" />
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-gradient-to-bl from-[#E26645] to-[#C94B2A] text-white text-center">
          <div className="text-[10px] text-white/70 font-black">{partnerName}</div>
          <div className="text-2xl font-black">{partner.total_points}</div>
          <div className="text-[9px] text-white/80 flex items-center justify-center gap-1">
            سطح {partner.level} • {partner.current_streak} <Flame className="w-3 h-3 text-orange-400 inline" />
          </div>
        </div>
      </div>

      {/* Win/Loss Summary */}
      <div className="flex items-center justify-center gap-4 p-2.5 bg-[#F9F6EE] border border-[#E6DFD3] rounded-2xl">
        <span className="text-[10px] font-black text-[#4A6741]">{meAhead} برد من</span>
        <span className="text-[9px] text-[#8D7F72] font-bold">مقابل</span>
        <span className="text-[10px] font-black text-[#E26645]">{partnerAhead} برد {partnerName}</span>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {comparison.map((row) => {
          const maxVal = Math.max(row.me, row.partner, 1);
          const Icon = FIELD_LUCIDE_ICONS[row.field] || Star;

          return (
            <div key={row.field} className="p-3 rounded-2xl bg-white border border-[#E6DFD3]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-[#8D7F72] flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#4A6741]" />
                  <span>{row.label}</span>
                </span>
                {row.ahead === "me" && (
                  <span className="text-[8px] font-black text-[#4A6741] bg-[#E8ECE0] px-2 py-0.5 rounded-md">
                    تو جلوتری!
                  </span>
                )}
                {row.ahead === "partner" && (
                  <span className="text-[8px] font-black text-[#E26645] bg-[#FDE8E3] px-2 py-0.5 rounded-md">
                    پارتنر جلوتره
                  </span>
                )}
                {row.ahead === "tie" && (
                  <span className="text-[8px] font-black text-[#8D7F72] bg-[#F9F6EE] px-2 py-0.5 rounded-md">
                    مساوی
                  </span>
                )}
              </div>

              {/* Dual Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[#4A6741] w-8 text-left">{row.me}</span>
                  <div className="flex-1 h-2 bg-[#E8ECE0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#4A6741] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.me / maxVal) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[#E26645] w-8 text-left">{row.partner}</span>
                  <div className="flex-1 h-2 bg-[#FDE8E3] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#E26645] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.partner / maxVal) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
