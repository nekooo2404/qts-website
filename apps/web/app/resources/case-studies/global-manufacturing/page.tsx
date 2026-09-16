import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Mô hình nền tảng vận hành số cho sản xuất — QTS",
  description: "Tình huống tham khảo về cách kết nối dữ liệu sản xuất, giao hàng và tài chính trên một nền tảng vận hành số.",
};

const phases = [
  ["01", "Khám phá", "Lập bản đồ điểm bàn giao giữa sản xuất, giao hàng và tài chính đang tạo ra độ trễ báo cáo."],
  ["02", "Thiết kế", "Xác lập mô hình vận hành thống nhất và trải nghiệm theo vai trò cho đội ngũ nhà máy và quản lý."],
  ["03", "Xây dựng", "Kết nối hệ thống cốt lõi với dịch vụ dữ liệu, giao diện vận hành và phân tích hỗ trợ AI."],
  ["04", "Triển khai", "Phát hành theo từng phạm vi với hạ tầng đám mây được quản trị và kiểm soát chất lượng dữ liệu."],
];

export default function GlobalManufacturingCaseStudy() {
  return <MarketingShell>
    <section className="case-detail-hero noise"><div className="container">
      <Link href="/resources/case-studies" className="back-link">← Tình huống ứng dụng</Link>
      <div className="case-detail-head"><div><span className="eyebrow">Tình huống tham khảo · Sản xuất</span><h1 className="display">Mô hình nền tảng vận hành số cho sản xuất</h1><p>Nội dung minh họa cách chuyển hoạt động rời rạc thành một lớp điều hành trực tiếp phục vụ sản xuất, giao hàng và tài chính. Đây không phải dự án hay số liệu của một khách hàng cụ thể.</p><div className="case-detail-client"><b>Mô hình doanh nghiệp sản xuất</b><span>Dữ liệu minh họa phục vụ trao đổi giải pháp</span></div></div><div className="case-detail-cover"><Image src="/images/resources/manufacturing-operations.svg" alt="Minh họa nền tảng vận hành sản xuất kết nối" fill priority sizes="(max-width: 950px) 100vw, 45vw" /></div></div>
    </div></section>
    <section className="case-impact-strip"><div className="container"><div><b>Kết nối</b><span>dữ liệu vận hành</span></div><div><b>Tự động</b><span>luồng báo cáo</span></div><div><b>Kịp thời</b><span>tín hiệu quyết định</span></div><div><b>Quan sát</b><span>hiệu suất sản xuất</span></div></div></section>
    <section className="section"><div className="container case-detail-grid"><Reveal><div><span className="eyebrow">Ràng buộc</span><h2>Báo cáo phản ánh tuần trước trong khi hoạt động đã thay đổi.</h2><p>Các hệ thống cũ có thể hoạt động tốt khi đứng riêng. Chi phí xuất hiện tại điểm bàn giao: đội ngũ nhà máy đối soát bảng tính, tài chính chờ dữ liệu sản xuất và quản lý nhìn thấy rủi ro giao hàng quá muộn.</p></div></Reveal><Reveal delay={0.15}><div className="case-detail-panel"><small>Hiện trạng tham khảo</small><h3>Tổng hợp dữ liệu thủ công giữa nhiều điểm vận hành</h3><ul><li>Chu kỳ báo cáo kéo dài</li><li>Dữ liệu sản xuất, giao hàng và tài chính rời rạc</li><li>Quyết định dựa trên thông tin không đồng bộ</li></ul></div></Reveal></div></section>
    <section className="section case-detail-solution"><div className="container case-detail-grid"><Reveal><div className="case-dashboard" aria-label="Bản xem trước minh họa bảng điều khiển vận hành sản xuất"><div className="case-dashboard-top"><span>Mô hình vận hành sản xuất</span><span className="live-dot">● Dữ liệu trực tiếp</span></div><div className="case-body"><aside className="case-side"><p>Vận hành</p><i className="case-site-item active" /><i className="case-site-item" /><i className="case-site-item" /><i className="case-site-item" /></aside><div className="case-visuals"><div className="dark-panel"><label>Sản lượng</label><strong>Minh họa</strong><span>Theo kế hoạch</span></div><div className="dark-panel"><label>Tiến độ giao hàng</label><strong>Minh họa</strong><span>Theo tuần</span></div><div className="dark-panel wide"><label>Hiệu suất nhà máy</label><div className="dark-bars">{[52, 75, 63, 86, 79, 96, 72, 91].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div></div></div></div></Reveal><Reveal delay={0.15}><div><span className="eyebrow">Giải pháp QTS</span><h2>Nền tảng doanh nghiệp tập trung giúp hoạt động trở nên rõ ràng.</h2><p>Một trải nghiệm nền tảng được xây quanh quyết định đội ngũ cần đưa ra ngay, thay vì thêm một bảng điều khiển bên cạnh hệ thống cũ. Lõi kết nối dữ liệu nguồn, quy trình có hướng dẫn và phân tích trong môi trường đám mây được quản trị.</p><div className="case-stack"><span>Next.js</span><span>Django</span><span>Phân tích AI</span><span>Hạ tầng đám mây</span></div></div></Reveal></div></section>
    <section className="section"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Lộ trình triển khai</span><h2>Từng bước từ hệ thống rời rạc đến khả năng kiểm soát trực tiếp.</h2></div></Reveal><Reveal delay={0.1}><ol className="case-timeline">{phases.map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></Reveal></div></section>
    <section className="section case-before-after"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Thay đổi hướng tới</span><h2>Ít đối soát hơn. Thêm thời gian để can thiệp.</h2></div></Reveal><Reveal delay={0.1}><div className="before-after-grid"><article><small>Trước</small><h3>Đội ngũ tổng hợp một phiên bản dữ liệu bằng tay.</h3><p>Báo cáo chậm, cục bộ và khó tin cậy giữa các địa điểm.</p></article><article><small>Sau</small><h3>Một góc nhìn vận hành trực tiếp cho người có thể hành động.</h3><p>Người quản lý có thể thấy ngoại lệ, đánh giá trong bối cảnh và điều chỉnh nguồn lực trước khi cam kết bị ảnh hưởng.</p><CheckCircleIcon /></article></div></Reveal></div></section>
    <CallToAction title="Làm rõ ràng buộc vận hành của bạn." copy="Trao đổi với QTS về nền tảng, kiến trúc và lộ trình triển khai phù hợp với kết quả bạn cần." />
  </MarketingShell>;
}
