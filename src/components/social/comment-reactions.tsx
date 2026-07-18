"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Flame, ThumbsUp, Zap, Heart, CheckCircle2, Sparkles, Plus, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_ICONS: { id: string; label: string; icon: LucideIcon; color: string }[] = [
  { id: "fire", label: "آتشی", icon: Flame, color: "text-orange-500" },
  { id: "cheer", label: "دمت گرم", icon: ThumbsUp, color: "text-blue-500" },
  { id: "clap", label: "آفرین", icon: Zap, color: "text-[#D6A94B]" },
  { id: "heart", label: "دوستت دارم", icon: Heart, color: "text-red-500" },
  { id: "done", label: "عالی", icon: CheckCircle2, color: "text-emerald-500" },
  { id: "party", label: "جشن", icon: Sparkles, color: "text-purple-500" },
];

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  userInfo: {
    fullName: string;
    avatarUrl?: string;
    color?: string;
  };
}

export interface ReactionGroup {
  kind: string;
  count: number;
  myReaction: boolean;
}

export function CommentReactions({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [reactions, setReactions] = useState<ReactionGroup[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!entityId) return;
    try {
      const res = await fetch(`/api/goals/${entityId}/engage`).then((r) => r.json());
      if (res?.comments) {
        setComments(
          res.comments.map((c: any) => ({
            id: c.c.id,
            body: c.c.body,
            createdAt: c.c.createdAt,
            userInfo: {
              fullName: c.name || "کاربر",
              color: c.color || "#4A6741",
            },
          }))
        );
      }
      if (res?.reactions) {
        setReactions(
          res.reactions.map((r: any) => ({
            kind: r.kind,
            count: Number(r.n) || 1,
            myReaction: (res.myReactions || []).includes(r.kind),
          }))
        );
      }
    } catch (err) {
      console.error("Fetch comments/reactions failed", err);
    }
  }, [entityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddComment = async () => {
    if (!newComment.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${entityId}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment", body: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment("");
        fetchData();
      }
    } catch (err) {
      console.error("Add comment failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReaction = async (kind: string) => {
    try {
      await fetch(`/api/goals/${entityId}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reaction", kind }),
      });
      fetchData();
    } catch (err) {
      console.error("Toggle reaction failed", err);
    }
  };

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-2 text-right" dir="rtl">
      {/* Reactions Bar with Lucide Icons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {REACTION_ICONS.map((r) => {
          const Icon = r.icon;
          const existing = reactions.find((rg) => rg.kind === r.id);
          const isMine = existing?.myReaction;
          const count = existing?.count || 0;

          return (
            <button
              key={r.id}
              onClick={() => handleToggleReaction(r.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                isMine
                  ? "bg-[#4A6741] text-white"
                  : "bg-[#F9F6EE] text-[#8D7F72] border border-[#E6DFD3] hover:border-[#4A6741]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isMine ? "text-white" : r.color}`} />
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Comments Toggle */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-[10px] font-black text-[#4A6741] cursor-pointer hover:underline flex items-center gap-1"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>دیدگاه‌ها</span>
          {comments.length > 0 && (
            <span className="bg-[#4A6741]/10 px-1.5 py-0.5 rounded-full text-[9px]">{comments.length}</span>
          )}
        </button>
        {totalReactions > 0 && <span className="text-[9px] text-[#8D7F72]">{totalReactions} واکنش ثبت شده</span>}
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2 pt-1"
          >
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="p-2.5 bg-[#F9F6EE] border border-[#E6DFD3] rounded-2xl">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                          style={{ background: c.userInfo.color || "#4A6741" }}
                        >
                          {c.userInfo.fullName[0]}
                        </span>
                        <span className="text-[10px] font-black text-[#2D3025]">{c.userInfo.fullName}</span>
                      </div>
                      <span className="text-[8px] text-[#8D7F72]">
                        {new Date(c.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#2D3025]">{c.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-[9px] text-[#8D7F72] italic">هنوز دیدگاهی ثبت نشده است.</p>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="دیدگاه خود را بنویسید..."
                className="flex-1 text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white focus:outline-none focus:border-[#4A6741]"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || saving}
                className="p-2.5 bg-[#4A6741] text-white rounded-xl cursor-pointer hover:opacity-90 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
