import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const myReports = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      description: reports.description,
      status: reports.status,
      entityType: reports.entityType,
      entityId: reports.entityId,
      createdAt: reports.createdAt,
      reportedUserName: users.name,
      reportedUserPhone: users.phone,
    })
    .from(reports)
    .leftJoin(users, eq(users.id, reports.reportedUserId))
    .where(eq(reports.reporterId, user.id))
    .orderBy(desc(reports.createdAt));

  const items = myReports.map((r) => ({
    id: r.id,
    reason: r.reason,
    reason_label: r.reason,
    description: r.description,
    status: r.status,
    created_at: r.createdAt,
    reported_user_info: {
      fullName: r.reportedUserName || "کاربر",
      email: r.reportedUserPhone || "",
    },
  }));

  return Response.json({ ok: true, reports: items });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reportedUserId = String(body.reported_user || body.reportedUserId || "").trim();
  const entityType = String(body.entity_type || body.entityType || "user");
  const entityId = String(body.entity || body.entityId || "");
  const reason = String(body.reason || "other");
  const description = String(body.description || "").slice(0, 1000);

  if (!reportedUserId && !entityId) {
    return Response.json({ error: "مورد گزارش‌گذاری مشخص نشده است" }, { status: 400 });
  }

  // Rate limit check: max 5 reports per day
  const today = new Date().toISOString().slice(0, 10);
  const [reportCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(eq(reports.reporterId, user.id), sql`(${reports.createdAt})::date = ${today}`));

  if ((reportCount?.n ?? 0) >= 5) {
    return Response.json({ error: "حداکثر ۵ گزارش در روز می‌توانید ثبت کنید" }, { status: 429 });
  }

  let targetUser = reportedUserId;
  if (!targetUser) {
    targetUser = user.id; // fallback if only entity is supplied
  }

  const [inserted] = await db
    .insert(reports)
    .values({
      reporterId: user.id,
      reportedUserId: targetUser,
      entityType,
      entityId,
      reason,
      description,
      status: "pending",
    })
    .returning();

  return Response.json({ ok: true, status: "reported", report_id: inserted.id });
}
