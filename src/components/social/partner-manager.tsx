"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, Users, X, Check, Trash2, Link2, Copy, Send, ChevronDown, ChevronUp, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NudgeSender } from "./nudge-sender";

export interface PartnerConnection {
  id: string;
  partner: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    color: string;
    level: number;
    points: number;
    streak: number;
  };
  sharedGoalsCount: number;
}

export function PartnerManager({ goalId, onPartnerAdded }: { goalId?: string; onPartnerAdded?: () => void }) {
  const [partners, setPartners] = useState<PartnerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partners/invite").then((r) => r.json());
      if (res?.data?.partners) {
        setPartners(res.data.partners);
      }
    } catch (err) {
      console.error("Fetch partners failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInvite = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/partners/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: inviteIdentifier.trim(),
          goal_id: goalId || undefined,
          message: inviteMessage || undefined,
        }),
      });
      const data = await res.json();
      if (data?.invite_code) {
        setGeneratedCode(data.invite_code);
      } else if (res.ok) {
        setInviteIdentifier("");
        setInviteMessage("");
        setInviteModalOpen(false);
        fetchData();
        onPartnerAdded?.();
      }
    } catch (err) {
      console.error("Invite failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePartner = async (connectionId: string) => {
    if (!confirm("آیا از حذف ارتباط با این پارتنر مطمئن هستید؟")) return;
    try {
      await fetch(`/api/partners/invite?id=${connectionId}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Remove partner failed", err);
    }
  };

  const handleShareGoal = async (partnerUserId: string) => {
    if (!goalId) return;
    setSaving(true);
    try {
      await fetch(`/api/goals/${goalId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: partnerUserId }),
      });
      setShareModalOpen(false);
      onPartnerAdded?.();
    } catch (err) {
      console.error("Share goal failed", err);
    } finally {
      setSaving(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
  };

  return (
    <div className="space-y-3 text-right">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h5 className="text-[11px] font-black text-[#4A6741] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>پارتنرهای هم‌مسیر</span>
          {partners.length > 0 && (
            <span className="text-[9px] bg-[#4A6741]/10 px-1.5 py-0.5 rounded-full">{partners.length}</span>
          )}
        </h5>
        <div className="flex items-center gap-2">
          {goalId && partners.length > 0 && (
            <button
              onClick={() => setShareModalOpen(true)}
              className="text-[9px] font-black text-[#E26645] cursor-pointer hover:opacity-80 flex items-center gap-1"
            >
              <Link2 className="w-3 h-3" /> اشتراک هدف
            </button>
          )}
          <button
            onClick={() => setInviteModalOpen(true)}
            className="text-[9px] font-black text-[#4A6741] cursor-pointer hover:opacity-80 flex items-center gap-1"
          >
            <UserPlus className="w-3 h-3" /> دعوت پارتنر
          </button>
        </div>
      </div>

      {/* Partners List */}
      {partners.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setExpandedSection(!expandedSection)}
            className="w-full flex items-center justify-between text-[10px] font-black text-[#2D3025]"
          >
            <span>پارتنرهای فعال ({partners.length})</span>
            {expandedSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {expandedSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-1.5"
              >
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="group flex items-center gap-2 p-2.5 bg-white border border-[#E6DFD3] rounded-2xl text-right"
                  >
                    <div
                      className="w-8 h-8 rounded-xl text-white font-black text-xs shrink-0 flex items-center justify-center"
                      style={{ background: p.partner.color || "#4A6741" }}
                    >
                      {p.partner.fullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-[#2D3025] truncate">{p.partner.fullName}</p>
                      <p className="text-[8px] text-[#8D7F72] flex items-center gap-1">
                        سطح {p.partner.level} • {p.partner.streak} <Flame className="w-3 h-3 text-orange-500 inline" /> استریک
                      </p>
                    </div>
                    <NudgeSender partnerId={p.partner.id} partnerName={p.partner.fullName} />
                    <button
                      onClick={() => handleRemovePartner(p.id)}
                      className="p-1 rounded text-[#8D7F72] hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {partners.length === 0 && !loading && (
        <p className="text-[9px] text-[#8D7F72]">
          هنوز پارتنری نداری.{" "}
          <button
            onClick={() => setInviteModalOpen(true)}
            className="text-[#4A6741] font-black cursor-pointer hover:underline"
          >
            همین حالا یک نفر را دعوت کن!
          </button>
        </p>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F6EE] border border-[#E6DFD3] rounded-3xl p-5 max-w-sm w-full text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#E6DFD3] pb-2">
                <h4 className="text-xs font-black text-[#2D3025] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#4A6741]" /> دعوت پارتنر هم‌مسیر
                </h4>
                <button
                  onClick={() => {
                    setInviteModalOpen(false);
                    setGeneratedCode(null);
                  }}
                  className="p-1 rounded-full bg-white cursor-pointer"
                >
                  <X className="w-4 h-4 text-[#8D7F72]" />
                </button>
              </div>

              {generatedCode ? (
                <div className="space-y-3 text-center">
                  <p className="text-[10px] text-[#8D7F72]">کد اختصاصی دعوت شما:</p>
                  <div className="bg-[#E8ECE0] p-4 rounded-2xl border border-[#E6DFD3]">
                    <p className="text-2xl font-black text-[#4A6741] tracking-widest font-mono">{generatedCode}</p>
                  </div>
                  <p className="text-[9px] text-[#8D7F72]">این کد را برای پارتنر خود ارسال کنید.</p>
                  <button
                    onClick={() => copyCode(generatedCode)}
                    className="px-4 py-2.5 bg-[#4A6741] text-white text-[10px] font-black rounded-2xl cursor-pointer hover:opacity-90 flex items-center gap-1.5 mx-auto"
                  >
                    <Copy className="w-3.5 h-3.5" /> کپی کد دعوت
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-[#8D7F72] block mb-1">
                      شماره موبایل یا شناسه کاربر
                    </label>
                    <input
                      type="text"
                      value={inviteIdentifier}
                      onChange={(e) => setInviteIdentifier(e.target.value)}
                      placeholder="مثلاً: 09120000000"
                      className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#8D7F72] block mb-1">پیام همراه (اختیاری)</label>
                    <input
                      type="text"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="بیا با هم اهدافمون رو پیش ببریم!"
                      className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white"
                    />
                  </div>
                  <button
                    onClick={handleInvite}
                    disabled={saving}
                    className="w-full py-3 bg-[#4A6741] text-white text-[10px] font-black rounded-2xl cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {saving ? "در حال ارسال..." : inviteIdentifier.trim() ? "افزودن پارتنر" : "تولید کد دعوت"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Goal Modal */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F6EE] border border-[#E6DFD3] rounded-3xl p-5 max-w-sm w-full text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#E6DFD3] pb-2">
                <h4 className="text-xs font-black text-[#2D3025] flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-[#4A6741]" /> اشتراک هدف با پارتنر
                </h4>
                <button onClick={() => setShareModalOpen(false)} className="p-1 rounded-full bg-white cursor-pointer">
                  <X className="w-4 h-4 text-[#8D7F72]" />
                </button>
              </div>
              <p className="text-[10px] text-[#8D7F72]">پارتنری که می‌خواهید این هدف را با او شریک شوید انتخاب کنید:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {partners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleShareGoal(p.partner.id)}
                    className="w-full flex items-center gap-2 p-2.5 bg-white border border-[#E6DFD3] rounded-2xl text-right cursor-pointer hover:border-[#4A6741] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg text-white font-black text-xs shrink-0 flex items-center justify-center"
                      style={{ background: p.partner.color || "#4A6741" }}
                    >
                      {p.partner.fullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-[#2D3025] truncate">{p.partner.fullName}</p>
                    </div>
                    <Link2 className="w-3.5 h-3.5 text-[#4A6741]" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
