"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Camera, ImagePlus, X, Check, Trash2, Upload, FileText, Play, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProofUploadItem {
  id: string;
  mediaUrl: string;
  mediaType: "photo" | "video" | "text";
  caption?: string;
  reflectionNote?: string;
  isMine?: boolean;
}

export function ProofUploader({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [proofs, setProofs] = useState<ProofUploadItem[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ base64: string; name: string; type: "photo" | "video" } | null>(null);
  const [caption, setCaption] = useState("");
  const [reflection, setReflection] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchProofs = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proofs?targetType=${entityType}&targetId=${entityId}`).then((r) => r.json());
      if (res?.proofs) {
        setProofs(
          res.proofs.map((p: any) => ({
            id: p.id,
            mediaUrl: p.mediaUrl,
            mediaType: p.mediaType,
            caption: p.caption,
            reflectionNote: p.reflectionNote,
            isMine: p.isMine,
          }))
        );
      }
    } catch (err) {
      console.error("Fetch proofs failed", err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mediaType: "photo" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = mediaType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(mediaType === "video" ? "حجم ویدیو نباید بیشتر از ۱۰MB باشد" : "حجم عکس نباید بیشتر از ۱۰MB باشد");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedFile({ base64, name: file.name, type: mediaType });
      if (mediaType === "photo") {
        setPreviewUrl(base64);
      } else {
        setPreviewUrl(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile && !reflection.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: entityType,
          targetId: entityId,
          caption,
          reflectionNote: reflection,
          mediaUrl: selectedFile?.base64 || "text_proof",
          mediaType: selectedFile?.type || "photo",
        }),
      });

      if (res.ok) {
        closeModal();
        await fetchProofs();
      }
    } catch (err) {
      console.error("Upload proof failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (proofId: string) => {
    if (!confirm("آیا از حذف این اثبات مطمئن هستید؟")) return;
    try {
      await fetch(`/api/proofs?id=${proofId}`, { method: "DELETE" });
      await fetchProofs();
    } catch (err) {
      console.error("Delete proof failed", err);
    }
  };

  const closeModal = () => {
    setUploadModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    setReflection("");
  };

  const hasProofs = proofs.length > 0;

  return (
    <div className="space-y-2 text-right">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h5 className="text-[10px] font-black text-[#E26645] flex items-center gap-1">
          <Camera className="w-3.5 h-3.5" />
          <span>اثبات پیشرفت</span>
          {hasProofs && <span className="text-[9px] bg-[#E26645]/10 px-1.5 py-0.5 rounded-full">{proofs.length}</span>}
        </h5>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="text-[9px] font-black text-[#E26645] cursor-pointer hover:opacity-80 flex items-center gap-1"
        >
          <Upload className="w-3 h-3" /> بارگذاری
        </button>
      </div>

      {/* Proofs preview */}
      {hasProofs && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-[9px] font-bold text-[#8D7F72]"
          >
            <span>{proofs.length} اثبات ثبت‌شده</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {proofs.map((p) => (
                    <div
                      key={p.id}
                      className="group relative rounded-xl overflow-hidden border border-[#E6DFD3] bg-white aspect-square"
                    >
                      {p.mediaType === "photo" && p.mediaUrl && p.mediaUrl !== "text_proof" ? (
                        <img src={p.mediaUrl} alt={p.caption || ""} className="w-full h-full object-cover" />
                      ) : p.mediaType === "video" ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#E8ECE0]">
                          <Play className="w-5 h-5 text-[#4A6741]" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#F9F6EE] p-2 text-[8px] text-[#2D3025] text-center line-clamp-3">
                          {p.reflectionNote || p.caption || "تأمل"}
                        </div>
                      )}
                      {p.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                          <p className="text-[7px] text-white truncate">{p.caption}</p>
                        </div>
                      )}
                      {p.isMine && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F6EE] border border-[#E6DFD3] rounded-3xl p-5 max-w-sm w-full text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#E6DFD3] pb-2">
                <h4 className="text-xs font-black text-[#2D3025] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#E26645]" /> بارگذاری اثبات پیشرفت
                </h4>
                <button onClick={closeModal} className="p-1 rounded-full bg-white cursor-pointer">
                  <X className="w-4 h-4 text-[#8D7F72]" />
                </button>
              </div>

              {/* Preview image */}
              {previewUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-[#E6DFD3] max-h-40">
                  <img src={previewUrl} alt="پیش‌نمایش" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* File Select */}
              {!selectedFile && (
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "photo")}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "video")}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 bg-[#E8ECE0] border border-[#E6DFD3] rounded-2xl cursor-pointer hover:opacity-90 flex flex-col items-center gap-1"
                  >
                    <ImagePlus className="w-5 h-5 text-[#4A6741]" />
                    <span className="text-[9px] font-black text-[#4A6741]">عکس</span>
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="flex-1 py-3 bg-[#FDE8E3] border border-[#E6DFD3] rounded-2xl cursor-pointer hover:opacity-90 flex flex-col items-center gap-1"
                  >
                    <Camera className="w-5 h-5 text-[#E26645]" />
                    <span className="text-[9px] font-black text-[#E26645]">ویدیو</span>
                  </button>
                  <button
                    onClick={() => setSelectedFile({ base64: "", name: "text", type: "photo" })}
                    className="flex-1 py-3 bg-white border border-[#E6DFD3] rounded-2xl cursor-pointer hover:opacity-90 flex flex-col items-center gap-1"
                  >
                    <FileText className="w-5 h-5 text-[#8D7F72]" />
                    <span className="text-[9px] font-black text-[#8D7F72]">فقط متن</span>
                  </button>
                </div>
              )}

              {/* Inputs */}
              <div>
                <label className="text-[10px] font-black text-[#8D7F72] block mb-1">کپشن (اختیاری)</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="مثلاً: تمرین امروز تکمیل شد 💪"
                  className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#8D7F72] block mb-1">تأمل و یادداشت (اختیاری)</label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={2}
                  placeholder="چه حس یا تجربه‌ای داشتی؟"
                  className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white resize-none"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={saving || (!selectedFile && !reflection.trim())}
                className="w-full py-3 bg-[#E26645] text-white text-[10px] font-black rounded-2xl cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {saving ? "در حال ارسال..." : "ثبت اثبات"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
