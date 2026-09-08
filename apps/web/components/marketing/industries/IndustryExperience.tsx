"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BuildingOffice2Icon, CursorArrowRaysIcon, GlobeAltIcon, HeartIcon, LightBulbIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export const industries = [
  {
    slug: "healthcare",
    name: "Y tế",
    icon: HeartIcon,
    image: "/images/industries/healthcare.svg",
    challenge: "Hệ thống rời rạc khiến đội ngũ phải tổng hợp thông tin người bệnh theo cách thủ công.",
    solution: "Nền tảng điều phối chăm sóc kết nối, giúp mọi điểm bàn giao trở nên rõ ràng và được quản trị.",
    product: "Màn hình điều phối, hỗ trợ phân loại và tín hiệu năng lực theo thời gian.",
  },
  {
    slug: "manufacturing",
    name: "Sản xuất",
    icon: BuildingOffice2Icon,
    image: "/images/industries/manufacturing.svg",
    challenge: "Báo cáo thủ công làm chậm quyết định tại nhà máy và bộ phận tài chính.",
    solution: "Lớp điều hành sản xuất kết nối dữ liệu nguồn, quy trình và phân tích.",
    product: "Kiểm soát thống nhất sản xuất, giao hàng và tài chính.",
  },
  {
    slug: "finance",
    name: "Tài chính",
    icon: ShieldCheckIcon,
    image: "/images/industries/finance.svg",
    challenge: "Dữ liệu cần di chuyển nhanh, an toàn và có đầy đủ dấu vết kiểm tra.",
    solution: "Quy trình được quản trị và đối soát đáng tin cậy giữa con người, phê duyệt và hệ thống.",
    product: "Phê duyệt, đối soát và theo dõi rủi ro có thể kiểm tra.",
  },
  {
    slug: "retail",
    name: "Bán lẻ",
    icon: GlobeAltIcon,
    image: "/images/industries/retail.svg",
    challenge: "Tín hiệu khách hàng và nhu cầu nằm rải rác trên nhiều kênh không tự đồng bộ.",
    solution: "Trí tuệ thương mại kết nối cùng một đồ thị khách hàng thống nhất.",
    product: "Tín hiệu nhu cầu, bối cảnh khách hàng và điều phối chiến dịch.",
  },
  {
    slug: "education",
    name: "Giáo dục",
    icon: LightBulbIcon,
    image: "/images/industries/education.svg",
    challenge: "Đội ngũ cần theo dõi người học và kết quả vận hành mà không tăng khối lượng hành chính.",
    solution: "Lớp vận hành học tập thích ứng giúp nhận diện rủi ro và định hướng hành động.",
    product: "Một góc nhìn vận hành cho người học, đội ngũ và cơ sở giáo dục.",
  },
  {
    slug: "logistics",
    name: "Logistics",
    icon: CursorArrowRaysIcon,
    image: "/images/industries/logistics.svg",
    challenge: "Mỗi điểm bàn giao có thể tạo ra chậm trễ và cộng dồn trên toàn luồng hoàn tất đơn hàng.",
    solution: "Lớp điều hành giúp theo dõi ngoại lệ và mức độ tin cậy giao hàng.",
    product: "Điều phối bàn giao, nhận diện ngoại lệ và bảo đảm tiến độ.",
  },
] as const;

const capabilities = ["Phát triển phần mềm", "Tư vấn công nghệ thông tin", "Xử lý dữ liệu", "Hạ tầng số", "Thiết kế hệ thống", "Đào tạo công nghệ"];

export function IndustryEcosystemMap() {
  const reduceMotion = useReducedMotion();
  return <motion.div className="industry-ecosystem" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -6, 0] }} transition={{ opacity: { duration: .6 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}>
    <Image src="/images/industries/ecosystem.svg" alt="Sơ đồ hệ sinh thái cho thấy nền tảng QTS kết nối y tế, sản xuất, tài chính, bán lẻ, giáo dục và logistics" fill priority sizes="(max-width: 950px) 100vw, 52vw" />
  </motion.div>;
}

export function IndustryBento() {
  return <div className="industry-bento">{industries.map((industry, index) => {
    const IndustryIcon = industry.icon;
    return <motion.article key={industry.slug} id={industry.slug} className="industry-bento-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={{ delay: Math.min(index * .06, .24), duration: .45 }}>
      <div className="industry-bento-media">
        <Image src={industry.image} alt={`Minh họa nền tảng cho ngành ${industry.name}`} fill sizes="(max-width: 950px) 100vw, 33vw" />
        <span className="industry-bento-pill"><IndustryIcon />{industry.name}</span>
      </div>
      <div className="industry-bento-body">
        <span className="industry-bento-client">Mô hình giải pháp tham khảo</span>
        <dl>
          <div><dt>Thách thức ngành</dt><dd>{industry.challenge}</dd></div>
          <div><dt>Giải pháp QTS</dt><dd>{industry.solution}</dd></div>
          <div><dt>Bề mặt sản phẩm</dt><dd>{industry.product}</dd></div>
        </dl>
        <Link href="/contact" className="industry-bento-cta">Trao đổi về ngành {industry.name.toLowerCase()} →</Link>
      </div>
    </motion.article>;
  })}</div>;
}

export function TrustedBand() {
  return <section className="trusted-band" aria-label="Năng lực công nghệ đã đăng ký của QTS">
    <div className="container trusted-band-head"><span className="eyebrow">Năng lực theo ngành nghề đăng ký</span><p>QTS phát triển các giải pháp số dựa trên năng lực phần mềm, dữ liệu, tư vấn công nghệ và hạ tầng liên quan.</p></div>
    <div className="trusted-marquee" aria-hidden="true">
      <div className="trusted-track">{[...capabilities, ...capabilities].map((capability, index) => <span key={`${capability}-${index}`} className="trusted-logo">{capability}</span>)}</div>
    </div>
    <div className="container trusted-grid" role="list">{capabilities.map((capability) => <span key={capability} role="listitem" className="trusted-card">{capability}</span>)}</div>
  </section>;
}
