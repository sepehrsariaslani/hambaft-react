import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const endpoint = String(body.endpoint || "");
  const keys = JSON.stringify(body.keys || {});

  if (!endpoint) return Response.json({ error: "endpoint required" }, { status: 400 });

  await db.insert(pushSubscriptions).values({
    userId: user.id,
    endpoint,
    keys,
  });

  return Response.json({ ok: true, message: "اشتراک اعلان با موفقیت ثبت شد" });
}
