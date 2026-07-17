import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "readAll") {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    return Response.json({ ok: true });
  }
  return Response.json({ error: "unknown action" }, { status: 400 });
}
