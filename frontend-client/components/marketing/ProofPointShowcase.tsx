import Image from "next/image";

import { getCuratedSources } from "@/lib/curated-sources";

export type ProofPointMetric = {
  value: string;
  label: string;
};

export type ProofPointItem = {
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  metrics: readonly ProofPointMetric[];
  sourceIds?: readonly string[];
};

type ProofPointShowcaseProps = {
  eyebrow: string;
  title: string;
  copy: string;
  items: readonly ProofPointItem[];
  contextLabel?: string;
  tone?: "light" | "paper" | "dark";
};

export default function ProofPointShowcase({ eyebrow, title, copy, items, contextLabel = "Bối cảnh vận hành", tone = "light" }: ProofPointShowcaseProps) {
  return <section className={`proof-showcase proof-showcase-${tone}`}>
    <div className="container">
      <div className="proof-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <p>{copy}</p>
      </div>
      <div className="proof-grid">
        {items.map((item) => {
          const sources = item.sourceIds ? getCuratedSources([...item.sourceIds]) : [];
          return <article className="proof-card" key={item.title}>
          <div className="proof-media">
            <Image src={item.image} alt={item.alt} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
            <span>{item.label}</span>
          </div>
          <div className="proof-body">
            <small>{contextLabel}</small>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <dl className="proof-metrics">
              {item.metrics.map((metric) => <div key={`${item.title}-${metric.label}`}>
                <dt>{metric.value}</dt>
                <dd>{metric.label}</dd>
              </div>)}
            </dl>
            {sources.length > 0 && <div className="proof-sources" aria-label={`Nguồn tham khảo cho ${item.title}`}>
              <span>Nguồn tham khảo:</span>
              {sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher} ↗</a>)}
            </div>}
          </div>
        </article>;
        })}
      </div>
    </div>
  </section>;
}
