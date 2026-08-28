import Link from "next/link";
import { Brand } from "./SiteHeader";

const groups = [
  { label: "Solutions", links: [["Enterprise software", "/solutions"], ["SaaS platforms", "/solutions"], ["AI solutions", "/solutions"], ["Cloud systems", "/solutions"]] },
  { label: "Industries", links: [["Healthcare", "/industries#healthcare"], ["Manufacturing", "/industries#manufacturing"], ["Finance", "/industries#finance"], ["Retail", "/industries#retail"]] },
  { label: "Company", links: [["About QTS", "/company"], ["Technology", "/company#technology"], ["Security", "/company#security"], ["Contact", "/contact"]] },
  {
    label: "Resources",
    links: [
      ["Case studies", "/resources/case-studies"],
      ["Solutions guides", "/resources/solutions-guides"],
      ["Technology insights", "/resources/technology-insights"],
      ["White papers", "/resources/white-papers"],
      ["Product updates", "/resources/product-updates"],
    ],
  },
];

export default function SiteFooter() {
  return <footer className="footer"><div className="container"><div className="footer-top"><div><Brand dark/><p className="footer-about">QTS builds the digital infrastructure that helps ambitious enterprises turn complexity into progress.</p></div>{groups.map(({ label, links }) => <div className="footer-col" key={label}><h4>{label}</h4>{links.map(([copy, href]) => <Link href={href} key={copy}>{copy}</Link>)}</div>)}<div className="footer-col"><h4>Contact</h4><a href="mailto:hello@qts.com">hello@qts.com</a><a href="tel:+18005550199">+1 800 555 0199</a><Link href="/contact">Request consultation</Link></div></div><div className="footer-bottom"><span>© 2026 QTS. Building what business becomes next.</span><div className="footer-legal"><Link href="/legal#privacy">Privacy</Link><Link href="/legal#terms">Terms</Link><Link href="/legal#accessibility">Accessibility</Link></div></div></div></footer>;
}
