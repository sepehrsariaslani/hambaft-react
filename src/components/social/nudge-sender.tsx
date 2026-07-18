"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Sprout, Users, Target, Sparkles, Send, type LucideIcon } from "lucide-react";

const TEMPLATES: { index: number; icon: LucideIcon; message_fa: string }[] = [
  { index: 0, icon: Zap, message_fa: "یادت نره امروزت رو ببافی ✦" },
  { index: 1, icon: Flame, message_fa: "من سرجامم، نوبت توئه!" },
  { index: 2, icon: Sprout, message_fa: "یه قدم کوچیک هم عالیه — شروع کن" },
  { index: 3, icon: Users, message_fa: "امروز را با هم می‌بریم جلو" },
  { index: 4, icon: Target, message_fa: "بشور و بپاش، هدف‌هات منتظرن :)" },
  { index: 5, icon: Sparkles, message_fa: "تو می‌تونی، منتظر خبرای خوبتم!" },
];

interface NudgeSenderProps {
  partnerId: string;
  partnerName: string;
}

export function NudgeSender({ partnerId, partnerName }: NudgeSenderProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const handleSend = async (msgText?: string) => {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nudge",
          partnerId,
          message: msgText || customMessage || undefined,
        }),
      });

      if (res.ok) {
        setCustomMessage("");
        setShowPanel(false);
        setJustSent(true);
        setTimeout(() => setJustSent(false), 3000);
      }
    } catch (e) {
      console.error("Nudge failed", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative text-right">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
          justSent ? "bg-[#4A6741] text-white" : "bg-gradient-to-l from-[#E26645] to-[#C94B2A] text-white hover:scale-105"
        }`}
      >
        <Zap className="w-3.5 h-3.5" />
        <span>{justSent ? "ارسال شد!" : "ناج بفرست"}</span>
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full mb-2 right-0 w-64 bg-white rounded-2xl border border-[#E6DFD3] shadow-xl p-3 space-y-2 z-50"
          >
            <div className="text-[10px] font-black text-[#2D3025]">ناج تشویقی به {partnerName}</div>

            <div className="grid grid-cols-3 gap-1">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.index}
                    onClick={() => handleSend(t.message_fa)}
                    disabled={sending}
                    className="p-1.5 rounded-xl bg-[#F9F6EE] hover:bg-[#E8ECE0] border border-[#E6DFD3] text-center cursor-pointer transition-colors disabled:opacity-50 flex flex-col items-center gap-1"
                  >
                    <Icon className="w-4 h-4 text-[#4A6741]" />
                    <div className="text-[7px] font-bold text-[#8D7F72] truncate w-full">{t.message_fa}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1 pt-1">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="پیام دلخواه..."
                className="flex-1 px-2 py-1.5 text-[10px] font-bold bg-[#F9F6EE] border border-[#E6DFD3] rounded-lg focus:outline-none focus:border-[#4A6741]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customMessage.trim()) handleSend();
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !customMessage.trim()}
                className="px-2.5 py-1.5 bg-[#4A6741] text-white text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
