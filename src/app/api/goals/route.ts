import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { areas, goals } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) return Response.json({ error: "عنوان هدف لازم است" }, { status: 400 });

  let areaId: string | null = body.areaId || null;
  if (areaId) {
    const [a] = await db.select({ id: areas.id }).from(areas).where(eq(areas.userId, user.id)).limit(1);
    if (!a) areaId = null;
  }
  const target = Math.max(1, Math.min(100000, Number(body.targetValue) || 100));
  const [row] = await db
    .insert(goals)
    .values({
      ownerId: user.id,
      title,
      description: String(body.description ?? "").slice(0, 2000),
      category: String(body.category ?? "personal"),
      goalType: ["outcome", "metric", "habit_driven", "savings"].includes(body.goalType) ? body.goalType : "outcome",
      unit: String(body.unit ?? "").slice(0, 20),
      targetValue: target,
      privacy: ["private", "shared"].includes(body.privacy) ? body.privacy : "private",
      scope: ["annual", "quarterly", "monthly", "custom"].includes(body.scope) ? body.scope : "custom",
      areaId,
    })
    .returning({ id: goals.id });
  return Response.json({ ok: true, id: row.id });
}

export async function GET() {
  return Response.json({ error: "use server pages" }, { status: 405 });
}
