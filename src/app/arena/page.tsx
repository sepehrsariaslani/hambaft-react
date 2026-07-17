import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getArena, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { ArenaClient } from "@/components/arena-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "باشگاه" };

export default async function ArenaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [data, dash] = await Promise.all([getArena(user.id), getDashboard(user.id)]);
  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <ArenaClient
        leaders={data.leaders}
        myId={data.myId}
        myWeekPoints={data.myWeekPoints}
        myLevel={user.level}
        challenges={data.challenges}
        partners={data.partners}
        feed={data.feed}
      />
    </AppShell>
  );
}
