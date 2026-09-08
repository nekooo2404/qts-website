import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { resourceCategories, resources } from "@/components/marketing/resources/catalog";
import { ResourceCardGrid } from "@/components/marketing/resources/ResourceCards";

export const metadata: Metadata = {
  title: "Tài nguyên — QTS",
  description: "Trung tâm tri thức QTS: tình huống ứng dụng, hướng dẫn giải pháp, góc nhìn công nghệ, chuyên khảo và cập nhật sản phẩm.",
};

export default function Page() {
  const featured = resources.find((r) => r.slug === "global-manufacturing") ?? resources[0];
  const editorial = resources.slice(1);

  return <MarketingShell>
    <section className="resource-hero noise">
      <div className="container">
        <div className="resource-hero-top">
          <div>
            <span className="eyebrow">Tài nguyên · Trung tâm tri thức</span>
            <h1 className="display">Góc nhìn làm rõ quyết định nền tảng tiếp theo.</h1>
            <p>Tài nguyên QTS trình bày cách tiếp cận các bài toán vận hành, dữ liệu và quy trình dưới góc nhìn sản phẩm. Tình huống ứng dụng trên website là mô hình tham khảo, không phải tuyên bố về khách hàng đã triển khai.</p>
            <div className="resource-category-pills">
              {resourceCategories.map((category) => <Link key={category.slug} href={`/resources/${category.slug}`} className="resource-pill">{category.label}</Link>)}
            </div>
          </div>
          <Reveal delay={0.15}><div className="resource-hero-proof">
            <div className="resource-proof-card"><b>5</b><span>Nhóm tài nguyên theo nhu cầu tìm hiểu</span></div>
            <div className="resource-proof-card"><b>6</b><span>Bối cảnh ngành trong các mô hình tham khảo</span></div>
            <div className="resource-proof-card"><b>3</b><span>Tài liệu chuyên khảo tiếng Việt có thể tải xuống</span></div>
          </div></Reveal>
        </div>

        <Reveal delay={0.2}><Link href={featured.href} className="resource-feature">
          <div className="resource-feature-media">
            <Image src="/images/resources/manufacturing-operations.svg" alt="Minh họa trung tâm điều hành sản xuất kết nối" fill priority sizes="(max-width: 950px) 100vw, 58vw" />
            <span className="resource-feature-badges"><i>Tình huống tham khảo</i><i>Sản xuất · Vận hành số</i></span>
          </div>
          <div className="resource-feature-body">
            <span className="eyebrow">Nội dung nổi bật</span>
            <h2>Cách tiếp cận chuyển đổi cùng QTS</h2>
            <h3>{featured.title}</h3>
            <p>Báo cáo rời rạc có thể khiến người điều hành thiếu bối cảnh giữa tài chính, sản xuất và giao hàng. Mô hình này minh họa cách xây dựng một nền tảng quản trị tập trung với giao diện web, dịch vụ dữ liệu, phân tích AI và hạ tầng đám mây.</p>
            <div className="resource-feature-metrics">
              <span><b>Kết nối</b><small>dữ liệu vận hành</small></span>
              <span><b>Tự động</b><small>quy trình báo cáo</small></span>
              <span><b>Kịp thời</b><small>tín hiệu quyết định</small></span>
            </div>
            <span className="btn btn-primary">Xem tình huống tham khảo <ArrowRightIcon width={15} /></span>
            <small className="resource-feature-meta">Next.js · Django · Phân tích AI · Hạ tầng đám mây · 12 phút đọc</small>
          </div>
        </Link></Reveal>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Tìm hiểu theo mục tiêu</span>
          <h2>Bắt đầu từ câu hỏi bạn đang cần trả lời.</h2>
          <p>Mỗi nhóm tài nguyên phục vụ một thời điểm khác nhau — từ làm rõ khả năng thay đổi đến lựa chọn kiến trúc có thể duy trì lợi thế dài hạn.</p>
        </div></Reveal>
        <Reveal delay={0.1}><div className="resource-category-grid">
          {resourceCategories.map((category) => <Link key={category.slug} href={`/resources/${category.slug}`} className={`resource-category-card resource-category-${category.slug}`}>
            <span className="resource-category-cover" aria-hidden="true">
              <Image
                src={category.slug === "case-studies" ? "/images/resources/manufacturing-operations.svg" : category.slug === "solutions-guides" ? "/images/resources/saas-architecture.svg" : category.slug === "technology-insights" ? "/images/resources/ai-intelligence.svg" : category.slug === "white-papers" ? "/images/resources/security-blueprint.svg" : "/images/resources/product-update.svg"}
                alt=""
                fill
                sizes="360px"
              />
            </span>
            <span className="eyebrow">{category.eyebrow}</span>
            <h3>{category.label}</h3>
            <p>{category.description}</p>
            <small>Khám phá {category.label.toLowerCase()} →</small>
          </Link>)}
        </div></Reveal>
      </div>
    </section>

    <section className="section" style={{ background: "#f7f8fc" }}>
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Nội dung chọn lọc</span>
          <h2>Tài liệu đang được quan tâm.</h2>
          <p>Mô hình ứng dụng, quyết định kiến trúc và góc nhìn kỹ thuật — được tổ chức theo nhu cầu thay vì chỉ theo ngày đăng.</p>
        </div></Reveal>
        <Reveal delay={0.1}><ResourceCardGrid resources={editorial} /></Reveal>
        <Reveal delay={0.15}><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link href="/resources/case-studies" className="btn btn-primary">Xem tình huống ứng dụng <ArrowRightIcon width={15} /></Link>
          <Link href="/contact" className="btn btn-light">Yêu cầu danh sách tài liệu phù hợp</Link>
        </div></Reveal>
      </div>
    </section>

    <CallToAction title="Làm rõ hơn cho quyết định chuyển đổi tiếp theo." copy="Bắt đầu từ bài toán vận hành. QTS cùng định hình sản phẩm, nền tảng và cơ sở cho quyết định phía trước." />
  </MarketingShell>;
}
