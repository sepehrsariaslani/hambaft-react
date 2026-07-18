import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { proofs, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { canViewGoal } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  if (!(await canViewGoal(id, user.id))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: proofs.id,
      userId: proofs.userId,
      userName: users.name,
      userAvatar: users.avatarColor,
      targetType: proofs.targetType,
      targetId: proofs.targetId,
      mediaUrl: proofs.mediaUrl,
      mediaType: proofs.mediaType,
      caption: proofs.caption,
      reflectionNote: proofs.reflectionNote,
      createdAt: proofs.createdAt,
    })
    .from(proofs)
    .innerJoin(users, eq(users.id, proofs.userId))
    .where(and(eq(proofs.targetType, "goal"), eq(proofs.targetId, id)))
    .orderBy(desc(proofs.createdAt));

  return Response.json({ ok: true, proofs: rows.map((r) => ({ ...r, isMine: r.userId === user.id })) });
}
