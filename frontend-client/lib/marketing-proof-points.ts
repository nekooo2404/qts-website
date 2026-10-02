import type { ProofPointItem } from "@/components/marketing/ProofPointShowcase";
import type { ResourceCategory } from "@/components/marketing/resources/catalog";

export const landingProofPoints = [
  {
    label: "Tổng quan vận hành",
    title: "Bề mặt điều hành doanh nghiệp",
    description: "QTS hướng tới một giao diện điều hành chung cho quy trình, dự án và tín hiệu hệ thống thay vì các công cụ rời rạc.",
    image: "/images/home/data-collaboration.jpg",
    alt: "Nhóm chuyên viên trao đổi quanh bàn làm việc với laptop, minh hoạ bề mặt điều hành doanh nghiệp",
    metrics: [
      { value: "CRM", label: "khách hàng và hợp đồng" },
      { value: "ERP", label: "vận hành và tài chính" },
      { value: "Portal", label: "cổng thông tin và truy cập" },
    ],
  },
  {
    label: "Tín hiệu quyết định",
    title: "AI gắn với vòng kiểm tra của con người",
    description: "Tín hiệu được tổng hợp thành cảnh báo và đề xuất, nhưng các quyết định quan trọng vẫn đi qua phê duyệt.",
    image: "/images/home/software-work.jpg",
    alt: "Không gian làm việc của nhóm phát triển phần mềm, minh hoạ luồng tín hiệu và kiểm tra",
    metrics: [
      { value: "Cảnh báo", label: "ngoại lệ cần xem xét" },
      { value: "Đề xuất", label: "hành động gợi ý" },
      { value: "Phê duyệt", label: "điểm ra quyết định" },
    ],
  },
  {
    label: "Luồng triển khai",
    title: "Từ bối cảnh đến một nền tảng có thể mở rộng",
    description: "Mỗi dự án bắt đầu bằng khám phá bối cảnh, sau đó mới định hình phạm vi, kiến trúc và lộ trình phát hành.",
    image: "/images/home/enterprise-operations.jpg",
    alt: "Nhóm trao đổi trước bảng kế hoạch, minh hoạ luồng triển khai theo bối cảnh",
    metrics: [
      { value: "Khám phá", label: "ràng buộc và mục tiêu" },
      { value: "Thiết kế", label: "quy trình và kiến trúc" },
      { value: "Triển khai", label: "phát hành có kiểm soát" },
    ],
  },
] satisfies ProofPointItem[];

export const platformProofPoints = [
  {
    label: "CRM + ERP",
    title: "Một hồ sơ vận hành chung",
    description: "Bối cảnh vận hành cho thấy khách hàng, hợp đồng, giao hàng và tài chính có thể cùng nằm trên một bối cảnh.",
    image: "/images/home/industrial-operations.jpg",
    alt: "Không gian vận hành công nghiệp với hệ thống máy móc, minh hoạ hồ sơ vận hành chung",
    metrics: [
      { value: "Hợp nhất", label: "hồ sơ khách hàng và hợp đồng" },
      { value: "Đối soát", label: "tài chính và giao hàng" },
      { value: "Phân quyền", label: "theo vai trò vận hành" },
    ],
  },
  {
    label: "Quy trình",
    title: "Quy trình có thể kiểm tra",
    description: "Bộ bối cảnh minh hoạ cho phần quy trình, thể hiện phê duyệt, chuyển bước và ngoại lệ trong cùng một luồng.",
    image: "/images/industries/education-classroom.jpg",
    alt: "Lớp học với người học, minh hoạ quy trình có thể kiểm tra trong môi trường đào tạo",
    metrics: [
      { value: "Phê duyệt", label: "điểm ra quyết định" },
      { value: "Chuyển bước", label: "luồng tác vụ" },
      { value: "Ngoại lệ", label: "cần rà soát" },
    ],
  },
  {
    label: "Đám mây + Phân tích dữ liệu",
    title: "Quan sát ở tốc độ vận hành",
    description: "Bối cảnh vận hành cho lớp phân tích: trạng thái môi trường, hiệu năng, cảnh báo và quyết định cần ưu tiên.",
    image: "/images/home/cloud-infrastructure.jpg",
    alt: "Hệ thống hạ tầng máy chủ, minh hoạ quan sát vận hành",
    metrics: [
      { value: "Môi trường", label: "theo dõi trạng thái" },
      { value: "Cảnh báo", label: "ngoại lệ cần ưu tiên" },
      { value: "Truy vết", label: "từ tín hiệu đến hành động" },
    ],
  },
] satisfies ProofPointItem[];

