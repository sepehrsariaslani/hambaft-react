import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/db";
import { areas } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { AreasClient } from "@/components/areas-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "حوزه‌های زندگی" };

export default async function AreasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [areaRows, dash] = await Promise.all([
    db.select().from(areas).where(eq(areas.userId, user.id)).orderBy(asc(areas.sortOrder)),
    getDashboard(user.id),
  ]);

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <AreasClient areas={areaRows} />
    </AppShell>
  );
}
