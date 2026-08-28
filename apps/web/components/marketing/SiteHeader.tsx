"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { featuredResource } from "@/components/marketing/resources/catalog";
import { megaMenu } from "@/lib/motion";

const navigation = [
  { label: "Solutions", href: "/solutions" },
  { label: "Platform", href: "/platform" },
  { label: "Industries", href: "/industries" },
  { label: "Company", href: "/company" },
];

const exploreLinks = [
  { label: "Case studies", href: "/resources/case-studies", copy: "Enterprise outcomes and measurable returns." },
  { label: "Solutions guides", href: "/resources/solutions-guides", copy: "Playbooks for scalable platforms and operations." },
  { label: "Technology insights", href: "/resources/technology-insights", copy: "Perspective on AI, cloud and enterprise architecture." },
];

const researchLinks = [
  { label: "White papers", href: "/resources/white-papers", copy: "Research for long-horizon platform decisions." },
  { label: "Product updates", href: "/resources/product-updates", copy: "What is new in the QTS platform." },
  { label: "Transformation report", href: "/resources/white-papers", copy: "Enterprise Digital Transformation Report 2026." },
];

export function QtsMark() {
  return <span className="brand-mark" aria-hidden="true" />;
}

export function Brand({ dark = false }: { dark?: boolean }) {
  return <Link href="/" className={`brand ${dark ? "brand-dark" : ""}`} aria-label="QTS home"><QtsMark />QTS</Link>;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement | null>(null);
  const resourcesButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => setResourcesOpen(false), [pathname]);

  // Close mega menu on outside click or Escape
  useEffect(() => {
    if (!resourcesOpen) return;
    function handlePointer(event: MouseEvent) {
      if (!resourcesRef.current?.contains(event.target as Node) && !resourcesButtonRef.current?.contains(event.target as Node)) setResourcesOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setResourcesOpen(false);
        resourcesButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [resourcesOpen]);

  // Mobile overlay: lock scroll, focus first link, Escape closes
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const first = mobileRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const openMega = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setResourcesOpen(true);
  }, []);

  const closeMega = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setResourcesOpen(false), 120);
  }, []);

  const resourcesActive = pathname.startsWith("/resources");
  const allMobileLinks = [...exploreLinks, ...researchLinks];

  return <header className={`nav ${scrolled ? "scrolled" : ""}`}>
    <div className="container nav-inner">
      <Brand />
      <nav className="nav-links" aria-label="Primary navigation">
        {navigation.slice(0, 3).map((item) => <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""}`}>{item.label}</Link>)}
        <div className="nav-mega-wrap" ref={resourcesRef} onMouseEnter={openMega} onMouseLeave={closeMega}>
          <button ref={resourcesButtonRef} type="button" className={`nav-link nav-mega-trigger ${resourcesActive ? "active" : ""} ${resourcesOpen ? "open" : ""}`} aria-expanded={resourcesOpen} aria-controls="resources-mega-menu" onClick={() => setResourcesOpen((value) => !value)}>
            Resources <ChevronDownIcon width={12} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {resourcesOpen && (
              <motion.div
                id="resources-mega-menu"
                className="nav-mega open"
                role="region"
                aria-label="Resources menu"
                variants={megaMenu}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="nav-mega-grid">
                  <div>
                    <span className="nav-mega-label">Explore</span>
                    {exploreLinks.map((item) => <Link key={item.href} href={item.href} className="nav-mega-link"><b>{item.label}</b><small>{item.copy}</small></Link>)}
                    <Link href="/resources" className="nav-mega-foot">View all resources →</Link>
                  </div>
                  <div>
                    <span className="nav-mega-label">Research</span>
                    {researchLinks.map((item) => <Link key={item.label} href={item.href} className="nav-mega-link"><b>{item.label}</b><small>{item.copy}</small></Link>)}
                  </div>
                  <Link href={featuredResource.href} className="nav-mega-feature">
                    <span className="nav-mega-kicker">Featured story</span>
                    <span className="nav-mega-feature-cover" aria-hidden="true">
                      <Image src="/images/resources/manufacturing-operations.svg" alt="" fill sizes="360px" />
                    </span>
                    <strong>{featuredResource.title}</strong>
                    <span>ABC Manufacturing Group · {featuredResource.outcome} · -60% manual reporting</span>
                    <small>Read the story →</small>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {navigation.slice(3).map((item) => <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""}`}>{item.label}</Link>)}
      </nav>
      <Link className="btn btn-dark nav-cta" href="/contact">Request consultation</Link>
      <button ref={menuButtonRef} className="nav-menu" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <XMarkIcon width={22} /> : <Bars3Icon width={22} />}
      </button>
    </div>

    {/* Full-screen mobile overlay */}
    <AnimatePresence>
      {open && (
        <motion.div
          ref={mobileRef}
          className="mobile-overlay"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          aria-label="Mobile navigation"
        >
          <div className="mobile-overlay-top">
            <Brand />
            <button type="button" aria-label="Close menu" onClick={() => { setOpen(false); menuButtonRef.current?.focus(); }}>
              <XMarkIcon width={24} />
            </button>
          </div>
          <nav className="mobile-overlay-nav">
            {navigation.slice(0, 3).map((item, i) => (
              <motion.div key={item.href} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                <Link href={item.href} className="mobile-overlay-link">{item.label}</Link>
              </motion.div>
            ))}
            {/* Resources accordion */}
            <MobileAccordion links={allMobileLinks} />
            {navigation.slice(3).map((item, i) => (
              <motion.div key={item.href} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
                <Link href={item.href} className="mobile-overlay-link">{item.label}</Link>
              </motion.div>
            ))}
          </nav>
          <div className="mobile-overlay-cta">
            <Link className="btn btn-primary" href="/contact">Request consultation</Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </header>;
}

function MobileAccordion({ links }: { links: { label: string; href: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mobile-accordion">
      <button type="button" className={`mobile-accordion-trigger ${expanded ? "open" : ""}`} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
        Resources <ChevronDownIcon width={14} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div className="mobile-accordion-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <Link href="/resources">All resources</Link>
            {links.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
