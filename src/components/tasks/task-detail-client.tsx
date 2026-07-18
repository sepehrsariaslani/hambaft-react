"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle, Circle, Trash2, Calendar, Clock, Flag, Zap,
  FolderKanban, Target, Layers, AlertCircle, Play, Pause,
  Square, RotateCcw, Sparkles, Pin, Link2, ArrowUpRight,
  BookOpen, Timer, History, Plus, ChevronDown, Check,
  ChevronLeft, X, AlarmClock, Flame, Diamond, Home, Paperclip, Upload, FileText, Download
} from "lucide-react";
import { ProofUploader } from "@/components/social/proof-uploader";
import { CommentReactions } from "@/components/social/comment-reactions";

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

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold"
      style={{
        backgroundColor: color + "18",
        color: color,
        border: `1px solid ${color}25`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function MetaDivider() {
  return <div className="mx-4 border-t border-[#E6DFD3]/50" />;
}

function MetaRow({
  icon,
  label,
  children,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer ${
        active ? "bg-[#4A6741]/5" : "hover:bg-[#F9F6EE]/60"
      }`}
    >
      <span className="flex items-center gap-2 text-[11px] text-[#8D7F72]">
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </button>
  );
}

type SubTab = "steps" | "time" | "files";

export function TaskDetailClient({ task }: { task: any }) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("steps");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [completed, setCompleted] = useState(task.status === "done");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Floating Pickers
  const [openPicker, setOpenPicker] = useState<"status" | "priority" | null>(null);

  // Time Tracker
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Subtasks
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
    if (!tempTitle.trim()) return;
    setIsEditingTitle(false);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: tempTitle.trim() }),
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
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}`, title: newSubtaskText.trim(), completed: false },
    ]);
    setNewSubtaskText("");
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const deleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const currentStatus = STATUS_CONFIG.find((s) => s.id === (completed ? "done" : task.status || "inbox"));
  const currentPriority = PRIORITY_CONFIG[task.priority || "medium"] || PRIORITY_CONFIG.medium;

  const subDone = subtasks.filter((st) => st.completed).length;
  const subTotal = subtasks.length;
  const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;

  const timerProgress = Math.min((timerSeconds % 3600) / 3600, 1);
  const timerArcDash = timerProgress * 226.2;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdf9f2_0%,#f3ebdf_100%)] p-2 text-right" dir="rtl">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between py-2 px-1">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#8D7F72] hover:text-[#4A6741] transition-colors"
        >
          <ArrowRight className="w-4 h-4" /> همهٔ تسک‌ها
        </Link>

        <div className="flex items-center gap-2">
          {/* Quick Timer Indicator */}
          {isTimerRunning && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#4A6741]/10">
              <span className="w-2 h-2 rounded-full bg-[#4A6741] animate-pulse" />
              <span className="text-[10px] font-black font-mono text-[#4A6741]">
                {formatSeconds(timerSeconds)}
              </span>
            </div>
          )}

          <button
            onClick={handleToggle}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
              completed ? "bg-[#4A6741] border-[#4A6741] text-white" : "border-[#D6CFC3] hover:border-[#4A6741]"
            }`}
          >
            {completed && <Check className="w-3.5 h-3.5" />}
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded-lg cursor-pointer"
              >
                حذف
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 text-[9px] font-bold text-[#8D7F72] cursor-pointer"
              >
                نه
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 text-[#8D7F72] hover:text-red-500 rounded cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="px-2 pt-2 pb-2">
        <div className="flex items-start gap-2.5">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 mt-1.5 cursor-pointer"
            style={{ backgroundColor: currentStatus?.dot || "#9D978B" }}
            onClick={() => setOpenPicker(openPicker === "status" ? null : "status")}
          />

          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                className="w-full text-lg font-black bg-transparent text-[#2D3025] focus:outline-none"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className={`text-lg font-black cursor-text leading-8 ${
                  completed ? "line-through text-[#8D7F72]" : "text-[#2D3025]"
                }`}
              >
                {tempTitle}
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Right Metadata Panel + Left Notes & Tabs */}
      <div className="flex flex-col lg:flex-row gap-4 pt-2">
        {/* Right Column: Metadata Panel */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-[#E6DFD3] overflow-hidden shadow-xs">
            <MetaRow
              icon={<Circle className="w-3.5 h-3.5" />}
              label="وضعیت"
              onClick={() => setOpenPicker(openPicker === "status" ? null : "status")}
            >
              <Badge color={currentStatus?.dot || "#9D978B"}>{currentStatus?.label}</Badge>
            </MetaRow>

            <MetaRow
              icon={<Flag className="w-3.5 h-3.5" />}
              label="اولویت"
              onClick={() => setOpenPicker(openPicker === "priority" ? null : "priority")}
            >
              <Badge color={currentPriority.dot}>{currentPriority.label}</Badge>
            </MetaRow>

            <MetaDivider />

            <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="برنامه‌ریزی">
              <span className="text-[11px] font-bold text-[#2D3025]">
                {task.scheduledDate || "—"}
              </span>
            </MetaRow>

            <MetaRow icon={<Clock className="w-3.5 h-3.5" />} label="تخمین زمان">
              <span className="text-[11px] font-bold text-[#2D3025]">
                {task.estimatedMinutes ? `${task.estimatedMinutes} دقیقه` : "—"}
              </span>
            </MetaRow>

            <MetaDivider />

            {/* Proofs & Comments */}
            <div className="p-3 space-y-3">
              <ProofUploader entityType="task" entityId={task.id} />
              <CommentReactions entityType="task" entityId={task.id} />
            </div>
          </div>
        </div>

        {/* Left Column: Description & Subtabs */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Description */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DFD3] space-y-2 shadow-xs">
            <span className="text-[10px] font-black text-[#8D7F72] block">توضیحات و یادداشت‌ها</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={3}
              placeholder="توضیحات مربوط به این کار را بنویسید..."
              className="w-full text-[11px] font-bold p-3 rounded-xl border border-[#E6DFD3] bg-[#F9F6EE] focus:outline-none focus:border-[#4A6741] resize-none"
            />
          </div>

          {/* Sub-tab Bar */}
          <div className="flex items-center gap-1 border-b border-[#E6DFD3] pb-1">
            {[
              { id: "steps" as SubTab, label: "مراحل", icon: Layers, count: subTotal },
              { id: "time" as SubTab, label: "زمان‌سنج دایره‌ای", icon: Timer, count: null },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black transition-all border-b-2 cursor-pointer ${
                    subTab === tab.id
                      ? "border-[#4A6741] text-[#4A6741]"
                      : "border-transparent text-[#8D7F72] hover:text-[#2D3025]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count != null && tab.count > 0 && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#4A6741]/10 text-[#4A6741]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subtab Content */}
          <AnimatePresence mode="wait">
            {subTab === "steps" && (
              <motion.div key="steps" className="space-y-3">
                {subTotal > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 shrink-0">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E6DFD3" strokeWidth="2.5" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="#4A6741"
                          strokeWidth="2.5"
                          strokeDasharray={`${subPct * 0.9738} 97.38`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-[#2D3025]">
                        {subPct}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8D7F72]">
                      {subDone} از {subTotal} مرحله انجام شد
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E6DFD3]"
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
                      <button
                        onClick={() => deleteSubtask(st.id)}
                        className="p-1 text-[#8D7F72] hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="خرده‌کار جدید..."
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-[#E6DFD3] bg-white focus:outline-none focus:border-[#4A6741]"
                  />
                  <button
                    onClick={addSubtask}
                    disabled={!newSubtaskText.trim()}
                    className="p-2.5 bg-[#4A6741] text-white rounded-xl cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {subTab === "time" && (
              <motion.div key="time" className="bg-white p-6 rounded-3xl border border-[#E6DFD3] text-center space-y-4 shadow-xs">
                <div className="flex flex-col items-center gap-3">
                  {/* Circular Timer Ring */}
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

                  {/* Timer Controls */}
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
