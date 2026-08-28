import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { CompanyHeroVisual, CompanyTimeline, CultureGallery, MethodologyExperience } from "@/components/marketing/company/CompanyExperience";

export const metadata: Metadata = {
  title: "Company — QTS",
  description: "Why enterprise organizations trust QTS to build resilient software platforms, intelligent operations and lasting technology foundations.",
};

const leaders = [
  { image: "/images/company/leadership/founder.svg", name: "Elena Park", role: "Founder & Chief Executive Officer", quote: "Technology should simplify complexity — especially where the cost of uncertainty is highest." },
  { image: "/images/company/leadership/cto.svg", name: "Marcus Reid", role: "Chief Technology Officer", quote: "The architecture only earns its place when teams can change with confidence." },
  { image: "/images/company/leadership/product.svg", name: "Sofia Alvarez", role: "Chief Product Officer", quote: "A platform becomes strategic when the better decision becomes the easier one." },
];

const stack = [
  { title: "Experience layer", copy: "Interfaces engineered for decisive work.", technologies: ["Next.js", "React", "TypeScript"] },
  { title: "Foundation", copy: "A secure, connected enterprise core.", technologies: ["Django", "PostgreSQL", "REST API"] },
  { title: "Intelligence layer", copy: "Scalable systems that learn with you.", technologies: ["Cloud", "Data", "AI"] },
];

export default function Page() {
  return <MarketingShell>
    <section className="company-hero noise">
      <div className="container company-hero-grid"><div><span className="eyebrow">Company · QTS</span><h1 className="display">Building technology foundations for the next generation of enterprises.</h1><p>QTS brings product thinking, systems engineering and enterprise delivery into one operating model — so organizations can turn their hardest complexity into durable capability.</p><div className="page-hero-actions"><Link href="/contact" className="btn btn-primary">Build with QTS <ArrowRightIcon width={15} /></Link><Link href="#methodology" className="btn btn-light">See how QTS works</Link></div><div className="company-hero-trust"><span><b>500+</b> enterprise projects</span><span><b>99.9%</b> platform uptime</span><span><b>10+</b> industries transformed</span></div></div><CompanyHeroVisual /></div>
    </section>

    <section className="section company-history"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">The QTS story</span><h2>Built in the space between enterprise ambition and operational reality.</h2><p>We have grown by solving the work that tends to sit between established systems: the decisions, data and handoffs that determine whether strategy moves.</p></div></Reveal><Reveal delay={0.1}><CompanyTimeline /></Reveal></div></section>

    <section className="section company-beliefs"><div className="container"><Reveal><span className="eyebrow">What holds the work together</span></Reveal><Reveal delay={0.1}><div className="beliefs-grid"><article><small>Mission</small><h2>Transform complex business challenges into scalable digital solutions.</h2></article><article><small>Vision</small><h2>Become the trusted technology infrastructure partner for global enterprises.</h2></article><article><small>Values</small><div className="value-terms"><span>Innovation</span><span>Reliability</span><span>Collaboration</span><span>Security</span></div><p>Values matter only when they change what gets designed, released and supported. At QTS, they define our delivery standard.</p></article></div></Reveal></div></section>

    <section className="section" id="methodology"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">How QTS works</span><h2>A delivery system built for enterprise movement.</h2><p>QTS does not treat launch as the finish line. We create a path from the business constraint to measurable, continuously improving operational capability.</p></div></Reveal><Reveal delay={0.1}><MethodologyExperience /></Reveal></div></section>

    <section className="section company-culture"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">The delivery culture</span><h2>Designed in partnership. Built with technical conviction.</h2><p>Our teams make complex work visible early, challenge weak assumptions directly and stay close enough to the operation to make the platform useful on day one.</p></div></Reveal><Reveal delay={0.1}><CultureGallery /></Reveal></div></section>

    <section className="section" id="leadership"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Leadership</span><h2>People accountable for the standard.</h2><p>QTS leadership connects business context with the disciplines required to make enterprise technology durable.</p></div></Reveal><div className="leadership-grid">{leaders.map((leader, i) => <Reveal key={leader.name} delay={i * 0.1}><article className="leader-card"><div className="leader-image"><Image src={leader.image} alt={`Illustrated portrait of ${leader.name}`} fill sizes="(max-width: 700px) 100vw, 33vw" /></div><div><h3>{leader.name}</h3><span>{leader.role}</span><blockquote>"{leader.quote}"</blockquote></div></article></Reveal>)}</div></div></section>

    <section className="section company-technology" id="technology"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Engineering credibility</span><h2>The architecture behind resilient growth.</h2><p>Modern technology choices matter only when they make the business more capable, secure and ready for change.</p></div></Reveal><Reveal delay={0.1}><div className="tech-grid">{stack.map(({ title, copy, technologies }, index) => <article className="tech-group" key={title}>{index !== 1 && <i className="arch-line" />}{index === 1 ? <div className="arch-node"><div><i className="brand-mark" /><strong>QTS Platform Core</strong><span>Composable, secure and API-first</span></div></div> : <><h3>{title}</h3><p>{copy}</p><div className="tech-stack">{technologies.map((technology) => <span className="tech-pill" key={technology}><i />{technology}</span>)}</div></>}</article>)}</div></Reveal></div></section>

    <section className="section industries" id="security"><div className="container contact-layout"><Reveal><div><span className="eyebrow">Security and trust</span><h2 className="display" style={{ color: "#fff", fontSize: "clamp(38px,4vw,56px)", margin: "18px 0" }}>Control without slowing down.</h2><p style={{ color: "#aeb2c9", fontSize: 16, lineHeight: 1.65 }}>QTS engineers governance into the platform so teams can move with confidence, every decision is traceable and every integration has a clear boundary.</p></div></Reveal><Reveal delay={0.15}><div className="contact-aside"><div className="contact-note"><i><LockClosedIcon /></i><span>Role-based access and governed workflows</span></div><div className="contact-note"><i><ShieldCheckIcon /></i><span>Secure API-first integration architecture</span></div><div className="contact-note"><i><CheckCircleIcon /></i><span>Auditable operations and measurable system health</span></div></div></Reveal></div></section>
    <CallToAction title="Make your next platform decision count." />
  </MarketingShell>;
}
