import { requireAccountSession } from "@/lib/account-session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireAccountSession();
  return children;
}
