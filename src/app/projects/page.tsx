import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getProjectsPage, getDashboard, getGoalsPage } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { ProjectsClient } from "@/components/projects/projects-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "پروژه‌ها" };

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [data, goalsData, dash] = await Promise.all([
    getProjectsPage(user.id),
    getGoalsPage(user.id),
    getDashboard(user.id),
  ]);

  const mappedProjects = data.projects.map((p) => ({
    id: p.id,
    title: p.title,
    goalId: p.goalId,
    goalTitle: p.goalTitle,
    areaId: p.areaId,
    areaName: p.areaName,
    status: p.status,
    color: p.color,
    tasks: p.tasks,
  }));

  const mappedGoals = goalsData.myGoals.map((g) => ({
    id: g.g.id,
    title: g.g.title,
  }));

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <ProjectsClient projects={mappedProjects} areas={data.areas} goals={mappedGoals} />
    </AppShell>
  );
}
