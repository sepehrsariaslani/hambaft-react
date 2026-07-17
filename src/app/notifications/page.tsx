import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bell, Zap, Award, Star, Heart, MessageCircle, Swords, Users2, type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { getNotifications, getDashboard } from "@/server/queries";
import { AppShell } from "@/components/app-shell";
import { ReadAllMarker } from "@/components/page-clients";
import { EmptyState } from "@/components/ui";
import { relativeFa } from "@/lib/fa";

export const dynamic = "force-dynamic";
export const metadata = { title: "اعلان‌ها" };

const TYPE_META: Record<string, { icon: LucideIcon; color: string }> = {
  nudge: { icon: Zap, color: "#E26645" },
  badge: { icon: Award, color: "#D6A94B" },
  points: { icon: Star, color: "#4A6741" },
  reaction: { icon: Heart, color: "#9B6B61" },
  comment: { icon: MessageCircle, color: "#7C8363" },
  challenge: { icon: Swords, color: "#D6A94B" },
  partner: { icon: Users2, color: "#4A6741" },
  info: { icon: Bell, color: "#8D7F72" },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [rows, dash] = await Promise.all([getNotifications(user.id), getDashboard(user.id)]);

  return (
    <AppShell userName={user.name} userColor={user.avatarColor} unreadCount={0} streakDays={user.streakDays}>
      <ReadAllMarker />
      <h1 className="display text-[22px] text-ink flex items-center gap-2 mb-4 anim-rise">
        <Bell className="text-clay" size={22} /> اعلان‌ها
      </h1>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState icon={Bell} title="سکوت همبافت" hint="وقتی پارتنرها تشویقت کنند یا نشانی بگیری، اینجا خبرش می‌آید" />
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {rows.map(({ n }) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.info;
            const Icon = meta.icon;
            const href = n.refType === "goal" ? `/goals/${n.refId}` : null;
            const inner = (
              <div className={`card flex items-start gap-3 px-4 py-3.5 ${!n.read ? "!border-sage bg-mist/30" : ""}`}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.color + "16", color: meta.color }}>
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-black text-ink leading-5">{n.title}</p>
                  {n.body && <p className="text-[11.5px] text-taupe mt-0.5 leading-5">{n.body}</p>}
                  <p className="text-[9.5px] text-sand font-bold mt-1">{relativeFa(n.createdAt)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-terra shrink-0 mt-2" />}
              </div>
            );
            return href ? <Link key={n.id} href={href}>{inner}</Link> : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </AppShell>
  );
}
