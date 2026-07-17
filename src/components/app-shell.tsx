"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import {
  Sun,
  ListChecks,
  Target,
  Users2,
  Plus,
  Bell,
  X,
  CheckSquare,
  Sprout,
  Flag,
} from "lucide-react";

const NAV = [
  { href: "/", fa: "امروز", icon: Sun },
  { href: "/tasks", fa: "تسک‌ها", icon: ListChecks },
  { href: "/goals", fa: "اهداف", icon: Target },
  { href: "/arena", fa: "باشگاه", icon: Users2 },
];

export function AppShell({
  children,
  userName,
  userColor,
  unreadCount,
  streakDays,
}: {
  children: React.ReactNode;
  userName: string;
  userColor: string;
  unreadCount: number;
  streakDays: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState(false);
  const initials = userName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ─── هدر ─── */}
      <header className="sticky top-0 z-40 glass border-b border-line/70">
        <div className="mx-auto w-full max-w-lg md:max-w-2xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/hambaft-mark.png" alt="همبافت" width={30} height={30} className="rounded-lg" />
            <span className="display text-[17px] text-ink">همبافت</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative w-9 h-9 rounded-xl bg-paper border border-line flex items-center justify-center text-ink2 hover:text-moss transition-colors"
              aria-label="اعلان‌ها"
            >
              <Bell size={17} strokeWidth={2.2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-terra text-white text-[9px] font-black flex items-center justify-center num">
                  {unreadCount > 9 ? "۹+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-black"
              style={{ background: userColor }}
              aria-label="پروفایل"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── محتوا ─── */}
      <main className="flex-1 w-full mx-auto max-w-lg md:max-w-2xl px-4 pb-28 pt-4">{children}</main>

      {/* ─── ناوبری پایین ─── */}
      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="mx-auto max-w-lg md:max-w-2xl px-4 safe-b">
          <div className="mb-3 rounded-[26px] bg-night/95 backdrop-blur-xl shadow-[0_12px_40px_-10px_rgba(27,29,22,0.5)] border border-white/5 h-[62px] grid grid-cols-5 items-center px-2">
            <NavBtn item={NAV[0]} active={isActive(pathname, NAV[0].href)} />
            <NavBtn item={NAV[1]} active={isActive(pathname, NAV[1].href)} />
            <div className="flex justify-center">
              <button
                onClick={() => setSheet(true)}
                className="nav-fab w-12 h-12 -mt-7 rounded-2xl bg-terra text-white flex items-center justify-center border-4 border-cream"
                aria-label="افزودن سریع"
              >
                <Plus size={22} strokeWidth={2.6} />
              </button>
            </div>
            <NavBtn item={NAV[2]} active={isActive(pathname, NAV[2].href)} />
            <NavBtn item={NAV[3]} active={isActive(pathname, NAV[3].href)} />
          </div>
        </div>
      </nav>

      {/* ─── شیت افزودن سریع ─── */}
      {sheet && <QuickAddSheet onClose={() => setSheet(false)} onDone={() => { setSheet(false); router.refresh(); }} />}
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavBtn({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="nav-item group flex flex-col items-center gap-0.5 text-sand/60"
      data-active={active}
    >
      <span
        className={`w-9 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
          active ? "bg-mist/15 text-mist" : "group-hover:text-sand"
        }`}
      >
        <Icon size={18} strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={`text-[9.5px] font-bold ${active ? "text-mist" : ""}`}>{item.fa}</span>
    </Link>
  );
}

/* ═══════ شیت افزودن سریع ═══════ */
function QuickAddSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"menu" | "task" | "habit">("menu");
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  const [doneMsg, setDoneMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== "menu") inputRef.current?.focus();
  }, [mode]);

  const submitTask = () => {
    if (!title.trim()) return;
    start(async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, forToday: true }),
      });
      if (res.ok) {
        setDoneMsg("به امروزت اضافه شد");
        router.refresh();
        setTimeout(onDone, 700);
      }
    });
  };

  const submitHabit = () => {
    if (!title.trim()) return;
    start(async () => {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setDoneMsg("عادت تازه ساخته شد — برو ثبتش کن!");
        router.refresh();
        setTimeout(onDone, 700);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-night/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-paper rounded-t-[28px] border-t border-line shadow-2xl safe-b anim-rise">
        <div className="w-10 h-1 rounded-full bg-sand mx-auto mt-3 mb-1" />
        {mode === "menu" ? (
          <div className="p-4 pb-6 stagger">
            <p className="text-center text-[13px] text-taupe font-bold mb-3">چی به همبافتت اضافه کنیم؟</p>
            <SheetBtn
              icon={CheckSquare}
              color="#4A6741"
              title="تسک برای امروز"
              hint="کاری کوچک که امروز انجامش می‌دهم"
              onClick={() => setMode("task")}
            />
            <SheetBtn
              icon={Sprout}
              color="#7C8363"
              title="عادت تازه"
              hint="یک رفتار روزانه برای بافتن آینده"
              onClick={() => setMode("habit")}
            />
            <SheetBtnLink
              icon={Flag}
              color="#E26645"
              title="هدف تازه"
              hint="با نوار پیشرفت و امتیاز"
              href="/goals?new=1"
            />
          </div>
        ) : (
          <div className="p-4 pb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-ink">
                {mode === "task" ? "تسک امروز" : "عادت تازه"}
              </p>
              <button onClick={() => setMode("menu")} className="w-7 h-7 rounded-full bg-mist flex items-center justify-center text-taupe">
                <X size={14} />
              </button>
            </div>
            {doneMsg ? (
              <div className="py-6 text-center anim-pop">
                <p className="text-moss font-black">{doneMsg}</p>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  className="input"
                  placeholder={mode === "task" ? "مثلاً: ۲۰ صفحه مطالعه…" : "مثلاً: نوشیدن آب کافی…"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (mode === "task" ? submitTask() : submitHabit())}
                  maxLength={120}
                />
                <button
                  disabled={pending || !title.trim()}
                  onClick={mode === "task" ? submitTask : submitHabit}
                  className="mt-3 w-full h-11 rounded-2xl bg-moss text-white font-black text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  {pending ? "در حال افزودن…" : mode === "task" ? "افزودن به امروز" : "ساخت عادت"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SheetBtn({ icon: Icon, color, title, hint, onClick }: { icon: typeof CheckSquare; color: string; title: string; hint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full card card-press flex items-center gap-3 px-4 py-3.5 mb-2 text-right">
      <span className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: color + "1a", color }}>
        <Icon size={19} strokeWidth={2.2} />
      </span>
      <span>
        <span className="block text-sm font-black text-ink">{title}</span>
        <span className="block text-[11px] text-taupe mt-0.5">{hint}</span>
      </span>
    </button>
  );
}

function SheetBtnLink({ icon: Icon, color, title, hint, href }: { icon: typeof Flag; color: string; title: string; hint: string; href: string }) {
  return (
    <Link href={href} className="w-full card card-press flex items-center gap-3 px-4 py-3.5 mb-2">
      <span className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: color + "1a", color }}>
        <Icon size={19} strokeWidth={2.2} />
      </span>
      <span>
        <span className="block text-sm font-black text-ink">{title}</span>
        <span className="block text-[11px] text-taupe mt-0.5">{hint}</span>
      </span>
    </Link>
  );
}
