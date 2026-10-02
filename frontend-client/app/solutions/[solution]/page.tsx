import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import CuratedSourceList from "@/components/marketing/CuratedSourceList";
import Reveal from "@/components/marketing/Reveal";
import { buildMetadata } from "@/lib/seo";
import { getSolutionTheme, solutionThemes } from "@/lib/solution-catalog";
import { resources } from "@/components/marketing/resources/catalog";
import CallToAction from "@/components/marketing/CallToAction";

export function generateStaticParams() {
  return solutionThemes.map((s) => ({ solution: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ solution: string }> }): Promise<Metadata> {
  const { solution } = await params;
  const theme = getSolutionTheme(solution);
  if (!theme) return {};
  return buildMetadata({
    title: `${theme.title} - QTS`,
    description: theme.description,
    path: `/solutions/${solution}`,
  });
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ solution: string }> }) {
  const { solution } = await params;
  const theme = getSolutionTheme(solution);
  if (!theme) notFound();

  const relatedResources = resources.filter((r) => theme.relatedResourceSlugs.includes(r.slug) || r.themes.includes(theme.slug)).slice(0, 3);

  return (
    <MarketingShell>
      <section className="solution-detail-hero noise">
        <div className="container solution-detail-hero-grid">
          <Reveal>
            <div>
              <Link href="/solutions" className="back-link">← Tất cả giải pháp</Link>
              <span className="eyebrow">Giải pháp</span>
              <h1 className="display">{theme.title}</h1>
              <p className="solution-detail-lead">{theme.longDescription}</p>
              <div className="solution-detail-topics">
                {theme.topics.map((t) => (
                  <span key={t} className="solution-topic-tag">{t}</span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <figure className="solution-detail-cover">
              <Image src={theme.cover} alt={theme.alt} fill sizes="(max-width: 900px) 100vw, 42vw" priority />
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container solution-detail-body">
          <Reveal>
            <h2>Những cân nhắc khi triển khai</h2>
            <ul className="solution-considerations">
              {theme.considerations.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <CuratedSourceList sourceIds={theme.sourceIds} />
          </Reveal>

          {relatedResources.length > 0 && (
            <Reveal delay={0.12}>
              <section className="related-resources" aria-labelledby="related-resources-title">
                <h2 id="related-resources-title">Tài nguyên liên quan</h2>
                <div className="related-resources-grid">
                  {relatedResources.map((r) => (
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

          <Reveal delay={0.15}>
            <div className="solution-detail-cta">
              <Link href="/contact" className="btn btn-primary">Trao đổi về {theme.shortTitle.toLowerCase()} <ArrowRightIcon width={15} /></Link>
              <Link href="/resources" className="btn btn-light">Khám phá tài nguyên</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <CallToAction title="Cùng làm rõ bước tiếp theo cho giải pháp của bạn." copy="QTS bắt đầu từ bài toán và ràng buộc thực tế trước khi đề xuất kiến trúc." />
    </MarketingShell>
  );
}
