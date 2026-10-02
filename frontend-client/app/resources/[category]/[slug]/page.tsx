import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CuratedSourceList from "@/components/marketing/CuratedSourceList";
import Reveal from "@/components/marketing/Reveal";
import { buildMetadata } from "@/lib/seo";
import { getResource, resources } from "@/components/marketing/resources/catalog";
import { getSolutionTheme } from "@/lib/solution-catalog";
import CallToAction from "@/components/marketing/CallToAction";

export function generateStaticParams() {
  return resources.map((r) => ({ category: r.category, slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const resource = getResource(category, slug);
  if (!resource) return {};
  return buildMetadata({
    title: `${resource.title} - QTS`,
    description: resource.description,
    path: `/resources/${category}/${slug}`,
  });
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const resource = getResource(category, slug);
  if (!resource) notFound();

  const isModel = resource.category === "case-studies";
  const related = resources.filter((r) => r.slug !== resource.slug && r.themes.some((t) => resource.themes.includes(t))).slice(0, 3);

  return (
    <MarketingShell>
      <section className="resource-detail-hero noise">
        <div className="container">
          <Link href={`/resources/${resource.category}`} className="back-link">← {resource.type}</Link>
          <span className="eyebrow">{resource.type}{isModel ? " · Có nguồn Việt Nam" : ""}</span>
          <h1 className="display">{resource.title}</h1>
          <p className="resource-detail-lead">{resource.description}</p>
          <div className="resource-detail-meta">
            <span>{resource.readingTime}</span>
            <span className="resource-detail-themes">{resource.themes.map((t) => getSolutionTheme(t)?.shortTitle ?? t).join(" · ")}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container resource-detail-body">
          <Reveal>
            <figure className="resource-detail-cover">
              <Image src={resource.image} alt={resource.imageAlt} fill sizes="(max-width: 900px) 100vw, 720px" priority />
              {isModel && <figcaption>Bối cảnh ngành từ tài liệu công khai — ảnh minh hoạ quy trình, không phải kết quả khách hàng đã công bố.</figcaption>}
            </figure>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="resource-detail-content">
              {resource.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <section className="resource-checklist" aria-labelledby="checklist-title">
              <h2 id="checklist-title">Gợi ý thảo luận</h2>
              <ul>
                {resource.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <CuratedSourceList sourceIds={resource.sourceIds} />
          </Reveal>

          {related.length > 0 && (
            <Reveal delay={0.14}>
              <section className="related-resources" aria-labelledby="related-title">
                <h2 id="related-title">Tài nguyên liên quan</h2>
                <div className="related-resources-grid">
                  {related.map((r) => (
                    <Link key={r.slug} href={r.href} className="related-resource-card">
                      <span className="resource-tag">{r.type}</span>
                      <strong>{r.title}</strong>
                      <small>{r.description}</small>
                      <span className="related-resource-cta">Xem tài nguyên →</span>
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          <Reveal delay={0.16}>
            <div className="resource-detail-cta">
              <Link href="/contact" className="btn btn-primary">Trao đổi với QTS <ArrowRightIcon width={15} /></Link>
              <Link href={`/resources/${resource.category}`} className="btn btn-light">Xem thêm {resource.type.toLowerCase()}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <CallToAction title="Làm rõ hơn cho quyết định tiếp theo." copy="QTS cùng bạn xác định phạm vi và lộ trình phù hợp trước khi đi sâu vào kiến trúc." />
    </MarketingShell>
  );
}
