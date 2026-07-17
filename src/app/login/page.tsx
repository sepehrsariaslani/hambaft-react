import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { ensureSeeded } from "@/server/seed";
import { getDemoUsers } from "@/server/queries";
import { LoginClient } from "@/components/login-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "ورود" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  await ensureSeeded();
  const demoUsers = await getDemoUsers();
  return <LoginClient demoUsers={demoUsers} />;
}
