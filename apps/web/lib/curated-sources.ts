export type CuratedSource = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  relevance: string;
};

export const curatedSources: CuratedSource[] = [
  {
    id: "ms-ia-principles",
    publisher: "Microsoft",
    title: "Information architecture principles",
    url: "https://learn.microsoft.com/en-us/sharepoint/information-architecture-principles",
    relevance: "Khung toàn cục/hub/cục bộ để tổ chức nội dung theo dịch vụ, sản phẩm và đối tượng.",
  },
  {
    id: "aws-architecture-center",
    publisher: "AWS",
    title: "AWS Architecture Center",
    url: "https://aws.amazon.com/architecture/",
    relevance: "Thư viện kiến trúc theo miền và ngành, dùng để đối chiếu cách trình bày giải pháp.",
  },
  {
    id: "aws-well-architected",
    publisher: "AWS",
    title: "AWS Well-Architected Framework",
    url: "https://aws.amazon.com/architecture/well-architected/",
    relevance: "Sáu trụ cột thiết kế hệ thống bền vững, dùng để cấu trúc tiêu chí đánh giá nền tảng.",
  },
  {
    id: "gcp-architecture-center",
    publisher: "Google Cloud",
    title: "Architecture Center",
    url: "https://docs.cloud.google.com/architecture",
    relevance: "Bộ sưu tập kiến trúc và hướng dẫn triển khai trên Google Cloud.",
  },
  {
    id: "gcp-architecture-framework",
    publisher: "Google Cloud",
    title: "Architecture Framework",
    url: "https://cloud.google.com/architecture/framework",
    relevance: "Khung đánh giá hệ thống theo nguyên tắc thiết kế, vận hành và tối ưu chi phí.",
  },
  {
    id: "salesforce-architects",
    publisher: "Salesforce",
    title: "Salesforce Architects",
    url: "https://architect.salesforce.com/",
    relevance: "Kho hướng dẫn kiến trúc, quyết định và mẫu triển khai cho hệ sinh thái Salesforce.",
  },
  {
    id: "salesforce-reference-diagrams",
    publisher: "Salesforce",
    title: "Solution Architecture Reference Diagrams",
    url: "https://architect.salesforce.com/docs/architect/reference-diagrams/guide/section-solution-architecture.html",
    relevance: "Sơ đồ kiến trúc kết nối miền giải pháp với các thành phần và vai trò liên quan.",
  },
  {
    id: "ibm-architecture-collection",
    publisher: "IBM",
    title: "Architecture Collection",
    url: "https://www.ibm.com/think/architectures",
    relevance: "Bộ sưu tập kiến trúc có thể triển khai và các mẫu vận hành theo ngành.",
  },
  {
    id: "ibm-architecture-patterns",
    publisher: "IBM",
    title: "Architecture Patterns",
    url: "https://www.ibm.com/think/architectures/patterns",
    relevance: "Mẫu kiến trúc tái sử dụng để mô tả luồng dữ liệu, tích hợp và vận hành.",
  },
  {
    id: "moh-1313",
    publisher: "Bộ Y tế Việt Nam",
    title: "Quyết định 1313/QĐ-BYT — Quy trình khám bệnh",
    url: "https://emohbackup.moh.gov.vn/publish/home?documentId=9218",
    relevance: "Văn bản Việt Nam về quy trình tại Khoa Khám bệnh: tiếp đón, khám/chẩn đoán, thanh toán và phát/lĩnh thuốc; có các nhánh cận lâm sàng và chỉ tiêu thời gian.",
  },
  {
    id: "moit-ip-2024",
    publisher: "Bộ Công Thương Việt Nam",
    title: "10 sự kiện nổi bật ngành Công Thương năm 2024",
    url: "https://moit.gov.vn/tin-tuc/hoat-dong/10-su-kien-noi-bat-nganh-cong-thuong-nam-2024.html",
    relevance: "Bối cảnh sản xuất công nghiệp Việt Nam năm 2024: IIP tăng 8,4%, công nghiệp chế biến, chế tạo tăng khoảng 9,6–9,7%.",
  },
  {
    id: "nso-q4-2024",
    publisher: "Tổng cục Thống kê Việt Nam",
    title: "Báo cáo tình hình kinh tế — xã hội quý IV và năm 2024",
    url: "https://www.nso.gov.vn/bai-top/2025/01/bao-cao-tinh-hinh-kinh-te-xa-hoi-quy-iv-va-nam-2024/",
    relevance: "Số liệu chính thức về IIP, vận tải và kho bãi Việt Nam năm 2024; dùng để đặt quy trình ngành trong bối cảnh quốc gia, không phải KPI của QTS.",
  },
  {
    id: "qdtg-2289-industry40",
    publisher: "Thủ tướng Chính phủ Việt Nam",
    title: "Quyết định 2289/QĐ-TTg — Chiến lược quốc gia về CMCN lần thứ tư",
    url: "https://vanban.chinhphu.vn/default.aspx?pageid=27160&docid=202228",
    relevance: "Khung chính sách Việt Nam đến năm 2030 về chủ động ứng dụng công nghệ mới và chuyển đổi sản xuất trong Cách mạng công nghiệp lần thứ tư.",
  },
  {
    id: "nhnn-810-cds",
    publisher: "Ngân hàng Nhà nước Việt Nam",
    title: "Quyết định 810/QĐ-NHNN — Kế hoạch chuyển đổi số ngành Ngân hàng",
    url: "https://www.sbv.gov.vn/vi/tra-cuu-van-ban-hanh-chinh",
    relevance: "Kế hoạch chuyển đổi số ngành Ngân hàng đến năm 2025, định hướng đến năm 2030; tra cứu theo số 810/QĐ-NHNN ngày 11/05/2021.",
  },
  {
    id: "sbv-cashless-2024",
    publisher: "Ngân hàng Nhà nước Việt Nam",
    title: "Tăng cường an ninh, an toàn trong thanh toán không dùng tiền mặt",
    url: "https://www.sbv.gov.vn/vi/web/sbv_portal/w/sbv602814",
    relevance: "Bài viết ngày 18/06/2024 ghi nhận 99% giao dịch nộp thuế không tiền mặt, hơn 182 triệu tài khoản cá nhân cuối 2023 và 4,9 tỷ giao dịch trực tuyến trong 4 tháng đầu 2024.",
  },
  {
    id: "moit-ecom-whitebook-2023",
    publisher: "Cục Thương mại điện tử và Kinh tế số — Bộ Công Thương",
    title: "Kho tài liệu Thương mại điện tử Việt Nam",
    url: "https://www.idea.gov.vn/?page=document",
    relevance: "Kho ấn phẩm chính thức, có Thương mại điện tử Việt Nam 2023 (25/07/2023); dùng để đặt bối cảnh đơn hàng, hoàn tất và giao hàng chặng cuối tại Việt Nam.",
  },
  {
    id: "moit-ecom-2024",
    publisher: "Bộ Công Thương Việt Nam",
    title: "Thương mại điện tử Việt Nam năm 2024: Những bước tiến và thách thức",
    url: "https://moit.gov.vn/khoa-hoc-va-cong-nghe/thuong-mai-dien-tu-viet-nam-nam-2024-nhung-buoc-tien-va-thach-thuc.html",
    relevance: "Bối cảnh bán lẻ số Việt Nam 2024: quy mô thị trường trên 25 tỷ USD, tăng khoảng 20% so với năm 2023 và chiếm khoảng 9% tổng mức bán lẻ hàng hóa, dịch vụ tiêu dùng.",
  },
  {
    id: "vecom-ebi-2024",
    publisher: "Hiệp hội Thương mại điện tử Việt Nam",
    title: "Báo cáo Chỉ số Thương mại điện tử Việt Nam 2024",
    url: "https://vecom.vn/bao-cao-chi-so-thuong-mai-dien-tu-viet-nam-ebi-2024",
    relevance: "Báo cáo EBI 2024 có phần về hoàn tất đơn hàng và giao hàng chặng cuối; dùng làm nguồn ngành Việt Nam bổ trợ cho quy trình bán lẻ.",
  },
  {
    id: "moet-csdl-5668",
    publisher: "Bộ Giáo dục và Đào tạo Việt Nam",
    title: "Công văn 5668/BGDĐT-CNTT — Báo cáo thống kê giáo dục",
    url: "https://csdl.moet.gov.vn/cong-van-so-5668-bgddt-cntt-ngay-23-thang-9-nam-2024-ve-don-doc-nop-bao-cao-thong-ke-nam-hoc-2023-2024-va-trien-khai-bao-cao-thong-ke-ky-dau-nam-hoc-2024-2025-79.htm",
    relevance: "Quy trình báo cáo thống kê trên Cơ sở dữ liệu ngành Giáo dục cho năm học 2023–2024 và kỳ đầu năm học 2024–2025.",
  },
  {
    id: "moit-logistics-10-2024",
    publisher: "Bộ Công Thương Việt Nam",
    title: "10 sự kiện logistics Việt Nam năm 2024",
    url: "https://moit.gov.vn/tin-tuc/hoat-dong/10-su-kien-logistics-viet-nam-nam-2024.html",
    relevance: "Bối cảnh logistics Việt Nam: cảng Cái Mép theo cơ chế cảng mở, Công viên Logistics Viettel, WMS/TMS, logistics xanh và kết nối hạ tầng.",
  },
  {
    id: "who-care-pathway",
    publisher: "WHO",
    title: "COVID-19 Clinical Care Pathway (CARE)",
    url: "https://www.who.int/publications/m/item/covid-19-clinical-care-pathway-(care)-confirm-assess-respond-evaluate",
    relevance: "Khung CARE để xác nhận, đánh giá, đáp ứng và đánh giá lại trong lập kế hoạch chăm sóc lâm sàng; chỉ dùng làm nguồn bổ trợ.",
  },
  {
    id: "toyota-tps",
    publisher: "Toyota Global",
    title: "Toyota Production System",
    url: "https://www.toyota-global.com/company/history_of_toyota/75years/data/automotive_business/production/system/index.html",
    relevance: "Hai trụ cột Just-in-Time và Jidoka: đúng thứ cần, đúng lúc, đúng lượng; dừng khi phát hiện bất thường.",
  },
  {
    id: "bis-pfmi",
    publisher: "BIS / CPMI-IOSCO",
    title: "Principles for Financial Market Infrastructures",
    url: "https://www.bis.org/committees/cpmi/pfmi/overview.htm",
    relevance: "Nguyên tắc về settlement finality, tiền thanh toán, rủi ro tín dụng và thanh khoản trong hạ tầng tài chính.",
  },
  {
    id: "bis-fx-settlement",
    publisher: "BIS / Basel Committee",
    title: "Foreign exchange settlement risk",
    url: "https://www.bis.org/publ/bcbs241.htm",
    relevance: "Khung kiểm soát rủi ro thanh toán ngoại hối: PvP, netting, collateral và giảm principal risk.",
  },
  {
    id: "bis-bcbs-248",
    publisher: "BIS / Basel Committee",
    title: "Basel Core Principle 26 — Internal control and audit",
    url: "https://www.bis.org/committees/bcbs/publ_248.htm",
    relevance: "Kiểm soát nội bộ, phân tách phê duyệt — ghi sổ, đối soát tài sản và kiểm toán độc lập.",
  },
  {
    id: "shopify-fulfillment",
    publisher: "Shopify Help Center",
    title: "Fulfilling orders",
    url: "https://help.shopify.com/en/manual/fulfillment/fulfilling-orders",
    relevance: "Luồng thực tế từ chuẩn bị, picking, packing đến shipping; hỗ trợ fulfillment đơn, hàng loạt và theo batch.",
  },
  {
    id: "shopify-returns",
    publisher: "Shopify Help Center",
    title: "Processing and managing returns",
    url: "https://help.shopify.com/en/manual/fulfillment/managing-orders/returns/processing-returns",
    relevance: "Kiểm hàng trả, nhập lại tồn kho, hoàn tiền, thu thêm tiền và hoàn tất đổi hàng.",
  },
  {
    id: "unesco-uis",
    publisher: "UNESCO Institute for Statistics",
    title: "Education data and enrolment/attendance indicators",
    url: "https://uis.unesco.org/en/topic/education-data",
    relevance: "Nguồn dữ liệu giáo dục quốc tế; phân biệt enrolment với attendance và theo dõi chỉ số người học.",
  },
  {
    id: "ups-tracking",
    publisher: "UPS",
    title: "Understanding Tracking Status",
    url: "https://www.ups.com/us/en/support/tracking-support/where-is-my-package/understanding-tracking-status.page",
    relevance: "Định nghĩa trạng thái Label Created, Shipped/On the Way, Out for Delivery, Delivered và Exception theo scan.",
  },
];

const sourceMap = new Map(curatedSources.map((s) => [s.id, s] as const));

export function getCuratedSource(id: string): CuratedSource | undefined {
  return sourceMap.get(id);
}

export function getCuratedSources(ids: string[]): CuratedSource[] {
  return ids.map((id) => sourceMap.get(id)).filter(Boolean) as CuratedSource[];
}
