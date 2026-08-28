import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CallToAction from "@/components/marketing/CallToAction";
import Reveal from "@/components/marketing/Reveal";
import { resourceCategories, resources } from "@/components/marketing/resources/catalog";
import { ResourceCardGrid } from "@/components/marketing/resources/ResourceCards";

export const metadata: Metadata = {
  title: "Resources — QTS",
  description: "QTS knowledge center: case studies, solutions guides, technology insights, white papers and product updates for enterprise platforms.",
};

export default function Page() {
  const featured = resources.find((r) => r.slug === "global-manufacturing") ?? resources[0];
  const editorial = resources.slice(1);

  return <MarketingShell>
    <section className="resource-hero noise">
      <div className="container">
        <div className="resource-hero-top">
          <div>
            <span className="eyebrow">Resources · Knowledge center</span>
            <h1 className="display">Perspective that earns the next platform decision.</h1>
            <p>QTS resources are not a blog feed. They show how successful teams brought fragmented operations, data and workflows into one governed product-led advantage.</p>
            <div className="resource-category-pills">
              {resourceCategories.map((category) => <Link key={category.slug} href={`/resources/${category.slug}`} className="resource-pill">{category.label}</Link>)}
            </div>
          </div>
          <Reveal delay={0.15}><div className="resource-hero-proof">
            <div className="resource-proof-card"><b>500+</b><span>Enterprise projects informing every guide and case study</span></div>
            <div className="resource-proof-card"><b>10+</b><span>Industries behind the patterns, playbooks and reported outcomes</span></div>
            <div className="resource-proof-card"><b>3</b><span>Downloadable executive papers for long-horizon investment</span></div>
          </div></Reveal>
        </div>

        <Reveal delay={0.2}><Link href={featured.href} className="resource-feature">
          <div className="resource-feature-media">
            <Image src="/images/resources/manufacturing-operations.svg" alt="Global Manufacturing operations command center" fill priority sizes="(max-width: 950px) 100vw, 58vw" />
            <span className="resource-feature-badges"><i>Case study</i><i>ABC Manufacturing Group · Manufacturing</i></span>
          </div>
          <div className="resource-feature-body">
            <span className="eyebrow">Featured story</span>
            <h2>How enterprises transform with QTS</h2>
            <h3>{featured.title}</h3>
            <p>Legacy reporting left leaders blind between finance, production and delivery. QTS built a centralized enterprise management platform on Next.js, Django, AI analytics and cloud infrastructure — and made operational truth visible.</p>
            <div className="resource-feature-metrics">
              <span><b>+45%</b><small>operational efficiency</small></span>
              <span><b>-60%</b><small>manual reporting</small></span>
              <span><b>8×</b><small>faster reporting cadence</small></span>
            </div>
            <span className="btn btn-primary">Read the flagship story <ArrowRightIcon width={15} /></span>
            <small className="resource-feature-meta">Next.js · Django · AI Analytics · Cloud Infrastructure · 12 min read</small>
          </div>
        </Link></Reveal>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Research by intent</span>
          <h2>Start with the question you are trying to answer.</h2>
          <p>Each resource category exists for a different executive moment — from proving change is possible to choosing the architecture that keeps advantage compounding.</p>
        </div></Reveal>
        <Reveal delay={0.1}><div className="resource-category-grid">
          {resourceCategories.map((category) => <Link key={category.slug} href={`/resources/${category.slug}`} className={`resource-category-card resource-category-${category.slug}`}>
            <span className="resource-category-cover" aria-hidden="true">
              <Image
                src={category.slug === "case-studies" ? "/images/resources/manufacturing-operations.svg" : category.slug === "solutions-guides" ? "/images/resources/saas-architecture.svg" : category.slug === "technology-insights" ? "/images/resources/ai-intelligence.svg" : category.slug === "white-papers" ? "/images/resources/security-blueprint.svg" : "/images/resources/product-update.svg"}
                alt=""
                fill
                sizes="360px"
              />
            </span>
            <span className="eyebrow">{category.eyebrow}</span>
            <h3>{category.label}</h3>
            <p>{category.description}</p>
            <small>Explore {category.label.toLowerCase()} →</small>
          </Link>)}
        </div></Reveal>
      </div>
    </section>

    <section className="section" style={{ background: "#f7f8fc" }}>
      <div className="container">
        <Reveal><div className="section-heading">
          <span className="eyebrow">Editorial rail</span>
          <h2>What leaders are reading now.</h2>
          <p>Real implementations, architectural decisions and technical perspective — curated as a product-led resource system rather than a date-sorted feed.</p>
        </div></Reveal>
        <Reveal delay={0.1}><ResourceCardGrid resources={editorial} /></Reveal>
        <Reveal delay={0.15}><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link href="/resources/case-studies" className="btn btn-primary">View case studies <ArrowRightIcon width={15} /></Link>
          <Link href="/contact" className="btn btn-light">Ask for a tailored reading list</Link>
        </div></Reveal>
      </div>
    </section>

    <CallToAction title="Make the next transformation more concrete." copy="Start with the operating problem. QTS helps shape the product, platform and evidence for the decision ahead." />
  </MarketingShell>;
}
