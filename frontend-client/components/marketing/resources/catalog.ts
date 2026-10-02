import type { SolutionSlug } from "@/lib/solution-catalog";

export const resourceCategories = [
  {
    slug: "case-studies",
    label: "Bối cảnh ngành Việt Nam",
    eyebrow: "Dữ liệu ngành có nguồn",
    title: "Quy trình công khai để đối chiếu cùng QTS.",
    description: "Các bài viết trong nhóm này đọc quy trình và chỉ dấu từ nguồn Việt Nam, rồi ánh xạ chúng thành câu hỏi thiết kế — không phải hồ sơ hay kết quả khách hàng QTS.",
  },
  {
    slug: "solutions-guides",
    label: "Hướng dẫn giải pháp",
    eyebrow: "Xây dựng có chủ đích",
    title: "Cẩm nang cho nền tảng có khả năng mở rộng.",
    description: "Hướng dẫn thực tiễn để thiết kế nền tảng phần mềm, vận hành kết nối và quy trình thông minh.",
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
    label: "Thư viện kiến trúc",
    eyebrow: "Tài liệu chuyên sâu",
    title: "Thư viện kiến trúc và khung triển khai.",
    description: "Tuyển tập khung kiến trúc và tài liệu kỹ thuật được chọn lọc kèm nguồn chính thức để đọc sâu."
  },
  {
    slug: "product-updates",
    label: "Theo dõi chủ đề",
    eyebrow: "Định hướng phát triển",
    title: "Theo dõi các chủ đề nền tảng đang được quan tâm.",
    description: "Tổng hợp ngắn gọn theo chủ đề về các năng lực nền tảng được quan tâm — không hàm ý mốc phát hành cụ thể của QTS.",
  },
] as const;

export type ResourceCategory = (typeof resourceCategories)[number]["slug"];

export type Resource = {
  slug: string;
  category: ResourceCategory;
  type: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
  readingTime: string;
  themes: SolutionSlug[];
  sourceIds: string[];
  body: string[];
  checklist: string[];
  relatedSlugs?: string[];
};

