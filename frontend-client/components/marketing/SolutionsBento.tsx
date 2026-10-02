"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon, CloudIcon, CommandLineIcon, GlobeAltIcon, SparklesIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { solutionThemes, type SolutionSlug } from "@/lib/solution-catalog";

const iconMap = {
  enterprise: Squares2X2Icon,
  platform: GlobeAltIcon,
  ai: SparklesIcon,
  cloud: CloudIcon,
  web: CommandLineIcon,
} as const;

const classMap: Record<SolutionSlug, string> = {
  "phan-mem-doanh-nghiep": "enterprise",
  "nen-tang-phan-mem": "",
  "giai-phap-ai": "",
  "he-thong-dam-may": "cloud",
  "ung-dung-web": "",
};

export default function SolutionsBento() {
  return (
    <section className="solutions-panel" aria-label="Bản minh họa các nhóm giải pháp QTS">
      <div className="landing-context-header">
        <b>Giải pháp QTS</b>
        <small>Bản minh họa theo bài toán vận hành</small>
      </div>
      <div className="bento">
        {solutionThemes.map((solution) => {
          const SolutionIcon = iconMap[solution.icon];
          return (
            <article className={`solution ${classMap[solution.slug]}`} key={solution.slug}>
              <Image className="solution-image" src={solution.cover} alt={solution.alt} fill sizes="(max-width: 768px) calc(100vw - clamp(20px, 4vw, 48px)), (max-width: 1024px) 50vw, 33vw" />
              <span className="solution-shade" aria-hidden="true" />
              <i className="solution-icon">
                <SolutionIcon />
              </i>
              <h3>
                <Link href={`/solutions/${solution.slug}`}>{solution.title}</Link>
              </h3>
              <p>{solution.description}</p>
              <span className="solution-link-label">Khám phá giải pháp</span>
              <i className="solution-arrow" aria-hidden="true">
                <ArrowUpRightIcon width={15} />
              </i>
            </article>
          );
        })}
      </div>
    </section>
  );
}
