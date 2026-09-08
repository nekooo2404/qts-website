import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, BoltIcon, ChartBarIcon, CloudIcon, CubeTransparentIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import PlatformExplorer from "@/components/marketing/PlatformExplorer";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import ProductExperienceLazy from "@/components/marketing/ProductExperienceLazy";

export const metadata: Metadata = {
  title: "Nền tảng doanh nghiệp — QTS",
  description: "Khám phá nền tảng QTS kết nối CRM, ERP, AI, phân tích, điều phối quy trình và hệ thống đám mây.",
};

const foundations = [
  ["CRM", "Bối cảnh khách hàng sẵn có cho mọi bộ phận.", UserGroupIcon],
  ["ERP", "Dữ liệu vận hành và tài chính đáng tin cậy.", CubeTransparentIcon],
  ["AI", "Đề xuất giúp biến tín hiệu thành hành động.", SparklesIcon],
  ["Analytics", "Số liệu phục vụ quyết định đúng thời điểm.", ChartBarIcon],
  ["Workflow", "Tự động hóa giúp công việc phức tạp tiếp tục vận hành.", BoltIcon],
  ["Cloud", "Nền tảng an toàn, ưu tiên API và có khả năng mở rộng.", CloudIcon],
] as const;

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="Nền tảng doanh nghiệp QTS" title="Các hệ thống thiết yếu cùng vận hành thống nhất." aside={<><div className="hero-fact"><i><ChartBarIcon /></i><span><b>Góc nhìn phục vụ quyết định</b><small>Tín hiệu trở thành hành động trên toàn đội ngũ.</small></span></div><div className="hero-fact"><i><BoltIcon /></i><span><b>Tự động hóa trong luồng việc</b><small>Ít điểm bàn giao, thêm năng lực cho công việc chiến lược.</small></span></div><div className="hero-fact"><i><CloudIcon /></i><span><b>Sẵn sàng cho thay đổi</b><small>Ưu tiên API và được thiết kế để phát triển.</small></span></div></>}>
      <p>QTS thay thế công nghệ phân mảnh bằng nền tảng vận hành thích ứng, được thiết kế quanh cách tổ chức tạo ra giá trị.</p>
      <p>Khám phá các mô-đun bên dưới để xem bài toán, bề mặt sản phẩm và kết quả vận hành hướng tới.</p>
      <div className="page-hero-actions"><Link href="/contact" className="btn btn-primary">Yêu cầu tư vấn <ArrowRightIcon width={15} /></Link></div>
    </PageHero>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading"><span className="eyebrow">Kết nối ngay từ thiết kế</span><h2>Nền tảng thông minh hơn khi kết nối thêm hệ thống.</h2><p>QTS đưa dữ liệu, con người và quy trình vào một lớp doanh nghiệp được quản trị — không buộc đội ngũ phải từ bỏ công cụ đang hoạt động tốt.</p></div></Reveal>
        <Reveal delay={0.1}><PlatformExplorer /></Reveal>
      </div>
    </section>
    <section className="section" style={{ background: "#f7f8fc" }}>
      <div className="container">
        <Reveal><div className="section-heading"><span className="eyebrow">Trải nghiệm sản phẩm</span><h2>Rõ ràng ở tốc độ vận hành doanh nghiệp.</h2><p>Mỗi tín hiệu, tác vụ và quyết định nằm trong giao diện giúp hoạt động phức tạp trở nên dễ hiểu.</p></div></Reveal>
        <Reveal delay={0.1}><ProductExperienceLazy /></Reveal>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading"><span className="eyebrow">Năng lực nền tảng</span><h2>Sáu mô-đun. Một lõi đáng tin cậy.</h2><p>Bắt đầu từ một nhu cầu hoặc kết nối toàn bộ mô hình vận hành.</p></div></Reveal>
        <div className="detail-rows">
          {foundations.map(([name, copy, Icon], i) => <Reveal key={name} delay={i * 0.08}><article className="detail-row"><i><Icon /></i><div><h3>QTS {name}</h3><p>{copy}</p></div></article></Reveal>)}
        </div>
      </div>
    </section>
    <CallToAction title="Biến các hệ thống rời rạc thành một lợi thế vận hành." />
  </MarketingShell>;
}
