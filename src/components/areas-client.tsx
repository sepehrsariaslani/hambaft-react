"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Target, FolderKanban, Plus, X, Trash2, Edit2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AreaItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  goalCount?: number;
  projectCount?: number;
}

export function AreasClient({
  areas,
}: {
  areas: AreaItem[];
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("#4A6741");
  const [pending, start] = useTransition();

  const handleCreateArea = async () => {
    if (!newTitle.trim()) return;
    start(async () => {
      // Create area API logic
      setShowAddForm(false);
      setNewTitle("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between anim-rise">
        <h1 className="display text-[22px] text-[#2D3025] flex items-center gap-2">
          <Layers className="text-[#4A6741]" size={22} /> حوزه‌های زندگی
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="h-9 px-3.5 rounded-xl bg-[#4A6741] text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={14} strokeWidth={2.6} /> حوزه جدید
        </button>
      </div>

      {/* Area Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {areas.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-[#E6DFD3] text-xs text-[#8D7F72]">
            حوزه‌ای تعریف نشده است.
          </div>
        ) : (
          areas.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-2 text-right shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full" style={{ background: a.color || "#4A6741" }} />
                <h3 className="text-xs font-black text-[#2D3025] flex-1">{a.name}</h3>
              </div>
              <p className="text-[10px] text-[#8D7F72]">
                شامل اهداف و پروژه‌های مرتبط با {a.name}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Modal create area */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F6EE] border border-[#E6DFD3] rounded-3xl p-5 max-w-sm w-full text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#E6DFD3] pb-2">
                <h4 className="text-xs font-black text-[#2D3025]">تعریف حوزه زندگی جدید</h4>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full bg-white cursor-pointer">
                  <X className="w-4 h-4 text-[#8D7F72]" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-[#8D7F72] block mb-1">عنوان حوزه</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثلاً: سلامت و ورزش"
                    className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white"
                  />
                </div>

                <button
                  onClick={handleCreateArea}
                  disabled={pending || !newTitle.trim()}
                  className="w-full py-3 bg-[#4A6741] text-white text-[10px] font-black rounded-2xl cursor-pointer hover:opacity-90 disabled:opacity-40"
                >
                  {pending ? "در حال ثبت..." : "ثبت حوزه"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