export const solutionProofPoints = [
  {
    label: "Phần mềm doanh nghiệp",
    title: "Thay bảng tính bằng luồng kiểm soát",
    description: "Bối cảnh vận hành cho phần mềm doanh nghiệp: từ yêu cầu, phê duyệt, đối soát đến báo cáo quản trị.",
    image: "/images/home/logistics-warehouse.jpg",
    alt: "Kho vận với kiện hàng được sắp xếp, minh hoạ phần mềm doanh nghiệp",
    metrics: [
      { value: "Vận hành", label: "quy trình cốt lõi" },
      { value: "Đối soát", label: "dữ liệu liên phòng ban" },
      { value: "Phân quyền", label: "theo vai trò" },
    ],
  },
  {
    label: "Nền tảng phần mềm",
    title: "Nền tảng có thể mở rộng",
    description: "Bộ bối cảnh minh hoạ cho nền tảng phần mềm thể hiện tổ chức, phân quyền, gói tính năng và vòng đời phát hành.",
    image: "/images/industries/finance-operations.jpg",
    alt: "Nhóm vận hành và dữ liệu, minh hoạ nền tảng phần mềm",
    metrics: [
      { value: "Đa tổ chức", label: "mô hình nền tảng" },
      { value: "Phân quyền", label: "theo vai trò" },
      { value: "Phát hành", label: "theo giai đoạn" },
    ],
  },
  {
    label: "AI + Đám mây",
    title: "Trí tuệ nằm trong luồng việc",
    description: "Bối cảnh vận hành cho giải pháp AI, gồm đầu vào, điểm kiểm tra con người và đề xuất có thể giải thích.",
    image: "/images/industries/retail-store.jpg",
    alt: "Không gian cửa hàng bán lẻ, minh hoạ điểm chạm AI trong luồng vận hành",
    metrics: [
      { value: "Tín hiệu", label: "ngoại lệ cần xem xét" },
      { value: "Đề xuất", label: "cần vòng kiểm tra" },
      { value: "Kiểm tra", label: "quyết định của con người" },
    ],
  },
] satisfies ProofPointItem[];

export const industryProofPoints = [
  {
    label: "Y tế · Việt Nam",
    title: "Tiếp đón — khám — cận lâm sàng — lĩnh thuốc",
    description: "Quy trình Khoa Khám bệnh theo Quyết định 1313/QĐ-BYT: từ tiếp đón và khám lâm sàng, qua nhánh cận lâm sàng, đến thanh toán và phát/lĩnh thuốc.",
    image: "/images/industries/healthcare-clinic.jpg",
    alt: "Đội ngũ y tế trong không gian phòng khám, minh hoạ bối cảnh y tế Việt Nam",
    metrics: [
      { value: "<2h", label: "khám lâm sàng đơn thuần" },
      { value: "<4h", label: "3 kỹ thuật cận lâm sàng" },
      { value: "1313", label: "QĐ-BYT · quy trình khám bệnh" },
    ],
    sourceIds: ["moh-1313"],
  },
  {
    label: "Sản xuất · Việt Nam",
    title: "IIP tăng — nối máy, tồn kho và tài chính",
    description: "Báo cáo Bộ Công Thương và Tổng cục Thống kê đặt nhà máy trong bối cảnh IIP 2024 tăng 8,4%, chế biến, chế tạo tăng khoảng 9,6–9,7%, cùng định hướng ứng dụng CMCN lần thứ tư.",
    image: "/images/industries/manufacturing-line.jpg",
    alt: "Dây chuyền sản xuất, minh hoạ bối cảnh công nghiệp Việt Nam",
    metrics: [
      { value: "+8,4%", label: "IIP Việt Nam 2024" },
      { value: "+9,6%", label: "chế biến, chế tạo" },
      { value: "4.0", label: "chiến lược quốc gia đến 2030" },
    ],
    sourceIds: ["moit-ip-2024", "qdtg-2289-industry40"],
  },
  {
    label: "Logistics · Việt Nam",
    title: "Vận tải — kho bãi — chặng cuối — ngoại lệ",
    description: "Báo cáo kinh tế — xã hội 2024 của Tổng cục Thống kê và Bộ Công Thương cho thấy vận tải, kho bãi tăng 10,82%, cùng các điểm nhấn WMS/TMS, cảng mở và logistics xanh.",
    image: "/images/industries/logistics-warehouse.jpg",
    alt: "Kho hàng với các kiện hàng, minh hoạ bối cảnh logistics Việt Nam",
    metrics: [
      { value: "+10,82%", label: "vận tải, kho bãi 2024" },
      { value: "2,67 tỷ", label: "tấn hàng hóa vận chuyển" },
      { value: "WMS/TMS", label: "số hóa mạng lưới logistics" },
    ],
    sourceIds: ["moit-logistics-10-2024", "nso-q4-2024"],
  },
] satisfies ProofPointItem[];

