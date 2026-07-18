"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Trash2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NotificationItem {
  n: {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
  };
  actorName?: string | null;
  actorColor?: string | null;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications").then((r) => r.json());
      if (Array.isArray(res)) setNotifications(res);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read_all" }),
      });
      fetchNotifications();
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  const filtered = notifications.filter((item) => (filter === "unread" ? !item.n.read : true));

  if (loading) return <div className="text-center py-10 text-xs text-[#8D7F72]">در حال بارگذاری اعلان‌ها...</div>;

  return (
    <div className="space-y-3 text-right" dir="rtl">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
              filter === "all" ? "bg-[#2D3025] text-white" : "bg-[#F9F6EE] text-[#8D7F72]"
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
              filter === "unread" ? "bg-[#2D3025] text-white" : "bg-[#F9F6EE] text-[#8D7F72]"
            }`}
          >
            خوانده‌نشده
          </button>
        </div>

        <button
          onClick={markAllRead}
          className="text-[10px] font-black text-[#4A6741] cursor-pointer hover:underline flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" /> خوانده‌شدن همه
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#8D7F72]">اعلان تازه‌ای وجود ندارد</div>
        ) : (
          filtered.map(({ n, actorName, actorColor }) => (
            <motion.div
              key={n.id}
              onClick={() => markSingleRead(n.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                n.read ? "bg-white border-[#E6DFD3]" : "bg-[#E8ECE0]/60 border-[#4A6741]/40"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-[#2D3025]">{n.title}</span>
                <span className="text-[8px] text-[#8D7F72]">
                  {new Date(n.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
              {n.body && <p className="text-[10px] text-[#8D7F72] mt-0.5">{n.body}</p>}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
