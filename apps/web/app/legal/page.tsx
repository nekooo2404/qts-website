import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Reveal from "@/components/marketing/Reveal";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Pháp lý — QTS",
  description: "Thông tin doanh nghiệp, nguyên tắc bảo mật, điều khoản và khả năng tiếp cận của QTS.",
};

const policies = [
  ["privacy", "Bảo mật thông tin", "QTS chỉ sử dụng thông tin trong yêu cầu tư vấn để phản hồi và hỗ trợ nội dung trao đổi mà người dùng đề nghị. QTS không bán thông tin liên hệ."],
  ["terms", "Điều khoản sử dụng", "Thông tin trên website được cung cấp cho mục đích tham khảo chung về doanh nghiệp. Mọi dịch vụ hoặc dự án được triển khai sẽ tuân theo thỏa thuận riêng đã ký với QTS."],
  ["accessibility", "Khả năng tiếp cận", "QTS thiết kế trải nghiệm số với cấu trúc ngữ nghĩa, hỗ trợ bàn phím, trạng thái tập trung rõ ràng và tùy chọn giảm chuyển động."],
] as const;

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="Thông tin pháp lý" title="Minh bạch trong thông tin và cam kết.">
      <p>Thông tin doanh nghiệp cùng các nguyên tắc bảo mật, điều khoản và khả năng tiếp cận áp dụng cho website công khai của QTS.</p>
    </PageHero>
    <section className="section" style={{ paddingTop: 8 }}>
      <div className="container detail-rows" style={{ marginTop: 0 }}>
        <Reveal><article className="detail-row" id="company-information"><div><h3>Thông tin doanh nghiệp</h3><p><strong>{COMPANY.fullName}</strong><br />Tên quốc tế: {COMPANY.intlName}<br />Tên viết tắt: {COMPANY.abbr}<br />Loại hình: Công ty TNHH hai thành viên trở lên ngoài nhà nước<br />Tình trạng: Đang hoạt động<br />Ngày hoạt động: {COMPANY.founded}<br />Ngành chính: Xuất bản phần mềm khác (mã ngành 5829)<br />Địa chỉ: {COMPANY.address}<br />Người đại diện theo pháp luật: {COMPANY.rep}<br />Điện thoại: <a href={`tel:${COMPANY.phone}`}>{COMPANY.phone}</a><br />Cổng liên hệ: <a href={COMPANY.contactUrl} target="_blank" rel="noreferrer">{COMPANY.contactDomain}</a></p></div></article></Reveal>
        {policies.map(([id, title, copy], i) => <Reveal key={id} delay={(i + 1) * 0.08}><article className="detail-row" id={id}><div><h3>{title}</h3><p>{copy}</p></div></article></Reveal>)}
      </div>
    </section>
  </MarketingShell>;
}