export const resourceProofPoints = [
  {
    label: "Tình huống minh hoạ",
    title: "Tình huống vận hành có bối cảnh",
    description: "Tài nguyên không chỉ là bài viết: mỗi tình huống có ràng buộc, bề mặt sản phẩm và bối cảnh minh hoạ để thảo luận.",
    image: "/images/resources/resource-office-meeting.jpg",
    alt: "Nhóm trao đổi trong phòng họp, minh hoạ tài nguyên tình huống vận hành",
    metrics: [
      { value: "Mô hình", label: "theo bối cảnh ngành" },
      { value: "Triển khai", label: "theo giai đoạn" },
      { value: "Thảo luận", label: "theo tình huống" },
    ],
  },
  {
    label: "Hướng dẫn",
    title: "Hướng dẫn theo quyết định",
    description: "Bối cảnh vận hành cho hướng dẫn: giúp người đọc nối vấn đề, kiến trúc, công nghệ và tác động vận hành.",
    image: "/images/resources/resource-datacenter-racks.jpg",
    alt: "Dãy tủ máy chủ trong trung tâm dữ liệu, minh hoạ hướng dẫn kiến trúc nền tảng",
    metrics: [
      { value: "Quyết định", label: "theo bối cảnh" },
      { value: "Công nghệ", label: "lựa chọn phù hợp" },
      { value: "Nguồn", label: "chính thức đi kèm" },
    ],
  },
  {
    label: "Cập nhật",
    title: "Cập nhật gắn với năng lực",
    description: "Bối cảnh vận hành cho cập nhật sản phẩm thể hiện thay đổi, nơi xuất hiện và công việc được hỗ trợ.",
    image: "/images/resources/product-update.svg",
    alt: "Minh hoạ cập nhật sản phẩm, nơi thay đổi xuất hiện trong bề mặt vận hành",
    metrics: [
      { value: "Chủ đề", label: "đang được quan tâm" },
      { value: "Năng lực", label: "theo chủ đề" },
      { value: "Tác động", label: "theo vai trò" },
    ],
  },
] satisfies ProofPointItem[];

