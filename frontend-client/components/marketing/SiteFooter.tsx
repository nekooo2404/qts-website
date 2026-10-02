import Link from "next/link";
import { Brand } from "./SiteHeader";
import { COMPANY } from "@/lib/company";
import { solutionThemes } from "@/lib/solution-catalog";

const solutionLinks = solutionThemes.map(({ title, slug }) => [title, `/solutions/${slug}`] as const);

const groups = [
  { label: "Giải pháp", links: solutionLinks },
  { label: "Ngành", links: [["Y tế", "/industries#healthcare"], ["Sản xuất", "/industries#manufacturing"], ["Tài chính", "/industries#finance"], ["Bán lẻ", "/industries#retail"]] },
  { label: "Công ty", links: [["Về QTS", "/company"], ["Công nghệ", "/company#technology"], ["Bảo mật", "/company#security"], ["Liên hệ", "/contact"]] },
  {
    label: "Tài nguyên",
    links: [
      ["Tình huống ứng dụng", "/resources/case-studies"],
      ["Hướng dẫn giải pháp", "/resources/solutions-guides"],
      ["Góc nhìn công nghệ", "/resources/technology-insights"],
      ["Chuyên khảo", "/resources/white-papers"],
      ["Cập nhật sản phẩm", "/resources/product-updates"],
    ],
  },
];

export default function SiteFooter() {
  return <footer className="footer"><div className="container"><div className="footer-top"><div><Brand/><p className="footer-about">{COMPANY.fullName} - hạ tầng số giúp doanh nghiệp vận hành hiệu quả và phát triển bền vững.</p><p className="footer-about" style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6 }}>{COMPANY.address}<br />Hoạt động từ {COMPANY.founded}</p></div>{groups.map(({ label, links }) => <div className="footer-col" key={label}><h4>{label}</h4>{links.map(([copy, href]) => <Link href={href} key={copy}>{copy}</Link>)}</div>)}<div className="footer-col"><h4>Liên hệ</h4><a href={COMPANY.contactUrl} target="_blank" rel="noreferrer">{COMPANY.contactDomain}</a><a href={`tel:${COMPANY.phone}`}>{COMPANY.phone}</a><Link href="/contact">Yêu cầu tư vấn</Link></div></div><div className="footer-bottom"><span>© 2026 QTS. Đồng hành cùng doanh nghiệp trên hành trình chuyển đổi số.</span><div className="footer-legal"><Link href="/legal#privacy">Bảo mật</Link><Link href="/legal#terms">Điều khoản</Link><Link href="/legal#accessibility">Khả năng tiếp cận</Link></div></div></div></footer>;
}
