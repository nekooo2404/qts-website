"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { BuildingOffice2Icon, CursorArrowRaysIcon, GlobeAltIcon, HeartIcon, LightBulbIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export const industries = [
  {
    slug: "healthcare",
    name: "Healthcare",
    icon: HeartIcon,
    image: "/images/industries/healthcare.svg",
    challenge: "Disconnected healthcare systems leave teams assembling patient context by hand.",
    solution: "A connected care operations platform that makes every handoff visible and governed.",
    product: "Care coordination views, intelligent triage and live capacity signals.",
    metrics: [
      { value: 30, suffix: "%", label: "faster operations" },
      { value: 40, suffix: "%", label: "better data visibility" },
    ],
    client: "Nova Healthcare",
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: BuildingOffice2Icon,
    image: "/images/industries/manufacturing.svg",
    challenge: "Manual reporting slows every operational decision on the floor and in finance.",
    solution: "A live production command layer that connects source data, workflow and analytics.",
    product: "Connected production, delivery and finance control.",
    metrics: [
      { value: 45, suffix: "%", label: "more operational efficiency" },
      { value: 60, suffix: "%", label: "less manual reporting" },
    ],
    client: "ABC Manufacturing Group",
  },
  {
    slug: "finance",
    name: "Finance",
    icon: ShieldCheckIcon,
    image: "/images/industries/finance.svg",
    challenge: "Data needs to move quickly, securely and with a complete audit trail.",
    solution: "Governed workflows and trusted reconciliation across people, approvals and systems.",
    product: "Auditable approvals, reconciliations and risk visibility.",
    metrics: [
      { value: 34, suffix: "%", label: "less reconciliation effort" },
      { value: 99, suffix: ".9%", label: "platform availability" },
    ],
    client: "Apex Financial",
  },
  {
    slug: "retail",
    name: "Retail",
    icon: GlobeAltIcon,
    image: "/images/industries/retail.svg",
    challenge: "Customer and demand signals live across channels that never reconcile on their own.",
    solution: "Connected commerce intelligence paired with a unified customer graph.",
    product: "Demand signals, unified customer context and campaign orchestration.",
    metrics: [
      { value: 19, suffix: "%", label: "higher conversion" },
      { value: 27, suffix: "%", label: "faster assortment decisions" },
    ],
    client: "Vertex Retail",
  },
  {
    slug: "education",
    name: "Education",
    icon: LightBulbIcon,
    image: "/images/industries/education.svg",
    challenge: "Teams need visibility into learner and operating outcomes without adding administrative load.",
    solution: "An adaptive learning operations layer that surfaces risk and guides action.",
    product: "One operational view for learners, teams and institutional performance.",
    metrics: [
      { value: 41, suffix: "%", label: "fewer manual tasks" },
      { value: 22, suffix: "%", label: "more targeted interventions" },
    ],
    client: "Arcstone Education",
  },
  {
    slug: "logistics",
    name: "Logistics",
    icon: CursorArrowRaysIcon,
    image: "/images/industries/logistics.svg",
    challenge: "Each handoff creates a potential delay that compounds across the fulfillment flow.",
    solution: "A fulfillment command layer for exception visibility and delivery confidence.",
    product: "Orchestrated handoffs, exception intelligence and delivery assurance.",
    metrics: [
      { value: 27, suffix: "%", label: "more predictable delivery" },
      { value: 33, suffix: "%", label: "faster exception resolution" },
    ],
    client: "Cirrus Logistics",
  },
] as const;

const trustedCompanies = ["Global Manufacturing Group", "Nova Healthcare", "Apex Financial", "Vertex Retail", "Cirrus Logistics", "Arcstone Education", "Northstar Systems", "Motion Industries"];

const testimonials = [
  {
    company: "Nova Manufacturing",
    logo: "NM",
    name: "Michael Anderson",
    role: "Chief Executive Officer",
    quote: "QTS helped us transform fragmented operations into a unified digital platform. Leaders finally see the same operating picture at the same time.",
    image: "/images/company/leadership/founder.svg",
  },
  {
    company: "Nova Healthcare",
    logo: "NH",
    name: "Sarah Kim",
    role: "Chief Operating Officer",
    quote: "The difference is not another dashboard. The right information arrives where the care decision is made — with governance our teams trust.",
    image: "/images/company/leadership/product.svg",
  },
  {
    company: "Apex Financial",
    logo: "AF",
    name: "David Chen",
    role: "Chief Financial Officer",
    quote: "QTS gave finance, risk and operations a single accountable workflow. Control improved without pulling speed out of the business.",
    image: "/images/company/leadership/cto.svg",
  },
];

const customerStories = [
  {
    company: "Nova Healthcare",
    industry: "Healthcare",
    image: "/images/industries/healthcare.svg",
    before: "Manual patient coordination across disconnected records and messaging.",
    after: "AI-assisted care platform routes patient context, capacity and next steps directly to clinical teams.",
    result: "50% workflow improvement across coordinated care journeys.",
  },
  {
    company: "Global Manufacturing Group",
    industry: "Manufacturing",
    image: "/images/industries/manufacturing.svg",
    before: "A week-long reporting cycle reconciled by spreadsheet across plants and finance.",
    after: "A centralized enterprise platform makes production, delivery and finance legible in real time.",
    result: "+45% operational efficiency and 60% fewer manual reporting hours.",
  },
  {
    company: "Apex Financial",
    industry: "Finance",
    image: "/images/industries/finance.svg",
    before: "High-friction approvals and reconciliations exposed risk and slowed close.",
    after: "Governed workflows bring approvals, controls and audit context into one trusted journey.",
    result: "34% faster close and stronger audit readiness.",
  },
];

