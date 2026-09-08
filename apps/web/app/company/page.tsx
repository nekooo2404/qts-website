import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { CompanyHeroVisual, CompanyTimeline, CultureGallery, MethodologyExperience } from "@/components/marketing/company/CompanyExperience";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Giới thiệu — QTS",
  description: "QTS xây dựng nền tảng phần mềm bền vững, vận hành thông minh và hạ tầng công nghệ dài hạn cho doanh nghiệp.",
};

const stack = [
  { title: "Lớp trải nghiệm", copy: "Giao diện được thiết kế cho công việc cần quyết định nhanh và chính xác.", technologies: ["Next.js", "React", "TypeScript"] },
  { title: "Nền tảng", copy: "Lõi doanh nghiệp an toàn và kết nối.", technologies: ["Django", "PostgreSQL", "REST API"] },
  { title: "Lớp trí tuệ", copy: "Hệ thống có khả năng mở rộng và học hỏi theo dữ liệu.", technologies: ["Cloud", "Data", "AI"] },
];

export default function Page() {
  return <MarketingShell>
    <section className="company-hero noise">
      <div className="container company-hero-grid"><div><span className="eyebrow">Công ty · QTS</span><h1 className="display">Xây dựng nền tảng công nghệ cho thế hệ doanh nghiệp tiếp theo.</h1><p>QTS kết hợp tư duy sản phẩm, kỹ thuật hệ thống và năng lực triển khai doanh nghiệp trong một mô hình vận hành thống nhất — giúp tổ chức chuyển những bài toán phức tạp thành năng lực bền vững.</p><div className="page-hero-actions"><Link href="/contact" className="btn btn-primary">Đồng hành cùng QTS <ArrowRightIcon width={15} /></Link><Link href="#methodology" className="btn btn-light">Cách QTS làm việc</Link></div><div className="company-hero-trust"><span><b>{COMPANY.founded}</b> chính thức hoạt động</span><span><b>5829</b> Xuất bản phần mềm khác</span><span><b>Hà Nội</b> Trụ sở doanh nghiệp</span></div><p style={{ marginTop: 12, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{COMPANY.fullName} · {COMPANY.intlName} · Trụ sở: {COMPANY.address} · Đại diện pháp luật: {COMPANY.rep}</p></div><CompanyHeroVisual /></div>
    </section>

    <section className="section company-history"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Hành trình QTS</span><h2>Phát triển từ nhu cầu vận hành thực tế của doanh nghiệp.</h2><p>QTS tập trung vào khoảng trống giữa hệ thống hiện có: các quyết định, dữ liệu và điểm bàn giao quyết định khả năng chiến lược được triển khai đến đâu.</p></div></Reveal><Reveal delay={0.1}><CompanyTimeline /></Reveal></div></section>

    <section className="section company-beliefs"><div className="container"><Reveal><span className="eyebrow">Nền tảng giá trị</span></Reveal><Reveal delay={0.1}><div className="beliefs-grid"><article><small>Sứ mệnh</small><h2>Biến những bài toán kinh doanh phức tạp thành giải pháp số có khả năng mở rộng.</h2></article><article><small>Tầm nhìn</small><h2>Trở thành đối tác hạ tầng công nghệ tin cậy của doanh nghiệp.</h2></article><article><small>Giá trị</small><div className="value-terms"><span>Đổi mới</span><span>Tin cậy</span><span>Cộng tác</span><span>An toàn</span></div><p>Giá trị chỉ có ý nghĩa khi được thể hiện trong thiết kế, phát hành và vận hành. Tại QTS, đó là tiêu chuẩn triển khai.</p></article></div></Reveal></div></section>

    <section className="section" id="methodology"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Cách QTS làm việc</span><h2>Hệ thống triển khai hướng tới chuyển động của doanh nghiệp.</h2><p>Ra mắt không phải là điểm kết thúc. QTS xây dựng lộ trình từ bài toán kinh doanh đến năng lực vận hành có thể đo lường và cải tiến liên tục.</p></div></Reveal><Reveal delay={0.1}><MethodologyExperience /></Reveal></div></section>

    <section className="section company-culture"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Văn hóa triển khai</span><h2>Thiết kế trong cộng tác. Xây dựng bằng năng lực kỹ thuật.</h2><p>Đội ngũ QTS làm cho công việc phức tạp trở nên rõ ràng từ sớm, thẳng thắn với giả định yếu và bám sát vận hành để nền tảng hữu ích ngay từ ngày đầu.</p></div></Reveal><Reveal delay={0.1}><CultureGallery /></Reveal></div></section>

    <section className="section company-technology" id="technology"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Năng lực kỹ thuật</span><h2>Kiến trúc tạo nên tăng trưởng bền vững.</h2><p>Lựa chọn công nghệ chỉ có giá trị khi giúp doanh nghiệp an toàn hơn, linh hoạt hơn và sẵn sàng cho thay đổi.</p></div></Reveal><Reveal delay={0.1}><div className="tech-grid">{stack.map(({ title, copy, technologies }, index) => <article className="tech-group" key={title}>{index !== 1 && <i className="arch-line" />}{index === 1 ? <div className="arch-node"><div><i className="brand-mark" /><strong>QTS Platform Core</strong><span>Có thể mở rộng, an toàn và ưu tiên API</span></div></div> : <><h3>{title}</h3><p>{copy}</p><div className="tech-stack">{technologies.map((technology) => <span className="tech-pill" key={technology}><i />{technology}</span>)}</div></>}</article>)}</div></Reveal></div></section>

    <section className="section industries" id="security"><div className="container contact-layout"><Reveal><div><span className="eyebrow">An toàn và tin cậy</span><h2 className="display" style={{ color: "#fff", fontSize: "clamp(38px,4vw,56px)", margin: "18px 0" }}>Kiểm soát chặt chẽ, vận hành thông suốt.</h2><p style={{ color: "#aeb2c9", fontSize: 16, lineHeight: 1.65 }}>QTS tích hợp quản trị vào nền tảng để đội ngũ di chuyển với sự tin cậy — mọi quyết định đều có thể truy vết và mọi tích hợp đều có ranh giới rõ ràng.</p></div></Reveal><Reveal delay={0.15}><div className="contact-aside"><div className="contact-note"><i><LockClosedIcon /></i><span>Phân quyền theo vai trò và quy trình được quản trị</span></div><div className="contact-note"><i><ShieldCheckIcon /></i><span>Kiến trúc tích hợp an toàn, ưu tiên API</span></div><div className="contact-note"><i><CheckCircleIcon /></i><span>Vận hành có thể kiểm tra và theo dõi sức khỏe hệ thống</span></div></div></Reveal></div></section>
    <CallToAction title="Để quyết định nền tảng tiếp theo có trọng lượng hơn." />
  </MarketingShell>;
}
