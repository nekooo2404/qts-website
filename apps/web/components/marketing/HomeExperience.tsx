"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, BoltIcon, CheckIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Magnetic from "./Magnetic";
import { EASE, DUR, staggerContainer, staggerItem } from "@/lib/motion";

function CountUp({ to, prefix = "", suffix = "", delay = 0.8 }: { to: number; prefix?: string; suffix?: string; delay?: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => `${prefix}${v < 10 ? v.toFixed(1) : Math.round(v)}${suffix}`);
  useEffect(() => {
    const controls = animate(mv, to, { duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, to, delay]);
  return <motion.span>{display}</motion.span>;
}

const notifications = [
  { icon: SparklesIcon, title: "AI đã phát hiện tín hiệu cần chú ý", body: "Dự báo được cập nhật từ dữ liệu mới" },
  { icon: BoltIcon, title: "Quy trình tự động đã hoàn tất", body: "Yêu cầu được chuyển đến đúng bộ phận" },
];

function NotificationToast() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let hideTimer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setShow(true);
      hideTimer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          if (!mounted.current) return;
          setIndex((i) => (i + 1) % notifications.length);
          cycle();
        }, 800);
      }, 4000);
    };
    const startTimer = setTimeout(cycle, 2500);
    return () => { mounted.current = false; clearTimeout(startTimer); clearTimeout(hideTimer); };
  }, []);

  const note = notifications[index];
  const Icon = note.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="floating-note" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: DUR.base, ease: EASE }}>
          <i className="note-ai"><Icon /></i>
          <span><strong>{note.title}</strong>{note.body}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductPreview() {
  const reducedMotion = useReducedMotion();
  const barHeights = ["34%", "44%", "40%", "59%", "55%", "71%", "86%"];

  return (
    <motion.div className="product-glow" initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65, delay: 0.8, ease: EASE }}>
      <div className="mock-app">
        <div className="mock-top"><i className="dot" /><i className="dot" /><i className="dot" /></div>
        <div className="mock-workspace">
          <aside className="mock-sidebar">
            <div className="mock-side-logo"><i className="mock-side-mark" /> QTS Vận hành</div>
            {["Tổng quan", "Vận hành", "Nhân sự", "Tự động hóa", "Phân tích"].map((item, index) => <div className={`mock-nav-item ${index === 0 ? "active" : ""}`} key={item}><i className="mock-nav-icon" />{item}</div>)}
          </aside>
          <div className="mock-content">
            <div className="mock-content-header"><div><div className="mock-kicker">DỮ LIỆU MINH HỌA</div><h2 className="mock-title">Tổng quan doanh nghiệp</h2></div><span className="live"><i /> Hệ thống hoạt động</span></div>
            <div className="mock-stats">
              <div className="mock-stat"><label>Quy trình đang chạy</label><strong><CountUp to={12} /></strong><small>Đã đồng bộ</small></div>
              <div className="mock-stat"><label>Dự án đang theo dõi</label><strong><CountUp to={8} /></strong><small>Cập nhật hôm nay</small></div>
              <div className="mock-stat"><label>Mức sử dụng nguồn lực</label><strong><CountUp to={76} suffix="%" /></strong><small>Trong ngưỡng</small></div>
            </div>
            <div className="mock-main-grid">
              <div className="mock-panel"><div className="panel-head"><span>Chỉ số vận hành</span><span>Tháng 7</span></div>
                <div className="signal-chart" aria-label="Biểu đồ minh họa chỉ số vận hành từ tháng 1 đến tháng 7">
                  {barHeights.map((h, i) => (
                    <motion.i key={i} style={{ height: h, originY: 1 }} initial={{ scaleY: reducedMotion ? 1 : 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: 1 + i * 0.08, ease: EASE }} />
                  ))}
                </div>
              </div>
              <div className="mock-panel"><div className="panel-head"><span>Hoạt động gần đây</span><BoltIcon width={11} /></div><div className="activity-list"><div className="activity"><i className="activity-icon"><SparklesIcon width={8} /></i><span><strong>Dự báo AI hoàn tất</strong>Nhu cầu đã được cập nhật</span></div><div className="activity"><i className="activity-icon"><CheckIcon width={8} /></i><span><strong>Quy trình đã duyệt</strong>Yêu cầu được tự động chuyển</span></div><div className="activity"><i className="activity-icon"><UserGroupIcon width={8} /></i><span><strong>Nguồn lực đã đồng bộ</strong>Phân bổ được cân đối lại</span></div></div></div>
            </div>
            <div className="mock-bottom">
              <div className="mock-panel"><div className="panel-head"><span>Sức khỏe hệ thống</span><span>↗</span></div><div className="score-ring"><CountUp to={96} delay={1.2} /></div></div>
              <div className="mock-panel"><div className="panel-head"><span>Tự động hóa quy trình</span><span>3 tác vụ</span></div>
                <div className="workflow-row"><div className="workflow-label"><span>Xử lý đơn hàng</span><span>92%</span></div><div className="progress"><motion.span style={{ originX: 0, width: "92%", display: "block", height: "100%" }} initial={{ scaleX: reducedMotion ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 1.3, ease: EASE }} /></div></div>
                <div className="workflow-row"><div className="workflow-label"><span>Kiểm tra chất lượng dữ liệu</span><span>74%</span></div><div className="progress"><motion.span style={{ originX: 0, width: "74%", display: "block", height: "100%" }} initial={{ scaleX: reducedMotion ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 1.45, ease: EASE }} /></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NotificationToast />
    </motion.div>
  );
}

