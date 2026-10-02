import { IdentityShell } from "@/components/IdentityShell";
import { accountApi, requireAccountSession } from "@/lib/account-session";
import type { LauncherApplication } from "@/lib/identity";
import { redirect } from "next/navigation";
import LauncherClient from "./LauncherClient";

export default async function LauncherPage() {
  const session = await requireAccountSession();
  const response = await accountApi("/api/launcher");
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error("Không tải được ứng dụng của tài khoản. Vui lòng thử lại.");
  const { applications } = await response.json() as { applications: LauncherApplication[] };
  return <IdentityShell active="launcher"><LauncherClient applications={applications} user={session.user} tenantName={session.tenant.name}/></IdentityShell>;
}
