export const resourceCategories = [
  {
    slug: "case-studies",
    label: "Case studies",
    eyebrow: "Enterprise outcomes",
    title: "How enterprises transform with QTS.",
    description: "The operating problems, platform decisions and measurable results behind QTS engagements.",
  },
  {
    slug: "solutions-guides",
    label: "Solutions guides",
    eyebrow: "Build with intent",
    title: "The playbooks behind scalable platforms.",
    description: "Practical guidance for leaders designing SaaS products, connected operations and intelligent workflows.",
  },
  {
    slug: "technology-insights",
    label: "Technology insights",
    eyebrow: "Technology perspective",
    title: "Signals shaping the enterprise stack.",
    description: "Clear technical perspective on AI transformation, cloud architecture, cyber security and decision-grade data.",
  },
  {
    slug: "white-papers",
    label: "White papers",
    eyebrow: "Executive research",
    title: "Evidence for the next platform decision.",
    description: "Downloadable QTS research for leaders making long-horizon technology investments.",
  },
  {
    slug: "product-updates",
    label: "Product updates",
    eyebrow: "What is new",
    title: "QTS platform, advancing in public.",
    description: "Release notes for the intelligence, automation and control surfaces we are improving next.",
  },
] as const;

export type ResourceCategory = (typeof resourceCategories)[number]["slug"];

export type Resource = {
  slug: string;
  category: ResourceCategory;
  type: string;
  title: string;
  description: string;
  cover: "manufacturing" | "saas" | "ai" | "cloud" | "security" | "update";
  href: string;
  author?: string;
  date?: string;
  readingTime?: string;
  meta?: string;
  client?: string;
  outcome?: string;
  download?: string;
};

export const resources: Resource[] = [
  {
    slug: "global-manufacturing",
    category: "case-studies",
    type: "Case study",
    title: "Global Manufacturing Digital Operations Platform",
    description: "How a connected command layer helped leaders move from weekly reconciliation to real-time operational control.",
    cover: "manufacturing",
    href: "/resources/case-studies/global-manufacturing",
    client: "ABC Manufacturing Group",
    meta: "12 min read",
    outcome: "+45% operational efficiency",
  },
  {
    slug: "nova-healthcare",
    category: "case-studies",
    type: "Case study",
    title: "A care operations platform that made every handoff visible",
    description: "Nova Healthcare replaced fragmented patient coordination with a governed, AI-assisted care operations layer.",
    cover: "ai",
    href: "/industries#healthcare",
    client: "Nova Healthcare",
    meta: "9 min read",
    outcome: "50% workflow improvement",
  },
  {
    slug: "scalable-saas-platforms",
    category: "solutions-guides",
    type: "Solutions guide",
    title: "How enterprises build scalable SaaS platforms",
    description: "A product, architecture and operating model for SaaS platforms built to evolve without operational drag.",
    cover: "saas",
    href: "/resources/solutions-guides",
    meta: "Download guide",
  },
  {
    slug: "composable-operations",
    category: "solutions-guides",
    type: "Solutions guide",
    title: "The composable operations blueprint",
    description: "How to connect systems of record, intelligence and workflows without replacing what already works.",
    cover: "cloud",
    href: "/resources/solutions-guides",
    meta: "7 min read",
  },
  {
    slug: "ai-in-critical-operations",
    category: "technology-insights",
    type: "Technology insight",
    title: "Making AI useful inside critical operations",
    description: "What it takes to move from isolated experiments to trusted recommendations in the flow of work.",
    cover: "ai",
    href: "/resources/technology-insights",
    author: "Maya Chen",
    date: "August 12, 2026",
    readingTime: "6 min read",
  },
  {
    slug: "resilient-cloud-architecture",
    category: "technology-insights",
    type: "Technology insight",
    title: "Designing cloud architecture for change, not just scale",
    description: "A practical view of resilient boundaries, observable systems and enterprise-grade integration.",
    cover: "cloud",
    href: "/resources/technology-insights",
    author: "Daniel Ortiz",
    date: "July 28, 2026",
    readingTime: "8 min read",
  },
  {
    slug: "transformation-report-2026",
    category: "white-papers",
    type: "QTS research report",
    title: "Enterprise Digital Transformation Report 2026",
    description: "How enterprise leaders are converting fragmented technology estates into compounding operating advantages.",
    cover: "manufacturing",
    href: "/resources/white-papers",
    meta: "24-page PDF",
    download: "/resources/qts-enterprise-digital-transformation-report-2026.pdf",
  },
  {
    slug: "ai-adoption-strategy",
    category: "white-papers",
    type: "Executive paper",
    title: "AI Adoption Strategy for Large Organizations",
    description: "A governance-first framework for moving from pilots to durable, valuable enterprise intelligence.",
    cover: "ai",
    href: "/resources/white-papers",
    meta: "18-page PDF",
    download: "/resources/qts-ai-adoption-strategy.pdf",
  },
  {
    slug: "saas-architecture-blueprint",
    category: "white-papers",
    type: "Architecture blueprint",
    title: "Modern SaaS Architecture Blueprint",
    description: "The technical decisions that keep a B2B platform secure, composable and ready for the next market move.",
    cover: "security",
    href: "/resources/white-papers",
    meta: "16-page PDF",
    download: "/resources/qts-modern-saas-architecture-blueprint.pdf",
  },
  {
    slug: "qts-ai-platform-v2",
    category: "product-updates",
    type: "Product update",
    title: "QTS AI Platform v2.0: Intelligence that closes the loop",
    description: "New automation, decision analytics and workflow-building capabilities bring useful AI directly into operations.",
    cover: "update",
    href: "/resources/product-updates",
    date: "August 20, 2026",
    meta: "Platform release",
  },
];

export const featuredResource = resources[0];

export function getCategory(slug: string) {
  return resourceCategories.find((category) => category.slug === slug);
}

export function getResourcesForCategory(category: ResourceCategory) {
  return resources.filter((resource) => resource.category === category);
}
