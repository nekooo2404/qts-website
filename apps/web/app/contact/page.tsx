import type { Metadata } from "next";
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import ContactForm from "@/components/marketing/ContactForm";
import Reveal from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Contact QTS",
  description: "Talk with QTS about your enterprise software, AI, cloud or digital transformation opportunity.",
};

export default function Page() {
  return <MarketingShell>
    <PageHero eyebrow="Contact QTS" title="Build the next advantage." aside={<><div className="hero-fact"><i><ClockIcon /></i><span><b>One business day</b><small>A QTS expert responds with useful context.</small></span></div><div className="hero-fact"><i><ShieldCheckIcon /></i><span><b>Enterprise-ready conversation</b><small>Start with the constraint that matters.</small></span></div><div className="hero-fact"><i><CheckCircleIcon /></i><span><b>A clearer path forward</b><small>Leave with a focused view of the opportunity.</small></span></div></>}>
      <p>Tell us what your organization is solving. A QTS expert will use the details you share to make the first conversation useful from the first minute.</p>
    </PageHero>
    <section className="section" style={{ paddingTop: 8 }}>
      <div className="container contact-layout">
        <Reveal><div>
          <span className="eyebrow">Start the conversation</span>
          <h2 className="display" style={{ fontSize: "clamp(36px,4vw,52px)", margin: "18px 0" }}>Bring the operational problem, not a finished brief.</h2>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.65 }}>Whether the work starts with a broken handoff, a fragmented system or an AI opportunity, QTS helps make the next decision concrete.</p>
          <div className="contact-aside">
            <div className="contact-note"><i><CheckCircleIcon /></i><span>Enterprise software, SaaS, AI, Cloud and platform transformation</span></div>
            <div className="contact-note"><i><ShieldCheckIcon /></i><span>Your information is used only to respond to this consultation request</span></div>
            <div className="contact-note"><i><ClockIcon /></i><span>Response within one business day</span></div>
          </div>
        </div></Reveal>
        <Reveal delay={0.15}><div className="contact-panel"><h2>Request a consultation</h2><p>Share the challenge, platform or outcome you have in mind.</p><ContactForm /></div></Reveal>
      </div>
    </section>
  </MarketingShell>;
}
