import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { todayISO } from "@/lib/fa";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) return Response.json({ error: "عنوان تسک لازم است" }, { status: 400 });
  const priority = ["low", "medium", "high", "urgent"].includes(body.priority) ? body.priority : "medium";
  const scheduledDate = /^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate ?? "") ? body.scheduledDate : body.forToday ? todayISO() : null;
  const [row] = await db
    .insert(tasks)
    .values({
      ownerId: user.id,
      title,
      priority,
      scheduledDate,
      isDailyHighlight: !!body.isDailyHighlight,
      estimatedMinutes: Number.isFinite(body.estimatedMinutes) ? Number(body.estimatedMinutes) : null,
      projectId: body.projectId || null,
      goalId: body.goalId || null,
      areaId: body.areaId || null,
    })
    .returning();
  return Response.json({ ok: true, task: row });
}
