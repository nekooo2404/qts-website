"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { identityPath } from "@/lib/base-path";
import { getCsrfToken } from "@/lib/identity";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  const [csrf, setCsrf] = useState("");
  const [challenge, setChallenge] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const body = new URLSearchParams({ csrfmiddlewaretoken: csrf, logout_challenge: challenge });
    setBusy(true);
    setError("");
    try {
      const response = await fetch(identityPath("/identity-api/oauth/ory/logout/accept"), {
        method: "POST",
        body,
        headers: { Accept: "application/json", "X-CSRFToken": csrf },
        credentials: "same-origin",
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || !result.redirect_to) throw new Error("Chưa thể hoàn tất đăng xuất. Vui lòng thử lại.");
      window.location.assign(result.redirect_to);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa thể hoàn tất đăng xuất. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  useEffect(() => {
    setChallenge(new URLSearchParams(window.location.search).get("logout_challenge") ?? "");
    void getCsrfToken().then(setCsrf).catch(() => setError("Chưa thể chuẩn bị đăng xuất. Vui lòng thử lại."));
  }, []);

  const canSubmit = Boolean(csrf && challenge && !busy);

  return <main className="identity-auth-surface min-h-[100dvh] bg-background text-foreground">
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-8">
      <Link href={identityPath("/launcher")} className="flex items-center gap-3" aria-label="Trung tâm định danh QTS">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-panel">
          <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="grid leading-tight">
          <b className="text-sm font-bold tracking-[-0.03em] text-foreground">QTS</b>
          <small className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Trung tâm định danh</small>
        </span>
      </Link>
      <Badge tone="success" className="hidden sm:inline-flex">Sẵn sàng</Badge>
    </header>

    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:px-8 lg:py-12">
      <div className="flex min-h-[460px] flex-col justify-center space-y-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
          <LockClosedIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          Phiên làm việc được bảo vệ
        </div>
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.06em] text-foreground md:text-5xl">Bạn muốn đăng xuất khỏi QTS?</h1>
          <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">Khi đăng xuất, phiên hiện tại trên các ứng dụng QTS được cấp quyền sẽ kết thúc trên trình duyệt này.</p>
        </div>
        <div className="grid max-w-xl gap-3 rounded-3xl border border-border bg-card/90 p-4 shadow-panel">
          {[
            "Kết thúc phiên đăng nhập hiện tại",
            "Giữ nguyên dữ liệu đã lưu trong ứng dụng",
            "Có thể đăng nhập lại bất cứ lúc nào",
          ].map(item => <div className="flex items-center gap-2 text-sm text-foreground" key={item}>
            <CheckCircleIcon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>{item}</span>
          </div>)}
        </div>
      </div>

      <Card className="relative self-center overflow-hidden bg-card/95 shadow-gateway backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
        <CardHeader className="space-y-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-primary">
            <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-2xl tracking-[-0.05em]">Xác nhận đăng xuất</CardTitle>
            <CardDescription>Chọn đăng xuất nếu bạn đã hoàn tất công việc trên thiết bị này.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert role="alert" tone="danger">{error}</Alert>}
          {!challenge && !error && <Alert tone="warning">Yêu cầu đăng xuất chưa sẵn sàng. Vui lòng quay lại trung tâm ứng dụng và thử lại.</Alert>}
          <form method="post" action={identityPath("/identity-api/oauth/ory/logout/accept")} onSubmit={submit} className="grid gap-3">
            <input type="hidden" name="csrfmiddlewaretoken" value={csrf} />
            <input type="hidden" name="logout_challenge" value={challenge} />
            <Button className="w-full" disabled={!canSubmit}>
              {busy ? "Đang đăng xuất..." : "Đăng xuất an toàn"}
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <ButtonLink variant="secondary" className="w-full" href={identityPath("/launcher")}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Quay lại trung tâm ứng dụng
            </ButtonLink>
          </form>
          <p className="text-xs leading-5 text-muted-foreground">Nếu đây không phải thiết bị của bạn, hãy đăng xuất sau khi hoàn tất công việc.</p>
        </CardContent>
      </Card>
    </section>
  </main>;
}
