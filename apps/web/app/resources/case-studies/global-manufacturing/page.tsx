import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Global Manufacturing Digital Operations Platform — QTS",
  description: "How ABC Manufacturing Group achieved +45% operational efficiency and reduced manual reporting by 60% with a QTS platform.",
};

const phases = [
  ["01", "Discover", "Mapped the production, delivery and finance handoffs creating reporting delay."],
  ["02", "Design", "Established one operating model and a role-specific command experience for plant and executive teams."],
  ["03", "Build", "Connected the core systems with Django services, a Next.js operating surface and AI analytics."],
  ["04", "Deploy", "Rolled out by site with governed cloud infrastructure and live data-quality controls."],
];

export default function GlobalManufacturingCaseStudy() {
  return <MarketingShell>
    <section className="case-detail-hero noise"><div className="container">
      <Link href="/resources/case-studies" className="back-link">← Case studies</Link>
      <div className="case-detail-head"><div><span className="eyebrow">Case study · Manufacturing</span><h1 className="display">Global Manufacturing Digital Operations Platform</h1><p>ABC Manufacturing Group turned a disconnected legacy operation into a live, decision-grade command layer for production, delivery and finance.</p><div className="case-detail-client"><b>ABC Manufacturing Group</b><span>Global manufacturing · 14 sites · 8,400 employees</span></div></div><div className="case-detail-cover"><Image src="/images/resources/manufacturing-operations.svg" alt="Abstract visualization of a connected manufacturing operating platform" fill priority sizes="(max-width: 950px) 100vw, 45vw" /></div></div>
    </div></section>
    <section className="case-impact-strip"><div className="container"><div><b>+45%</b><span>operational efficiency</span></div><div><b>-60%</b><span>manual reporting</span></div><div><b>8×</b><span>faster reporting</span></div><div><b>94.8%</b><span>production output visibility</span></div></div></section>
    <section className="section"><div className="container case-detail-grid"><Reveal><div><span className="eyebrow">The constraint</span><h2>Reporting was describing last week while operations were already changing.</h2><p>Legacy systems were functional in isolation. The cost was at the handoff: plant teams reconciled spreadsheets, finance waited on production data and leadership could not see a delivery risk until the window to act had closed.</p></div></Reveal><Reveal delay={0.15}><div className="case-detail-panel"><small>Before QTS</small><h3>Manual truth-finding across every site</h3><ul><li>Seven-day reporting cycle</li><li>Disconnected production, delivery and finance data</li><li>High-value decisions made from stale information</li></ul></div></Reveal></div></section>
    <section className="section case-detail-solution"><div className="container case-detail-grid"><Reveal><div className="case-dashboard" aria-label="Manufacturing operating dashboard preview"><div className="case-dashboard-top"><span>ABC Manufacturing Group</span><span style={{ color: "#6ee0b2" }}>● Operating live</span></div><div className="case-body"><aside className="case-side"><p>Operations</p><i className="case-site-item active" /><i className="case-site-item" /><i className="case-site-item" /><i className="case-site-item" /></aside><div className="case-visuals"><div className="dark-panel"><label>Production output</label><strong>94.8%</strong><span>↑ 8.2% vs plan</span></div><div className="dark-panel"><label>Delivery confidence</label><strong>97.1%</strong><span>↑ 3.4% vs last week</span></div><div className="dark-panel wide"><label>Factory performance</label><div className="dark-bars">{[52, 75, 63, 86, 79, 96, 72, 91].map((height) => <i key={height} style={{ height: `${height}%` }} />)}</div></div></div></div></div></Reveal><Reveal delay={0.15}><div><span className="eyebrow">The QTS solution</span><h2>A centralized enterprise platform that makes the operation legible.</h2><p>QTS built one platform experience around the decisions teams needed to make now, not another dashboard beside the old system. The foundation connected source data, guided workflow and AI analytics in a governed cloud environment.</p><div className="case-stack"><span>Next.js</span><span>Django</span><span>AI Analytics</span><span>Cloud Infrastructure</span></div></div></Reveal></div></section>
    <section className="section"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Delivery timeline</span><h2>A measured path from legacy complexity to live control.</h2></div></Reveal><Reveal delay={0.1}><ol className="case-timeline">{phases.map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></Reveal></div></section>
    <section className="section case-before-after"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">The operational change</span><h2>Less reconciliation. More time to intervene.</h2></div></Reveal><Reveal delay={0.1}><div className="before-after-grid"><article><small>Before</small><h3>Teams assembled a version of the truth by hand.</h3><p>Reporting was late, local and hard to trust across locations.</p></article><article><small>After</small><h3>One live operating picture, routed to the people who can act.</h3><p>Leaders can see exception risk, evaluate it in context and redirect capacity before commitments slip.</p><CheckCircleIcon /></article></div></Reveal></div></section>
    <CallToAction title="Bring your operating constraint into focus." copy="Talk with QTS about the platform, architecture and delivery path that can make your next outcome measurable." />
  </MarketingShell>;
}
