import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getProjectDetail, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [project, dash] = await Promise.all([getProjectDetail(id, user.id), getDashboard(user.id)]);

  if (!project) notFound();

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <ProjectDetailClient project={project} />
    </AppShell>
  );
}