export const resources: Resource[] = [
  // case-studies — 3 bối cảnh ngành Việt Nam có nguồn
  {
    slug: "global-manufacturing",
    category: "case-studies",
    type: "Bối cảnh ngành Việt Nam",
    title: "Vận hành sản xuất Việt Nam 2024: nối máy, tồn kho và tài chính",
    description: "Đọc báo cáo sản xuất Việt Nam 2024 (IIP +8,4%, chế biến, chế tạo khoảng +9,6–9,7%) và định hướng CMCN 4.0 để đặt câu hỏi thiết kế cho lớp điều hành nhà máy.",
    image: "/images/home/industrial-operations.jpg",
    imageAlt: "Không gian vận hành công nghiệp với hệ thống máy móc và kết cấu thép",
    href: "/resources/case-studies/global-manufacturing",
    readingTime: "8 phút đọc",
    themes: ["phan-mem-doanh-nghiep", "he-thong-dam-may"],
    sourceIds: ["moit-ip-2024", "nso-q4-2024", "qdtg-2289-industry40"],
    body: [
      "Bài viết đọc bối cảnh công nghiệp Việt Nam năm 2024 từ nguồn Bộ Công Thương và Tổng cục Thống kê: chỉ số sản xuất công nghiệp tăng 8,4%, ngành chế biến, chế tạo tăng khoảng 9,6–9,7%, trong khung định hướng CMCN lần thứ tư tại Quyết định 2289/QĐ-TTg. Đây là dữ liệu ngành công khai, không phải kết quả của một nhà máy hoặc khách hàng QTS cụ thể.",
      "Nội dung dùng các chỉ dấu đó để đặt câu hỏi thiết kế: tín hiệu máy–xưởng–kho–giao hàng được nối như thế nào, điểm bàn giao nào cần kiểm tra chất lượng tại nguồn, và bề mặt báo cáo nào nên ưu tiên cho người điều hành theo vai trò.",
    ],
    checklist: ["Đối chiếu chỉ dấu IIP và chế biến, chế tạo Việt Nam 2024 với trạng thái nhà máy", "Liệt kê điểm bàn giao cần kiểm tra giữa sản xuất, tồn kho và tài chính", "Chọn tín hiệu ưu tiên cho bề mặt điều hành theo vai trò"],
    relatedSlugs: ["van-hanh-ket-noi-erp-crm", "kien-truc-dam-may-ben-vung"],
  },
  {
    slug: "van-hanh-ket-noi-erp-crm",
    category: "case-studies",
    type: "Bối cảnh ngành Việt Nam",
    title: "Thanh toán số và đối soát tại Việt Nam: từ eKYC đến truy vết",
    description: "Đọc kế hoạch chuyển đổi số ngành Ngân hàng (810/QĐ-NHNN) và dữ liệu thanh toán không tiền mặt của NHNN để đặt câu hỏi thiết kế cho luồng phê duyệt, ghi sổ và đối soát.",
    image: "/images/home/enterprise-operations.jpg",
    imageAlt: "Nhóm chuyên viên trao đổi trước bảng kế hoạch trong phòng họp",
    href: "/resources/case-studies/van-hanh-ket-noi-erp-crm",
    readingTime: "6 phút đọc",
    themes: ["phan-mem-doanh-nghiep", "ung-dung-web"],
    sourceIds: ["nhnn-810-cds", "sbv-cashless-2024"],
    body: [
      "Bài viết đọc khung chuyển đổi số ngành Ngân hàng theo Quyết định 810/QĐ-NHNN và dữ liệu thanh toán không tiền mặt do NHNN công bố: 99% giao dịch nộp thuế không tiền mặt, hơn 182 triệu tài khoản cá nhân cuối 2023 và khoảng 4,9 tỷ giao dịch trực tuyến trong 4 tháng đầu 2024. Đây là bối cảnh ngành công khai, không mô tả một ngân hàng hay khách hàng QTS cụ thể.",
      "Nội dung chuyển các yêu cầu đó thành câu hỏi thiết kế: luồng eKYC–phê duyệt–ghi sổ–thanh toán số–đối soát–truy vết được tách bạch và phân quyền như thế nào để mỗi thay đổi đều có thể kiểm tra.",
    ],
    checklist: ["Đối chiếu yêu cầu eKYC, phê duyệt và truy vết theo 810/QĐ-NHNN", "Thiết kế luồng phê duyệt, ghi sổ và đối soát có thể kiểm tra", "Chuẩn hóa phân quyền theo vai trò và mức rủi ro"],
  },
  {
    slug: "dieu-phoi-y-te-ban-giao",
    category: "case-studies",
    type: "Bối cảnh ngành Việt Nam",
    title: "Quy trình khám bệnh tại Khoa Khám bệnh theo Quyết định 1313/QĐ-BYT",
    description: "Đọc quy trình tiếp đón–khám–cận lâm sàng–thanh toán–lĩnh thuốc của Bộ Y tế và các nhánh kỹ thuật cận lâm sàng để đặt câu hỏi thiết kế cho bề mặt điều phối y tế.",
    image: "/images/home/data-collaboration.jpg",
    imageAlt: "Nhóm chuyên viên trao đổi cùng laptop trong buổi làm việc",
    href: "/resources/case-studies/dieu-phoi-y-te-ban-giao",
    readingTime: "7 phút đọc",
    themes: ["phan-mem-doanh-nghiep", "ung-dung-web"],
    sourceIds: ["moh-1313"],
    body: [
      "Bài viết đọc Quyết định 1313/QĐ-BYT về quy trình khám bệnh tại Khoa Khám bệnh: tiếp đón và lấy số, đăng ký vào khám, khám lâm sàng, các nhánh cận lâm sàng, kết luận và dặn dò, thanh toán và lĩnh thuốc. Văn bản có chỉ tiêu thời gian khám lâm sàng đơn thuần dưới 2 giờ và dưới 4 giờ khi có ba kỹ thuật cận lâm sàng phối hợp.",
      "Nội dung dùng quy trình công khai đó để đặt câu hỏi thiết kế: hồ sơ, năng lực đội ngũ và bước tiếp theo được nối theo vai trò và ca trực như thế nào để giảm điểm mù khi bàn giao và giữ khả năng truy vết.",
    ],
    checklist: ["Mô tả quy trình 1313 theo vai trò và ca trực", "Chuẩn hóa bước bàn giao có kiểm tra giữa khám và cận lâm sàng", "Ghi lại quyết định điều phối để truy vết"],
  },
  // solutions-guides — 3
  {
    slug: "nen-tang-saas-mo-rong",
    category: "solutions-guides",
    type: "Hướng dẫn giải pháp",
    title: "Hướng dẫn xây nền tảng SaaS có khả năng mở rộng",
    description: "Các quyết định về ranh giới miền, phân quyền và vòng đời phát hành giúp nền tảng phát triển mà không tạo lực cản.",
    image: "/images/home/software-work.jpg",
    imageAlt: "Nhóm làm việc trong không gian phát triển phần mềm",
    href: "/resources/solutions-guides/nen-tang-saas-mo-rong",
    readingTime: "9 phút đọc",
    themes: ["nen-tang-phan-mem", "ung-dung-web"],
    sourceIds: ["aws-well-architected", "gcp-architecture-framework"],
    body: [
      "Hướng dẫn này hệ thống hóa các câu hỏi cần trả lời trước khi mở rộng nền tảng SaaS: ranh giới miền, mô hình đa tổ chức, gói tính năng và luồng phát hành.",
      "Mỗi mục đi kèm gợi ý thảo luận để đội ngũ chọn phương án phù hợp với bối cảnh thay vì áp dụng một mẫu cố định.",
    ],
    checklist: ["Xác định ranh giới miền và phụ thuộc", "Chọn mô hình đa tổ chức và phân quyền", "Chuẩn hóa luồng phát hành theo giai đoạn"],
  },
  {
    slug: "kien-truc-composable",
    category: "solutions-guides",
    type: "Hướng dẫn giải pháp",
    title: "Kiến trúc vận hành có thể kết hợp",
    description: "Cách kết nối hệ thống dữ liệu, trí tuệ và quy trình mà không phải thay thế những phần đang hoạt động tốt.",
    image: "/images/resources/resource-datacenter-racks.jpg",
    imageAlt: "Dãy tủ rack trong trung tâm dữ liệu, minh hoạ kiến trúc có thể kết hợp",
    href: "/resources/solutions-guides/kien-truc-composable",
    readingTime: "7 phút đọc",
    themes: ["nen-tang-phan-mem", "he-thong-dam-may"],
    sourceIds: ["gcp-architecture-center", "ibm-architecture-patterns"],
    body: [
      "Hướng dẫn trình bày cách tiếp cận composable: giữ lại thành phần đang vận hành tốt, chuẩn hóa lớp tích hợp và thêm năng lực mới theo ranh giới rõ ràng.",
      "Nội dung nhấn mạnh việc chọn điểm tích hợp có kiểm soát thay vì thay thế toàn bộ hệ thống cùng lúc.",
    ],
    checklist: ["Liệt kê thành phần giữ lại và thay thế", "Chuẩn hóa lớp tích hợp và hợp đồng dữ liệu", "Thêm năng lực mới theo ranh giới miền"],
  },
  {
    slug: "api-va-tich-hop-ben-vung",
    category: "solutions-guides",
    type: "Hướng dẫn giải pháp",
    title: "API và tích hợp bền vững giữa các hệ thống",
    description: "Nguyên tắc thiết kế hợp đồng tích hợp, phân quyền và quan sát để kết nối doanh nghiệp vận hành ổn định.",
    image: "/images/home/logistics-warehouse.jpg",
    imageAlt: "Không gian kho vận với kiện hàng được sắp xếp",
    href: "/resources/solutions-guides/api-va-tich-hop-ben-vung",
    readingTime: "6 phút đọc",
    themes: ["nen-tang-phan-mem", "he-thong-dam-may"],
    sourceIds: ["aws-architecture-center", "gcp-architecture-center"],
    body: [
      "Hướng dẫn tập trung vào hợp đồng API, kiểm soát truy cập và khả năng quan sát cho các điểm tích hợp giữa hệ thống nội bộ và đối tác.",
      "Mỗi quyết định được đặt trong bối cảnh vận hành: ai gọi, dữ liệu nào đi qua, và cách phát hiện sự cố sớm.",
    ],
    checklist: ["Chuẩn hóa hợp đồng API và phiên bản", "Phân quyền theo vai trò và phạm vi gọi", "Thiết kế quan sát cho điểm tích hợp trọng yếu"],
  },
  // technology-insights — 3
  {
    slug: "ai-trong-quy-trinh-quan-trong",
    category: "technology-insights",
    type: "Góc nhìn công nghệ",
    title: "Đưa AI vào các hoạt động quan trọng một cách hữu ích",
    description: "Những điều cần có để đi từ thử nghiệm riêng lẻ đến đề xuất đáng tin cậy trong luồng công việc.",
    image: "/images/home/data-collaboration.jpg",
    imageAlt: "Nhóm chuyên viên trao đổi cùng laptop trong buổi làm việc",
    href: "/resources/technology-insights/ai-trong-quy-trinh-quan-trong",
    readingTime: "6 phút đọc",
    themes: ["giai-phap-ai", "phan-mem-doanh-nghiep"],
    sourceIds: ["aws-well-architected", "gcp-architecture-center"],
    body: [
      "Góc nhìn này đặt AI tại điểm quyết định thực tế thay vì lớp báo cáo tách rời. Trọng tâm là cách tín hiệu được chuyển thành đề xuất có thể giải thích và đi qua vòng kiểm tra của con người.",
      "Nội dung gợi ý cách chuẩn bị dữ liệu, tiêu chí đánh giá và ngưỡng can thiệp trước khi mở rộng.",
    ],
    checklist: ["Chọn điểm quyết định đặt AI", "Thiết kế vòng kiểm tra con người", "Chuẩn bị tiêu chí đánh giá và ngưỡng can thiệp"],
  },
  {
    slug: "quan-sat-van-hanh-dam-may",
    category: "technology-insights",
    type: "Góc nhìn công nghệ",
    title: "Quan sát vận hành đám mây ở tốc độ thực tế",
    description: "Cách tổ chức tín hiệu, cảnh báo và truy vết để đội ngũ phản ứng kịp thời mà không nhiễu.",
    image: "/images/home/cloud-infrastructure.jpg",
    imageAlt: "Hệ thống hạ tầng máy chủ và kết nối mạng",
    href: "/resources/technology-insights/quan-sat-van-hanh-dam-may",
    readingTime: "7 phút đọc",
    themes: ["he-thong-dam-may", "giai-phap-ai"],
    sourceIds: ["aws-well-architected", "gcp-architecture-framework"],
    body: [
      "Góc nhìn hệ thống hóa cách tổ chức quan sát: tín hiệu nào cần thu thập, cảnh báo nào cần ưu tiên và cách truy vết từ cảnh báo đến nguyên nhân.",
      "Nội dung nhấn mạnh việc giảm nhiễu bằng cách gắn cảnh báo với vai trò và mức ưu tiên rõ ràng.",
    ],
    checklist: ["Chọn tín hiệu trọng yếu cần thu thập", "Gắn cảnh báo với vai trò và mức ưu tiên", "Chuẩn hóa truy vết từ cảnh báo đến nguyên nhân"],
  },
  {
    slug: "hieu-nang-va-tiep-can",
    category: "technology-insights",
    type: "Góc nhìn công nghệ",
    title: "Hiệu năng và khả năng tiếp cận cho ứng dụng web vận hành",
    description: "Vì sao tốc độ, khả năng tiếp cận và tính nhất quán nên được xem là yêu cầu cốt lõi của ứng dụng nội bộ.",
    image: "/images/home/software-work.jpg",
    imageAlt: "Nhóm làm việc trong không gian phát triển phần mềm",
    href: "/resources/technology-insights/hieu-nang-va-tiep-can",
    readingTime: "5 phút đọc",
    themes: ["ung-dung-web", "nen-tang-phan-mem"],
    sourceIds: ["ms-ia-principles", "gcp-architecture-center"],
    body: [
      "Góc nhìn trình bày cách xem hiệu năng và khả năng tiếp cận như yêu cầu cốt lõi thay vì tối ưu bổ sung, đặc biệt với ứng dụng vận hành dùng hằng ngày.",
      "Nội dung gợi ý cách kiểm tra trải nghiệm theo vai trò và theo tác vụ thay vì chỉ theo trang.",
    ],
    checklist: ["Kiểm tra trải nghiệm theo vai trò và tác vụ", "Chuẩn hóa kiểm thử bàn phím và trình đọc màn hình", "Đặt ngưỡng hiệu năng theo luồng trọng yếu"],
  },
  // white-papers — 3 Thư viện kiến trúc
  {
    slug: "kien-truc-dam-may-ben-vung",
    category: "white-papers",
    type: "Thư viện kiến trúc",
    title: "Thiết kế kiến trúc đám mây cho thay đổi, không chỉ cho quy mô",
    description: "Tuyển tập khung Well-Architected và kiến trúc triển khai giúp đánh giá ranh giới bền vững và khả năng quan sát.",
    image: "/images/resources/resource-datacenter-racks.jpg",
    imageAlt: "Dãy tủ rack trong trung tâm dữ liệu, minh hoạ hạ tầng đám mây",
    href: "/resources/white-papers/kien-truc-dam-may-ben-vung",
    readingTime: "10 phút đọc",
    themes: ["he-thong-dam-may", "nen-tang-phan-mem"],
    sourceIds: ["aws-well-architected", "gcp-architecture-framework", "aws-architecture-center"],
    body: [
      "Tuyển tập này tổng hợp các khung kiến trúc giúp đội ngũ đánh giá hệ thống đám mây theo ranh giới bền vững, khả năng quan sát và kiểm soát thay đổi.",
      "QTS tóm tắt ngắn gọn bằng tiếng Việt và dẫn tới nguồn chính thức để đọc sâu; không sao chép sơ đồ hay nội dung gốc.",
    ],
    checklist: ["Đối chiếu 6 trụ cột Well-Architected với hệ thống hiện có", "Rà soát ranh giới bền vững và khả năng quan sát", "Lập danh mục nguồn chính thức cần đọc sâu"],
  },
  {
    slug: "nen-tang-du-lieu-va-tich-hop",
    category: "white-papers",
    type: "Thư viện kiến trúc",
    title: "Nền tảng dữ liệu và tích hợp cho vận hành kết nối",
    description: "Khung tổ chức dữ liệu, hợp đồng tích hợp và truy vết phục vụ vận hành liên phòng ban.",
    image: "/images/resources/resource-office-meeting.jpg",
    imageAlt: "Nhóm trao đổi trong phòng họp, minh hoạ phối hợp liên phòng ban",
    href: "/resources/white-papers/nen-tang-du-lieu-va-tich-hop",
    readingTime: "9 phút đọc",
    themes: ["phan-mem-doanh-nghiep", "nen-tang-phan-mem"],
    sourceIds: ["ibm-architecture-collection", "gcp-architecture-center", "aws-architecture-center"],
    body: [
      "Tuyển tập tập trung vào cách tổ chức dữ liệu làm chủ, hợp đồng tích hợp và truy vết để vận hành liên phòng ban có thể đối soát và kiểm tra.",
      "Mỗi khung được giới thiệu ngắn gọn kèm liên kết tới nguồn chính thức.",
    ],
    checklist: ["Xác định dữ liệu làm chủ và hợp đồng tích hợp", "Chuẩn hóa truy vết cho luồng liên phòng ban", "Chọn nguồn chính thức phù hợp để đọc sâu"],
  },
  {
    slug: "khung-ai-co-quan-tri",
    category: "white-papers",
    type: "Thư viện kiến trúc",
    title: "Khung AI có quản trị: từ thử nghiệm đến năng lực bền vững",
    description: "Tuyển tập khung quản trị AI giúp chuyển từ thử nghiệm sang năng lực có thể kiểm tra và duy trì.",
    image: "/images/resources/resource-open-office.jpg",
    imageAlt: "Không gian văn phòng mở với khu họp kính, minh hoạ quản trị AI",
    href: "/resources/white-papers/khung-ai-co-quan-tri",
    readingTime: "8 phút đọc",
    themes: ["giai-phap-ai", "he-thong-dam-may"],
    sourceIds: ["ibm-architecture-patterns", "aws-well-architected", "gcp-architecture-framework"],
    body: [
      "Tuyển tập hệ thống hóa các cân nhắc quản trị khi đưa AI vào vận hành: dữ liệu, vòng kiểm tra con người, khả năng giải thích và ngưỡng can thiệp.",
      "Nội dung được tóm tắt ngắn gọn bằng tiếng Việt và dẫn tới nguồn chính thức để đọc sâu.",
    ],
    checklist: ["Xác định vòng kiểm tra con người cho từng đề xuất AI", "Chuẩn bị tiêu chí đánh giá và truy vết", "Chọn khung quản trị phù hợp để áp dụng"],
  },
  // product-updates — 3 Theo dõi chủ đề
  {
    slug: "tu-dong-hoa-co-kiem-soat",
    category: "product-updates",
    type: "Theo dõi chủ đề",
    title: "Tự động hóa có kiểm soát trong quy trình vận hành",
    description: "Chủ đề được quan tâm: cách tự động hóa điểm bàn giao thủ công mà vẫn giữ điểm kiểm tra phù hợp.",
    image: "/images/home/logistics-warehouse.jpg",
    imageAlt: "Không gian kho vận với kiện hàng được sắp xếp",
    href: "/resources/product-updates/tu-dong-hoa-co-kiem-soat",
    readingTime: "5 phút đọc",
    themes: ["phan-mem-doanh-nghiep", "giai-phap-ai"],
    sourceIds: ["ibm-architecture-patterns", "salesforce-architects"],
    body: [
      "Chủ đề này tổng hợp các cân nhắc khi tự động hóa quy trình vận hành: chọn điểm tự động hóa, giữ điểm kiểm tra và đo tác động sau triển khai.",
      "Nội dung được trình bày như gợi ý thảo luận theo chủ đề, không hàm ý mốc phát hành cụ thể của QTS.",
    ],
    checklist: ["Chọn điểm bàn giao nên tự động hóa", "Giữ điểm kiểm tra phù hợp với rủi ro", "Đo tác động sau khi áp dụng"],
  },
  {
    slug: "governance-ai-thuc-tien",
    category: "product-updates",
    type: "Theo dõi chủ đề",
    title: "Quản trị AI thực tiễn cho đội ngũ vận hành",
    description: "Chủ đề được quan tâm: cách đặt ngưỡng, phân quyền và truy vết cho đề xuất AI trong luồng việc.",
    image: "/images/home/data-collaboration.jpg",
    imageAlt: "Nhóm chuyên viên trao đổi cùng laptop trong buổi làm việc",
    href: "/resources/product-updates/governance-ai-thuc-tien",
    readingTime: "6 phút đọc",
    themes: ["giai-phap-ai", "nen-tang-phan-mem"],
    sourceIds: ["gcp-architecture-framework", "aws-well-architected"],
    body: [
      "Chủ đề hệ thống hóa các câu hỏi quản trị AI ở mức vận hành: ai duyệt đề xuất, ngưỡng nào cần can thiệp và cách truy vết quyết định.",
      "Nội dung giúp đội ngũ chuẩn bị trước khi mở rộng AI ra nhiều luồng việc hơn.",
    ],
    checklist: ["Xác định người duyệt cho từng loại đề xuất", "Đặt ngưỡng can thiệp theo tác động", "Chuẩn hóa truy vết quyết định AI"],
  },
  {
    slug: "landing-zone-thuc-tien",
    category: "product-updates",
    type: "Theo dõi chủ đề",
    title: "Landing zone thực tiễn cho phát triển theo giai đoạn",
    description: "Chủ đề được quan tâm: cách chuẩn bị nền tảng hạ tầng để thêm dịch vụ mà không làm phức tạp vận hành.",
    image: "/images/resources/resource-datacenter-racks.jpg",
    imageAlt: "Dãy tủ rack trong trung tâm dữ liệu, minh hoạ landing zone",
    href: "/resources/product-updates/landing-zone-thuc-tien",
    readingTime: "6 phút đọc",
    themes: ["he-thong-dam-may", "nen-tang-phan-mem"],
    sourceIds: ["aws-architecture-center", "gcp-architecture-center"],
    body: [
      "Chủ đề trình bày cách chuẩn bị landing zone và ranh giới vận hành trước khi mở rộng dịch vụ, giúp kiểm soát thay đổi và khả năng quan sát.",
      "Nội dung được tổ chức như danh mục cân nhắc theo chủ đề thay vì tuyên bố lộ trình sản phẩm.",
    ],
    checklist: ["Chuẩn bị landing zone và ranh giới vận hành", "Chuẩn hóa kiểm soát truy cập theo môi trường", "Lập kế hoạch mở rộng dịch vụ theo giai đoạn"],
  },
  // extra to reach 15+ — keep distribution balanced (3 more)
  {
    slug: "thiet-ke-trai-nghiem-theo-vai-tro",
    category: "solutions-guides",
    type: "Hướng dẫn giải pháp",
    title: "Thiết kế trải nghiệm theo vai trò và tác vụ",
    description: "Cách biến quy trình phức tạp thành giao diện rõ ràng cho từng vai trò vận hành.",
    image: "/images/home/software-work.jpg",
    imageAlt: "Nhóm làm việc trong không gian phát triển phần mềm",
    href: "/resources/solutions-guides/thiet-ke-trai-nghiem-theo-vai-tro",
    readingTime: "6 phút đọc",
    themes: ["ung-dung-web", "phan-mem-doanh-nghiep"],
    sourceIds: ["ms-ia-principles", "salesforce-reference-diagrams"],
    body: [
      "Hướng dẫn trình bày cách thiết kế giao diện theo tác vụ và vai trò thay vì sao chép cấu trúc dữ liệu nội bộ.",
      "Mỗi mục gợi ý cách kiểm tra tính rõ ràng của luồng trước khi thêm tính năng mới.",
    ],
    checklist: ["Mô tả tác vụ trọng yếu theo vai trò", "Kiểm tra luồng với người dùng thực tế", "Chuẩn hóa mẫu giao diện theo tác vụ"],
  },
  {
    slug: "doi-soat-tai-chinh-van-hanh",
    category: "technology-insights",
    type: "Góc nhìn công nghệ",
    title: "Đối soát tài chính - vận hành trên cùng một bối cảnh",
    description: "Góc nhìn về cách liên kết dữ liệu giao hàng, tồn kho và bút toán để giảm đối soát cuối kỳ.",
    image: "/images/home/enterprise-operations.jpg",
    imageAlt: "Nhóm chuyên viên trao đổi trước bảng kế hoạch trong phòng họp",
    href: "/resources/technology-insights/doi-soat-tai-chinh-van-hanh",
    readingTime: "6 phút đọc",
    themes: ["phan-mem-doanh-nghiep", "he-thong-dam-may"],
    sourceIds: ["ibm-architecture-collection", "aws-architecture-center"],
    body: [
      "Góc nhìn mô tả cách liên kết dữ liệu giao hàng, tồn kho và bút toán trên cùng một bối cảnh để giảm đối soát thủ công cuối kỳ.",
      "Trọng tâm là ranh giới dữ liệu làm chủ và khả năng truy vết cho mỗi bút toán.",
    ],
    checklist: ["Xác định dữ liệu làm chủ cho từng bút toán", "Liên kết giao hàng - tồn kho - tài chính", "Chuẩn hóa truy vết đối soát"],
  },
  {
    slug: "tu-he-thong-quan-tri-toi-san-pham-khach-hang",
    category: "white-papers",
    type: "Thư viện kiến trúc",
    title: "Từ hệ thống quản trị tới sản phẩm cho khách hàng",
    description: "Khung triển khai để mở rộng từ ứng dụng nội bộ sang trải nghiệm khách hàng trên cùng một nền tảng.",
    image: "/images/resources/resource-glass-meeting.jpg",
    imageAlt: "Phòng họp kính trong văn phòng mở, minh hoạ mở rộng tới khách hàng",
    href: "/resources/white-papers/tu-he-thong-quan-tri-toi-san-pham-khach-hang",
    readingTime: "8 phút đọc",
    themes: ["ung-dung-web", "nen-tang-phan-mem"],
    sourceIds: ["salesforce-architects", "gcp-architecture-center", "ms-ia-principles"],
    body: [
      "Tuyển tập trình bày cách mở rộng từ hệ thống quản trị nội bộ sang sản phẩm cho khách hàng mà vẫn giữ ranh giới miền và kiểm soát truy cập rõ ràng.",
      "Mỗi khung được tóm tắt ngắn gọn kèm liên kết tới nguồn chính thức để đọc sâu.",
    ],
    checklist: ["Tách ranh giới miền giữa quản trị và khách hàng", "Chuẩn hóa kiểm soát truy cập theo vai trò", "Chọn khung triển khai phù hợp để đọc sâu"],
  },
];

export const featuredResource = resources.find((r) => r.slug === "global-manufacturing") ?? resources[0];

export function getCategory(slug: string) {
  return resourceCategories.find((category) => category.slug === slug);
}

export function getResourcesForCategory(category: ResourceCategory) {
  return resources.filter((resource) => resource.category === category);
}

export function getResource(category: string, slug: string) {
  return resources.find((r) => r.category === category && r.slug === slug);
}

export function getResourceBySlug(slug: string) {
  return resources.find((r) => r.slug === slug);
}
