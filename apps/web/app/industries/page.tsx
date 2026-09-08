import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { IndustryBento, IndustryEcosystemMap, TrustedBand } from "@/components/marketing/industries/IndustryExperience";

export const metadata: Metadata = {
  title: "Ngành — QTS",
  description: "Nền tảng công nghệ cho y tế, sản xuất, tài chính, bán lẻ, giáo dục và logistics — thiết kế quanh kết quả vận hành có thể theo dõi.",
};

export default function Page() {
  return <MarketingShell>
    <section className="industries-hero noise"><div className="container industries-hero-grid"><div><span className="eyebrow">Ngành · Hệ thống doanh nghiệp</span><h1 className="display">Giải pháp công nghệ cho từng ngành.</h1><p>QTS chuyển những ràng buộc đặc thù của từng ngành thành trải nghiệm sản phẩm kết nối — để hệ thống, quyết định và điểm bàn giao có thể vận hành như một thể thống nhất.</p><div className="page-hero-actions"><Link href="#industry-solutions" className="btn btn-primary">Khám phá giải pháp theo ngành <ArrowRightIcon width={15} /></Link><Link href="/contact" className="btn btn-light">Trao đổi với chuyên gia</Link></div><div className="industries-hero-note"><b>Thiết kế cho những tổ chức có chi phí vận hành phân mảnh cao.</b><span>Y tế · Sản xuất · Tài chính · Bán lẻ · Giáo dục · Logistics</span></div></div><IndustryEcosystemMap /></div></section>
    <TrustedBand />
    <section className="section" id="industry-solutions"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Thiết kế trong bối cảnh</span><h2>Mỗi ngành có một thực tế vận hành riêng.</h2><p>QTS bắt đầu từ áp lực doanh nghiệp đang cảm nhận, rồi thiết kế bề mặt nền tảng giúp thay đổi kết quả.</p></div></Reveal><Reveal delay={0.1}><IndustryBento /></Reveal></div></section>
    <section className="section"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Cách tiếp cận theo ngành</span><h2>Từ mô hình tham khảo đến lộ trình triển khai phù hợp.</h2><p>Mỗi ngành đều có ví dụ minh họa về thách thức, bề mặt sản phẩm và hướng kết quả — được sử dụng như tài liệu tham khảo, không phải lời chứng thực khách hàng.</p></div></Reveal><div className="customer-story-grid">{[
      { industry: "Y tế", before: "Điều phối người bệnh thủ công giữa hồ sơ và trao đổi rời rạc.", after: "Nền tảng điều phối hỗ trợ đưa bối cảnh, năng lực và bước tiếp theo đến đội ngũ liên quan." },
      { industry: "Sản xuất", before: "Chu kỳ báo cáo kéo dài do đối soát bảng tính giữa nhà máy và tài chính.", after: "Nền tảng doanh nghiệp tập trung giúp sản xuất, giao hàng và tài chính rõ ràng theo thời gian." },
      { industry: "Tài chính", before: "Phê duyệt và đối soát nhiều bước gây chậm trễ và rủi ro.", after: "Quy trình được quản trị đưa phê duyệt, kiểm soát và bối cảnh kiểm toán vào một hành trình tin cậy." },
    ].map((story) => <article key={story.industry} className="customer-story-card"><div className="customer-story-body"><span>{story.industry} · Mô hình tham khảo</span><dl><div><dt>Trước</dt><dd>{story.before}</dd></div><div><dt>Sau</dt><dd>{story.after}</dd></div></dl><Link href="/contact">Trao đổi lộ trình tương tự →</Link></div></article>)}</div></div></section>
    <CallToAction title="Xây dựng giải pháp quanh ràng buộc quan trọng nhất." copy="Mang thách thức ngành của bạn đến QTS. Rời đi với góc nhìn rõ ràng về lợi thế vận hành phía trước." />
  </MarketingShell>;
}
