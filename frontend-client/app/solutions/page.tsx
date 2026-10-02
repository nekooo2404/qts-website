import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRightIcon, CloudIcon, CommandLineIcon, GlobeAltIcon, SparklesIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import SolutionsBento from "@/components/marketing/SolutionsBento";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import ProofPointShowcase from "@/components/marketing/ProofPointShowcase";
import { solutionProofPoints } from "@/lib/marketing-proof-points";
import { solutionThemes } from "@/lib/solution-catalog";

export const metadata = buildMetadata({
  title: "Giải pháp - QTS",
  description: "Phần mềm doanh nghiệp, nền tảng SaaS, AI, hệ thống đám mây và ứng dụng web được xây dựng cho hiệu quả kinh doanh.",
  path: "/solutions",
});

const iconMap = {
  enterprise: Squares2X2Icon,
  platform: GlobeAltIcon,
  ai: SparklesIcon,
  cloud: CloudIcon,
  web: CommandLineIcon,
} as const;

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
    <ProofPointShowcase
      eyebrow="Luồng vận hành theo giải pháp"
      title="Mỗi nhóm giải pháp có một luồng vận hành để nhìn rõ mục tiêu sản phẩm."
      copy="Các luồng vận hành này giúp phân biệt phần mềm doanh nghiệp, nền tảng phần mềm, AI và đám mây bằng dữ liệu, quyền và quyết định cụ thể thay vì chỉ bằng danh sách tính năng."
      items={solutionProofPoints}
      tone="paper"
    />
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Kiến trúc giải pháp QTS</span>
          <h2>Một hệ sinh thái, năm nhóm giải pháp.</h2>
          <p>Các giải pháp có thể chạy trên cùng một lõi nền tảng để dữ liệu, quy trình và trí tuệ luôn kết nối.</p>
        </div></Reveal>
        <Reveal delay={0.1}><SolutionsBento /></Reveal>
        <div className="detail-rows">
          {solutionThemes.map(({ title, description, icon, slug, topics }, i) => {
            const Icon = iconMap[icon];
            return <Reveal key={slug} delay={i * 0.08}><article className="detail-row">
              <i><Icon /></i>
              <div><h3><Link href={`/solutions/${slug}`}>{title}</Link></h3><p>{description}</p><ul style={{ margin: "12px 0 0", paddingLeft: 16, color: "var(--muted)", fontSize: 12, lineHeight: 1.6 }}>{topics.slice(0, 2).map((p) => <li key={p}>{p}</li>)}</ul></div>
            </article></Reveal>;
          })}
        </div>
      </div>
    </section>
    <section className="section" style={{ background: "var(--paper)" }}>
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
