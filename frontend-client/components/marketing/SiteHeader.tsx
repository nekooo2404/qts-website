"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { featuredResource } from "@/components/marketing/resources/catalog";
import { megaMenu } from "@/lib/motion";

const navigation = [
  { label: "Giải pháp", href: "/solutions" },
  { label: "Nền tảng", href: "/platform" },
  { label: "Ngành", href: "/industries" },
  { label: "Công ty", href: "/company" },
];

const exploreLinks = [
  { label: "Bối cảnh ngành Việt Nam", href: "/resources/case-studies", copy: "Quy trình và chỉ dấu từ nguồn công khai, không phải kết quả khách hàng." },
  { label: "Hướng dẫn giải pháp", href: "/resources/solutions-guides", copy: "Cẩm nang xây dựng nền tảng và quy trình có khả năng mở rộng." },
  { label: "Góc nhìn công nghệ", href: "/resources/technology-insights", copy: "Phân tích về AI, đám mây và kiến trúc doanh nghiệp." },
];

const researchLinks = [
  { label: "Thư viện kiến trúc", href: "/resources/white-papers", copy: "Tuyển tập khung kiến trúc kèm nguồn chính thức để đọc sâu." },
  { label: "Theo dõi chủ đề", href: "/resources/product-updates", copy: "Tổng hợp ngắn gọn theo chủ đề, không hàm ý mốc phát hành cụ thể." },
];

export function QtsMark({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={`qts-mark ${className}`.trim()} aria-hidden="true">
      <Image src="/images/brand/qts-logo-96.webp" alt="" width={96} height={96} sizes="48px" {...(priority ? { preload: true } : { loading: "lazy" as const })} />
    </span>
  );
}