function CountUpMetric({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: .6 });
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion, value]);

  return <span className="industry-metric"><b ref={ref}>{display}{suffix}</b><small>{label}</small></span>;
}

export function IndustryEcosystemMap() {
  const reduceMotion = useReducedMotion();
  return <motion.div className="industry-ecosystem" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -6, 0] }} transition={{ opacity: { duration: .6 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}>
    <Image src="/images/industries/ecosystem.svg" alt="Industry ecosystem map showing QTS platform connected to healthcare, manufacturing, finance, retail, education and logistics" fill priority sizes="(max-width: 950px) 100vw, 52vw" />
  </motion.div>;
}

export function IndustryBento() {
  return <div className="industry-bento">{industries.map((industry, index) => {
    const IndustryIcon = industry.icon;
    return <motion.article key={industry.slug} id={industry.slug} className="industry-bento-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={{ delay: Math.min(index * .06, .24), duration: .45 }}>
      <div className="industry-bento-media">
        <Image src={industry.image} alt={`${industry.name} platform visual`} fill sizes="(max-width: 950px) 100vw, 33vw" />
        <span className="industry-bento-pill"><IndustryIcon />{industry.name}</span>
      </div>
      <div className="industry-bento-body">
        <span className="industry-bento-client">{industry.client}</span>
        <dl>
          <div><dt>Industry challenge</dt><dd>{industry.challenge}</dd></div>
          <div><dt>QTS solution</dt><dd>{industry.solution}</dd></div>
          <div><dt>Product surface</dt><dd>{industry.product}</dd></div>
        </dl>
        <div className="industry-bento-metrics">{industry.metrics.map((metric) => <CountUpMetric key={metric.label} value={metric.value} suffix={metric.suffix} label={metric.label} />)}</div>
        <Link href="/contact" className="industry-bento-cta">Talk with an {industry.name.toLowerCase()} expert →</Link>
      </div>
    </motion.article>;
  })}</div>;
}

export function TrustedBand() {
  return <section className="trusted-band" aria-label="Trusted by enterprise organizations">
    <div className="container trusted-band-head"><span className="eyebrow">Trusted by organizations built to lead</span><p>QTS supports enterprise teams where operational failure is expensive and change needs to be credible with the board.</p></div>
    <div className="trusted-marquee" aria-hidden="true">
      <div className="trusted-track">{[...trustedCompanies, ...trustedCompanies].map((company, index) => <span key={`${company}-${index}`} className="trusted-logo">{company}</span>)}</div>
    </div>
    <div className="container trusted-grid" role="list">{trustedCompanies.map((company) => <span key={company} role="listitem" className="trusted-card">{company}</span>)}</div>
  </section>;
}

export function TestimonialsExperience() {
  const [active, setActive] = useState(0);
  const testimonial = testimonials[active];
  return <section className="testimonial-band"><div className="container testimonial-shell">
    <div className="section-heading"><span className="eyebrow">Customer voice</span><h2>Executives put it plainly.</h2><p>Not polished claims — the operating changes leaders bring back to their teams.</p></div>
    <div className="testimonial-stage">
      <div className="testimonial-main">
        <span className="testimonial-mark">{testimonial.logo}</span>
        <blockquote>“{testimonial.quote}”</blockquote>
        <div className="testimonial-person">
          <span className="testimonial-avatar"><Image src={testimonial.image} alt="" fill sizes="56px" /></span>
          <span><b>{testimonial.name}</b><small>{testimonial.role} · {testimonial.company}</small></span>
        </div>
      </div>
      <div className="testimonial-controls" role="tablist" aria-label="Customer testimonials">
        {testimonials.map((item, index) => <button key={item.company} type="button" role="tab" aria-selected={active === index} className={active === index ? "active" : ""} onClick={() => setActive(index)}><b>{item.company}</b><small>{item.name} · {item.role}</small></button>)}
      </div>
    </div>
  </div></section>;
}

export function CustomerStoryCards() {
  return <section className="section"><div className="container"><div className="section-heading"><span className="eyebrow">Customer stories</span><h2>The before-and-after that convinces a room.</h2><p>Each story makes the operational change legible — challenge, shipped solution surface and the result that followed.</p></div><div className="customer-story-grid">{customerStories.map((story) => <article key={story.company} className="customer-story-card"><div className="customer-story-media"><Image src={story.image} alt={`${story.company} case overview`} fill sizes="(max-width: 950px) 100vw, 33vw" /></div><div className="customer-story-body"><span>{story.industry} · {story.company}</span><dl><div><dt>Before</dt><dd>{story.before}</dd></div><div><dt>After</dt><dd>{story.after}</dd></div></dl><b>{story.result}</b><Link href="/contact">Discuss a comparable path →</Link></div></article>)}</div></div></section>;
}
