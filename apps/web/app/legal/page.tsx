import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Legal — QTS",
  description: "QTS privacy, terms and accessibility commitments.",
};

const policies = [
  ["privacy", "Privacy", "QTS uses consultation details only to respond to the request and support the conversation requested. We do not sell contact information."],
  ["terms", "Terms", "Information on this site is provided for general business information. A signed QTS agreement governs any delivered service or platform engagement."],
  ["accessibility", "Accessibility", "QTS designs digital experiences with semantic structure, keyboard access, clear focus states and reduced-motion support."],
] as const;

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="Legal" title="Clear commitments, built into the experience.">
      <p>Privacy, terms and accessibility principles for the QTS public website.</p>
    </PageHero>
    <section className="section" style={{ paddingTop: 8 }}>
      <div className="container detail-rows" style={{ marginTop: 0 }}>{policies.map(([id, title, copy], i) => <Reveal key={id} delay={i * 0.08}><article className="detail-row" id={id}><div><h3>{title}</h3><p>{copy}</p></div></article></Reveal>)}</div>
    </section>
  </MarketingShell>;
}
