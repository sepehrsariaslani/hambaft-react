"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Flag, Trash2, Calendar, FolderKanban, Target, Layers } from "lucide-react";
import { ProofUploader } from "@/components/social/proof-uploader";
import { CommentReactions } from "@/components/social/comment-reactions";

export function TaskDetailClient({ task }: { task: any }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(task.status === "done");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [pending, start] = useTransition();

  const handleToggle = async () => {
    const next = !completed;
    setCompleted(next);
    start(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      router.refresh();
    });
  };

  const handleSaveDescription = async () => {
    start(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این تسک مطمئن هستید؟")) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    router.push("/tasks");
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-xs font-black text-[#8D7F72] hover:text-[#4A6741] transition-colors"
      >
        <ArrowRight size={14} /> همهٔ تسک‌ها
      </Link>

      {/* Hero */}
      <div className="p-5 rounded-3xl bg-white border border-[#E6DFD3] space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
              completed ? "bg-[#E8ECE0] text-[#4A6741]" : "bg-[#F9F6EE] text-[#8D7F72]"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {completed ? "تکمیل‌شده" : "در حال انجام"}
          </button>

          <button onClick={handleDelete} className="p-1 text-[#8D7F72] hover:text-red-500 cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <h1 className={`text-xl font-black ${completed ? "line-through text-[#8D7F72]" : "text-[#2D3025]"}`}>
          {task.title}
        </h1>

        {/* Priority & Date Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[10px] font-bold text-[#8D7F72] bg-[#F9F6EE] px-2.5 py-1 rounded-xl flex items-center gap-1">
            <Flag className="w-3 h-3 text-[#E26645]" /> اولویت: {priority}
          </span>
          {task.scheduledDate && (
            <span className="text-[10px] font-bold text-[#8D7F72] bg-[#F9F6EE] px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#4A6741]" /> برنامه‌ریزی: {task.scheduledDate}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="text-[10px] font-bold text-[#8D7F72] bg-[#F9F6EE] px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#D6A94B]" /> {task.estimatedMinutes} دقیقه
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-2">
        <label className="text-[10px] font-black text-[#8D7F72] block">توضیحات و جزئیات</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleSaveDescription}
          rows={3}
          placeholder="شرح کار و یادداشت‌های مربوطه..."
          className="w-full text-[11px] font-bold p-3 rounded-2xl border border-[#E6DFD3] bg-[#F9F6EE] focus:outline-none focus:border-[#4A6741] resize-none"
        />
      </div>

      {/* Proofs */}
      <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3]">
        <ProofUploader entityType="task" entityId={task.id} />
      </div>

      {/* Comments & Reactions */}
      <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3]">
        <CommentReactions entityType="task" entityId={task.id} />
      </div>
    </div>
  );
}
