import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import HomeExperience from "@/components/marketing/HomeExperience";
import PlatformExplorer from "@/components/marketing/PlatformExplorer";
import SolutionsBento from "@/components/marketing/SolutionsBento";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "QTS — Hạ tầng số cho tăng trưởng doanh nghiệp",
  description: "QTS phát triển phần mềm, nền tảng doanh nghiệp và hệ sinh thái số thông minh có khả năng mở rộng.",
};

export default function Page() {
  return <MarketingShell>
    <HomeExperience />
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Một nền tảng kết nối</span>
          <h2>Các hệ thống thiết yếu cùng vận hành thống nhất.</h2>
          <p>QTS kết nối CRM, ERP, AI, phân tích dữ liệu, quy trình và hạ tầng đám mây trên một lõi có thể mở rộng.</p>
        </div></Reveal>
        <Reveal delay={0.1}><PlatformExplorer /></Reveal>
        <Reveal delay={0.15}><div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}><Link href="/platform" className="btn btn-light">Khám phá nền tảng <ArrowRightIcon width={15} /></Link></div></Reveal>
      </div>
    </section>
    <section className="section" style={{ background: "var(--paper)" }}>
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Thiết kế theo mục tiêu doanh nghiệp</span>
          <h2>Công nghệ giúp hoạt động kinh doanh tiến về phía trước.</h2>
          <p>Từ hệ thống quản trị nội bộ đến sản phẩm số cho khách hàng, QTS chuyển các quy trình quan trọng thành phần mềm rõ ràng và hiệu quả.</p>
        </div></Reveal>
        <Reveal delay={0.1}><SolutionsBento /></Reveal>
        <Reveal delay={0.15}><div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}><Link href="/solutions" className="btn btn-light">Xem tất cả giải pháp <ArrowRightIcon width={15} /></Link></div></Reveal>
      </div>
    </section>
    <section className="section case-study">
      <div className="container case-grid">
        <Reveal><div>
          <span className="eyebrow">Mô hình vận hành số</span>
          <h2 className="display" style={{ fontSize: "clamp(36px,4vw,52px)", margin: "18px 0" }}>Từ dữ liệu phân tán đến góc nhìn vận hành thống nhất.</h2>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.65, maxWidth: 490 }}>Một nền tảng kết nối có thể hợp nhất dữ liệu sản xuất, giao nhận và tài chính để đội ngũ theo dõi biến động sớm hơn. Mô hình dưới đây mang tính minh họa, không phải số liệu khách hàng thực tế.</p>
          <div className="case-steps">
            <div className="case-step"><small>HIỆN TRẠNG</small><h4>Báo cáo thủ công, dữ liệu rời rạc</h4><p>Đội ngũ phải đối soát nhiều bảng tính và hệ thống.</p></div>
            <div className="case-step"><small>GIẢI PHÁP</small><h4>Nền tảng vận hành kết nối</h4><p>Dữ liệu quan trọng được hợp nhất và quy trình được tự động hóa.</p></div>
            <div className="case-step"><small>KẾT QUẢ HƯỚNG TỚI</small><h4>Kiểm soát vận hành kịp thời</h4><p>Rủi ro được nhận diện sớm để đội ngũ chủ động xử lý.</p></div>
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <Link href="/resources" className="btn btn-primary">Xem tài nguyên <ArrowRightIcon width={15} /></Link>
            <Link href="/contact" className="btn btn-light">Trao đổi với chuyên gia</Link>
          </div>
        </div></Reveal>
        <Reveal delay={0.15}><div className="case-dashboard" aria-label="Bản xem trước minh họa bảng điều khiển vận hành sản xuất">
          <div className="case-dashboard-top"><span>Mô hình vận hành số</span><span style={{ color: "#6ee0b2" }}>● Dữ liệu trực tiếp</span></div>
          <div className="case-body">
            <aside className="case-side"><p>Vận hành</p><i className="case-site-item active" /><i className="case-site-item" /><i className="case-site-item" /><i className="case-site-item" /></aside>
            <div className="case-visuals">
              <div className="dark-panel"><label>Sản lượng</label><strong>Minh họa</strong><span>Dữ liệu theo thời gian</span></div>
              <div className="dark-panel"><label>Tiến độ giao hàng</label><strong>Minh họa</strong><span>Cảnh báo theo ngưỡng</span></div>
              <div className="dark-panel wide"><label>Hiệu suất nhà máy</label><div className="dark-bars">{[52, 75, 63, 86, 79, 96, 72, 91].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></div>
            </div>
          </div>
        </div></Reveal>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Vì sao chọn QTS</span>
          <h2>Rõ ràng trong từng lớp của hệ thống doanh nghiệp.</h2>
          <p>Mỗi mô-đun, quy trình và báo cáo được thiết kế để giúp hoạt động phức tạp trở nên dễ hiểu và dễ kiểm soát.</p>
        </div></Reveal>
        <div className="company-points" style={{ marginTop: 32 }}>
          <Reveal delay={0}><div className="company-point"><i><ShieldCheckIcon /></i><h3>Bảo mật ngay từ thiết kế</h3><p>Kiến trúc ưu tiên API, luồng công việc có thể kiểm tra và kiểm soát truy cập theo vai trò.</p></div></Reveal>
          <Reveal delay={0.1}><div className="company-point"><i><SparklesIcon /></i><h3>Trí tuệ trong quy trình</h3><p>AI hỗ trợ phát hiện tín hiệu và đề xuất hành động ngay tại nơi công việc diễn ra.</p></div></Reveal>
          <Reveal delay={0.2}><div className="company-point"><i><CheckCircleIcon /></i><h3>Phát triển có phương pháp</h3><p>Quy trình từ khám phá, thiết kế, xây dựng đến triển khai và tối ưu được tổ chức rõ ràng.</p></div></Reveal>
        </div>
      </div>
    </section>
    <CallToAction />
  </MarketingShell>;
}
