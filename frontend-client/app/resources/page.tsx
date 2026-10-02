import { buildMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { resourceCategories, resources } from "@/components/marketing/resources/catalog";
import { ResourceCardGrid } from "@/components/marketing/resources/ResourceCards";
import ProofPointShowcase from "@/components/marketing/ProofPointShowcase";
import { resourceProofPoints } from "@/lib/marketing-proof-points";

export const metadata = buildMetadata({
  title: "Tài nguyên - QTS",
  description: "Trung tâm tri thức QTS: bối cảnh ngành Việt Nam có nguồn, hướng dẫn giải pháp, góc nhìn công nghệ, thư viện kiến trúc và theo dõi chủ đề.",
  path: "/resources",
});

export default function Page() {
  const featured = resources.find((r) => r.slug === "global-manufacturing") ?? resources[0];
  const editorial = resources.slice(1, 7);

  return <MarketingShell>
    <section className="resource-hero noise">
      <div className="container">
        <div className="resource-hero-top">
          <div>
            <span className="eyebrow">Tài nguyên · Bối cảnh và nguồn</span>
            <h1 className="display">Góc nhìn làm rõ quyết định nền tảng tiếp theo.</h1>
            <p>Tài nguyên QTS gồm hai lớp: bối cảnh ngành Việt Nam được dẫn từ nguồn công khai và tài liệu kỹ thuật giúp làm rõ quyết định sản phẩm. Nội dung không phải hồ sơ hay kết quả khách hàng đã triển khai.</p>
            <div className="resource-category-pills">
              {resourceCategories.map((category) => <Link key={category.slug} href={`/resources/${category.slug}`} className="resource-pill">{category.label}</Link>)}
            </div>
          </div>
          <Reveal delay={0.15}><div className="resource-hero-proof">
            <div className="resource-proof-card"><b>5</b><span>Nhóm tài nguyên theo nhu cầu tìm hiểu</span></div>
            <div className="resource-proof-card"><b>{resources.length}</b><span>Tài nguyên có trang chi tiết riêng</span></div>
            <div className="resource-proof-card"><b>5</b><span>Chủ đề giải pháp được liên kết</span></div>
          </div></Reveal>
        </div>

        <Reveal delay={0.2}><Link href={featured.href} className="resource-feature">
          <div className="resource-feature-media">
            <Image src={featured.image} alt={featured.imageAlt} fill priority sizes="(max-width: 950px) 100vw, 58vw" />
            <span className="resource-feature-badges"><i>{featured.type}</i><i>Bối cảnh ngành Việt Nam</i></span>
          </div>
          <div className="resource-feature-body">
            <span className="eyebrow">Bối cảnh nổi bật</span>
            <h2>Cách tiếp cận chuyển đổi cùng QTS</h2>
            <h3>{featured.title}</h3>
            <p>{featured.description} — dữ liệu ngành công khai để đối chiếu, không phải kết quả khách hàng đã công bố.</p>
            <div className="resource-feature-metrics">
              <span><b>Kết nối</b><small>dữ liệu vận hành</small></span>
              <span><b>Tự động</b><small>quy trình báo cáo</small></span>
              <span><b>Kịp thời</b><small>tín hiệu quyết định</small></span>
            </div>
            <span className="btn btn-primary">Xem bối cảnh có nguồn <ArrowRightIcon width={15} /></span>
            <small className="resource-feature-meta">{featured.type} · {featured.readingTime}</small>
          </div>
        </Link></Reveal>
      </div>
    </section>

    <ProofPointShowcase
      eyebrow="Nguồn và bối cảnh vận hành"
      title="Tài nguyên được tổ chức theo mục tiêu tìm hiểu, không chỉ theo định dạng."
      copy="Bối cảnh ngành có nguồn, hướng dẫn kỹ thuật và cập nhật sản phẩm được tách rõ để người đọc biết nội dung nào phục vụ quyết định nào."
      items={resourceProofPoints}
      tone="paper"
    />

    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Đọc theo mục tiêu</span>
          <h2>Bắt đầu từ câu hỏi bạn đang cần trả lời.</h2>
          <p>Mỗi nhóm tài nguyên phục vụ một thời điểm khác nhau - từ làm rõ khả năng thay đổi đến lựa chọn kiến trúc có thể duy trì lợi thế dài hạn.</p>
        </div></Reveal>
        <Reveal delay={0.1}><div className="resource-category-grid">
          {resourceCategories.map((category) => <Link key={category.slug} href={`/resources/${category.slug}`} className={`resource-category-card resource-category-${category.slug}`}>
            <span className="resource-category-cover" aria-hidden="true">
              <Image
                src={resources.find((r) => r.category === category.slug)?.image ?? "/images/home/enterprise-operations.jpg"}
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

    <section className="section" style={{ background: "var(--paper)" }}>
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Nội dung chọn lọc</span>
          <h2>Tài liệu đang được quan tâm.</h2>
          <p>Bối cảnh ngành, quyết định kiến trúc và góc nhìn kỹ thuật - được tổ chức theo nhu cầu thay vì chỉ theo ngày đăng.</p>
        </div></Reveal>
        <Reveal delay={0.1}><ResourceCardGrid resources={editorial} /></Reveal>
        <Reveal delay={0.15}><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link href="/resources/case-studies" className="btn btn-primary">Xem bối cảnh ngành <ArrowRightIcon width={15} /></Link>
          <Link href="/contact" className="btn btn-light">Yêu cầu danh sách tài liệu phù hợp</Link>
        </div></Reveal>
      </div>
    </section>

    <CallToAction title="Làm rõ hơn cho quyết định chuyển đổi tiếp theo." copy="Bắt đầu từ bài toán vận hành. QTS cùng định hình sản phẩm, nền tảng và cơ sở cho quyết định phía trước." />
  </MarketingShell>;
}
