import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { CoachClient } from "@/components/coach-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "مربی هوشمند" };

export default async function CoachPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dash = await getDashboard(user.id);

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <CoachClient />
    </AppShell>
  );
}
