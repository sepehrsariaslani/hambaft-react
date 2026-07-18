"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle, Circle, Edit2, Trash2, Calendar, Clock, Flag, Zap,
  FolderKanban, Target, Layers, AlertCircle, Play, Pause,
  Square, RotateCcw, Sparkles, Pin, Link2, ArrowUpRight,
  BookOpen, Timer, History, Plus, ChevronDown, Check,
  ChevronLeft, X, AlarmClock, Flame, Diamond, Home, Paperclip, Upload, FileText
} from "lucide-react";
import { ProofUploader } from "@/components/social/proof-uploader";
import { CommentReactions } from "@/components/social/comment-reactions";

// ─── Status Config ───────────────────────────────────────────
const STATUS_CONFIG = [
  { id: "inbox", label: "ورودی", dot: "#D4A017", bg: "bg-[#F9F1D8]/60", text: "text-[#5A5A40]" },
  { id: "today", label: "امروز", dot: "#10B981", bg: "bg-emerald-50/60", text: "text-emerald-700" },
  { id: "next", label: "بعدی", dot: "#3B82F6", bg: "bg-blue-50/60", text: "text-blue-700" },
  { id: "in_progress", label: "درحال انجام", dot: "#6366F1", bg: "bg-indigo-50/60", text: "text-indigo-700" },
  { id: "on_hold", label: "متوقف", dot: "#F97316", bg: "bg-orange-50/60", text: "text-orange-700" },
  { id: "someday", label: "شاید", dot: "#9D978B", bg: "bg-[#F9F6EE]/60", text: "text-[#8D7F72]" },
  { id: "done", label: "انجام‌شده", dot: "#22C55E", bg: "bg-green-50/60", text: "text-green-700" },
] as const;

const PRIORITY_CONFIG: Record<string, { label: string; dot: string; color: string }> = {
  low: { label: "پایین", dot: "#10B981", color: "bg-emerald-100/60 text-emerald-700" },
  medium: { label: "متوسط", dot: "#D4A017", color: "bg-[#F9F1D8]/60 text-[#5A5A40]" },
  high: { label: "فوری", dot: "#EF4444", color: "bg-red-100/60 text-red-700" },
  urgent: { label: "بحرانی", dot: "#DC2626", color: "bg-red-200/60 text-red-800" },
};

type SubTab = "steps" | "time" | "files";

