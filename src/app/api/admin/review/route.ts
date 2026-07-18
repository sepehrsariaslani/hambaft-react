import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { notifications, reports, userBlocks } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reportId = String(body.report_id || body.reportId || "");
  const action = String(body.action || "تأییدشده");
  const actionTaken = String(body.action_taken || body.actionTaken || "هشدار");
  const adminNotes = String(body.admin_notes || body.adminNotes || "");

  if (!reportId) return Response.json({ error: "report_id required" }, { status: 400 });

  const [rep] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!rep) return Response.json({ error: "report not found" }, { status: 404 });

  await db
    .update(reports)
    .set({
      status: action,
      actionTaken,
      adminNotes,
      reviewedBy: user.id,
      reviewedAt: new Date(),
    })
    .where(eq(reports.id, reportId));

  if (actionTaken === "مسدود_کاربر" && rep.reportedUserId) {
    await db
      .insert(userBlocks)
      .values({
        blockerId: user.id,
        blockedId: rep.reportedUserId,
        reason: "گزارش مدیریت",
        notes: adminNotes || action,
      })
      .onConflictDoNothing();

    await db.insert(notifications).values({
      userId: rep.reportedUserId,
      type: "system",
      title: "حساب شما مسدود شد",
      body: "به دلیل نقض قوانین اجتماعی، دسترسی شما محدود شده است.",
    });
  }

  return Response.json({ ok: true, report_id: reportId });
}
