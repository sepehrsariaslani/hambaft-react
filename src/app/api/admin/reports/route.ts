import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  let query = db
    .select({
      id: reports.id,
      reporterId: reports.reporterId,
      reportedUserId: reports.reportedUserId,
      entityType: reports.entityType,
      entityId: reports.entityId,
      reason: reports.reason,
      description: reports.description,
      status: reports.status,
      actionTaken: reports.actionTaken,
      adminNotes: reports.adminNotes,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt));

  if (statusFilter && statusFilter !== "همه") {
    query = query.where(eq(reports.status, statusFilter)) as typeof query;
  }

  const rows = await query;

  // Enhance with user names
  const result = await Promise.all(
    rows.map(async (r) => {
      const [reporter] = await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, r.reporterId)).limit(1);
      const [reported] = await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, r.reportedUserId)).limit(1);

      return {
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        action_taken: r.actionTaken,
        created_at: r.createdAt,
        reporter_info: { fullName: reporter?.name || "ناشناس", phone: reporter?.phone },
        reported_user_info: { fullName: reported?.name || "ناشناس", phone: reported?.phone },
      };
    })
  );

  return Response.json({ ok: true, data: { reports: result } });
}
