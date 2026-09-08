import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CloudIcon, CommandLineIcon, GlobeAltIcon, SparklesIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import SolutionsBento from "@/components/marketing/SolutionsBento";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Giải pháp — QTS",
  description: "Phần mềm doanh nghiệp, nền tảng SaaS, AI, hệ thống đám mây và ứng dụng web được xây dựng cho hiệu quả kinh doanh.",
};

const details = [
  { title: "Phần mềm doanh nghiệp", copy: "Hệ thống cốt lõi thay thế bảng tính và công cụ rời rạc bằng một mô hình vận hành thống nhất.", icon: Squares2X2Icon, points: ["Hợp nhất dữ liệu vận hành, tài chính và giao hàng", "Quy trình có thể kiểm tra với phân quyền theo vai trò"] },
  { title: "Nền tảng SaaS", copy: "Sản phẩm có khả năng mở rộng, ưu tiên API và sẵn sàng phát triển theo thị trường.", icon: GlobeAltIcon, points: ["Nền tảng đa khách hàng với khả năng mở rộng an toàn", "Thiết kế hướng tới khả năng áp dụng và phát triển"] },
  { title: "Giải pháp AI", copy: "Trí tuệ được tích hợp vào luồng công việc để đội ngũ nhận diện rủi ro và ra quyết định tự tin hơn.", icon: SparklesIcon, points: ["Dự báo, đề xuất và trợ lý công việc", "Đầu ra đáng tin cậy với giám sát của con người"] },
  { title: "Hệ thống đám mây", copy: "Nền tảng hiện đại có khả năng mở rộng và duy trì triển khai bền vững.", icon: CloudIcon, points: ["Dịch vụ có thể kết hợp với quy trình phát hành rõ ràng", "Kết nối an toàn và khả năng quan sát hệ thống"] },
  { title: "Ứng dụng web", copy: "Trải nghiệm số hiệu năng cao giúp hoạt động kinh doanh tiến về phía trước.", icon: CommandLineIcon, points: ["Giao diện hiệu năng cao và dễ tiếp cận", "Từ hệ thống quản trị đến sản phẩm cho khách hàng"] },
];

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="Giải pháp" title="Công nghệ giúp doanh nghiệp tiến về phía trước.">
      <p>Từ hệ thống quản trị đến giao diện khách hàng sử dụng mỗi ngày, QTS chuyển công việc tạo nên lợi thế thành sản phẩm số.</p>
      <p>Mỗi giải pháp bắt đầu từ bài toán, trải nghiệm cần có và kết quả vận hành hướng tới.</p>
      <div className="page-hero-actions">
        <Link href="/contact" className="btn btn-primary">Yêu cầu tư vấn <ArrowRightIcon width={15} /></Link>
        <Link href="/platform" className="btn btn-light">Khám phá nền tảng</Link>
      </div>
    </PageHero>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Kiến trúc giải pháp QTS</span>
          <h2>Một hệ sinh thái, năm nhóm giải pháp.</h2>
          <p>Các giải pháp có thể chạy trên cùng một lõi nền tảng để dữ liệu, quy trình và trí tuệ luôn kết nối.</p>
        </div></Reveal>
        <Reveal delay={0.1}><SolutionsBento /></Reveal>
        <div className="detail-rows">
          {details.map(({ title, copy, points, icon: Icon }, i) => <Reveal key={title} delay={i * 0.08}><article className="detail-row">
            <i><Icon /></i>
            <div><h3>{title}</h3><p>{copy}</p><ul style={{ margin: "12px 0 0", paddingLeft: 16, color: "#5b5e73", fontSize: 12, lineHeight: 1.6 }}>{points.map((p) => <li key={p}>{p}</li>)}</ul></div>
          </article></Reveal>)}
        </div>
      </div>
    </section>
    <section className="section" style={{ background: "#f7f8fc" }}>
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Tác động kinh doanh</span>
          <h2>Kết quả được xác định ngay từ thiết kế sản phẩm.</h2>
          <p>QTS xác định thành công bằng thay đổi vận hành có thể quan sát, không chỉ bằng danh sách tính năng.</p>
        </div></Reveal>
        <Reveal delay={0.1}><div className="platform-benefits">
          <div className="platform-benefit"><b>Kết nối</b><span>Bối cảnh khách hàng thống nhất giữa các bộ phận</span></div>
          <div className="platform-benefit"><b>Tin cậy</b><span>Một nguồn dữ liệu vận hành và tài chính nhất quán</span></div>
          <div className="platform-benefit"><b>Kịp thời</b><span>Báo cáo và tín hiệu vận hành theo thời gian</span></div>
          <div className="platform-benefit"><b>Tự động</b><span>Giảm điểm bàn giao thủ công trong quy trình</span></div>
        </div></Reveal>
      </div>
    </section>
    <CallToAction title="Mang đến lộ trình của bạn. QTS cùng xây dựng nền tảng." copy="QTS cùng doanh nghiệp làm rõ cơ hội có giá trị nhất trong một buổi trao đổi tập trung." />
  </MarketingShell>;
}
