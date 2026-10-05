import type { Metadata } from "next";
import { COMPANY } from "./company";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://qtsgroup.vn").replace(/\/+$/, "");
export const SITE_NAME = "QTS" as const;

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p === "/" ? "/" : p.replace(/\/$/, "") || "/"}`;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function buildMetadata({ title, description, path, noIndex, keywords }: BuildMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title,
    description,
    applicationName: SITE_NAME,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "vi_VN",
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.fullName,
    alternateName: [COMPANY.shortName, COMPANY.intlName, COMPANY.abbr].filter(Boolean),
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address,
      addressLocality: "Hà Nội",
      addressCountry: "VN",
    },
    foundingDate: "2026-01-21",
    telephone: COMPANY.phone,
    areaServed: "VN",
    knowsAbout: [
      "Phần mềm doanh nghiệp",
      "Nền tảng vận hành",
      "Định danh và phân quyền",
      "Single sign-on",
      "SSO",
      "MFA",
      "RBAC",
      "Tích hợp hệ thống",
      "HRM",
      "Workflow",
      "Business intelligence",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: COMPANY.phone,
      contactType: "customer support",
      availableLanguage: ["vi"],
    },
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "vi-VN",
    publisher: {
      "@type": "Organization",
      name: COMPANY.fullName,
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/resources?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function landingPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "QTS - Nền tảng vận hành doanh nghiệp",
    description:
      "QTS - Một lần đăng nhập (SSO) cho Portal, HRM, workflow và báo cáo. Phân quyền RBAC, MFA và audit tập trung trong hệ sinh thái doanh nghiệp bảo mật, dễ mở rộng.",
    url: absoluteUrl("/"),
    inLanguage: "vi-VN",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: [
      { "@type": "Thing", name: "Enterprise software platform" },
      { "@type": "Thing", name: "Identity and access management" },
      { "@type": "Thing", name: "Human resources management" },
      { "@type": "Thing", name: "Workflow automation" },
      { "@type": "Thing", name: "Single sign-on" },
    ],
    mainEntity: {
      "@type": "Service",
      name: "Nền tảng vận hành doanh nghiệp QTS",
      provider: {
        "@type": "Organization",
        name: COMPANY.fullName,
        url: SITE_URL,
      },
      serviceType: "Single sign-on, identity and access management, HRM, workflow and reporting platform",
      areaServed: "VN",
    },
  };
}


export function landingFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "vi-VN",
    mainEntity: [
      {
        "@type": "Question",
        name: "QTS có hỗ trợ đăng nhập một lần (SSO) không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Có. QTS dùng SSO tập trung cho Portal, HRM, workflow và báo cáo — đăng nhập một lần, phân quyền theo vai trò (RBAC), hỗ trợ MFA và lưu vết truy cập.",
        },
      },
      {
        "@type": "Question",
        name: "QTS bắt đầu một dự án công nghệ như thế nào?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "QTS bắt đầu bằng việc làm rõ mục tiêu, quy trình hiện có, các hệ thống liên quan và ràng buộc cần ưu tiên trước khi đi sâu vào thiết kế và lộ trình thực hiện.",
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const STATIC_SITEMAP_ROUTES: string[] = [
  "/",
  "/company",
  "/contact",
  "/industries",
  "/legal",
  "/platform",
  "/resources",
  "/solutions",
];
