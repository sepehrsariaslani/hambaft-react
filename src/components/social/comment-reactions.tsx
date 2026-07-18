"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_EMOJIS = ["🔥", "👏", "💪", "❤️", "✅", "🎉"];

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
  emoji: string;
  count: number;
  myReaction: boolean;
}

export function CommentReactions({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [reactions, setReactions] = useState<ReactionGroup[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const [commentsRes, reactionsRes] = await Promise.all([
        fetch(`/api/goals/${entityId}/engage`).then((r) => r.json()),
        fetch(`/api/goals/${entityId}/engage`).then((r) => r.json()),
      ]);
      if (commentsRes?.comments) {
        setComments(
          commentsRes.comments.map((c: any) => ({
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
      if (reactionsRes?.reactions) {
        setReactions(
          reactionsRes.reactions.map((r: any) => ({
            emoji: r.kind === "cheer" ? "👏" : r.kind === "fire" ? "🔥" : r.kind === "clap" ? "💪" : "❤️",
            count: Number(r.n) || 1,
            myReaction: (reactionsRes.myReactions || []).includes(r.kind),
          }))
        );
      }
    } catch (err) {
      console.error("Fetch comments/reactions failed", err);
    } finally {
      setLoading(false);
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
      const reactionKind = kind === "👏" ? "cheer" : kind === "🔥" ? "fire" : kind === "💪" ? "clap" : "heart";
      await fetch(`/api/goals/${entityId}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reaction", kind: reactionKind }),
      });
      fetchData();
    } catch (err) {
      console.error("Toggle reaction failed", err);
    }
  };

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-2 text-right">
      {/* Reactions bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {reactions.map((r) => (
          <button
            key={r.emoji}
            onClick={() => handleToggleReaction(r.emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
              r.myReaction
                ? "bg-[#4A6741]/20 text-[#4A6741] border border-[#4A6741]/40"
                : "bg-[#E6DFD3]/40 text-[#8D7F72] border border-transparent hover:border-[#E6DFD3]"
            }`}
          >
            <span>{r.emoji}</span>
            <span>{r.count}</span>
          </button>
        ))}
        {/* Add reaction picker */}
        <div className="relative group">
          <button className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#8D7F72] cursor-pointer hover:bg-[#E6DFD3]/40 border border-dashed border-[#E6DFD3]">
            +😊
          </button>
          <div className="absolute bottom-full right-0 mb-1 hidden group-hover:flex bg-white dark:bg-[#20241A] border border-[#E6DFD3] rounded-2xl p-1.5 shadow-lg z-10 gap-1">
            {REACTION_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => handleToggleReaction(e)}
                className="w-7 h-7 flex items-center justify-center text-sm cursor-pointer hover:bg-[#E6DFD3]/40 rounded-xl transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comments toggle button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-[10px] font-black text-[#4A6741] cursor-pointer hover:opacity-80 flex items-center gap-1"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>دیدگاه‌ها</span>
          {comments.length > 0 && (
            <span className="bg-[#4A6741]/10 px-1.5 py-0.5 rounded-full text-[9px]">{comments.length}</span>
          )}
        </button>
        {totalReactions > 0 && <span className="text-[9px] text-[#8D7F72]">{totalReactions} واکنش</span>}
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
                  <div key={c.id} className="p-2 bg-white dark:bg-[#20241A] border border-[#E6DFD3]/40 rounded-xl">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                          style={{ background: c.userInfo.color || "#4A6741" }}
                        >
                          {c.userInfo.fullName[0]}
                        </span>
                        <span className="text-[10px] font-black text-[#2D3025] dark:text-[#E8ECE0]">
                          {c.userInfo.fullName}
                        </span>
                      </div>
                      <span className="text-[8px] text-[#8D7F72]">
                        {new Date(c.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#3D3D3D] dark:text-[#D6CFC3]">{c.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-[9px] text-[#8D7F72] italic">هنوز دیدگاهی ثبت نشده است.</p>
              )}
            </div>

            {/* Add comment input */}
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
                className="flex-1 text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white dark:bg-[#20241A] focus:outline-none focus:border-[#4A6741]"
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
