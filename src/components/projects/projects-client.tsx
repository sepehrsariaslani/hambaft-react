"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, CheckCircle, Clock, Trash2, Search, X, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProjectItem {
  id: string;
  title: string;
  goalId?: string | null;
  goalTitle?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  status: string;
  color: string;
  tasks: { id: string; title: string; status: string }[];
}

export function ProjectsClient({
  projects,
  areas,
  goals,
}: {
  projects: ProjectItem[];
  areas: { id: string; name: string; color: string }[];
  goals: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [pending, start] = useTransition();

  const filtered = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "completed" && p.status === "completed") ||
      (filterStatus === "active" && p.status !== "completed");
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = () => {
    if (!newTitle.trim()) return;
    start(async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          goalId: selectedGoalId || undefined,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setShowAddModal(false);
        router.refresh();
      }
    });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("آیا از حذف این پروژه مطمئن هستید؟")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ─── هدر ─── */}
      <div className="flex items-center justify-between anim-rise">
        <h1 className="display text-[22px] text-[#2D3025] flex items-center gap-2">
          <FolderKanban className="text-[#4A6741]" size={22} /> پروژه‌ها
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-9 px-3.5 rounded-xl bg-[#4A6741] text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={14} strokeWidth={2.6} /> پروژه جدید
        </button>
      </div>

      {/* ─── فیلتر و جستجو ─── */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-2xl border border-[#E6DFD3]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8D7F72] absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجوی پروژه..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-[#F9F6EE] border border-[#E6DFD3] rounded-xl focus:outline-none focus:border-[#4A6741]"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { id: "all", label: "همه" },
            { id: "active", label: "در حال اجرا" },
            { id: "completed", label: "تکمیل‌شده" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                filterStatus === s.id ? "bg-[#2D3025] text-white" : "bg-[#F9F6EE] text-[#8D7F72]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── کارت پروژه‌ها ─── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#E6DFD3] text-xs text-[#8D7F72]">
            پروژه‌ای یافت نشد
          </div>
        ) : (
          filtered.map((p) => {
            const doneTasks = p.tasks.filter((t) => t.status === "done").length;
            const totalTasks = p.tasks.length;
            const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

            return (
              <div key={p.id} className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-black text-[#2D3025]">{p.title}</h3>
                    {p.goalTitle && (
                      <span className="text-[9px] text-[#8D7F72] font-bold mt-0.5 flex items-center gap-1">
                        <Target className="w-3 h-3 text-[#4A6741] inline" />
                        <span>هدف مرتبط: {p.goalTitle}</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="p-1.5 text-[#8D7F72] hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-[#8D7F72]">
                    <span>پیشرفت تسک‌ها ({doneTasks} از {totalTasks})</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-[#E8ECE0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4A6741] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      p.status === "completed"
                        ? "bg-[#E8ECE0] text-[#4A6741]"
                        : "bg-[#F9F1D8] text-[#5A5A40]"
                    }`}
                  >
                    {p.status === "completed" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {p.status === "completed" ? "تکمیل‌شده" : "در حال اجرا"}
                  </span>

                  <Link
                    href={`/projects/${p.id}`}
                    className="text-[10px] font-black text-[#4A6741] hover:underline"
                  >
                    جزئیات پروژه ←
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal create project */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F6EE] border border-[#E6DFD3] rounded-3xl p-5 max-w-sm w-full text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#E6DFD3] pb-2">
                <h4 className="text-xs font-black text-[#2D3025]">تعریف پروژه جدید</h4>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full bg-white cursor-pointer">
                  <X className="w-4 h-4 text-[#8D7F72]" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-[#8D7F72] block mb-1">عنوان پروژه</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثلاً: راه‌اندازی کمپین تبلیغاتی"
                    className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#8D7F72] block mb-1">هدف مرتبط (اختیاری)</label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white"
                  >
                    <option value="">بدون هدف مرتبط</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateProject}
                  disabled={pending || !newTitle.trim()}
                  className="w-full py-3 bg-[#4A6741] text-white text-[10px] font-black rounded-2xl cursor-pointer hover:opacity-90 disabled:opacity-40"
                >
                  {pending ? "در حال ساخت..." : "ایجاد پروژه"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