export const companyProofPoints = [
  {
    label: "Khám phá",
    title: "Bản đồ ràng buộc vận hành",
    description: "Bối cảnh vận hành cho cách QTS bắt đầu: điểm quyết định, điểm bàn giao và hệ thống liên quan.",
    image: "/images/company/company-culture-workshop.jpg",
    alt: "Buổi workshop khám phá nhu cầu, minh hoạ bản đồ ràng buộc vận hành",
    metrics: [
      { value: "Ràng buộc", label: "cần làm rõ" },
      { value: "Luồng việc", label: "theo vai trò" },
      { value: "Vai trò", label: "ra quyết định" },
    ],
  },
  {
    label: "Xây dựng",
    title: "Phát hành theo giai đoạn",
    description: "Bối cảnh vận hành cho triển khai: backlog, rủi ro tích hợp và vòng kiểm chứng trước khi mở rộng.",
    image: "/images/company/company-culture-architecture.jpg",
    alt: "Rà soát kiến trúc hệ thống, minh hoạ phát hành theo giai đoạn",
    metrics: [
      { value: "Phát hành", label: "theo giai đoạn" },
      { value: "Ưu tiên", label: "theo tác động" },
      { value: "Rủi ro", label: "cần kiểm soát" },
    ],
  },
  {
    label: "Vận hành",
    title: "Cải tiến sau khi vận hành",
    description: "Bối cảnh vận hành cho tối ưu: tín hiệu áp dụng, phản hồi người dùng và sức khỏe nền tảng.",
    image: "/images/company/company-culture-product-review.jpg",
    alt: "Đánh giá sản phẩm cùng nhóm, minh hoạ cải tiến sau vận hành",
    metrics: [
      { value: "Tín hiệu", label: "áp dụng thực tế" },
      { value: "Phản hồi", label: "từ người dùng" },
      { value: "Theo dõi", label: "sức khỏe nền tảng" },
    ],
  },
] satisfies ProofPointItem[];

export const contactProofPoints = [
  {
    label: "Yêu cầu tư vấn",
    title: "Bạn chỉ cần mang vấn đề",
    description: "Bối cảnh vận hành cho form liên hệ: mô tả mục tiêu, hệ thống hiện có và ràng buộc đang gây chậm.",
    image: "/images/company/company-culture-collaboration.jpg",
    alt: "Nhóm trao đổi tại bàn làm việc, minh hoạ yêu cầu tư vấn",
    metrics: [
      { value: "Bối cảnh", label: "vấn đề cần trao đổi" },
      { value: "Chuẩn bị", label: "thông tin liên quan" },
      { value: "Phản hồi", label: "bước tiếp theo" },
    ],
  },
  {
    label: "Phạm vi",
    title: "Từ ý tưởng đến quyết định nền tảng",
    description: "Bối cảnh vận hành giúp đội tư vấn phân loại yêu cầu phần mềm doanh nghiệp, AI, đám mây hoặc nền tảng phần mềm.",
    image: "/images/resources/saas-architecture.svg",
    alt: "Minh hoạ kiến trúc nền tảng phần mềm, gợi nhắc phạm vi tư vấn nền tảng",
    metrics: [
      { value: "Nhu cầu", label: "theo nhóm giải pháp" },
      { value: "Hệ thống", label: "đang sử dụng" },
      { value: "Ưu tiên", label: "theo giai đoạn" },
    ],
  },
  {
    label: "Bảo mật",
    title: "Thông tin được dùng đúng mục đích",
    description: "Bối cảnh vận hành cho bước tiếp nhận: chỉ giữ thông tin cần thiết để phản hồi yêu cầu.",
    image: "/images/resources/security-blueprint.svg",
    alt: "Minh hoạ bảo mật nền tảng, gợi nhắc luồng tiếp nhận thông tin có phân quyền",
    metrics: [
      { value: "Tối thiểu", label: "chỉ dùng để phản hồi" },
      { value: "Một mục đích", label: "phản hồi yêu cầu" },
      { value: "QTS", label: "đầu mối" },
    ],
  },
] satisfies ProofPointItem[];