export function TaskDetailClient({ task }: { task: any }) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("steps");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [completed, setCompleted] = useState(task.status === "done");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Time Tracker State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);

  // Subtasks State
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatSeconds = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const saveTitle = async () => {
    if (!title.trim()) return;
    setIsEditingTitle(false);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    router.refresh();
  };

  const saveDescription = async () => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    router.refresh();
  };

  const handleToggle = async () => {
    const next = !completed;
    setCompleted(next);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle" }),
    });
    router.refresh();
  };

  const handleDelete = async () => {
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    router.push("/tasks");
  };

  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSt = {
      id: `st-${Date.now()}`,
      title: newSubtaskText.trim(),
      completed: false,
    };
    setSubtasks((prev) => [...prev, newSt]);
    setNewSubtaskText("");
  };

  const toggleSubtask = (stId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === stId ? { ...s, completed: !s.completed } : s))
    );
  };

  const deleteSubtask = (stId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== stId));
  };

  const currentStatus = STATUS_CONFIG.find((s) => s.id === (completed ? "done" : task.status || "inbox"));
  const currentPriority = PRIORITY_CONFIG[task.priority || "medium"] || PRIORITY_CONFIG.medium;

  const subDone = subtasks.filter((s) => s.completed).length;
  const subTotal = subtasks.length;
  const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;

  const timerProgress = Math.min((timerSeconds % 3600) / 3600, 1);
  const timerArcDash = timerProgress * 226.2;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#8D7F72] hover:text-[#4A6741] transition-colors"
        >
          <ArrowRight size={14} /> همهٔ تسک‌ها
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
              completed ? "bg-[#4A6741] border-[#4A6741] text-white" : "border-[#E6DFD3] hover:border-[#4A6741]"
            }`}
          >
            {completed && <Check className="w-4 h-4" />}
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="px-2.5 py-1 bg-red-500 text-white text-[9px] font-bold rounded-lg cursor-pointer"
              >
                حذف
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-[9px] font-bold text-[#8D7F72] cursor-pointer"
              >
                انصراف
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-[#8D7F72] hover:text-red-500 rounded cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="p-5 rounded-3xl bg-white border border-[#E6DFD3] space-y-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 mt-1.5"
            style={{ backgroundColor: currentStatus?.dot || "#9D978B" }}
          />
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                className="w-full text-lg font-black bg-transparent text-[#2D3025] focus:outline-none"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className={`text-lg font-black cursor-pointer leading-8 ${
                  completed ? "line-through text-[#8D7F72]" : "text-[#2D3025]"
                }`}
              >
                {title}
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Metadata (Right) + Details & Tabs (Left) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Right Column: Metadata */}
        <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-3 md:col-span-1 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
            <span className="text-[10px] font-black text-[#8D7F72]">وضعیت</span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${currentStatus?.bg} ${currentStatus?.text}`}>
              {currentStatus?.label}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
            <span className="text-[10px] font-black text-[#8D7F72]">اولویت</span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${currentPriority.color}`}>
              {currentPriority.label}
            </span>
          </div>

          {task.scheduledDate && (
            <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
              <span className="text-[10px] font-black text-[#8D7F72]">برنامه‌ریزی</span>
              <span className="text-[10px] font-bold text-[#2D3025]">{task.scheduledDate}</span>
            </div>
          )}

          {task.estimatedMinutes && (
            <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
              <span className="text-[10px] font-black text-[#8D7F72]">تخمین زمان</span>
              <span className="text-[10px] font-bold text-[#2D3025]">{task.estimatedMinutes} دقیقه</span>
            </div>
          )}

          {/* Attachments & Social */}
          <div className="pt-2 space-y-3">
            <ProofUploader entityType="task" entityId={task.id} />
            <CommentReactions entityType="task" entityId={task.id} />
          </div>
        </div>

        {/* Left Column: Description & Sub-tabs */}
        <div className="space-y-4 md:col-span-2">
          {/* Description Card */}
          <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-2 shadow-xs">
            <label className="text-[10px] font-black text-[#8D7F72] block">توضیحات و یادداشت‌ها</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={3}
              placeholder="توضیحات مربوط به این کار را بنویسید..."
              className="w-full text-[11px] font-bold p-3 rounded-2xl border border-[#E6DFD3] bg-[#F9F6EE] focus:outline-none focus:border-[#4A6741] resize-none"
            />
          </div>

          {/* Sub Tab Bar */}
          <div className="flex bg-[#F9F6EE] p-1 rounded-2xl border border-[#E6DFD3] gap-1">
            <button
              onClick={() => setSubTab("steps")}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                subTab === "steps" ? "bg-[#2D3025] text-white" : "text-[#8D7F72]"
              }`}
            >
              مراحل و خرده‌کارها ({subTotal})
            </button>
            <button
              onClick={() => setSubTab("time")}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                subTab === "time" ? "bg-[#2D3025] text-white" : "text-[#8D7F72]"
              }`}
            >
              ⏱️ زمان‌سنج دایره‌ای
            </button>
          </div>

          {/* Sub Tab Content */}
          <AnimatePresence mode="wait">
            {subTab === "steps" && (
              <motion.div key="steps" className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#2D3025]">پیشرفت زیرمجموعه‌ها ({subPct}%)</span>
                  <span className="text-[10px] text-[#8D7F72] font-bold">
                    {subDone} از {subTotal} انجام شد
                  </span>
                </div>

                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 bg-[#F9F6EE] rounded-xl border border-[#E6DFD3]"
                    >
                      <button
                        onClick={() => toggleSubtask(st.id)}
                        className="flex items-center gap-2 text-right flex-1 cursor-pointer"
                      >
                        {st.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#8D7F72]" />
                        )}
                        <span
                          className={`text-[11px] font-bold ${
                            st.completed ? "line-through text-[#8D7F72]" : "text-[#2D3025]"
                          }`}
                        >
                          {st.title}
                        </span>
                      </button>
                      <button onClick={() => deleteSubtask(st.id)} className="p-1 text-[#8D7F72] hover:text-red-500 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="خرده‌کار جدید..."
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    className="flex-1 text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-[#F9F6EE]"
                  />
                  <button
                    onClick={addSubtask}
                    disabled={!newSubtaskText.trim()}
                    className="px-4 bg-[#4A6741] text-white rounded-xl text-[10px] font-black cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {subTab === "time" && (
              <motion.div key="time" className="p-5 rounded-3xl bg-white border border-[#E6DFD3] space-y-4 text-center">
                {/* Circular Timer Display */}
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="none" strokeWidth="3" className="stroke-[#E6DFD3]" />
                      {isTimerRunning && (
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${timerArcDash} 226.2`}
                          className="stroke-[#4A6741]"
                          style={{ transition: "stroke-dasharray 1s linear" }}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black font-mono tracking-tight text-[#2D3025]">
                        {formatSeconds(timerSeconds)}
                      </span>
                      <span className="text-[8px] font-black uppercase text-[#4A6741]">
                        {isTimerRunning ? "در حال اجرا" : "متوقف"}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="p-3 rounded-full bg-[#4A6741] text-white cursor-pointer hover:opacity-90 active:scale-95"
                    >
                      {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(0);
                      }}
                      className="p-3 rounded-full bg-red-100 text-red-600 cursor-pointer hover:bg-red-200 active:scale-95"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
