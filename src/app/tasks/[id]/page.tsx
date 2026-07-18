import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { TaskDetailClient } from "@/components/tasks/task-detail-client";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.ownerId, user.id))).limit(1);
  if (!task) notFound();

  const dash = await getDashboard(user.id);

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <TaskDetailClient task={task} />
    </AppShell>
  );
}
