import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getGoalsPage, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { GoalsClient } from "@/components/goals-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "اهداف" };

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const [data, dash] = await Promise.all([getGoalsPage(user.id), getDashboard(user.id)]);

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <GoalsClient
        areas={data.areas.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
        myGoals={data.myGoals.map((r) => ({ goal: r.g, areaName: r.areaName, areaColor: r.areaColor }))}
        memberGoals={data.memberGoals.map((r) => ({ goal: r.g, ownerName: r.ownerName, areaName: r.areaName }))}
        memberCounts={data.memberCounts}
        openNew={sp.new === "1"}
      />
    </AppShell>
  );
}
