import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getProjectsPage } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const data = await getProjectsPage(user.id);
  return Response.json({ ok: true, ...data });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const goalId = body.goalId || body.goal_id || null;
  const areaId = body.areaId || body.area_id || null;
  const color = String(body.color || "#7C8363");

  if (!title) return Response.json({ error: "عنوان پروژه الزامی است" }, { status: 400 });

  const [inserted] = await db
    .insert(projects)
    .values({
      ownerId: user.id,
      title,
      goalId,
      areaId,
      color,
      status: "active",
    })
    .returning();

  return Response.json({ ok: true, project: inserted, id: inserted.id });
}
