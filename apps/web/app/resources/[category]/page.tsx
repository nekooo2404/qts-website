import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownTrayIcon, ArrowRightIcon, DocumentTextIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { getCategory, getResourcesForCategory, resourceCategories } from "@/components/marketing/resources/catalog";
import { ResourceCardGrid } from "@/components/marketing/resources/ResourceCards";

export function generateStaticParams() {
  return resourceCategories.map(({ slug }) => ({ category: slug }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const category = getCategory(params.category);
  if (!category) return {};
  return { title: `${category.label} — QTS Resources`, description: category.description };
}

export default function ResourceCategoryPage({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  if (!category) notFound();
  const entries = getResourcesForCategory(category.slug);
  const isCaseStudies = category.slug === "case-studies";
  const isGuides = category.slug === "solutions-guides";
  const isInsights = category.slug === "technology-insights";
  const isPapers = category.slug === "white-papers";
  const isUpdates = category.slug === "product-updates";

  return <MarketingShell>
    <section className="resource-category-hero noise">
      <div className="container">
        <Link href="/resources" className="back-link">← QTS knowledge center</Link>
        <span className="eyebrow">{category.eyebrow}</span>
        <h1 className="display">{category.title}</h1>
        <p>{category.description}</p>
        <div className="resource-category-nav">{resourceCategories.map((item) => <Link key={item.slug} href={`/resources/${item.slug}`} className={item.slug === category.slug ? "active" : ""}>{item.label}</Link>)}</div>
      </div>
    </section>

    {isCaseStudies && <section className="section resource-context"><div className="container resource-context-grid"><Reveal><div><span className="eyebrow">A QTS case study has receipts</span><h2>From the business constraint to the operating result.</h2><p>Every story maps a real-world pressure to a delivered product surface, the architecture beneath it and a result leaders can bring back to the boardroom.</p></div></Reveal><Reveal delay={0.1}><dl><div><dt>Challenge</dt><dd>The decision, handoff or blind spot holding the organization back.</dd></div><div><dt>QTS solution</dt><dd>The connected product and delivery path that changed the work.</dd></div><div><dt>Impact</dt><dd>The operational result that made the transformation measurable.</dd></div></dl></Reveal></div></section>}
    {isGuides && <section className="section resource-context"><div className="container guide-framework"><span>01 · Problem</span><span>02 · Approach</span><span>03 · Technology</span><span>04 · Business impact</span></div></section>}
    {isInsights && <section className="section resource-context"><div className="container insight-intro"><SparklesIcon /><div><b>Written by QTS practitioners</b><p>Technology perspective grounded in what it takes to design, integrate and operate systems when failure is expensive.</p></div></div></section>}
    {isPapers && <section className="section resource-context"><div className="container paper-intro"><DocumentTextIcon /><div><b>Executive research, ready to take with you</b><p>Each paper is a compact field guide for the strategic, technical and governance conversations required before a large platform investment.</p></div></div></section>}
    {isUpdates && <section className="section resource-context"><div className="container update-intro"><span className="live"><i /> Release channel open</span><p>Product releases are presented as operational capabilities — what changed, where it appears in the platform and the work it helps teams do better.</p></div></section>}

    <section className="section"><div className="container">
      <Reveal><div className="section-heading"><span className="eyebrow">{category.label}</span><h2>{isPapers ? "Research built for the download." : isUpdates ? "A clearer view of what moved forward." : "Work built to be useful in the room."}</h2></div></Reveal>
      <Reveal delay={0.1}><ResourceCardGrid resources={entries} /></Reveal>
      {isPapers && <p className="download-note"><ArrowDownTrayIcon width={15} /> PDF downloads are provided for internal enterprise evaluation and planning.</p>}
      {isUpdates && <div className="release-notes"><span>AI automation</span><span>Decision analytics engine</span><span>Visual workflow builder</span></div>}
      <div style={{ marginTop: 32 }}><Link href="/contact" className="btn btn-primary">Bring a QTS expert into the conversation <ArrowRightIcon width={15} /></Link></div>
    </div></section>
    <CallToAction title="Build the evidence behind your next move." />
  </MarketingShell>;
}