export function Brand({ dark = false, priority = false }: { dark?: boolean; priority?: boolean }) {
  return <Link href="/" className={`brand ${dark ? "brand-dark" : ""}`} aria-label="Trang chủ QTS"><QtsMark priority={priority} />QTS</Link>;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const resourcesRef = useRef<HTMLDivElement | null>(null);
  const resourcesButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileClosingRef = useRef(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restoreMenuFocus = useCallback(() => {
    const focusTrigger = () => menuButtonRef.current?.focus({ preventScroll: true });
    focusTrigger();
    requestAnimationFrame(focusTrigger);
    window.setTimeout(focusTrigger, 120);
  }, []);

  const closeMobileMenu = useCallback(() => {
    mobileClosingRef.current = true;
    setOpen(false);
    restoreMenuFocus();
  }, [restoreMenuFocus]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => setResourcesOpen(false), [pathname]);
  useEffect(() => setHydrated(true), []);

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

  useEffect(() => {
    if (!open) return;
    mobileClosingRef.current = false;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [...document.querySelectorAll<HTMLElement>("main, footer")];
    const previous = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    const focusTimer = window.setTimeout(() => {
      if (mobileRef.current?.contains(document.activeElement)) return;
      mobileRef.current?.querySelector<HTMLElement>("a[href],button:not([disabled])")?.focus();
    }, 80);
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileMenu();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...(mobileRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? [])].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    const wide = window.matchMedia("(min-width: 769px)");
    const closeIfWide = () => { if (wide.matches) setOpen(false); };
    wide.addEventListener("change", closeIfWide);
    window.addEventListener("resize", closeIfWide);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.body.style.overflow = overflow;
      window.clearTimeout(focusTimer);
      background.forEach((element, index) => { element.inert = previous[index]; });
      document.removeEventListener("keydown", handleKey, true);
      wide.removeEventListener("change", closeIfWide);
      window.removeEventListener("resize", closeIfWide);
      restoreMenuFocus();
    };
  }, [closeMobileMenu, open, restoreMenuFocus]);

  useEffect(() => () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const openMega = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setResourcesOpen(true);
    }, 120);
  }, []);

  const closeMega = useCallback(() => {
    if (openTimerRef.current) { clearTimeout(openTimerRef.current); openTimerRef.current = null; }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      if (!resourcesRef.current?.contains(document.activeElement)) setResourcesOpen(false);
    }, 180);
  }, []);

  const cancelMegaTimers = useCallback(() => {
    if (openTimerRef.current) { clearTimeout(openTimerRef.current); openTimerRef.current = null; }
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  }, []);

  const trapMobileFocus = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      closeMobileMenu();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')].filter(el => el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }, [closeMobileMenu]);

  const getMobileControls = useCallback(() => [...(mobileRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? [])].filter(el => el.getClientRects().length), []);
  const focusFirstMobileControl = useCallback(() => {
    if (mobileClosingRef.current) return;
    getMobileControls()[0]?.focus();
  }, [getMobileControls]);
  const focusLastMobileControl = useCallback(() => {
    if (mobileClosingRef.current) return;
    const controls = getMobileControls();
    controls.at(-1)?.focus();
  }, [getMobileControls]);

  const resourcesActive = pathname.startsWith("/resources");
  const allMobileLinks = [...exploreLinks, ...researchLinks];

  return <header className="nav">
    <div className="container nav-inner">
      <Brand priority />
      <nav className="nav-links" aria-label="Điều hướng chính">
        {navigation.slice(0, 3).map((item) => <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""}`}>{item.label}</Link>)}
        <div className="nav-mega-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setResourcesOpen(false); }} ref={resourcesRef} onMouseEnter={openMega} onMouseLeave={closeMega} onFocus={cancelMegaTimers} onKeyDown={event => {
          if (event.key === "Escape") {
            event.preventDefault();
            setResourcesOpen(false);
            resourcesButtonRef.current?.focus();
          }
        }}>
          <button ref={resourcesButtonRef} type="button" className={`nav-link nav-mega-trigger ${resourcesActive ? "active" : ""} ${resourcesOpen ? "open" : ""}`} aria-expanded={resourcesOpen} aria-controls="resources-mega-menu" onClick={() => setResourcesOpen((v) => !v)}>
            Tài nguyên <ChevronDownIcon width={12} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {resourcesOpen && (
              <motion.div
                id="resources-mega-menu"
                className="nav-mega open"
                role="region"
                aria-label="Trình đơn tài nguyên"
                variants={megaMenu}
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
                exit="exit"
              >
                <div className="nav-mega-grid">
                  <div>
                    <span className="nav-mega-label">Khám phá</span>
                    {exploreLinks.map((item) => <Link key={item.href} href={item.href} className="nav-mega-link"><b>{item.label}</b><small>{item.copy}</small></Link>)}
                    <Link href="/resources" className="nav-mega-foot">Xem tất cả tài nguyên →</Link>
                  </div>
                  <div>
                    <span className="nav-mega-label">Nghiên cứu</span>
                    {researchLinks.map((item) => <Link key={item.label} href={item.href} className="nav-mega-link"><b>{item.label}</b><small>{item.copy}</small></Link>)}
                  </div>
                  <Link href={featuredResource.href} className="nav-mega-feature">
                    <span className="nav-mega-kicker">Nội dung nổi bật</span>
                    <span className="nav-mega-feature-cover" aria-hidden="true">
                      <Image src={featuredResource.image} alt="" fill sizes="360px" />
                    </span>
                    <strong>{featuredResource.title}</strong>
                    <span>{featuredResource.description}</span>
                    <small>Xem nội dung →</small>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {navigation.slice(3).map((item) => <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""}`}>{item.label}</Link>)}
      </nav>
      <Link className="btn btn-dark nav-cta" href="/contact">Yêu cầu tư vấn</Link>
      <button ref={menuButtonRef} className="nav-menu" type="button" aria-label="Mở hoặc đóng điều hướng" aria-controls="mobile-navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <XMarkIcon width={22} /> : <Bars3Icon width={22} />}
      </button>
    </div>

    {hydrated && createPortal(<AnimatePresence>
      {open && (
        <motion.div
          ref={mobileRef}
          className="mobile-overlay"
          role="dialog" aria-modal="true" id="mobile-navigation"
          onClick={event => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}
          onKeyDownCapture={trapMobileFocus}
          initial={reduceMotion ? false : { x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
          aria-label="Điều hướng trên thiết bị di động"
        >
          <span className="focus-guard" tabIndex={0} aria-label="Quay lại cuối trình đơn" onFocus={focusLastMobileControl} />
          <div className="mobile-overlay-top">
            <Link
              href="/"
              className="brand"
              aria-label="Trang chủ QTS"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeMobileMenu();
                  return;
                }
                if (event.key === "Tab" && event.shiftKey) {
                  event.preventDefault();
                  focusLastMobileControl();
                }
              }}
              onBlur={(event) => {
                if (mobileClosingRef.current) return;
                const next = event.relatedTarget as HTMLElement | null;
                if (!next || next.classList.contains("focus-guard") || !mobileRef.current?.contains(next)) requestAnimationFrame(focusLastMobileControl);
              }}
            >
              <QtsMark />QTS
            </Link>
            <button type="button" aria-label="Đóng trình đơn" onClick={closeMobileMenu}>
              <XMarkIcon width={24} />
            </button>
          </div>
          <nav className="mobile-overlay-nav">
            {navigation.slice(0, 3).map((item, i) => (
              <motion.div key={item.href} initial={reduceMotion ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.08 + i * 0.05, duration: 0.25 }}>
                <Link href={item.href} className="mobile-overlay-link">{item.label}</Link>
              </motion.div>
            ))}
            <MobileAccordion links={allMobileLinks} />
            {navigation.slice(3).map((item, i) => (
              <motion.div key={item.href} initial={reduceMotion ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.2 + i * 0.05, duration: 0.25 }}>
                <Link href={item.href} className="mobile-overlay-link">{item.label}</Link>
              </motion.div>
            ))}
          </nav>
          <div className="mobile-overlay-cta">
            <Link
              className="btn btn-primary"
              href="/contact"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeMobileMenu();
                  return;
                }
                if (event.key === "Tab" && !event.shiftKey) {
                  event.preventDefault();
                  focusFirstMobileControl();
                }
              }}
              onBlur={(event) => {
                if (mobileClosingRef.current) return;
                const next = event.relatedTarget as HTMLElement | null;
                if (!next || next.classList.contains("focus-guard") || !mobileRef.current?.contains(next)) requestAnimationFrame(focusFirstMobileControl);
              }}
            >
              Yêu cầu tư vấn
            </Link>
          </div>
          <span className="focus-guard" tabIndex={0} aria-label="Quay lại đầu trình đơn" onFocus={focusFirstMobileControl} />
        </motion.div>
      )}
    </AnimatePresence>, document.body)}
  </header>;
}

function MobileAccordion({ links }: { links: { label: string; href: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <div className="mobile-accordion">
      <button type="button" className={`mobile-accordion-trigger ${expanded ? "open" : ""}`} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
        Tài nguyên <ChevronDownIcon width={14} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div className="mobile-accordion-body" initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduceMotion ? { height: 0 } : { height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.25 }}>
            <Link href="/resources">Tất cả tài nguyên</Link>
            {links.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
