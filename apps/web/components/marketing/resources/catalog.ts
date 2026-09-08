export const resourceCategories = [
  {
    slug: "case-studies",
    label: "Tình huống ứng dụng",
    eyebrow: "Mô hình vận hành",
    title: "Cách tiếp cận bài toán doanh nghiệp cùng QTS.",
    description: "Các tình huống tham khảo về vấn đề vận hành, quyết định nền tảng và hướng kết quả cần đạt.",
  },
  {
    slug: "solutions-guides",
    label: "Hướng dẫn giải pháp",
    eyebrow: "Xây dựng có chủ đích",
    title: "Cẩm nang cho nền tảng có khả năng mở rộng.",
    description: "Hướng dẫn thực tiễn để thiết kế sản phẩm SaaS, vận hành kết nối và quy trình thông minh.",
  },
  {
    slug: "technology-insights",
    label: "Góc nhìn công nghệ",
    eyebrow: "Phân tích công nghệ",
    title: "Những tín hiệu định hình hệ thống doanh nghiệp.",
    description: "Góc nhìn kỹ thuật về AI, kiến trúc đám mây, an toàn thông tin và dữ liệu phục vụ quyết định.",
  },
  {
    slug: "white-papers",
    label: "Chuyên khảo",
    eyebrow: "Tài liệu chuyên sâu",
    title: "Cơ sở cho quyết định nền tảng tiếp theo.",
    description: "Tài liệu QTS bằng tiếng Việt dành cho những quyết định đầu tư công nghệ dài hạn.",
  },
  {
    slug: "product-updates",
    label: "Cập nhật sản phẩm",
    eyebrow: "Định hướng phát triển",
    title: "Nền tảng QTS được cải tiến theo nhu cầu vận hành.",
    description: "Thông tin về các bề mặt trí tuệ, tự động hóa và kiểm soát đang được QTS phát triển.",
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
    type: "Tình huống tham khảo",
    title: "Mô hình nền tảng vận hành số cho sản xuất",
    description: "Cách một lớp điều hành kết nối có thể đưa báo cáo định kỳ đến góc nhìn vận hành theo thời gian.",
    cover: "manufacturing",
    href: "/resources/case-studies/global-manufacturing",
    meta: "12 phút đọc",
  },
  {
    slug: "nova-healthcare",
    category: "case-studies",
    type: "Tình huống tham khảo",
    title: "Nền tảng điều phối giúp mọi điểm bàn giao y tế trở nên rõ ràng",
    description: "Mô hình kết nối dữ liệu, năng lực và quy trình chăm sóc trong một lớp vận hành được quản trị.",
    cover: "ai",
    href: "/industries#healthcare",
    meta: "9 phút đọc",
  },
  {
    slug: "scalable-saas-platforms",
    category: "solutions-guides",
    type: "Hướng dẫn giải pháp",
    title: "Cách xây dựng nền tảng SaaS có khả năng mở rộng",
    description: "Mô hình sản phẩm, kiến trúc và vận hành giúp nền tảng SaaS phát triển mà không tạo thêm lực cản.",
    cover: "saas",
    href: "/resources/solutions-guides",
    meta: "Tải hướng dẫn",
  },
  {
    slug: "composable-operations",
    category: "solutions-guides",
    type: "Hướng dẫn giải pháp",
    title: "Kiến trúc vận hành có thể kết hợp",
    description: "Kết nối hệ thống dữ liệu, trí tuệ và quy trình mà không phải thay thế những phần đang hoạt động tốt.",
    cover: "cloud",
    href: "/resources/solutions-guides",
    meta: "7 phút đọc",
  },
  {
    slug: "ai-in-critical-operations",
    category: "technology-insights",
    type: "Góc nhìn công nghệ",
    title: "Đưa AI vào các hoạt động quan trọng một cách hữu ích",
    description: "Những điều cần có để đi từ thử nghiệm riêng lẻ đến đề xuất đáng tin cậy trong luồng công việc.",
    cover: "ai",
    href: "/resources/technology-insights",
    readingTime: "6 phút đọc",
  },
  {
    slug: "resilient-cloud-architecture",
    category: "technology-insights",
    type: "Góc nhìn công nghệ",
    title: "Thiết kế kiến trúc đám mây cho thay đổi, không chỉ cho quy mô",
    description: "Góc nhìn thực tiễn về ranh giới bền vững, hệ thống có thể quan sát và tích hợp cấp doanh nghiệp.",
    cover: "cloud",
    href: "/resources/technology-insights",
    readingTime: "8 phút đọc",
  },
  {
    slug: "transformation-report-2026",
    category: "white-papers",
    type: "Báo cáo QTS",
    title: "Báo cáo Chuyển đổi số Doanh nghiệp 2026",
    description: "Khung tham khảo để chuyển hệ thống công nghệ phân mảnh thành nền tảng vận hành kết nối.",
    cover: "manufacturing",
    href: "/resources/white-papers",
    meta: "Tài liệu PDF tiếng Việt",
    download: "/resources/qts-enterprise-digital-transformation-report-2026.pdf",
  },
  {
    slug: "ai-adoption-strategy",
    category: "white-papers",
    type: "Chuyên khảo quản trị",
    title: "Chiến lược áp dụng AI cho tổ chức",
    description: "Khung quản trị để chuyển từ thử nghiệm sang năng lực AI bền vững và có giá trị.",
    cover: "ai",
    href: "/resources/white-papers",
    meta: "Tài liệu PDF tiếng Việt",
    download: "/resources/qts-ai-adoption-strategy.pdf",
  },
  {
    slug: "saas-architecture-blueprint",
    category: "white-papers",
    type: "Khung kiến trúc",
    title: "Khung kiến trúc SaaS hiện đại",
    description: "Những quyết định kỹ thuật giúp nền tảng B2B an toàn, có thể kết hợp và sẵn sàng phát triển.",
    cover: "security",
    href: "/resources/white-papers",
    meta: "Tài liệu PDF tiếng Việt",
    download: "/resources/qts-modern-saas-architecture-blueprint.pdf",
  },
  {
    slug: "qts-ai-platform-v2",
    category: "product-updates",
    type: "Định hướng sản phẩm",
    title: "AI trong nền tảng QTS: kết nối tín hiệu với hành động",
    description: "Cách tự động hóa, phân tích quyết định và xây dựng quy trình có thể đưa AI vào hoạt động hằng ngày.",
    cover: "update",
    href: "/resources/product-updates",
    meta: "Nội dung định hướng",
  },
];

export const featuredResource = resources[0];

export function getCategory(slug: string) {
  return resourceCategories.find((category) => category.slug === slug);
}

export function getResourcesForCategory(category: ResourceCategory) {
  return resources.filter((resource) => resource.category === category);
}
