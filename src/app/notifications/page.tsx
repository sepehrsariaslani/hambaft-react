import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const dynamic = "force-dynamic";
export const metadata = { title: "اعلان‌ها" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const dash = await getDashboard(user.id);

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <h1 className="display text-[22px] text-[#2D3025] flex items-center gap-2 mb-4 anim-rise">
        <Bell className="text-[#E26645]" size={22} /> اعلان‌ها و پیام‌ها
      </h1>
      <NotificationCenter />
    </AppShell>
  );
}
