"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, UserX, Flag, Settings } from "lucide-react";

export function ReportModal({
  reportedUser,
  onClose,
  onSubmitted,
}: {
  reportedUser: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState("other");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const REASONS = [
    { value: "spam", label: "هرزنامه و پیام تبلیغاتی" },
    { value: "harassment", label: "آزار و اذیت" },
    { value: "inappropriate_content", label: "محتوای نامناسب" },
    { value: "misinformation", label: "اطلاعات نادرست" },
    { value: "other", label: "سایر موارد" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_user: reportedUser,
          reason,
          description,
        }),
      });
      onSubmitted();
      onClose();
    } catch (err) {
      console.error("Report submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 text-right border border-[#E6DFD3]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h3 className="text-sm font-black text-[#2D3025] flex items-center gap-1.5">
          <Flag className="w-4 h-4 text-[#E26645]" /> ثبت گزارش تخلف
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-black text-[#8D7F72] block mb-1">دلیل گزارش</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-[10px] font-bold bg-[#F9F6EE] border border-[#E6DFD3] rounded-xl focus:outline-none focus:border-[#4A6741]"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-[#8D7F72] block mb-1">توضیحات تکمیلی (اختیاری)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-[10px] font-bold bg-[#F9F6EE] border border-[#E6DFD3] rounded-xl focus:outline-none focus:border-[#4A6741] h-20 resize-none"
              placeholder="شرح جزئیات..."
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#E6DFD3] text-[10px] font-black text-[#8D7F72] rounded-xl cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#E26645] text-white text-[10px] font-black rounded-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? "در حال ارسال..." : "ارسال گزارش"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function BlockedList() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    try {
      const res = await fetch("/api/partners/block").then((r) => r.json());
      setBlockedUsers(res?.blocked_users || []);
    } catch (e) {
      console.error("Failed to fetch blocked users", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = async (userId: string) => {
    try {
      await fetch(`/api/partners/block?userId=${userId}`, { method: "DELETE" });
      fetchBlocked();
    } catch (e) {
      console.error("Unblock failed", e);
    }
  };

  if (loading) return <div className="text-center py-6 text-xs text-[#8D7F72]">در حال دریافت لیست...</div>;

  if (blockedUsers.length === 0) {
    return <div className="text-center py-8 text-[#8D7F72] text-xs">هیچ کاربر مسدودی وجود ندارد.</div>;
  }

  return (
    <div className="space-y-2">
      {blockedUsers.map((b) => (
        <div key={b.block_id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E6DFD3]">
          <div className="w-8 h-8 rounded-full bg-[#E8ECE0] flex items-center justify-center text-sm font-black text-[#4A6741]">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-black text-[#2D3025] truncate">
              {b.user_info?.fullName || b.user_info?.email}
            </div>
            <div className="text-[9px] text-[#8D7F72]">{b.reason}</div>
          </div>
          <button
            onClick={() => handleUnblock(b.user_info?.id || b.user_info?.email)}
            className="px-3 py-1 text-[9px] font-black text-[#4A6741] bg-[#E8ECE0] rounded-xl cursor-pointer hover:bg-[#DDE2D5]"
          >
            رفع مسدودیت
          </button>
        </div>
      ))}
    </div>
  );
}

function MyReportsList() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((res) => setReports(res?.reports || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-6 text-xs text-[#8D7F72]">در حال دریافت گزارش‌ها...</div>;

  if (reports.length === 0) {
    return <div className="text-center py-8 text-[#8D7F72] text-xs">گزارشی ثبت نکرده‌اید.</div>;
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div key={r.id} className="p-3 rounded-2xl bg-white border border-[#E6DFD3]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
              {r.status}
            </span>
            <span className="text-[10px] font-black text-[#2D3025]">{r.reason_label || r.reason}</span>
          </div>
          <div className="text-[9px] text-[#8D7F72]">
            {r.reported_user_info?.fullName} • {new Date(r.created_at).toLocaleDateString("fa-IR")}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminPanel() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/reports").then((r) => r.json()),
    ])
      .then(([statsRes, reportsRes]) => {
        if (statsRes?.data) setStats(statsRes.data);
        if (reportsRes?.data?.reports) setReports(reportsRes.data.reports);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-xs text-[#8D7F72]">در حال بارگذاری پنل مدیریت...</div>;

  const statCards = [
    { label: "کاربران", value: stats.users || 0, icon: "👥" },
    { label: "گزارش‌ها", value: stats.reports_total || 0, icon: "📋" },
    { label: "مسدودشده‌ها", value: stats.blocks_total || 0, icon: "🚫" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((s) => (
          <div key={s.label} className="p-3 rounded-2xl bg-white border border-[#E6DFD3] text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="text-sm font-black text-[#2D3025]">{s.value}</div>
            <div className="text-[9px] text-[#8D7F72] font-bold">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-1">
        <h4 className="text-[11px] font-black text-[#2D3025]">گزارش‌های اخیر</h4>
        {reports.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#8D7F72]">گزارشی ثبت نشده است</div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="p-3 rounded-2xl bg-white border border-[#E6DFD3] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#2D3025]">{r.reason}</span>
                <span className="text-[8px] text-[#8D7F72]">
                  {new Date(r.created_at).toLocaleDateString("fa-IR")}
                </span>
              </div>
              <p className="text-[9px] text-[#8D7F72]">
                گزارش‌دهنده: {r.reporter_info?.fullName} ← گزارش‌شده: {r.reported_user_info?.fullName}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ModerationPanel() {
  const [activeTab, setActiveTab] = useState<"blocked" | "reports" | "admin">("blocked");

  return (
    <div className="space-y-3 text-right" dir="rtl">
      {/* Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-bl from-[#2D3025] to-[#4A5A3F] text-white flex items-center justify-between">
        <div>
          <div className="text-[10px] text-white/70 font-bold">ایمنی و نظارت</div>
          <div className="text-base font-black">مدیریت کاربران و گزارش‌ها</div>
        </div>
        <Shield className="w-8 h-8 text-white/80" />
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F9F6EE] p-1 rounded-2xl border border-[#E6DFD3] gap-1">
        <button
          onClick={() => setActiveTab("blocked")}
          className={`flex-1 py-2 text-[10px] font-black rounded-xl cursor-pointer transition-all ${
            activeTab === "blocked" ? "bg-[#2D3025] text-white" : "text-[#8D7F72]"
          }`}
        >
          🚫 مسدودشده‌ها
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-2 text-[10px] font-black rounded-xl cursor-pointer transition-all ${
            activeTab === "reports" ? "bg-[#2D3025] text-white" : "text-[#8D7F72]"
          }`}
        >
          📋 گزارش‌ها
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex-1 py-2 text-[10px] font-black rounded-xl cursor-pointer transition-all ${
            activeTab === "admin" ? "bg-[#2D3025] text-white" : "text-[#8D7F72]"
          }`}
        >
          ⚙️ پنل ادمین
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "blocked" && <BlockedList key="blocked" />}
        {activeTab === "reports" && <MyReportsList key="reports" />}
        {activeTab === "admin" && <AdminPanel key="admin" />}
      </AnimatePresence>
    </div>
  );
}
