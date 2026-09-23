import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { IndustryBento, IndustryEcosystemMap, TrustedBand } from "@/components/marketing/industries/IndustryExperience";
import ProofPointShowcase from "@/components/marketing/ProofPointShowcase";
import { industryProofPoints } from "@/lib/marketing-proof-points";

export const metadata = buildMetadata({
  title: "Ngành - QTS",
  description: "Nền tảng công nghệ cho y tế, sản xuất, tài chính, bán lẻ, giáo dục và logistics - thiết kế quanh kết quả vận hành có thể theo dõi.",
  path: "/industries",
});

export default function Page() {
  return <MarketingShell>
    <section className="industries-hero noise"><div className="container industries-hero-grid"><div><span className="eyebrow">Ngành · Hệ thống doanh nghiệp</span><h1 className="display">Giải pháp công nghệ cho từng ngành.</h1><p>QTS chuyển những ràng buộc đặc thù của từng ngành thành trải nghiệm sản phẩm kết nối - để hệ thống, quyết định và điểm bàn giao có thể vận hành như một thể thống nhất.</p><div className="page-hero-actions"><Link href="#industry-solutions" className="btn btn-primary">Khám phá giải pháp theo ngành <ArrowRightIcon width={15} /></Link><Link href="/contact" className="btn btn-light">Trao đổi với chuyên gia</Link></div><div className="industries-hero-note"><b>Thiết kế cho những tổ chức có chi phí vận hành phân mảnh cao.</b><span>Y tế · Sản xuất · Tài chính · Bán lẻ · Giáo dục · Logistics</span></div></div><IndustryEcosystemMap /></div></section>
    <TrustedBand />
    <ProofPointShowcase
      eyebrow="Bối cảnh thực tế tại Việt Nam"
      title="Mỗi ngành có một thực tế vận hành riêng ở Việt Nam."
      copy="Các ví dụ dưới đây bám vào tài liệu trong nước — Quyết định 1313/QĐ-BYT, kế hoạch chuyển đổi số ngành Ngân hàng, Cơ sở dữ liệu ngành Giáo dục, cùng báo cáo Bộ Công Thương và Tổng cục Thống kê — để nối ràng buộc ngành với bề mặt QTS. Đây không phải kết quả khách hàng."
      items={industryProofPoints}
      contextLabel="Bối cảnh thực tế Việt Nam"
      tone="paper"
    />
    <section className="section" id="industry-solutions" style={{ background: "#fff" }}><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Thiết kế trong bối cảnh</span><h2>Mỗi ngành có một thực tế vận hành riêng.</h2><p>QTS bắt đầu từ áp lực doanh nghiệp đang cảm nhận, rồi thiết kế bề mặt nền tảng giúp thay đổi kết quả.</p></div></Reveal><Reveal delay={0.1}><IndustryBento /></Reveal></div></section>
    <section className="section" style={{ background: "var(--paper)" }}><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Đọc bối cảnh Việt Nam</span><h2>Từ tài liệu ngành đến lộ trình triển khai phù hợp.</h2><p>QTS dùng các quy trình và chỉ dấu đã được công bố trong nước để bắt đầu cuộc trao đổi — không trình bày chúng như lời chứng thực hay kết quả của khách hàng.</p></div></Reveal><div className="customer-story-grid">{[
      { industry: "Y tế · QĐ 1313/QĐ-BYT", before: "Khoa Khám bệnh phải nối tiếp đón, khám lâm sàng, cận lâm sàng, thanh toán và lĩnh thuốc.", after: "Bề mặt điều phối có thể bám theo từng bước, hồ sơ và điểm quay lại kết luận trong quy trình bệnh viện." },
      { industry: "Sản xuất · MOIT/NSO 2024", before: "Sản xuất, tồn kho, chất lượng và tài chính cần cùng nhìn trạng thái nhà máy trong bối cảnh IIP 2024 tăng 8,4%.", after: "Nền tảng có thể nối tín hiệu máy — xưởng — kho — giao hàng và báo cáo theo vai trò." },
      { industry: "Tài chính · NHNN 810/QĐ-NHNN", before: "Giao dịch số tăng quy mô, đòi hỏi eKYC, phân quyền, đối soát và truy vết theo kế hoạch chuyển đổi số ngành Ngân hàng.", after: "Quy trình quản trị đưa phê duyệt, thanh toán, kiểm soát và audit vào cùng một hành trình." },
    ].map((story) => <article key={story.industry} className="customer-story-card"><div className="customer-story-body"><span>{story.industry} · Bối cảnh thực tế Việt Nam</span><dl><div><dt>Văn bản ghi nhận</dt><dd>{story.before}</dd></div><div><dt>Bề mặt có thể thiết kế</dt><dd>{story.after}</dd></div></dl><Link href="/contact">Trao đổi bối cảnh của tổ chức →</Link></div></article>)}</div></div></section>
    <CallToAction title="Xây dựng giải pháp quanh ràng buộc quan trọng nhất." copy="Mang thách thức ngành của bạn đến QTS. Rời đi với góc nhìn rõ ràng về lợi thế vận hành phía trước." />
  </MarketingShell>;
}
