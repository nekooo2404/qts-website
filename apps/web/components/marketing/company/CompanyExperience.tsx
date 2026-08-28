"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const milestones = [
  { year: "2018", title: "QTS founded", copy: "Established around a simple conviction: enterprise technology should make complexity easier to act on." },
  { year: "2020", title: "Enterprise software expansion", copy: "Extended product delivery across core operational, financial and customer systems." },
  { year: "2023", title: "AI platform launched", copy: "Brought governed intelligence and workflow automation into the systems teams already trusted." },
  { year: "2026", title: "Global digital ecosystem provider", copy: "Building connected platforms for organizations operating across markets, systems and teams." },
];

const stages = [
  { number: "01", title: "Discover", copy: "Expose the decision, handoff and operating constraint where a connected platform can create leverage.", output: "Outcome map · operating baseline" },
  { number: "02", title: "Design", copy: "Shape the architecture and product experience around the people who must make better work happen.", output: "Platform blueprint · experience prototype" },
  { number: "03", title: "Build", copy: "Engineer composable software that fits the existing estate while changing the work that matters.", output: "Delivery increments · integration foundation" },
  { number: "04", title: "Deploy", copy: "Move through governed release paths with observable infrastructure, clear ownership and adoption support.", output: "Cloud release · operational readiness" },
  { number: "05", title: "Optimize", copy: "Use adoption, performance and outcome signals to make the platform more valuable after launch.", output: "Impact review · continuous improvement" },
];

const gallery = [
  { src: "/images/company/culture-engineering.svg", title: "Engineering reviews", copy: "Architecture decisions made visible." },
  { src: "/images/company/culture-workshop.svg", title: "Client workshops", copy: "A shared view of the constraint before the build." },
  { src: "/images/company/culture-collaboration.svg", title: "Cross-functional delivery", copy: "Product, data and engineering working as one team." },
  { src: "/images/company/culture-product.svg", title: "Product critique", copy: "Interfaces sharpened around the moment of decision." },
];

export function CompanyHeroVisual() {
  const reduceMotion = useReducedMotion();
  return <motion.div className="company-hero-visual" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -7, 0], scale: 1 }} transition={{ opacity: { duration: .65 }, scale: { duration: .65 }, y: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}>
    <Image src="/images/company/headquarters.svg" alt="Abstract QTS technology workspace with connected enterprise operating surfaces" fill priority sizes="(max-width: 950px) 100vw, 53vw" />
    <div className="company-hero-float"><b>QTS delivery network</b><span>Product · Engineering · Data · Cloud</span></div>
  </motion.div>;
}

export function CompanyTimeline() {
  const [active, setActive] = useState(3);
  return <div className="company-timeline" role="tablist" aria-label="QTS company history">{milestones.map((milestone, index) => <button key={milestone.year} type="button" role="tab" aria-selected={active === index} className={active === index ? "active" : ""} onClick={() => setActive(index)}><span>{milestone.year}</span><i /><strong>{milestone.title}</strong><small>{active === index ? milestone.copy : "Select to view milestone"}</small></button>)}</div>;
}

export function MethodologyExperience() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const stage = stages[active];
  return <div className="methodology-shell">
    <div className="methodology-steps">{stages.map((item, index) => <button type="button" key={item.number} className={active === index ? "active" : ""} onClick={() => setActive(index)} aria-pressed={active === index}><span>{item.number}</span><b>{item.title}</b></button>)}</div>
    <motion.div className="methodology-detail" key={stage.number} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }}><span>Stage {stage.number}</span><h3>{stage.title}</h3><p>{stage.copy}</p><small>{stage.output}</small></motion.div>
  </div>;
}

export function CultureGallery() {
  return <div className="culture-gallery">{gallery.map((image, index) => <motion.figure key={image.title} className={`culture-shot culture-shot-${index + 1}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: index * .08 }} tabIndex={0}><Image src={image.src} alt={`${image.title}: ${image.copy}`} fill sizes="(max-width: 700px) 100vw, (max-width: 950px) 50vw, 40vw" /><figcaption><b>{image.title}</b><span>{image.copy}</span></figcaption></motion.figure>)}</div>;
}
