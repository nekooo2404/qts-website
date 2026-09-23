"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";
import { industryOperations } from "@/lib/industry-operations";
import { getCuratedSource } from "@/lib/curated-sources";

export const industries = industryOperations;

export function IndustryEcosystemMap() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.figure
      className="industry-ecosystem"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -6, 0] }}
      transition={{ opacity: { duration: 0.6 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
    >
      <Image
        src="/images/industries/manufacturing-line.jpg"
        alt="Dây chuyền sản xuất — ảnh minh họa bối cảnh kết nối dữ liệu ngành"
        fill
        priority
        sizes="(max-width: 950px) 100vw, 52vw"
      />
      <figcaption>Ảnh minh họa bối cảnh — không mô tả cơ sở hay khách hàng QTS.</figcaption>
    </motion.figure>
  );
}

export function IndustryBento() {
  return (
    <div className="industry-bento">
      {industries.map((industry, index) => {
        const IndustryIcon = industry.icon;
        const sources = industry.sourceIds.map((id) => getCuratedSource(id)).filter(Boolean);
        return (
          <motion.article
            key={industry.slug}
            id={industry.slug}
            className="industry-bento-card"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ delay: Math.min(index * 0.06, 0.24), duration: 0.45 }}
          >
            <div className="industry-bento-media">
              <Image src={industry.image} alt={industry.imageAlt} fill sizes="(max-width: 950px) 100vw, 33vw" />
              <span className="industry-bento-pill"><IndustryIcon />{industry.name}</span>
            </div>
            <div className="industry-bento-body">
              <span className="industry-bento-client">Quy trình vận hành thực tế · Có nguồn</span>
              <dl>
                <div><dt>Thực tế vận hành</dt><dd>{industry.challenge}</dd></div>
                <div><dt>Mô hình chuẩn</dt><dd>{industry.solution}</dd></div>
                <div><dt>Bề mặt QTS</dt><dd>{industry.product}</dd></div>
              </dl>

              <div className="industry-workflow-wrap">
                <span className="industry-workflow-title">Luồng công việc thực tế</span>
                <ol className="industry-workflow">
                  {industry.workflow.map((item) => (
                    <li key={`${industry.slug}-${item.step}`}>
                      <span className="industry-workflow-number">{item.step}</span>
                      <span className="industry-workflow-copy">
                        <b>{item.label}</b>
                        <small>{item.detail}</small>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="industry-bento-metrics" aria-label={`Chỉ dấu vận hành ${industry.name}`}>
                {industry.metrics.map((metric) => <div className="industry-metric" key={metric.label}><b>{metric.value}</b><small>{metric.label}</small></div>)}
              </div>

              <div className="industry-source-links" aria-label={`Nguồn chính thức ngành ${industry.name}`}>
                <span>Nguồn chính thức:</span>
                {sources.map((source) => source && (
                  <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.publisher} ↗
                  </a>
                ))}
              </div>
              <Link href="/contact" className="industry-bento-cta">Trao đổi về ngành {industry.name.toLowerCase()} →</Link>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

const capabilities = [
  { name: "Phát triển phần mềm", summary: "Ứng dụng doanh nghiệp, cổng thông tin và hệ thống nghiệp vụ" },
  { name: "Tư vấn công nghệ thông tin", summary: "Lộ trình số hóa, kiến trúc và chuẩn vận hành" },
  { name: "Xử lý dữ liệu", summary: "Chuẩn hóa, kết nối và khai thác dữ liệu vận hành" },
  { name: "Hạ tầng số", summary: "Nền tảng triển khai ổn định, bảo mật và mở rộng" },
  { name: "Thiết kế hệ thống", summary: "Luồng nghiệp vụ, phân quyền và tích hợp liên phòng ban" },
  { name: "Đào tạo công nghệ", summary: "Chuyển giao năng lực sử dụng và vận hành nội bộ" },
] as const;

export function TrustedBand() {
  const [isPaused, setIsPaused] = useState(false);

  return <section className="trusted-band" aria-label="Năng lực công nghệ đã đăng ký của QTS">
    <div className="container trusted-band-head">
      <div>
        <span className="eyebrow">Năng lực công nghệ được chuẩn hóa</span>
        <p>QTS phát triển giải pháp số dựa trên năng lực phần mềm, dữ liệu, tư vấn công nghệ và hạ tầng vận hành.</p>
      </div>
      <button className="trusted-motion-toggle" type="button" aria-pressed={isPaused} onClick={() => setIsPaused((current) => !current)}>
        {isPaused ? <PlayIcon /> : <PauseIcon />}
        <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
      </button>
    </div>
    <div className={`trusted-marquee${isPaused ? " is-paused" : ""}`} aria-hidden="true">
      <div className="trusted-track">
        {[0, 1].map((group) => (
          <div className="trusted-marquee-group" key={group}>
            {capabilities.map((capability) => <span key={`${capability.name}-${group}`} className="trusted-capability"><strong>{capability.name}</strong><small>{capability.summary}</small></span>)}
          </div>
        ))}
      </div>
    </div>
    <ul className="sr-only">
      {capabilities.map((capability) => <li key={capability.name}>{capability.name}: {capability.summary}</li>)}
    </ul>
    <div className="container trusted-grid" aria-hidden="true">{capabilities.map((capability) => <span key={capability.name} className="trusted-card"><strong>{capability.name}</strong><small>{capability.summary}</small></span>)}</div>
  </section>;
}
