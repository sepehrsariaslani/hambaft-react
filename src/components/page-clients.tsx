"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

/* وقتی صفحهٔ اعلان‌ها باز شد، همه را «خوانده‌شده» کن */
export function ReadAllMarker() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "readAll" }),
    }).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.replace("/login");
          router.refresh();
        })
      }
      className="w-full h-12 rounded-2xl bg-terra/10 text-terra font-black text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
    >
      <LogOut size={16} />
      {pending ? "در حال خروج…" : "خروج از حساب"}
    </button>
  );
}
