import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { identityPath } from "./base-path";
import type { IdentitySession } from "./identity";

export async function accountApi(path: string) {
  const incoming = await headers();
  return fetch(`${process.env.IDENTITY_API_ORIGIN ?? "http://localhost:8084"}${path}`, {
    headers: { Cookie: incoming.get("cookie") ?? "", Accept: "application/json", "X-Forwarded-Proto": process.env.NODE_ENV === "production" ? "https" : "http" },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}

export const requireAccountSession = cache(async (): Promise<IdentitySession> => {
  const response = await accountApi("/api/session");
  if (response.status === 401 || response.status === 403) {
    redirect("/login?return_to=" + encodeURIComponent(identityPath("/launcher")));
  }
  if (!response.ok) throw new Error("Không thể xác minh phiên đăng nhập. Vui lòng thử lại.");
  const session = await response.json() as IdentitySession;
  if (session.authenticated !== true || !session.user?.id) redirect("/login");
  return session;
});
