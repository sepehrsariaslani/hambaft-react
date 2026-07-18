import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getProfile, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { ProfileClient } from "@/components/profile-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "پروفایل" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [data, dash] = await Promise.all([getProfile(user.id), getDashboard(user.id)]);
  const u = data.user!;

  const mappedBadges = data.badges.map((b) => ({
    badgeId: b.id,
    badgeNameFa: b.title,
    icon: b.icon,
    descriptionFa: b.description,
    rarity: (b.id.includes("5000") || b.id.includes("master") ? "Legendary" : b.id.includes("2000") || b.id.includes("200") ? "Epic" : b.id.includes("50") ? "Rare" : "Common") as any,
    earned: !!b.awardedAt,
    awardedAt: b.awardedAt ? String(b.awardedAt) : null,
  }));

  const mappedRecentEvents = data.recentEvents.map((e) => ({
    id: e.id,
    points: e.points,
    reason: e.reason,
    createdAt: String(e.createdAt),
  }));

  const stats = {
    tasksCompleted: data.stats.tasksDone,
    proofsUploaded: 0,
    commentsPosted: data.stats.comments,
  };

  return (
    <AppShell userName={u.name} userColor={u.avatarColor} unreadCount={dash.unreadCount} streakDays={u.streakDays}>
      <ProfileClient
        user={{
          id: u.id,
          name: u.name,
          phone: u.phone,
          bio: u.bio,
          avatarColor: u.avatarColor,
          level: u.level,
          totalPoints: u.totalPoints,
          streakDays: u.streakDays,
        }}
        stats={stats}
        badges={mappedBadges}
        recentEvents={mappedRecentEvents}
      />
    </AppShell>
  );
}
