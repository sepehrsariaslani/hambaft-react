import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getTasksPage, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { TasksClient } from "@/components/tasks-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "تسک‌ها" };

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [data, dash] = await Promise.all([getTasksPage(user.id), getDashboard(user.id)]);
  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <TasksClient
        tasks={data.tasks}
        projects={data.projects.map((p) => ({ id: p.id, title: p.title, color: p.color }))}
        today={dash.today}
      />
    </AppShell>
  );
}
