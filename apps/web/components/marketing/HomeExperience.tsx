"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, CheckIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import Magnetic from "./Magnetic";
import { EASE, staggerContainer, staggerItem } from "@/lib/motion";

function ProductScenario() {
  return (
    <div className="hero-scenario" aria-label="Luồng minh hoạ về vận hành kết nối">
      <div className="hero-scenario-heading">
        <span>Luồng minh hoạ</span>
        <i><SparklesIcon /></i>
      </div>
      <strong>Một bức tranh vận hành chung</strong>
      <p>Kết nối dữ liệu, quy trình và các điểm cần con người ra quyết định.</p>
      <ul>
        <li><CheckIcon />Nền tảng theo vai trò</li>
        <li><CheckIcon />Tín hiệu có ngữ cảnh</li>
        <li><CheckIcon />Quy trình có thể kiểm tra</li>
      </ul>
    </div>
  );
}

const trustProofs = [
  { value: "Bảo mật và phân quyền", label: "Thiết kế truy cập theo vai trò, phiên đăng nhập và phạm vi dữ liệu rõ ràng." },
  { value: "Tích hợp hệ thống", label: "Kết nối Portal, HRM, tài liệu, phê duyệt, báo cáo và các dịch vụ nội bộ." },
  { value: "Triển khai có lộ trình", label: "Khảo sát, thiết kế, bàn giao và vận hành theo từng giai đoạn có thể kiểm tra." },
  { value: "Sẵn sàng mở rộng", label: "Kiến trúc mở cho ERP, CRM, Analytics và microservices trong tương lai." },
];

export function TrustStrip() {
  return (
    <section className="trust"><div className="container"><div className="trust-inner">
      {trustProofs.map((proof) => (
        <div className="trust-stat" key={proof.value}>
          <strong>{proof.value}</strong>
          <span>{proof.label}</span>
        </div>
      ))}
    </div><div className="logo-row"><span>Phạm vi nền tảng</span><b className="client-logo">Identity</b><b className="client-logo">HRM</b><b className="client-logo">Workflow</b><b className="client-logo">Analytics</b></div></div></section>
  );
}

export default function HomeExperience() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 48]);

  return (
    <>
      <section className="hero noise" ref={heroRef}>
        <div className="container hero-grid">
          <motion.div className="hero-copy" initial={reducedMotion ? false : "hidden"} animate="visible" variants={staggerContainer(0.1)}>
            <motion.span className="hero-kicker" variants={staggerItem}><ShieldCheckIcon width={15} /> Quản trị phần mềm, dữ liệu và quy trình</motion.span>
            <motion.h1 className="display" variants={staggerItem}>Nền tảng vận hành số cho doanh nghiệp.</motion.h1>
            <motion.p variants={staggerItem}>QTS giúp doanh nghiệp kết nối nhân sự, tài liệu, phê duyệt và báo cáo trong một hệ sinh thái bảo mật, dễ mở rộng.</motion.p>
            <motion.div className="hero-actions" variants={staggerItem}>
              <Magnetic><Link href="/contact" className="btn btn-primary">Yêu cầu tư vấn <ArrowRightIcon width={15} /></Link></Magnetic>
              <Link href="/solutions" className="btn btn-light">Xem giải pháp</Link>
            </motion.div>
          </motion.div>
          <motion.figure className="hero-photo" style={reducedMotion ? undefined : { y: parallaxY }} initial={reducedMotion ? false : { opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.65, delay: 0.45, ease: EASE }}>
            <Image src="/images/home/enterprise-operations.jpg" alt="Nhóm chuyên viên cùng trao đổi trước bảng kế hoạch trong không gian làm việc" fill priority sizes="(max-width: 950px) calc(100vw - 48px), 52vw" />
            <figcaption>Hình ảnh minh hoạ về hoạt động hợp tác trong doanh nghiệp.</figcaption>
            <ProductScenario />
          </motion.figure>
        </div>
      </section>
      <TrustStrip />
    </>
  );
}
