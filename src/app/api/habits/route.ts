import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { habits } from "@/db/schema";

export const dynamic = "force-dynamic";

const HABIT_COLORS = ["#4A6741", "#E26645", "#7C8363", "#9B6B61", "#8D7F72", "#5B7E9B", "#D6A94B"];
const HABIT_ICONS = ["leaf", "book-open", "dumbbell", "flower", "droplets", "pen-line", "sun", "moon", "heart", "music"];

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) return Response.json({ error: "عنوان عادت لازم است" }, { status: 400 });
  const [row] = await db
    .insert(habits)
    .values({
      userId: user.id,
      title,
      color: HABIT_COLORS.includes(body.color) ? body.color : HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
      icon: HABIT_ICONS.includes(body.icon) ? body.icon : "leaf",
      targetPerDay: Math.max(1, Math.min(20, Number(body.targetPerDay) || 1)),
    })
    .returning();
  return Response.json({ ok: true, habit: row });
}
