import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { CustomerStoryCards, IndustryBento, IndustryEcosystemMap, TestimonialsExperience, TrustedBand } from "@/components/marketing/industries/IndustryExperience";

export const metadata: Metadata = {
  title: "Industries — QTS",
  description: "Enterprise technology platforms for healthcare, manufacturing, finance, retail, education and logistics — built around measurable operating outcomes.",
};

export default function Page() {
  return <MarketingShell>
    <section className="industries-hero noise"><div className="container industries-hero-grid"><div><span className="eyebrow">Industries · Enterprise systems</span><h1 className="display">Technology solutions built for every industry.</h1><p>QTS translates industry-specific constraints into connected product experiences — so the systems, decisions and handoffs that define performance can move as one.</p><div className="page-hero-actions"><Link href="#industry-solutions" className="btn btn-primary">Explore industry solutions <ArrowRightIcon width={15} /></Link><Link href="/contact" className="btn btn-light">Talk with an expert</Link></div><div className="industries-hero-note"><b>Built for teams where the cost of fragmented operations is too high.</b><span>Healthcare · Manufacturing · Finance · Retail · Education · Logistics</span></div></div><IndustryEcosystemMap /></div></section>
    <TrustedBand />
    <section className="section" id="industry-solutions"><div className="container"><Reveal><div className="section-heading"><span className="eyebrow">Designed in context</span><h2>Every industry has a different operating truth.</h2><p>QTS starts with the pressure the business can already feel, then designs the platform surface that changes the outcome.</p></div></Reveal><Reveal delay={0.1}><IndustryBento /></Reveal></div></section>
    <Reveal><TestimonialsExperience /></Reveal>
    <Reveal delay={0.1}><CustomerStoryCards /></Reveal>
    <CallToAction title="Build around the constraints that matter most." copy="Bring your industry challenge to QTS. Leave with a focused view of the operating advantage ahead." />
  </MarketingShell>;
}
