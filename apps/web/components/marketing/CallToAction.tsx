import Link from "next/link";
import Reveal from "./Reveal";

export default function CallToAction({ title = "Build the next advantage.", copy = "Tell us what your organization is solving. A QTS expert will be in touch within one business day." }: { title?: string; copy?: string }) {
  return <section className="cta-band"><div className="container cta-inner">
    <Reveal><div className="cta-copy"><h2>{title}</h2><p>{copy}</p></div></Reveal>
    <Reveal delay={0.15}><Link href="/contact" className="btn btn-light">Request consultation</Link></Reveal>
  </div></section>;
}
