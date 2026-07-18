"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Plus, Trash2,
  Building2, CreditCard, PieChart, Coins, Scale, Repeat, ShieldCheck, FileText, ChevronDown, Check, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FinanceClient({
  transactions,
  bankAccounts,
  debts,
  assets,
  installments,
  subscriptions,
}: {
  transactions: any[];
  bankAccounts: any[];
  debts: any[];
  assets: any[];
  installments: any[];
  subscriptions: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "accounts" | "assets">("overview");
  const [showAddTx, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("food");
  const [txDesc, setTxDesc] = useState("");
  const [pending, start] = useTransition();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  const handleCreateTx = () => {
    const amt = Number(txAmount);
    if (!amt || amt <= 0) return;

    start(async () => {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: txType,
          amount: amt,
          category: txCategory,
          description: txDesc.trim(),
        }),
      });

      if (res.ok) {
        setTxAmount("");
        setTxDesc("");
        setShowAddModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between anim-rise">
        <h1 className="display text-[22px] text-[#2D3025] flex items-center gap-2">
          <Wallet className="text-[#4A6741]" size={22} /> مدیریت امور مالی
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-9 px-3.5 rounded-xl bg-[#E26645] text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={14} strokeWidth={2.6} /> تراکنش جدید
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E6DFD3] text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[#4A6741]">
            <TrendingUp size={16} />
            <span className="text-[9px] font-black text-[#8D7F72]">کل درآمد</span>
          </div>
          <p className="text-sm font-black text-[#2D3025] font-mono">{totalIncome.toLocaleString("fa-IR")}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E6DFD3] text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[#E26645]">
            <TrendingDown size={16} />
            <span className="text-[9px] font-black text-[#8D7F72]">کل هزینه</span>
          </div>
          <p className="text-sm font-black text-[#2D3025] font-mono">{totalExpense.toLocaleString("fa-IR")}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E6DFD3] text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-[#2D3025]">
            <Building2 size={16} />
            <span className="text-[9px] font-black text-[#8D7F72]">موجودی بانک</span>
          </div>
          <p className="text-sm font-black text-[#2D3025] font-mono">{totalBalance.toLocaleString("fa-IR")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F9F6EE] p-1 rounded-2xl border border-[#E6DFD3] gap-1">
        {[
          { id: "overview" as const, label: "خلاصه مالی", icon: PieChart },
          { id: "transactions" as const, label: "تراکنش‌ها", icon: FileText },
          { id: "accounts" as const, label: "حساب‌ها", icon: Building2 },
          { id: "assets" as const, label: "دارایی‌ها", icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === tab.id ? "bg-[#2D3025] text-white shadow-sm" : "text-[#8D7F72]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" className="space-y-3">
            <div className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-2">
              <h3 className="text-xs font-black text-[#2D3025] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#4A6741]" /> آخرین تراکنش‌ها
              </h3>
              <div className="space-y-1.5">
                {transactions.length === 0 ? (
                  <p className="text-[10px] text-[#8D7F72] text-center py-4">تراکنشی ثبت نشده است</p>
                ) : (
                  transactions.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9F6EE] border border-[#E6DFD3]"
                    >
                      <div className="flex items-center gap-2">
                        {t.type === "income" ? (
                          <ArrowDownLeft className="w-4 h-4 text-[#4A6741]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-[#E26645]" />
                        )}
                        <div>
                          <p className="text-[10px] font-black text-[#2D3025]">{t.description || t.category}</p>
                          <p className="text-[8px] text-[#8D7F72]">{t.date}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-black font-mono ${
                          t.type === "income" ? "text-[#4A6741]" : "text-[#E26645]"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}{t.amount.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "transactions" && (
          <motion.div key="transactions" className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E6DFD3]"
              >
                <div className="flex items-center gap-2.5">
                  {t.type === "income" ? (
                    <ArrowDownLeft className="w-4 h-4 text-[#4A6741]" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-[#E26645]" />
                  )}
                  <div>
                    <p className="text-[11px] font-black text-[#2D3025]">{t.description || t.category}</p>
                    <p className="text-[9px] text-[#8D7F72]">{t.date}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-black font-mono ${
                    t.type === "income" ? "text-[#4A6741]" : "text-[#E26645]"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}{t.amount.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "accounts" && (
          <motion.div key="accounts" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bankAccounts.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-xs text-[#8D7F72]">حساب بانکی تعریف نشده است</div>
            ) : (
              bankAccounts.map((a) => (
                <div key={a.id} className="p-4 rounded-3xl bg-white border border-[#E6DFD3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#2D3025]">{a.bankName}</span>
                    <CreditCard className="w-4 h-4 text-[#4A6741]" />
                  </div>
                  <p className="text-[10px] text-[#8D7F72]">{a.accountName}</p>
                  <p className="text-sm font-black text-[#4A6741] font-mono">{a.balance.toLocaleString("fa-IR")} تومان</p>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "assets" && (
          <motion.div key="assets" className="space-y-2">
            {assets.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8D7F72]">دارایی ثبت نشده است</div>
            ) : (
              assets.map((ast) => (
                <div key={ast.id} className="p-3.5 rounded-2xl bg-white border border-[#E6DFD3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#D6A94B]" />
                    <div>
                      <p className="text-[11px] font-black text-[#2D3025]">{ast.name}</p>
                      <p className="text-[9px] text-[#8D7F72]">مقدار: {ast.amount}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#2D3025] font-mono">
                    {ast.currentPrice.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Add Transaction */}
      <AnimatePresence>
        {showAddTx && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F9F6EE] border border-[#E6DFD3] rounded-3xl p-5 max-w-sm w-full text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#E6DFD3] pb-2">
                <h4 className="text-xs font-black text-[#2D3025]">ثبت تراکنش جدید</h4>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full bg-white cursor-pointer">
                  <X className="w-4 h-4 text-[#8D7F72]" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex bg-white p-1 rounded-2xl border border-[#E6DFD3] gap-1">
                  <button
                    onClick={() => setTxType("expense")}
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl cursor-pointer ${
                      txType === "expense" ? "bg-[#E26645] text-white" : "text-[#8D7F72]"
                    }`}
                  >
                    هزینه (برداشت)
                  </button>
                  <button
                    onClick={() => setTxType("income")}
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl cursor-pointer ${
                      txType === "income" ? "bg-[#4A6741] text-white" : "text-[#8D7F72]"
                    }`}
                  >
                    درآمد (واریز)
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#8D7F72] block mb-1">مبلغ (تومان)</label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="مثلاً: ۱۵۰۰۰۰"
                    className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white font-mono text-left"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#8D7F72] block mb-1">شرح تراکنش</label>
                  <input
                    type="text"
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    placeholder="بابت چه موردی؟"
                    className="w-full text-[10px] font-bold p-2.5 rounded-xl border border-[#E6DFD3] bg-white"
                  />
                </div>

                <button
                  onClick={handleCreateTx}
                  disabled={pending || !txAmount}
                  className="w-full py-3 bg-[#2D3025] text-white text-[10px] font-black rounded-2xl cursor-pointer hover:opacity-90 disabled:opacity-40"
                >
                  {pending ? "در حال ثبت..." : "ثبت تراکنش"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
