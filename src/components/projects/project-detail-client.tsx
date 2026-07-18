"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, CheckSquare, Square, Trash2, FolderKanban } from "lucide-react";
import { ProofUploader } from "@/components/social/proof-uploader";
import { CommentReactions } from "@/components/social/comment-reactions";

export function ProjectDetailClient({ project }: { project: any }) {
  const router = useRouter();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [pending, start] = useTransition();

  const doneCount = project.tasks.filter((t: any) => t.status === "done").length;
  const totalCount = project.tasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    start(async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          projectId: project.p.id,
        }),
      });
      if (res.ok) {
        setNewTaskTitle("");
        router.refresh();
      }
    });
  };

  const handleToggleTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle" }),
    });
    router.refresh();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-black text-[#8D7F72] hover:text-[#4A6741] transition-colors"
      >
        <ArrowRight size={14} /> همهٔ پروژه‌ها
      </Link>

      {/* Hero */}
      <div className="p-5 rounded-3xl bg-white border border-[#E6DFD3] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#4A6741] bg-[#E8ECE0] px-2.5 py-1 rounded-xl">
            📂 پروژه
          </span>
          {project.goalTitle && (
            <span className="text-[10px] text-[#8D7F72] font-bold">
              🎯 {project.goalTitle}
            </span>
          )}
        </div>

        <h1 className="text-xl font-black text-[#2D3025]">{project.p.title}</h1>

        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-[10px] font-bold text-[#8D7F72]">
            <span>پیشرفت تسک‌ها ({doneCount} از {totalCount})</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-[#E8ECE0] rounded-full overflow-hidden">
            <div className="h-full bg-[#4A6741] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-3">
        <h3 className="text-xs font-black text-[#2D3025] flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-[#4A6741]" /> تسک‌های پروژه
        </h3>

        <div className="space-y-2">
          {project.tasks.length === 0 ? (
            <p className="text-[10px] text-[#8D7F72] italic text-center py-4">تسکی تعریف نشده است</p>
          ) : (
            project.tasks.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-[#F9F6EE] rounded-2xl border border-[#E6DFD3]"
              >
                <button
                  onClick={() => handleToggleTask(t.id)}
                  className="flex items-center gap-2 text-right flex-1 cursor-pointer"
                >
                  {t.status === "done" ? (
                    <CheckSquare className="w-4 h-4 text-[#4A6741]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#8D7F72]" />
                  )}
                  <span
                    className={`text-[11px] font-bold ${
                      t.status === "done" ? "line-through text-[#8D7F72]" : "text-[#2D3025]"
                    }`}
                  >
                    {t.title}
                  </span>
                </button>
                <button onClick={() => handleDeleteTask(t.id)} className="p-1 text-[#8D7F72] hover:text-red-500 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Add Task */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="تسک جدید در پروژه..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            className="flex-1 text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-[#F9F6EE]"
          />
          <button
            onClick={handleAddTask}
            disabled={pending || !newTaskTitle.trim()}
            className="px-4 bg-[#4A6741] text-white rounded-xl text-[10px] font-black cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Proofs */}
      <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3]">
        <ProofUploader entityType="project" entityId={project.p.id} />
      </div>

      {/* Comments & Reactions */}
      <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3]">
        <CommentReactions entityType="project" entityId={project.p.id} />
      </div>
    </div>
  );
}
