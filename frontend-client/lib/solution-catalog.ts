export const solutionSlugs = [
  "phan-mem-doanh-nghiep",
  "nen-tang-phan-mem",
  "giai-phap-ai",
  "he-thong-dam-may",
  "ung-dung-web",
] as const;

export type SolutionSlug = (typeof solutionSlugs)[number];

export type SolutionTheme = {
  slug: SolutionSlug;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  icon: "enterprise" | "platform" | "ai" | "cloud" | "web";
  cover: string;
  alt: string;
  topics: string[];
  considerations: string[];
  sourceIds: string[];
  relatedResourceSlugs: string[];
};

export const solutionThemes: SolutionTheme[] = [
  {
    slug: "phan-mem-doanh-nghiep",
    title: "Phần mềm doanh nghiệp",
    shortTitle: "Doanh nghiệp",
    description: "Hệ thống cốt lõi thay thế bảng tính và công cụ rời rạc bằng một mô hình vận hành thống nhất.",
    longDescription:
      "Phần mềm doanh nghiệp của QTS tập trung vào việc hợp nhất dữ liệu vận hành, tài chính và giao hàng trên một bề mặt có thể kiểm tra. Mỗi quy trình được thiết kế với phân quyền theo vai trò, luồng phê duyệt rõ ràng và khả năng đối soát.",
    icon: "enterprise",
    cover: "/images/home/enterprise-operations.jpg",
    alt: "Nhóm chuyên viên trao đổi trước bảng kế hoạch trong phòng họp",
    topics: ["Hợp nhất dữ liệu vận hành và tài chính", "Quy trình phê duyệt và đối soát", "Phân quyền theo vai trò và kiểm soát truy cập", "Báo cáo quản trị hợp nhất"],
    considerations: [
      "Xác định ranh giới dữ liệu làm chủ giữa các bộ phận trước khi hợp nhất.",
      "Thiết kế quy trình có thể kiểm tra thay vì chỉ tự động hóa bước hiện có.",
      "Chọn mô hình phân quyền phản ánh cấu trúc quyết định thực tế.",
    ],
    sourceIds: ["ms-ia-principles", "ibm-architecture-collection", "aws-architecture-center"],
    relatedResourceSlugs: ["global-manufacturing", "van-hanh-ket-noi-erp-crm", "doi-soat-tai-chinh-van-hanh"],
  },
  {
    slug: "nen-tang-phan-mem",
    title: "Nền tảng phần mềm",
    shortTitle: "Nền tảng",
    description: "Sản phẩm có khả năng mở rộng, ưu tiên khả năng kết nối và sẵn sàng phát triển theo thị trường.",
    longDescription:
      "Nền tảng phần mềm được thiết kế để phát triển cùng mô hình kinh doanh: đa tổ chức, vòng đời phát hành rõ ràng, tích hợp có kiểm soát và khả năng mở rộng an toàn.",
    icon: "platform",
    cover: "/images/home/software-work.jpg",
    alt: "Nhóm làm việc trong không gian phát triển phần mềm",
    topics: ["Kiến trúc đa tổ chức và phân quyền", "Vòng đời phát hành và khả năng mở rộng", "Tích hợp và khả năng kết nối", "Thiết kế hướng tới áp dụng và phát triển"],
    considerations: [
      "Tách ranh giới miền rõ ràng trước khi thêm tích hợp mới.",
      "Thiết kế gói tính năng và phân quyền sao cho có thể mở rộng mà không chỉnh lõi.",
      "Chuẩn hóa luồng phát hành để kiểm soát thay đổi.",
    ],
    sourceIds: ["aws-well-architected", "gcp-architecture-framework", "salesforce-architects"],
    relatedResourceSlugs: ["nen-tang-saas-mo-rong", "kien-truc-composable", "api-va-tich-hop-ben-vung"],
  },
  {
    slug: "giai-phap-ai",
    title: "Giải pháp AI",
    shortTitle: "AI",
    description: "Trí tuệ được tích hợp vào luồng công việc để đội ngũ nhận diện rủi ro và ra quyết định tự tin hơn.",
    longDescription:
      "Giải pháp AI của QTS đưa tín hiệu, đề xuất và vòng kiểm tra của con người vào cùng một luồng việc. Trọng tâm là tính hữu ích trong quyết định, khả năng giải thích và quản trị.",
    icon: "ai",
    cover: "/images/home/data-collaboration.jpg",
    alt: "Nhóm chuyên viên trao đổi cùng laptop trong buổi làm việc",
    topics: ["Tín hiệu, dự báo và đề xuất trong luồng việc", "Vòng kiểm tra của con người và khả năng giải thích", "Quản trị dữ liệu và truy vết", "Triển khai AI theo giai đoạn"],
    considerations: [
      "Đặt AI tại điểm quyết định thực tế thay vì lớp báo cáo tách rời.",
      "Thiết kế vòng kiểm tra con người cho mọi đề xuất có tác động vận hành.",
      "Chuẩn bị truy vết dữ liệu và tiêu chí đánh giá trước khi mở rộng.",
    ],
    sourceIds: ["gcp-architecture-center", "aws-well-architected", "ibm-architecture-patterns"],
    relatedResourceSlugs: ["ai-trong-quy-trinh-quan-trong", "governance-ai-thuc-tien", "tu-dong-hoa-co-kiem-soat"],
  },
  {
    slug: "he-thong-dam-may",
    title: "Hệ thống đám mây",
    shortTitle: "Đám mây",
    description: "Nền tảng hiện đại có khả năng mở rộng và duy trì triển khai bền vững.",
    longDescription:
      "Hệ thống đám mây của QTS xây trên nền tảng hạ tầng có khả năng quan sát, ranh giới bền vững và quy trình phát hành rõ ràng — sẵn sàng cho từng giai đoạn phát triển tiếp theo.",
    icon: "cloud",
    cover: "/images/home/cloud-infrastructure.jpg",
    alt: "Hệ thống hạ tầng máy chủ và kết nối mạng",
    topics: ["Nền tảng hạ tầng và landing zone", "Kiến trúc bền vững và khả năng quan sát", "Tích hợp an toàn và kiểm soát truy cập", "Phát hành có kiểm soát và vận hành"],
    considerations: [
      "Thiết kế landing zone trước khi mở rộng dịch vụ.",
      "Ưu tiên khả năng quan sát và ranh giới bền vững ngay từ đầu.",
      "Chuẩn hóa kiểm soát truy cập và luồng phát hành.",
    ],
    sourceIds: ["aws-well-architected", "gcp-architecture-framework", "aws-architecture-center"],
    relatedResourceSlugs: ["kien-truc-dam-may-ben-vung", "quan-sat-van-hanh-dam-may", "landing-zone-thuc-tien"],
  },
  {
    slug: "ung-dung-web",
    title: "Ứng dụng web",
    shortTitle: "Web",
    description: "Trải nghiệm số rõ ràng cho các quy trình và nhóm người dùng khác nhau.",
    longDescription:
      "Ứng dụng web của QTS tập trung vào trải nghiệm hiệu năng cao, dễ tiếp cận và phù hợp với từng vai trò — từ hệ thống quản trị nội bộ đến sản phẩm cho khách hàng.",
    icon: "web",
    cover: "/images/home/logistics-warehouse.jpg",
    alt: "Không gian kho vận với kiện hàng được sắp xếp",
    topics: ["Trải nghiệm theo vai trò và luồng tác vụ", "Hiệu năng, khả năng tiếp cận và tính nhất quán", "Tích hợp với nền tảng và dịch vụ dữ liệu", "Phát triển bền vững và kiểm thử"],
    considerations: [
      "Thiết kế theo tác vụ và vai trò thay vì theo cấu trúc dữ liệu nội bộ.",
      "Đảm bảo khả năng tiếp cận và hiệu năng như yêu cầu cốt lõi.",
      "Giữ ranh giới rõ giữa lớp trải nghiệm và lớp nền tảng.",
    ],
    sourceIds: ["ms-ia-principles", "salesforce-reference-diagrams", "gcp-architecture-center"],
    relatedResourceSlugs: ["thiet-ke-trai-nghiem-theo-vai-tro", "hieu-nang-va-tiep-can", "tu-he-thong-quan-tri-toi-san-pham-khach-hang"],
  },
];

export function getSolutionTheme(slug: string): SolutionTheme | undefined {
  return solutionThemes.find((s) => s.slug === slug);
}
