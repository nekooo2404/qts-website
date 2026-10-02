import { buildMetadata } from "@/lib/seo";
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import ContactForm from "@/components/marketing/ContactForm";
import Reveal from "@/components/marketing/Reveal";
import { COMPANY } from "@/lib/company";
import ProofPointShowcase from "@/components/marketing/ProofPointShowcase";
import { contactProofPoints } from "@/lib/marketing-proof-points";

export const metadata = buildMetadata({
  title: "Liên hệ QTS",
  description: "Trao đổi với QTS về phần mềm doanh nghiệp, AI, đám mây hoặc cơ hội chuyển đổi số.",
  path: "/contact",
});

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="Liên hệ QTS" title="Cùng xây dựng lợi thế số tiếp theo." aside={<><div className="hero-fact"><i><ClockIcon /></i><span><b>Phản hồi trong ngày làm việc</b><small>QTS tiếp nhận và phản hồi yêu cầu với thông tin phù hợp.</small></span></div><div className="hero-fact"><i><ShieldCheckIcon /></i><span><b>Trao đổi theo nhu cầu doanh nghiệp</b><small>Bắt đầu từ vấn đề vận hành quan trọng nhất.</small></span></div><div className="hero-fact"><i><CheckCircleIcon /></i><span><b>Định hướng rõ ràng</b><small>Làm rõ bài toán, phạm vi và bước triển khai phù hợp.</small></span></div></>}>
      <p>Hãy cho QTS biết bài toán doanh nghiệp đang cần giải quyết. Thông tin bạn chia sẻ sẽ giúp buổi trao đổi đầu tiên đi thẳng vào nhu cầu thực tế.</p>
    </PageHero>
    <ProofPointShowcase
      eyebrow="Chuẩn bị yêu cầu nhanh hơn"
      title="Trang liên hệ cũng có dữ liệu mẫu để người dùng biết nên gửi gì."
      copy="Các mẫu bên dưới giúp người dùng hình dung thông tin cần chuẩn bị: vấn đề, phạm vi hệ thống, mức ưu tiên và nguyên tắc bảo mật khi gửi yêu cầu."
      items={contactProofPoints}
      tone="paper"
    />
    <section className="section" style={{ paddingTop: 8 }}>
      <div className="container contact-layout">
        <Reveal><div>
          <span className="eyebrow">Bắt đầu trao đổi</span>
          <h2 className="display" style={{ fontSize: "clamp(36px,4vw,52px)", margin: "18px 0" }}>Chỉ cần mang đến vấn đề vận hành, chưa cần một bản yêu cầu hoàn chỉnh.</h2>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.65 }}>Từ quy trình gián đoạn, hệ thống phân mảnh đến cơ hội ứng dụng AI, QTS cùng doanh nghiệp làm rõ quyết định công nghệ tiếp theo.</p>
          <div className="contact-aside">
            <div className="contact-note"><i><CheckCircleIcon /></i><span>Phần mềm doanh nghiệp, nền tảng phần mềm, AI, đám mây và chuyển đổi nền tảng</span></div>
            <div className="contact-note"><i><ShieldCheckIcon /></i><span>Thông tin chỉ được sử dụng để phản hồi yêu cầu tư vấn</span></div>
            <div className="contact-note"><i><ClockIcon /></i><span>{COMPANY.phone} · <a href={COMPANY.contactUrl} target="_blank" rel="noreferrer">{COMPANY.contactDomain}</a></span></div>
          </div>
        </div></Reveal>
        <Reveal delay={0.15}><div className="contact-panel"><h2>Yêu cầu tư vấn</h2><p>Chia sẻ bài toán, nền tảng hoặc kết quả bạn đang hướng tới.</p><ContactForm /></div></Reveal>
      </div>
    </section>
  </MarketingShell>;
}
