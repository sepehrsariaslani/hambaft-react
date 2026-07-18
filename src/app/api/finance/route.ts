import { apiUser } from "@/server/auth";
import { db } from "@/db";
import { assets, bankAccounts, debts, installments, subscriptions, transactions } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [
    txs,
    accounts,
    debtRows,
    assetRows,
    installmentRows,
    subscriptionRows
  ] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.date)).limit(100),
    db.select().from(bankAccounts).where(eq(bankAccounts.userId, user.id)),
    db.select().from(debts).where(eq(debts.userId, user.id)),
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(installments).where(eq(installments.userId, user.id)),
    db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)),
  ]);

  return Response.json({
    ok: true,
    data: {
      transactions: txs,
      bankAccounts: accounts,
      debts: debtRows,
      assets: assetRows,
      installments: installmentRows,
      subscriptions: subscriptionRows,
    },
  });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "expense");
  const amount = Number(body.amount || 0);
  const category = String(body.category || "other");
  const description = String(body.description || "");
  const date = String(body.date || new Date().toISOString().slice(0, 10));

  if (!amount || amount <= 0) {
    return Response.json({ error: "مبلغ معتبر نیست" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(transactions)
    .values({
      userId: user.id,
      type,
      amount,
      category,
      description,
      date,
    })
    .returning();

  return Response.json({ ok: true, transaction: inserted });
}
