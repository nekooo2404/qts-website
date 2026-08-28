import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import HomeExperience from "@/components/marketing/HomeExperience";
import PlatformExplorer from "@/components/marketing/PlatformExplorer";
import SolutionsBento from "@/components/marketing/SolutionsBento";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "QTS — Digital infrastructure for enterprise growth",
  description: "QTS builds scalable software platforms, enterprise applications and intelligent digital ecosystems. Explore the platform, solutions and industry outcomes.",
};

export default function Page() {
  return <MarketingShell>
    <HomeExperience />
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">One connected foundation</span>
          <h2>Every essential system, working as one.</h2>
          <p>QTS replaces fragmented tools with an adaptive operating platform. CRM, ERP, AI, Analytics, Workflow and Cloud run on one composable core.</p>
        </div></Reveal>
        <Reveal delay={0.1}><PlatformExplorer /></Reveal>
        <Reveal delay={0.15}><div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}><Link href="/platform" className="btn btn-light">Explore platform <ArrowRightIcon width={15} /></Link></div></Reveal>
      </div>
    </section>
    <section className="section" style={{ background: "#f7f8fc" }}>
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Designed around your ambition</span>
          <h2>Technology that moves the business forward.</h2>
          <p>From system of record to customer-loved product, QTS turns the work that defines your advantage into software.</p>
        </div></Reveal>
        <Reveal delay={0.1}><SolutionsBento /></Reveal>
        <Reveal delay={0.15}><div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}><Link href="/solutions" className="btn btn-light">View all solutions <ArrowRightIcon width={15} /></Link></div></Reveal>
      </div>
    </section>
    <section className="section case-study">
      <div className="container case-grid">
        <Reveal><div>
          <span className="eyebrow">Client transformation</span>
          <h2 className="display" style={{ fontSize: "clamp(36px,4vw,52px)", margin: "18px 0" }}>From lagging reports to a live operating advantage.</h2>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.65, maxWidth: 490 }}>Global Manufacturing Corp unified production, delivery and finance on QTS. Reporting cycles accelerated 8× and leaders redirect resources while there is time to act.</p>
          <div className="case-steps">
            <div className="case-step"><small>BEFORE</small><h4>Manual reporting everywhere</h4><p>Teams spent days reconciling spreadsheets.</p></div>
            <div className="case-step"><small>QTS SOLUTION</small><h4>A connected operations platform</h4><p>QTS unified essential data and automated blocked decisions.</p></div>
            <div className="case-step"><small>AFTER</small><h4>Real-time operational control</h4><p>Risk surfaces early and teams respond in hours, not weeks.</p></div>
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <Link href="/resources" className="btn btn-primary">Read case study <ArrowRightIcon width={15} /></Link>
            <Link href="/contact" className="btn btn-light">Talk with experts</Link>
          </div>
        </div></Reveal>
        <Reveal delay={0.15}><div className="case-dashboard" aria-label="Manufacturing operations dashboard preview">
          <div className="case-dashboard-top"><span>Global Manufacturing Corp</span><span style={{ color: "#6ee0b2" }}>● Operating live</span></div>
          <div className="case-body">
            <aside className="case-side"><p>Operations</p><i className="case-site-item active" /><i className="case-site-item" /><i className="case-site-item" /><i className="case-site-item" /></aside>
            <div className="case-visuals">
              <div className="dark-panel"><label>Production output</label><strong>94.8%</strong><span>↑ 8.2% vs plan</span></div>
              <div className="dark-panel"><label>Delivery confidence</label><strong>97.1%</strong><span>↑ 3.4% vs last week</span></div>
              <div className="dark-panel wide"><label>Factory performance</label><div className="dark-bars">{[52, 75, 63, 86, 79, 96, 72, 91].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></div>
            </div>
          </div>
        </div></Reveal>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Why QTS</span>
          <h2>Built for clarity at enterprise scale.</h2>
          <p>Every module, workflow and insight is engineered to make complex operations feel immediately understandable.</p>
        </div></Reveal>
        <div className="company-points" style={{ marginTop: 32 }}>
          <Reveal delay={0}><div className="company-point"><i><ShieldCheckIcon /></i><h3>Secure by design</h3><p>API-first architecture with auditable workflows and enterprise-grade controls.</p></div></Reveal>
          <Reveal delay={0.1}><div className="company-point"><i><SparklesIcon /></i><h3>Intelligence in flow</h3><p>AI surfaces opportunities and recommends the next best action where work happens.</p></div></Reveal>
          <Reveal delay={0.2}><div className="company-point"><i><CheckCircleIcon /></i><h3>Proven delivery</h3><p>500+ enterprise projects across 10+ industries, 99.9% platform uptime.</p></div></Reveal>
        </div>
      </div>
    </section>
    <CallToAction />
  </MarketingShell>;
}
