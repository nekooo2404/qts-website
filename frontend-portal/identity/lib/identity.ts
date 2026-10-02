import { identityPath } from "@/lib/base-path";

export type IdentitySession = {
  authenticated: boolean;
  user: { id: string; email: string; name: string };
  tenant: { id: string; slug: string; name: string };
  session: { id: string; auth_time: string; amr: string[] };
  roles: string[];
  permissions: string[];
};

export type LauncherApplication = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  client_id: string;
  redirect_uri: string;
  status: string;
  last_accessed_at: string | null;
};

export type SecurityOverview = {
  active_users: number;
  failed_logins: number;
  mfa_adoption: number;
  risk_level: string;
  connected_applications: number;
};

const api = identityPath("/identity-api");
const genericError = "Không thể hoàn tất yêu cầu. Vui lòng thử lại hoặc liên hệ quản trị viên.";

function localizedErrorDescription(value: unknown): string {
  if (typeof value !== "string") return genericError;
  const description = value.trim();
  const normalized = description.toLowerCase();
  if (normalized.includes("redirect uri")) return "Địa chỉ quay lại sau đăng nhập chưa được đăng ký cho ứng dụng này.";
  if (normalized.includes("pkce")) return normalized.includes("không hợp lệ")
    ? "Mã xác minh đăng nhập không hợp lệ. Vui lòng bắt đầu lại từ ứng dụng."
    : "Ứng dụng này cần bật cơ chế xác minh đăng nhập an toàn trước khi sử dụng.";
  if (normalized.includes("bearer token") || normalized.includes("bearer access token")) return normalized.includes("trống")
    ? "Mã truy cập không được để trống."
    : "Yêu cầu cần có mã truy cập hợp lệ.";
  if (normalized.includes("scope")) {
    if (normalized.includes("openid")) return "Yêu cầu đăng nhập thiếu quyền nhận diện tài khoản.";
    if (normalized.includes("không khả dụng")) return "Một hoặc nhiều quyền truy cập được yêu cầu chưa khả dụng.";
    return "Quyền truy cập được yêu cầu chưa được cấp.";
  }
  return genericError;
}

export async function identityFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes((init.method ?? "GET").toUpperCase())) {
    const csrf = await getCsrfToken();
    headers.set("X-CSRFToken", csrf);
  }
  const response = await fetch(`${api}${path}`, {
    credentials: "include",
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(localizedErrorDescription(body.error_description));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getCsrfToken() {
  const result = await identityFetch<{ csrfToken: string }>("/oauth/csrf");
  return result.csrfToken;
}

export function csrfHeaders(token: string) {
  return { "X-CSRFToken": token };
}

export function dateTime(value: string | null) {
  if (!value) return "Chưa từng mở";
  return new Intl.DateTimeFormat("vi-VN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
