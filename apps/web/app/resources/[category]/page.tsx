import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowDownTrayIcon, ArrowRightIcon, DocumentTextIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { getCategory, getResourcesForCategory, resourceCategories } from "@/components/marketing/resources/catalog";
import { ResourceCardGrid } from "@/components/marketing/resources/ResourceCards";
import ProofPointShowcase from "@/components/marketing/ProofPointShowcase";
import { resourceCategoryProofPoints } from "@/lib/marketing-proof-points";

export function generateStaticParams() {
  return resourceCategories.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return buildMetadata({
    title: `${cat.label} - Tài nguyên QTS`,
    description: cat.description,
    path: `/resources/${category}`,
  });
}

export default async function ResourceCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();
  const entries = getResourcesForCategory(cat.slug);
  const isCaseStudies = cat.slug === "case-studies";
  const isGuides = cat.slug === "solutions-guides";
  const isInsights = cat.slug === "technology-insights";
  const isPapers = cat.slug === "white-papers";
  const isUpdates = cat.slug === "product-updates";

  return <MarketingShell>
    <section className="resource-category-hero noise">
      <div className="container">
        <Link href="/resources" className="back-link">← Trung tâm tri thức QTS</Link>
        <span className="eyebrow">{cat.eyebrow}</span>
        <h1 className="display">{cat.title}</h1>
        <p>{cat.description}</p>
        <div className="resource-category-nav">{resourceCategories.map((item) => <Link key={item.slug} href={`/resources/${item.slug}`} className={item.slug === cat.slug ? "active" : ""}>{item.label}</Link>)}</div>
      </div>
    </section>

    {isCaseStudies && <section className="section resource-context"><div className="container resource-context-grid"><Reveal><div><span className="eyebrow">Bối cảnh ngành có nguồn</span><h2>Từ ràng buộc vận hành đến định hướng kết quả.</h2><p>Mỗi nội dung đọc một áp lực vận hành từ tài liệu công khai, ánh xạ sang bề mặt sản phẩm tương ứng và nêu câu hỏi thiết kế — không phải công bố kết quả khách hàng.</p></div></Reveal><Reveal delay={0.1}><dl><div><dt>Thách thức</dt><dd>Vấn đề quyết định hoặc điểm tắc nghẽn đang làm chậm tổ chức.</dd></div><div><dt>Giải pháp QTS</dt><dd>Sản phẩm và cách triển khai giúp thay đổi công việc thực tế.</dd></div><div><dt>Định hướng kết quả</dt><dd>Điều gì có thể cải thiện khi dữ liệu và quy trình được kết nối.</dd></div></dl></Reveal></div></section>}
    {isGuides && <section className="section resource-context"><div className="container guide-framework"><span>01 · Vấn đề</span><span>02 · Cách tiếp cận</span><span>03 · Công nghệ</span><span>04 · Tác động vận hành</span></div></section>}
    {isInsights && <section className="section resource-context"><div className="container insight-intro"><SparklesIcon /><div><b>Góc nhìn từ thực tiễn triển khai của QTS</b><p>Góc nhìn công nghệ dựa trên yêu cầu thiết kế, tích hợp và vận hành hệ thống khi độ tin cậy là ưu tiên hàng đầu.</p></div></div></section>}
    {isPapers && <section className="section resource-context"><div className="container paper-intro"><DocumentTextIcon /><div><b>Tài liệu chuyên sâu sẵn sàng mang theo</b><p>Mỗi tài liệu là hướng dẫn ngắn gọn cho trao đổi chiến lược, kỹ thuật và quản trị trước một quyết định nền tảng lớn.</p></div></div></section>}
    {isUpdates && <section className="section resource-context"><div className="container update-intro"><span className="live"><i /> Kênh phát hành đang hoạt động</span><p>Các bản cập nhật được trình bày như năng lực vận hành - điều gì đã thay đổi, xuất hiện ở đâu trong nền tảng và công việc đó hỗ trợ gì.</p></div></section>}

    <ProofPointShowcase
      eyebrow="Nội dung theo chuyên mục"
      title={`${cat.label}: nội dung bám đúng mục tiêu đọc.`}
      copy="Mỗi chuyên mục có hình ảnh, nguồn và cách tiếp cận riêng để người đọc nhanh chóng hiểu nội dung này phục vụ quyết định nào."
      items={resourceCategoryProofPoints[cat.slug]}
      tone="paper"
    />

    <section className="section"><div className="container">
      <Reveal><div className="section-heading"><span className="eyebrow">{cat.label}</span><h2>{isPapers ? "Tài liệu dành cho việc tải xuống." : isUpdates ? "Góc nhìn rõ hơn về những gì đã tiến triển." : "Nội dung có thể dùng ngay trong buổi thảo luận."}</h2></div></Reveal>
      <Reveal delay={0.1}><ResourceCardGrid resources={entries} /></Reveal>
      {isPapers && <p className="download-note"><ArrowDownTrayIcon width={15} /> Tài liệu PDF được cung cấp bằng tiếng Việt cho mục đích đánh giá và lập kế hoạch nội bộ.</p>}
      {isUpdates && <div className="release-notes"><span>Tự động hóa bằng AI</span><span>Bộ máy phân tích quyết định</span><span>Công cụ xây dựng quy trình trực quan</span></div>}
      <div style={{ marginTop: 32 }}><Link href="/contact" className="btn btn-primary">Mời QTS tham gia trao đổi <ArrowRightIcon width={15} /></Link></div>
    </div></section>
    <CallToAction title="Tích lũy thêm cơ sở cho quyết định tiếp theo." />
  </MarketingShell>;
}
