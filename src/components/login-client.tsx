"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Phone, User, ArrowLeft, Sparkles, ShieldCheck, Flame, Target, UserCheck } from "lucide-react";

interface DemoUser {
  id: string;
  name: string;
  color: string;
  bio: string;
  level: number;
  phone: string;
}

export function LoginClient({ demoUsers }: { demoUsers: DemoUser[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [needName, setNeedName] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    setError("");
    start(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        if (data.needName) setNeedName(true);
        setError(data.error ?? "مشکلی پیش آمد");
      }
    });
  };

  return (
    <div className="min-h-dvh grid md:grid-cols-2">
      {/* ─── پنل تصویری ─── */}
      <div className="relative hidden md:flex flex-col justify-between bg-night text-cream overflow-hidden">
        <Image
          src="/brand/login-art.png"
          alt=""
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-ink/25" />
        <div className="relative z-10 p-8 flex items-center gap-3">
          <Image src="/brand/hambaft-mark.png" alt="همبافت" width={40} height={40} className="rounded-xl shadow-lg" />
          <div>
            <p className="display text-xl">همبافت</p>
            <p className="text-[11px] text-cream/80 font-bold">زندگی هم‌مسیر</p>
          </div>
        </div>
        <div className="relative z-10 p-8">
          <p className="display text-2xl leading-9 max-w-sm">
            زندگی، وقتی
            <span className="text-terra"> با هم </span>
            بافته شود، محکم‌تر است.
          </p>
          <div className="flex gap-5 mt-6">
            {[
              { icon: Target, fa: "اهداف مشترک" },
              { icon: Flame, fa: "زنجیرهٔ روزها" },
              { icon: Sparkles, fa: "گیمیفیکیشن فارسی" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-cream/90">
                <f.icon size={15} className="text-sage-soft" />
                <span className="text-[11px] font-bold">{f.fa}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── فرم ورود ─── */}
      <div className="flex flex-col justify-center px-6 py-10 md:px-14 max-w-md w-full mx-auto">
        <div className="md:hidden flex flex-col items-center mb-7">
          <Image src="/brand/hambaft-mark.png" alt="همبافت" width={64} height={64} className="rounded-2xl shadow-lg anim-pop" />
          <p className="display text-2xl mt-3 text-ink">همبافت</p>
          <p className="text-xs text-taupe font-bold mt-1">زندگی هم‌مسیر — با هم بافته می‌شویم</p>
        </div>

        {/* دکمهٔ ورود سریع یک‌لمسی به برنامه */}
        <Link
          href="/"
          className="card card-hover p-4 mb-6 bg-moss/10 border-moss/30 flex items-center justify-between text-moss text-right"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-moss text-white flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </span>
            <div>
              <p className="text-sm font-black">ورود مستقیم به برنامه</p>
              <p className="text-[11px] text-taupe font-bold">بدون نیاز به لاگین (حساب سپهر صریراصلانی)</p>
            </div>
          </div>
          <ArrowLeft size={18} />
        </Link>

        <h1 className="hidden md:block display text-2xl text-ink">ورود با شماره موبایل</h1>
        <p className="text-[13px] text-taupe mt-1 mb-4 leading-6">
          می‌توانی مستقیم شماره وارد کنی یا از اکانت‌های دمو یکی را انتخاب کنی:
        </p>

        <label className="text-[11px] font-black text-ink2 mb-1.5 block">شمارهٔ موبایل</label>
        <div className="relative">
          <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-taupe" />
          <input
            className="input pr-10 ltr text-right"
            inputMode="numeric"
            placeholder="0912…"
            value={phone}
            maxLength={11}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        {needName && (
          <div className="anim-rise">
            <label className="text-[11px] font-black text-ink2 mt-3.5 mb-1.5 block">نام و نام‌خانوادگی</label>
            <div className="relative">
              <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-taupe" />
              <input
                className="input pr-10"
                placeholder="مثلاً: سپهر صریراصلانی"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>
        )}

        {error && <p className="text-[12px] text-terra font-bold mt-3 anim-rise">{error}</p>}

        <button
          onClick={submit}
          disabled={pending || phone.length < 10}
          className="mt-4 w-full h-11 rounded-2xl bg-moss text-white font-black text-[14px] flex items-center justify-center gap-2 hover:bg-moss-deep transition-colors disabled:opacity-40 active:scale-[0.98]"
        >
          {pending ? "در حال ورود…" : "ورود / ساخت حساب"}
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-line" />
          <span className="text-[10px] font-black text-taupe">سوئیچ سریع اکانت‌های دمو</span>
          <span className="flex-1 h-px bg-line" />
        </div>

        <div className="grid grid-cols-2 gap-2 stagger">
          {demoUsers.map((u) => (
            <a
              key={u.id}
              href={`/api/auth/switch?phone=${u.phone}`}
              className="card card-press card-hover p-3 flex items-center gap-2.5 text-right"
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-black shrink-0"
                style={{ background: u.color }}
              >
                {u.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] font-black text-ink truncate">{u.name.split(" ")[0]}</span>
                <span className="block text-[9.5px] text-taupe font-bold">سطح {u.level<10?["","۱","۲","۳","۴","۵","۶","۷","۸","۹"][u.level]:u.level}</span>
              </span>
            </a>
          ))}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[10px] text-taupe mt-6">
          <ShieldCheck size={12} className="text-sage" />
          همبافت v2 — Next.js + PostgreSQL (Supabase Architecture)
        </p>
      </div>
    </div>
  );
}
