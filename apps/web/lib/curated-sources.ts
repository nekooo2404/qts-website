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
    relevance: "Thư viện kiến trúc tham khảo theo miền và ngành, dùng để đối chiếu cách trình bày giải pháp.",
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
    relevance: "Bộ sưu tập kiến trúc tham khảo và hướng dẫn triển khai trên Google Cloud.",
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
    relevance: "Sơ đồ tham khảo kết nối miền giải pháp với các thành phần và vai trò liên quan.",
  },
  {
    id: "ibm-architecture-collection",
    publisher: "IBM",
    title: "Architecture Collection",
    url: "https://www.ibm.com/think/architectures",
    relevance: "Bộ sưu tập kiến trúc có thể triển khai và mô hình tham khảo theo ngành.",
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
    url: "https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Quyet-dinh-1313-QD-BYT-nam-2013-huong-dan-quy-trinh-kham-benh-tai-khoa-kham-benh-cua-benh-vien-183523.aspx",
    relevance: "Quy trình chính thức tại Khoa Khám bệnh: tiếp đón, khám/chẩn đoán, thanh toán và phát/lĩnh thuốc; có các nhánh cận lâm sàng.",
  },
  {
    id: "who-care-pathway",
    publisher: "WHO",
    title: "COVID-19 Clinical Care Pathway (CARE)",
    url: "https://www.who.int/publications/m/item/covid-19-clinical-care-pathway-(care)-confirm-assess-respond-evaluate",
    relevance: "Khung CARE để xác nhận, đánh giá, đáp ứng và đánh giá lại trong lập kế hoạch chăm sóc lâm sàng.",
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
