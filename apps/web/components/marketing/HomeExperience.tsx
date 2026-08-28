"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, BoltIcon, CheckIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Magnetic from "./Magnetic";
import { EASE, DUR } from "@/lib/motion";

/* Count-up: renders formatted value, animates 0→target on mount. */
function CountUp({ to, prefix = "", suffix = "", delay = 0.8 }: { to: number; prefix?: string; suffix?: string; delay?: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => `${prefix}${v < 10 ? v.toFixed(1) : Math.round(v)}${suffix}`);
  useEffect(() => {
    const controls = animate(mv, to, { duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, to, delay]);
  return <motion.span>{display}</motion.span>;
}

/* Notification cycle: slides in after ~2.5s, stays ~4s, slides out, cycles to next. */
const notifications = [
  { icon: SparklesIcon, title: "QTS AI discovered an opportunity", body: "Forecast accuracy improved by 14%" },
  { icon: BoltIcon, title: "Workflow automation complete", body: "Invoice routing saved 6.2 hours" },
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
            <div className="mock-side-logo"><i className="mock-side-mark" /> QTS Operating</div>
            {["Overview", "Operations", "People", "Automations", "Analytics"].map((item, index) => <div className={`mock-nav-item ${index === 0 ? "active" : ""}`} key={item}><i className="mock-nav-icon" />{item}</div>)}
          </aside>
          <div className="mock-content">
            <div className="mock-content-header"><div><div className="mock-kicker">GOOD MORNING, ALEX</div><h2 className="mock-title">Enterprise overview</h2></div><span className="live"><i /> All systems live</span></div>
            <div className="mock-stats">
              <div className="mock-stat"><label>Operating revenue</label><strong><CountUp to={5.8} prefix="$" suffix="M" /></strong><small>↑ 18.6%</small></div>
              <div className="mock-stat"><label>Active projects</label><strong><CountUp to={24} /></strong><small>↑ 4 this week</small></div>
              <div className="mock-stat"><label>Team capacity</label><strong><CountUp to={86} suffix="%" /></strong><small>Healthy</small></div>
            </div>
            <div className="mock-main-grid">
              <div className="mock-panel"><div className="panel-head"><span>Revenue intelligence</span><span>Jul</span></div>
                <div className="signal-chart" aria-label="Revenue increased from January through July">
                  {barHeights.map((h, i) => (
                    <motion.i key={i} style={{ height: h, originY: 1 }} initial={{ scaleY: reducedMotion ? 1 : 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: 1 + i * 0.08, ease: EASE }} />
                  ))}
                </div>
              </div>
              <div className="mock-panel"><div className="panel-head"><span>Live activity</span><BoltIcon width={11} /></div><div className="activity-list"><div className="activity"><i className="activity-icon"><SparklesIcon width={8} /></i><span><strong>AI forecast complete</strong>Manufacturing demand updated</span></div><div className="activity"><i className="activity-icon"><CheckIcon width={8} /></i><span><strong>Workflow approved</strong>Invoice routing automated</span></div><div className="activity"><i className="activity-icon"><UserGroupIcon width={8} /></i><span><strong>Capacity synced</strong>42 allocations rebalanced</span></div></div></div>
            </div>
            <div className="mock-bottom">
              <div className="mock-panel"><div className="panel-head"><span>System health</span><span>↗</span></div><div className="score-ring"><CountUp to={96} delay={1.2} /></div></div>
              <div className="mock-panel"><div className="panel-head"><span>Workflow automation</span><span>3 live</span></div>
                <div className="workflow-row"><div className="workflow-label"><span>Order to cash</span><span>92%</span></div><div className="progress"><motion.span style={{ originX: 0, width: "92%", display: "block", height: "100%" }} initial={{ scaleX: reducedMotion ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 1.3, ease: EASE }} /></div></div>
                <div className="workflow-row"><div className="workflow-label"><span>Data quality checks</span><span>74%</span></div><div className="progress"><motion.span style={{ originX: 0, width: "74%", display: "block", height: "100%" }} initial={{ scaleX: reducedMotion ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 1.45, ease: EASE }} /></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NotificationToast />
    </motion.div>
  );
}

/* TrustStrip with count-up on scroll into view. */
const trustStats = [
  { to: 500, suffix: "+", label: "Enterprise projects" },
  { to: 99.9, suffix: "%", label: "Platform uptime" },
  { to: 50, suffix: "+", label: "Enterprise clients" },
  { to: 10, suffix: "+", label: "Industries transformed" },
];

function TrustStat({ to, suffix, delay = 0 }: { to: number; suffix: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => `${to % 1 !== 0 ? v.toFixed(1) : Math.round(v)}${suffix}`);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const controls = animate(mv, to, { duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [started, mv, to, delay]);

  return <motion.strong ref={ref}>{display}</motion.strong>;
}

export function TrustStrip() {
  return (
    <section className="trust"><div className="container"><div className="trust-inner">
      {trustStats.map((s, i) => (
        <div className="trust-stat" key={s.label}>
          <TrustStat to={s.to} suffix={s.suffix} delay={i * 0.12} />
          <span>{s.label}</span>
        </div>
      ))}
    </div><div className="logo-row"><span>Powering organizations built to lead</span><b className="client-logo">NORTHSTAR</b><b className="client-logo">CIRRUS</b><b className="client-logo">ARCSTONE</b><b className="client-logo">MOTION</b><b className="client-logo">FUSE</b></div></div></section>
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
          <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.2 } } }}>
            <motion.span className="eyebrow" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } } }}>Enterprise technology, engineered</motion.span>
            <motion.h1 className="display" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } } }}>Building Digital Infrastructure For Enterprise Growth</motion.h1>
            <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } } }}>QTS helps organizations build scalable software platforms, enterprise applications and intelligent digital ecosystems.</motion.p>
            <motion.div className="hero-actions" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } } }}>
              <Magnetic><Link href="/solutions" className="btn btn-primary">Explore solutions <ArrowRightIcon width={15} /></Link></Magnetic>
              <Link href="/contact" className="btn btn-light">Talk with experts</Link>
            </motion.div>
            <motion.div className="hero-meta" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } } }}><div className="avatars"><i className="avatar">AM</i><i className="avatar">JL</i><i className="avatar">RS</i></div><span>Trusted by enterprise teams in 10+ industries</span></motion.div>
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
