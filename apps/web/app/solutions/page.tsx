import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CloudIcon, CommandLineIcon, GlobeAltIcon, SparklesIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import SolutionsBento from "@/components/marketing/SolutionsBento";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Solutions — QTS",
  description: "Enterprise software, SaaS platforms, AI, cloud systems and web applications engineered for measurable business impact.",
};

const details = [
  { title: "Enterprise Software", copy: "Core systems that replace spreadsheets and fragmented tools with one responsive organization.", icon: Squares2X2Icon, points: ["Unified operational, financial and delivery data", "Auditable workflows with role-based control"] },
  { title: "SaaS Platforms", copy: "Products your customers choose to return to — scalable, API-first and ready for every market.", icon: GlobeAltIcon, points: ["Multi-tenant foundations with secure extensibility", "Built for adoption, retention and expansion"] },
  { title: "AI Solutions", copy: "Intelligence integrated into the flow of work so teams see risk early and act with confidence.", icon: SparklesIcon, points: ["Forecasting, recommendations and copilot assistance", "Trusted outputs with human oversight"] },
  { title: "Cloud Systems", copy: "Modern foundations that scale without friction and keep delivery resilient.", icon: CloudIcon, points: ["Composable services with resilient delivery", "99.9% uptime posture and secure connectivity"] },
  { title: "Web Applications", copy: "Digital experiences that perform at any scale and move the business forward.", icon: CommandLineIcon, points: ["High-performance, accessible interfaces", "From system of record to customer love"] },
];

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="Solutions" title="Technology that moves the business forward.">
      <p>From the system of record to the interface your customers love, QTS transforms the work that defines your advantage.</p>
      <p>Each solution is product-led — problem, solution, visible experience and measurable impact.</p>
      <div className="page-hero-actions">
        <Link href="/contact" className="btn btn-primary">Request consultation <ArrowRightIcon width={15} /></Link>
        <Link href="/platform" className="btn btn-light">Explore platform</Link>
      </div>
    </PageHero>
    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">QTS solution architecture</span>
          <h2>One ecosystem, five product surfaces.</h2>
          <p>Every solution runs on the same platform core, so data, workflows and intelligence stay connected.</p>
        </div></Reveal>
        <Reveal delay={0.1}><SolutionsBento /></Reveal>
        <div className="detail-rows">
          {details.map(({ title, copy, points, icon: Icon }, i) => <Reveal key={title} delay={i * 0.08}><article className="detail-row">
            <i><Icon /></i>
            <div><h3>{title}</h3><p>{copy}</p><ul style={{ margin: "12px 0 0", paddingLeft: 16, color: "#5b5e73", fontSize: 12, lineHeight: 1.6 }}>{points.map((p) => <li key={p}>{p}</li>)}</ul></div>
          </article></Reveal>)}
        </div>
      </div>
    </section>
    <section className="section" style={{ background: "#f7f8fc" }}>
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Business impact</span>
          <h2>Outcomes engineered into the product.</h2>
          <p>QTS defines success in operational terms — not feature lists.</p>
        </div></Reveal>
        <Reveal delay={0.1}><div className="platform-benefits">
          <div className="platform-benefit"><b>31%</b><span>Shorter sales cycles with a connected customer graph</span></div>
          <div className="platform-benefit"><b>42%</b><span>Faster close cycles with one dependable source of truth</span></div>
          <div className="platform-benefit"><b>8×</b><span>Faster reporting with real-time operational intelligence</span></div>
          <div className="platform-benefit"><b>63%</b><span>Fewer manual handoffs via automated workflows</span></div>
        </div></Reveal>
      </div>
    </section>
    <CallToAction title="Bring your roadmap. We will bring the platform." copy="A QTS expert maps your highest-leverage opportunity in one focused conversation." />
  </MarketingShell>;
}
