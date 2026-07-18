import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/db";
import { assets, bankAccounts, debts, installments, subscriptions, transactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { FinanceClient } from "@/components/finance/finance-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "امور مالی" };

export default async function FinancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [
    txs,
    accounts,
    debtRows,
    assetRows,
    installmentRows,
    subscriptionRows,
    dash,
  ] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.date)).limit(100),
    db.select().from(bankAccounts).where(eq(bankAccounts.userId, user.id)),
    db.select().from(debts).where(eq(debts.userId, user.id)),
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(installments).where(eq(installments.userId, user.id)),
    db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)),
    getDashboard(user.id),
  ]);

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={dash.unreadCount} streakDays={user.streakDays}>
      <FinanceClient
        transactions={txs}
        bankAccounts={accounts}
        debts={debtRows}
        assets={assetRows}
        installments={installmentRows}
        subscriptions={subscriptionRows}
      />
    </AppShell>
  );
}
