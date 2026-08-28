import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, BoltIcon, ChartBarIcon, CloudIcon, CubeTransparentIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import PlatformExplorer from "@/components/marketing/PlatformExplorer";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import ProductExperienceLazy from "@/components/marketing/ProductExperienceLazy";

export const metadata: Metadata = {
  title: "Enterprise Platform — QTS",
  description: "Explore the connected QTS enterprise platform for CRM, ERP, AI, analytics, workflow orchestration and cloud systems.",
};

const foundations = [
  ["CRM", "Customer context available to every team.", UserGroupIcon],
  ["ERP", "Operational and financial data you can trust.", CubeTransparentIcon],
  ["AI", "Recommendations that turn signals into action.", SparklesIcon],
  ["Analytics", "Decision-grade metrics in the moment they matter.", ChartBarIcon],
  ["Workflow", "Automation that keeps complex work moving.", BoltIcon],
  ["Cloud", "A secure API-first foundation that scales.", CloudIcon],
] as const;

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="QTS Enterprise Platform" title="Every essential system, working as one." aside={<><div className="hero-fact"><i><ChartBarIcon /></i><span><b>Decision-grade visibility</b><small>Signals become action across every team.</small></span></div><div className="hero-fact"><i><BoltIcon /></i><span><b>Automation in the flow</b><small>Fewer handoffs, more strategic capacity.</small></span></div><div className="hero-fact"><i><CloudIcon /></i><span><b>Composed for change</b><small>API-first and built to evolve.</small></span></div></>}>
      <p>QTS replaces fragmented technology with an adaptive operating platform designed around how your organization creates value.</p>
      <p>Explore the modules below to see the problem they solve, the product surface and the business outcome.</p>
      <div className="page-hero-actions"><Link href="/contact" className="btn btn-primary">Request consultation <ArrowRightIcon width={15} /></Link></div>
    </PageHero>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading"><span className="eyebrow">Connected by design</span><h2>A platform that gets smarter with every system.</h2><p>QTS brings data, people and workflows into one governed enterprise layer — without forcing teams to abandon the tools that already work.</p></div></Reveal>
        <Reveal delay={0.1}><PlatformExplorer /></Reveal>
      </div>
    </section>
    <section className="section" style={{ background: "#f7f8fc" }}>
      <div className="container">
        <Reveal><div className="section-heading"><span className="eyebrow">Product experience</span><h2>Built for clarity at the speed of business.</h2><p>Every signal, task and decision lives in an interface that makes complex operations immediately understandable.</p></div></Reveal>
        <Reveal delay={0.1}><ProductExperienceLazy /></Reveal>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading"><span className="eyebrow">Platform capabilities</span><h2>Six modules. One dependable core.</h2><p>Choose a starting point or bring the entire operating model together.</p></div></Reveal>
        <div className="detail-rows">
          {foundations.map(([name, copy, Icon], i) => <Reveal key={name} delay={i * 0.08}><article className="detail-row"><i><Icon /></i><div><h3>QTS {name}</h3><p>{copy}</p></div></article></Reveal>)}
        </div>
      </div>
    </section>
    <CallToAction title="Turn disconnected systems into one operating advantage." />
  </MarketingShell>;
}
