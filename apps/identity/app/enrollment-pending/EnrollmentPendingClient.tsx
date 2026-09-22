"use client";

import { useState } from "react";
import { ShieldCheckIcon, KeyIcon, DevicePhoneMobileIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { identityPath } from "@/lib/base-path";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { getCsrfToken } from "@/lib/identity";

const credentialLabels: Record<string, string> = {
  password: "mật khẩu",
  totp: "ứng dụng xác thực (TOTP)",
  lookup_secret: "mã dự phòng",
};

export function EnrollmentPendingClient() {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  async function complete() {
    if (!confirm) {
      setError("Vui lòng xác nhận bạn đã đổi mật khẩu ban đầu.");
      return;
    }
    setBusy(true);
    setError("");
    setMissing([]);
    try {
      // Dùng fetch thủ công 1 lần để giữ được `missing` từ body (identityFetch hiện bọc lỗi chung)
      const csrf = await getCsrfToken();
      const response = await fetch(identityPath("/identity-api/api/enrollment/complete"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
        body: JSON.stringify({ confirm_password_changed: true }),
      });
      const body = await response.json().catch(() => ({} as Record<string, unknown>));
      if (!response.ok) {
        if (Array.isArray((body as { missing?: unknown }).missing)) {
          const list = (body as { missing: string[] }).missing;
          setMissing(list);
          const labels = list.map((k) => credentialLabels[k] ?? k).join(", ");
          throw new Error(`Còn thiếu: ${labels}. Vui lòng quay lại Cài đặt để hoàn tất.`);
        }
        const desc = typeof (body as { error_description?: unknown }).error_description === "string"
          ? (body as { error_description: string }).error_description
          : "";
        throw new Error(desc || "Không thể hoàn tất kích hoạt. Vui lòng thử lại.");
      }
      window.location.assign(identityPath("/launcher"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể hoàn tất kích hoạt. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="identity-auth-surface min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
        <Card className="relative overflow-hidden bg-card/95 shadow-gateway backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
          <CardHeader className="space-y-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-2xl tracking-[-0.04em]">Tài khoản đang chờ hoàn tất kích hoạt</CardTitle>
              <CardDescription>
                Tài khoản đã đăng nhập nhưng chưa thể truy cập ứng dụng cho đến khi hoàn tất các bước bảo mật dưới đây.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert tone="warning">
              Bạn đã đăng nhập bằng mật khẩu ban đầu do quản trị viên cấp. Vui lòng hoàn tất <b>đổi mật khẩu</b>,{" "}
              <b>thiết lập TOTP</b> và <b>lưu mã dự phòng</b> trước khi truy cập Cổng thông tin hoặc HRM. Sau khi hoàn
              tất 3 bước, bấm <b>Hoàn tất kích hoạt</b> ngay tại đây — không cần liên hệ quản trị viên hay truy cập
              terminal.
            </Alert>

            <ol className="grid gap-3">
              <li className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm">
                  <KeyIcon className="h-4 w-4" />
                </span>
                <span>
                  <b className="text-sm text-foreground">1. Đổi mật khẩu</b>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Đổi mật khẩu ban đầu thành mật khẩu cá nhân an toàn tại phần Cài đặt bảo mật.
                  </p>
                </span>
              </li>
              <li className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm">
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                </span>
                <span>
                  <b className="text-sm text-foreground">2. Thiết lập ứng dụng xác thực (TOTP)</b>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Quét mã QR bằng ứng dụng xác thực và xác nhận mã 6 số.
                  </p>
                </span>
              </li>
              <li className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm">
                  <ClipboardDocumentCheckIcon className="h-4 w-4" />
                </span>
                <span>
                  <b className="text-sm text-foreground">3. Lưu mã dự phòng</b>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Lưu bộ mã dự phòng (lookup_secret) ở nơi an toàn. Mỗi mã chỉ dùng một lần khi mất thiết bị xác thực.
                  </p>
                </span>
              </li>
            </ol>

            <div className="grid gap-2">
              <ButtonLink
                href={identityPath("/settings?enrollment=required&return_to=" + encodeURIComponent(identityPath("/enrollment-pending")))}
              >
                Mở Cài đặt để hoàn tất
              </ButtonLink>

              <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-slate-900"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  disabled={busy}
                />
                <span>
                  Tôi đã đổi mật khẩu ban đầu thành mật khẩu cá nhân
                  <span className="block text-xs leading-5 text-muted-foreground">
                    Bắt buộc trước khi kích hoạt. Hệ thống sẽ kiểm tra bạn đã có đủ 3 phương thức (mật khẩu, TOTP, mã dự
                    phòng) trước khi mở khóa.
                  </span>
                </span>
              </label>

              {error && (
                <Alert tone="danger" role="alert">
                  {error}
                  {missing.length > 0 && (
                    <span className="mt-2 block text-xs">
                      Thiếu: {missing.map((k) => credentialLabels[k] ?? k).join(", ")} — vui lòng quay lại{" "}
                      <a className="font-semibold underline" href={identityPath("/settings?enrollment=required&return_to=" + encodeURIComponent(identityPath("/enrollment-pending")))}>
                        Cài đặt
                      </a>{" "}
                      để bổ sung.
                    </span>
                  )}
                </Alert>
              )}

              <Button onClick={complete} disabled={busy || !confirm} aria-busy={busy}>
                {busy ? "Đang kích hoạt..." : "Hoàn tất kích hoạt"}
              </Button>
              <ButtonLink variant="secondary" href={identityPath("/launcher")}>
                Về Trung tâm ứng dụng
              </ButtonLink>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Sau khi bấm Hoàn tất kích hoạt và được xác nhận, bạn có thể truy cập Cổng thông tin và HRM ngay. Nếu còn
              thiếu bước, hệ thống sẽ báo rõ bạn cần bổ sung gì.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