export const legalProofPoints = [
  {
    label: "Doanh nghiệp",
    title: "Thông tin nhận diện rõ ràng",
    description: "Bề mặt pháp lý ưu tiên dữ liệu có thể kiểm tra: tên doanh nghiệp, ngày hoạt động, ngành chính và đầu mối liên hệ.",
    image: "/images/company/company-hero-open-office.jpg",
    alt: "Không gian văn phòng mở, minh hoạ thông tin doanh nghiệp QTS",
    metrics: [
      { value: "Tư vấn", label: "và phát triển phần mềm" },
      { value: "Hà Nội", label: "trụ sở" },
      { value: "Liên hệ", label: "qua trang liên hệ" },
    ],
  },
  {
    label: "Bảo mật",
    title: "Nguyên tắc dữ liệu tối thiểu",
    description: "Bối cảnh vận hành kiểm tra nội dung pháp lý: thu thập đúng mục đích, không bán thông tin và dùng để phản hồi yêu cầu.",
    image: "/images/resources/resource-glass-meeting.jpg",
    alt: "Phòng họp kính trong văn phòng, minh hoạ nguyên tắc bảo mật thông tin",
    metrics: [
      { value: "Tối thiểu", label: "theo mục đích" },
      { value: "Không bán", label: "dữ liệu liên hệ" },
      { value: "Minh bạch", label: "về sử dụng dữ liệu" },
    ],
  },
  {
    label: "Khả năng tiếp cận",
    title: "Khả năng tiếp cận là cam kết trải nghiệm",
    description: "Bối cảnh vận hành cho kiểm tra giao diện: cấu trúc ngữ nghĩa, bàn phím, trạng thái tập trung và giảm chuyển động.",
    image: "/images/resources/resource-open-office.jpg",
    alt: "Không gian làm việc mở, minh hoạ kiểm tra khả năng tiếp cận",
    metrics: [
      { value: "Trải nghiệm", label: "kiểm tra khả năng tiếp cận" },
      { value: "Bàn phím", label: "điều hướng đầy đủ" },
      { value: "Giảm chuyển động", label: "được tôn trọng" },
    ],
  },
] satisfies ProofPointItem[];

export const caseStudyProofPoints = [
  {
    label: "Luồng dữ liệu",
    title: "Luồng sản xuất, giao hàng và tài chính",
    description: "Bộ bối cảnh minh hoạ cho tình huống vận hành thể hiện cách dữ liệu rời rạc có thể trở thành tín hiệu vận hành chung.",
    image: "/images/resources/manufacturing-operations.svg",
    alt: "Minh hoạ luồng vận hành sản xuất, giao hàng và tài chính",
    metrics: [
      { value: "Kết nối", label: "sản xuất và tài chính" },
      { value: "Liên phòng ban", label: "cùng bối cảnh" },
      { value: "Chu kỳ", label: "báo cáo vận hành" },
    ],
  },
  {
    label: "Quyết định",
    title: "Ngoại lệ cần can thiệp sớm",
    description: "Bối cảnh vận hành cho bảng điều khiển: phân loại ngoại lệ, người phụ trách và tác động tới cam kết.",
    image: "/images/resources/ai-intelligence.svg",
    alt: "Minh hoạ tín hiệu AI và ngoại lệ cần can thiệp sớm",
    metrics: [
      { value: "Ngoại lệ", label: "cần can thiệp sớm" },
      { value: "Ưu tiên", label: "theo tác động" },
      { value: "Rủi ro", label: "cần can thiệp" },
    ],
  },
  {
    label: "Triển khai",
    title: "Triển khai theo từng phạm vi",
    description: "Bối cảnh vận hành cho lộ trình: khám phá, thiết kế, xây dựng và phát hành có kiểm soát.",
    image: "/images/resources/cloud-architecture.svg",
    alt: "Minh hoạ kiến trúc đám mây cho lộ trình triển khai nền tảng",
    metrics: [
      { value: "Triển khai", label: "theo giai đoạn" },
      { value: "Đối soát", label: "theo mốc" },
      { value: "Nền tảng", label: "kết nối chung" },
    ],
  },
] satisfies ProofPointItem[];

export const resourceCategoryProofPoints = {
  "case-studies": [
    resourceProofPoints[0],
    caseStudyProofPoints[0],
  ],
  "solutions-guides": [
    solutionProofPoints[1],
    platformProofPoints[1],
  ],
  "technology-insights": [
    landingProofPoints[1],
    platformProofPoints[2],
  ],
  "white-papers": [
    resourceProofPoints[1],
    legalProofPoints[1],
  ],
  "product-updates": [
    resourceProofPoints[2],
    platformProofPoints[1],
  ],
} satisfies Record<ResourceCategory, readonly ProofPointItem[]>;