const companyFacts = [
  { value: "5829", label: "Ngành chính: Xuất bản phần mềm khác" },
  { value: "21/01/2026", label: "Ngày chính thức hoạt động" },
  { value: "Hà Nội", label: "Trụ sở doanh nghiệp" },
  { value: "Đang hoạt động", label: "Tình trạng pháp lý" },
];

export function TrustStrip() {
  return (
    <section className="trust"><div className="container"><div className="trust-inner">
      {companyFacts.map((fact) => (
        <div className="trust-stat" key={fact.label}>
          <strong>{fact.value}</strong>
          <span>{fact.label}</span>
        </div>
      ))}
    </div><div className="logo-row"><span>Năng lực công nghệ theo ngành nghề đăng ký</span><b className="client-logo">PHẦN MỀM</b><b className="client-logo">DỮ LIỆU</b><b className="client-logo">ĐÁM MÂY</b><b className="client-logo">TƯ VẤN CNTT</b></div></div></section>
  );
}

export default function HomeExperience() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 56]);

  return (
    <>
      <section className="hero noise" ref={heroRef}>
        <div className="container hero-grid">
          <motion.div className="hero-copy" initial="hidden" animate="visible" variants={staggerContainer(0.1)}>
            <motion.span className="hero-kicker" variants={staggerItem}>01 / HỆ ĐIỀU HÀNH SỐ</motion.span>
            <motion.span className="eyebrow" variants={staggerItem}>Công nghệ doanh nghiệp, được xây dựng bài bản</motion.span>
            <motion.h1 className="display" variants={staggerItem}>Xây dựng hạ tầng số cho tăng trưởng doanh nghiệp</motion.h1>
            <motion.p variants={staggerItem}>QTS phát triển phần mềm, nền tảng doanh nghiệp và hệ thống số thông minh có khả năng mở rộng.</motion.p>
            <motion.div className="hero-actions" variants={staggerItem}>
              <Magnetic><Link href="/solutions" className="btn btn-primary">Khám phá giải pháp <ArrowRightIcon width={15} /></Link></Magnetic>
              <Link href="/contact" className="btn btn-light">Trao đổi với chuyên gia</Link>
            </motion.div>
            <motion.div className="hero-meta" variants={staggerItem}><span>Phần mềm · Dữ liệu · Đám mây · Tư vấn công nghệ</span></motion.div>
            <motion.div className="operation-index" aria-label="Chỉ số vận hành minh hoạ" variants={staggerItem}>
              <small>OPERATION INDEX — MINH HỌA</small>
              <strong>07 mô-đun · 01 lõi dữ liệu</strong>
              <span>Dữ liệu mô phỏng cho mục đích trình bày sản phẩm.</span>
            </motion.div>
          </motion.div>
          <motion.div style={reducedMotion ? undefined : { y: parallaxY }}>
            <ProductPreview />
          </motion.div>
        </div>
      </section>
      <TrustStrip />
    </>
  );
}
