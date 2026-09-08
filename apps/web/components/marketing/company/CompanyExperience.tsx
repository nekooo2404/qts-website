"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const milestones = [
  { year: "21/01/2026", title: "Chính thức hoạt động", copy: "CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ QTS (QTS TECHNOLOGY DEVELOPMENT CO., LTD) chính thức đi vào hoạt động theo đăng ký doanh nghiệp." },
];

const stages = [
  { number: "01", title: "Khám phá", copy: "Làm rõ điểm quyết định, điểm bàn giao và rào cản vận hành nơi nền tảng kết nối có thể tạo đòn bẩy.", output: "Bản đồ kết quả · Hiện trạng vận hành" },
  { number: "02", title: "Thiết kế", copy: "Xây dựng kiến trúc và trải nghiệm sản phẩm xoay quanh người dùng phải tạo ra kết quả công việc tốt hơn.", output: "Bản thiết kế nền tảng · Nguyên mẫu trải nghiệm" },
  { number: "03", title: "Xây dựng", copy: "Phát triển phần mềm có khả năng tích hợp với hệ thống hiện có đồng thời thay đổi phần việc quan trọng.", output: "Bản phát hành theo giai đoạn · Nền tảng tích hợp" },
  { number: "04", title: "Triển khai", copy: "Đưa sản phẩm vào vận hành theo lộ trình có kiểm soát, với hạ tầng quan sát được và hỗ trợ áp dụng.", output: "Phát hành đám mây · Sẵn sàng vận hành" },
  { number: "05", title: "Tối ưu", copy: "Sử dụng tín hiệu áp dụng, hiệu năng và kết quả để nền tảng ngày càng có giá trị sau khi ra mắt.", output: "Đánh giá tác động · Cải tiến liên tục" },
];

const gallery = [
  { src: "/images/company/culture-engineering.svg", title: "Rà soát kiến trúc", copy: "Quyết định kiến trúc được thể hiện rõ ràng." },
  { src: "/images/company/culture-workshop.svg", title: "Workshop cùng khách hàng", copy: "Thống nhất góc nhìn về rào cản trước khi xây dựng." },
  { src: "/images/company/culture-collaboration.svg", title: "Triển khai liên chức năng", copy: "Sản phẩm, dữ liệu và kỹ thuật làm việc như một đội ngũ." },
  { src: "/images/company/culture-product.svg", title: "Đánh giá sản phẩm", copy: "Giao diện được hoàn thiện theo thời điểm ra quyết định." },
];

export function CompanyHeroVisual() {
  const reduceMotion = useReducedMotion();
  return <motion.div className="company-hero-visual" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -7, 0], scale: 1 }} transition={{ opacity: { duration: .65 }, scale: { duration: .65 }, y: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}>
    <Image src="/images/company/headquarters.svg" alt="Không gian làm việc công nghệ QTS với các bề mặt vận hành doanh nghiệp kết nối" fill priority sizes="(max-width: 950px) 100vw, 53vw" />
    <div className="company-hero-float"><b>Mạng lưới triển khai QTS</b><span>Sản phẩm · Kỹ thuật · Dữ liệu · Đám mây</span></div>
  </motion.div>;
}

export function CompanyTimeline() {
  const [active, setActive] = useState(0);
  return <div className="company-timeline" role="tablist" aria-label="Lịch sử công ty QTS">{milestones.map((milestone, index) => <button key={milestone.year} type="button" role="tab" aria-selected={active === index} className={active === index ? "active" : ""} onClick={() => setActive(index)}><span>{milestone.year}</span><i /><strong>{milestone.title}</strong><small>{active === index ? milestone.copy : "Chọn để xem mốc thời gian"}</small></button>)}</div>;
}

export function MethodologyExperience() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const stage = stages[active];
  return <div className="methodology-shell">
    <div className="methodology-steps">{stages.map((item, index) => <button type="button" key={item.number} className={active === index ? "active" : ""} onClick={() => setActive(index)} aria-pressed={active === index}><span>{item.number}</span><b>{item.title}</b></button>)}</div>
    <motion.div className="methodology-detail" key={stage.number} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }}><span>Giai đoạn {stage.number}</span><h3>{stage.title}</h3><p>{stage.copy}</p><small>{stage.output}</small></motion.div>
  </div>;
}

export function CultureGallery() {
  return <div className="culture-gallery">{gallery.map((image, index) => <motion.figure key={image.title} className={`culture-shot culture-shot-${index + 1}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: index * .08 }} tabIndex={0}><Image src={image.src} alt={`${image.title}: ${image.copy}`} fill sizes="(max-width: 700px) 100vw, (max-width: 950px) 50vw, 40vw" /><figcaption><b>{image.title}</b><span>{image.copy}</span></figcaption></motion.figure>)}</div>;
}
