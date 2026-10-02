import Image from "next/image";
import Link from "next/link";
import { industryOperations } from "@/lib/industry-operations";
import { getCuratedSource } from "@/lib/curated-sources";

export const industries = industryOperations;

export function IndustryEcosystemMap() {
  return (
    <figure className="industry-ecosystem">
      <Image
        src="/images/industries/manufacturing-line.jpg"
        alt="Dây chuyền sản xuất — ảnh minh họa bối cảnh kết nối dữ liệu ngành"
        fill
        priority
        sizes="(max-width: 950px) 100vw, 52vw"
      />
      <figcaption>Ảnh minh hoạ bối cảnh ngành; quy trình bám tài liệu Việt Nam — không mô tả cơ sở hay khách hàng QTS.</figcaption>
    </figure>
  );
}

export function IndustryBento() {
  return (
    <div className="industry-bento">
      {industries.map((industry) => {
        const IndustryIcon = industry.icon;
        const sources = industry.sourceIds.map((id) => getCuratedSource(id)).filter(Boolean);
        return (
          <article
            key={industry.slug}
            id={industry.slug}
            className="industry-bento-card"
          >
            <div className="industry-bento-media">
              <Image src={industry.image} alt={industry.imageAlt} fill sizes="(max-width: 950px) 100vw, 33vw" />
              <span className="industry-bento-pill"><IndustryIcon />{industry.name}</span>
            </div>
            <div className="industry-bento-body">
              <span className="industry-bento-client">Quy trình thực tế tại Việt Nam · Có nguồn VN</span>
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
          </article>
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
  return <section className="trusted-band" aria-label="Năng lực công nghệ đã đăng ký của QTS">
    <div className="container trusted-band-head">
      <div>
        <span className="eyebrow">Năng lực công nghệ được chuẩn hóa</span>
        <p>QTS phát triển giải pháp số dựa trên năng lực phần mềm, dữ liệu, tư vấn công nghệ và hạ tầng vận hành.</p>
      </div>
    </div>
    <div className="container trusted-grid">{capabilities.map((capability) => <span key={capability.name} className="trusted-card"><strong>{capability.name}</strong><small>{capability.summary}</small></span>)}</div>
  </section>;
}
