import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { proofs, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { awardPoints, syncDailyChallenges } from "@/server/gamification";
import { POINTS } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType") || url.searchParams.get("entityType") || "goal";
  const targetId = url.searchParams.get("targetId") || url.searchParams.get("entityId") || url.searchParams.get("entity");

  if (!targetId) return Response.json({ error: "targetId is required" }, { status: 400 });

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
    .where(and(eq(proofs.targetType, targetType), eq(proofs.targetId, targetId)))
    .orderBy(desc(proofs.createdAt));

  const items = rows.map((r) => ({
    ...r,
    isMine: r.userId === user.id,
  }));

  return Response.json({ ok: true, proofs: items });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetType = String(body.targetType || body.entityType || body.entity_type || "goal");
  const targetId = String(body.targetId || body.entityId || body.entity || "");
  const mediaUrl = String(body.mediaUrl || body.filedata || body.file_url || "");
  const mediaType = String(body.mediaType || body.media_type || "photo");
  const caption = String(body.caption || "").slice(0, 500);
  const reflectionNote = String(body.reflectionNote || body.reflection || "").slice(0, 1000);

  if (!targetId) return Response.json({ error: "targetId is required" }, { status: 400 });
  if (!mediaUrl && !reflectionNote) {
    return Response.json({ error: "ارسال تصویر/ویدیو یا تأمل الزامی است" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(proofs)
    .values({
      userId: user.id,
      targetType,
      targetId,
      mediaUrl: mediaUrl || "text_proof",
      mediaType: mediaType === "video" ? "video" : "photo",
      caption,
      reflectionNote,
    })
    .returning();

  const res = await awardPoints(user.id, POINTS.PROOF_UPLOADED, "بارگذاری اثبات پیشرفت", "proof", inserted.id);
  await syncDailyChallenges(user.id);

  return Response.json({ ok: true, proof: inserted, ...res });
}

export async function DELETE(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const proofId = url.searchParams.get("id") || url.searchParams.get("proofId");

  if (!proofId) return Response.json({ error: "proofId required" }, { status: 400 });

  const [p] = await db.select().from(proofs).where(eq(proofs.id, proofId)).limit(1);
  if (!p) return Response.json({ error: "not found" }, { status: 404 });

  if (p.userId !== user.id && user.role !== "admin") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  await db.delete(proofs).where(eq(proofs.id, proofId));

  return Response.json({ ok: true });
}
