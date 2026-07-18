"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, HelpCircle, TrendingUp, Target, Flame } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export function CoachClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-init",
      role: "model",
      text: "سلام دوست من! من **«یار»**، مربی توسعه فردی هوشمند شما هستم. چطور می‌توانم در مسیر رشد و توازن زندگی کمکتان کنم؟",
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;
    setIsLoading(true);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: promptText.trim(),
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    setTimeout(() => {
      const aiReply: Message = {
        id: `msg-ai-${Date.now()}`,
        role: "model",
        text: `پاسخ پیشنهادی مربی همبافت: برای دستیابی به توازن در ${promptText.trim()}، گام‌های کوچک روزانه بساز و از ردیابی استریک استفاده کن.`,
        timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header Card */}
      <div className="p-5 rounded-3xl bg-[#2D3025] text-white flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-[10px] text-white/70 font-bold">مربی هوشمند همبافت</div>
          <h1 className="text-lg font-black font-serif-elegant">«یار» — مربی و تحلیل‌گر توازن</h1>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
          🌿
        </div>
      </div>

      {/* Chat Frame */}
      <div className="bg-white rounded-3xl border border-[#E6DFD3] h-[520px] flex flex-col justify-between overflow-hidden shadow-xs">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9F6EE]/40">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-bold leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#4A6741] text-white rounded-tr-none"
                    : "bg-white border border-[#E6DFD3] text-[#2D3025] rounded-tl-none"
                }`}
              >
                <p>{m.text}</p>
                <span className="text-[8px] opacity-70 block mt-1 text-left font-mono">{m.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E6DFD3] rounded-2xl px-4 py-2.5 text-xs text-[#8D7F72]">
                یار در حال بررسی مکتوبات شماست...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-3 py-2 border-t border-[#E6DFD3] flex gap-1.5 overflow-x-auto bg-[#F9F6EE]">
          <button
            onClick={() => sendMessage("وضعیت توازن زندگی من را تحلیل کن.")}
            className="px-3 py-1 bg-white border border-[#E6DFD3] text-[9px] font-black text-[#2D3025] rounded-xl shrink-0 cursor-pointer hover:bg-[#E8ECE0]"
          >
            🌱 تحلیل کل زندگی
          </button>
          <button
            onClick={() => sendMessage("چگونه استمرار عادت‌ها را حفظ کنم؟")}
            className="px-3 py-1 bg-white border border-[#E6DFD3] text-[9px] font-black text-[#E26645] rounded-xl shrink-0 cursor-pointer hover:bg-[#FDE8E3]"
          >
            🔥 استمرار عادت‌ها
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputText);
          }}
          className="p-3 border-t border-[#E6DFD3] flex gap-2 bg-[#F9F6EE]"
        >
          <input
            type="text"
            placeholder="پیام خود به یار را بنویسید..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-[11px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white text-[#2D3025] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-[#4A6741] text-white rounded-xl cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}
