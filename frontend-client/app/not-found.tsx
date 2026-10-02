import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="page-hero noise">
        <div className="container page-hero-grid">
          <div>
            <span className="eyebrow">Lỗi 404 - Trang không tồn tại</span>
            <h1 className="display">Trang yêu cầu không tìm thấy.</h1>
            <div className="page-hero-copy">
              <p>Địa chỉ có thể đã thay đổi hoặc không còn tồn tại. Quay lại trang chủ hoặc khám phá các trang chính của QTS.</p>
            </div>
            <div className="page-hero-actions">
              <Link href="/" className="btn btn-primary">
                Về trang chủ
              </Link>
              <Link href="/resources" className="btn btn-light">
                Xem tài nguyên
              </Link>
            </div>
            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/solutions">Giải pháp</Link>
              <Link href="/platform">Nền tảng</Link>
              <Link href="/industries">Ngành</Link>
              <Link href="/company">Giới thiệu</Link>
              <Link href="/legal">Pháp lý</Link>
              <Link href="/contact">Liên hệ</Link>
            </div>
          </div>
          <div className="page-hero-aside" aria-hidden="true" />
        </div>
      </section>
    </MarketingShell>
  );
}
