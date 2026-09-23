import type { ComponentType, SVGProps } from "react";
import { BuildingOffice2Icon, CursorArrowRaysIcon, GlobeAltIcon, HeartIcon, LightBulbIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export type IndustryWorkflowStep = {
  step: number;
  label: string;
  detail: string;
  sourceId: string;
};

export type IndustryOps = {
  slug: string;
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  image: string;
  imageAlt: string;
  challenge: string;
  solution: string;
  product: string;
  workflow: IndustryWorkflowStep[];
  metrics: { value: string; label: string }[];
  sourceIds: string[];
};

// Mỗi workflow bám một nguồn chính thức duy nhất, không bịa số liệu.
// Nguồn được định nghĩa trong lib/curated-sources.ts và render qua CuratedSourceList.

export const industryOperations: readonly IndustryOps[] = [
  {
    slug: "healthcare",
    name: "Y tế",
    icon: HeartIcon,
    image: "/images/industries/healthcare-clinic.jpg",
    imageAlt: "Đội ngũ y tế trao đổi hồ sơ — minh họa bối cảnh điều phối điểm bàn giao",
    challenge: "Luồng khám ngoại trú rời rạc khiến bệnh nhân phải xếp hàng, đăng ký thủ công và chờ kết quả cận lâm sàng kéo dài.",
    solution: "Mô hình Khoa Khám bệnh theo QĐ 1313/QĐ-BYT: tinh gọn 4 bước chuẩn, chuẩn hóa tiếp đón — khám — cận lâm sàng — thanh toán/lĩnh thuốc.",
    product: "Sổ khám điện tử, hàng đợi theo số, chỉ định CĐHA/XN/TDCN và quay lại kết luận trong cùng luồng.",
    workflow: [
      { step: 1, label: "Tiếp đón & lấy số", detail: "Lấy số thứ tự, xuất trình CCCD/BHYT, giấy chuyển tuyến", sourceId: "moh-1313" },
      { step: 2, label: "Đăng ký & vào khám", detail: "Nhập thông tin, in phiếu khám, đo sinh hiệu, vào buồng khám", sourceId: "moh-1313" },
      { step: 3, label: "Khám lâm sàng", detail: "Hỏi bệnh — thăm khám — chẩn đoán sơ bộ / kê đơn nếu không cần CLS", sourceId: "moh-1313" },
      { step: 4, label: "Cận lâm sàng (nếu có)", detail: "XN, CĐHA, TDCN; chờ & nhận kết quả", sourceId: "moh-1313" },
      { step: 5, label: "Kết luận & dặn dò", detail: "Bác sĩ kết luận, giải thích phác đồ, hẹn tái khám", sourceId: "moh-1313" },
      { step: 6, label: "Thanh toán & lĩnh thuốc", detail: "Thanh toán viện phí, nhận thuốc tại quầy — chỉ tiêu <2h (khám đơn) đến <4h (3 KT phối hợp)", sourceId: "moh-1313" },
    ],
    metrics: [
      { value: "<2h", label: "khám đơn thuần" },
      { value: "<4h", label: "3 kỹ thuật phối hợp" },
    ],
    sourceIds: ["moh-1313", "who-care-pathway"],
  },
  {
    slug: "manufacturing",
    name: "Sản xuất",
    icon: BuildingOffice2Icon,
    image: "/images/industries/manufacturing-line.jpg",
    imageAlt: "Xưởng sản xuất với dây chuyền và kết cấu thép — minh họa vận hành nhà máy",
    challenge: "Sản xuất thừa, chờ đợi và lỗi phát hiện muộn làm đội chi phí và trễ giao hàng.",
    solution: "Toyota Production System — 2 trụ cột Just-in-Time và Jidoka, loại bỏ lãng phí, dừng khi phát hiện bất thường.",
    product: "Kéo theo nhu cầu (pull), kanban, andon, poka-yoke và cải tiến liên tục trên dây chuyền.",
    workflow: [
      { step: 1, label: "Kế hoạch kéo (pull)", detail: "Chỉ sản xuất khi có nhu cầu thực từ công đoạn sau", sourceId: "toyota-tps" },
      { step: 2, label: "Just-in-Time", detail: "Cung ứng đúng thứ cần, đúng lúc, đúng lượng (what/when/amount needed)", sourceId: "toyota-tps" },
      { step: 3, label: "Sản xuất & Jidoka", detail: "Tự động dừng khi phát hiện bất thường — con người can thiệp ngay", sourceId: "toyota-tps" },
      { step: 4, label: "Kiểm soát chất lượng tại nguồn", detail: "Poka-yoke, andon, chuẩn hóa thao tác để không chuyền lỗi", sourceId: "toyota-tps" },
      { step: 5, label: "Kaizen & giao hàng", detail: "Cải tiến liên tục, đồng bộ sản xuất — tồn kho — giao hàng — tài chính", sourceId: "toyota-tps" },
    ],
    metrics: [
      { value: "JIT", label: "đúng lúc/đúng lượng" },
      { value: "Jidoka", label: "dừng khi lỗi" },
    ],
    sourceIds: ["toyota-tps"],
  },
  {
    slug: "finance",
    name: "Tài chính",
    icon: ShieldCheckIcon,
    image: "/images/industries/finance-operations.jpg",
    imageAlt: "Hạ tầng máy chủ — minh họa vận hành thanh toán và đối soát tài chính",
    challenge: "Lệnh thanh toán tách rời dễ tạo rủi ro tín dụng, thanh khoản và vận hành khi tiền — chứng khoán không chuyển giao đồng thời.",
    solution: "PFMI & quản trị rủi ro BIS: settlement finality trong ngày, PvP/DvP, netting, thế chấp và kiểm soát nội bộ.",
    product: "Đối soát intraday, điều kiện thanh toán cuối cùng và audit độc lập cho dòng tiền.",
    workflow: [
      { step: 1, label: "Khởi tạo & kiểm tra", detail: "Kiểm tra hạn mức, xác thực lệnh, tách bạch phê duyệt — ghi sổ", sourceId: "bis-pfmi" },
      { step: 2, label: "Clearing & netting", detail: "Bù trừ, thế chấp, giảm số lệnh phải thanh toán gộp", sourceId: "bis-pfmi" },
      { step: 3, label: "PvP / DvP", detail: "Chuyển giao đồng thời tiền — ngoại tệ/chứng khoán để triệt tiêu principal risk", sourceId: "bis-fx-settlement" },
      { step: 4, label: "Settlement finality", detail: "Tất toán cuối cùng bằng tiền NHTW, ưu tiên intraday/real-time, cuối ngày giá trị", sourceId: "bis-pfmi" },
      { step: 5, label: "Đối soát & kiểm soát", detail: "Đối soát intraday, giám sát thanh khoản, kiểm toán nội bộ độc lập", sourceId: "bis-bcbs-248" },
    ],
    metrics: [
      { value: "Intraday", label: "finality ưu tiên" },
      { value: "PvP", label: "triệt principal risk" },
    ],
    sourceIds: ["bis-pfmi", "bis-fx-settlement", "bis-bcbs-248"],
  },
  {
    slug: "retail",
    name: "Bán lẻ",
    icon: GlobeAltIcon,
    image: "/images/industries/retail-store.jpg",
    imageAlt: "Nhóm vận hành trao đổi trước bảng kế hoạch — minh họa điều phối đơn hàng bán lẻ",
    challenge: "Đơn hàng đa kênh, tồn kho phân mảnh và đổi/trả thủ công làm chậm giao và đội chi phí.",
    solution: "Shopify fulfillment: nhận đơn → gán vị trí tồn kho → picking/packing/shipping có tracking → đổi/trả & restock.",
    product: "Pick list, packing slip, tracking, return rules và self-serve returns cho khách.",
    workflow: [
      { step: 1, label: "Nhận & gán đơn", detail: "Đơn vào Shopify, gán kho/điểm fulfill theo tồn kho & routing", sourceId: "shopify-fulfillment" },
      { step: 2, label: "Picking & packing", detail: "Tạo pick list / packing slip, soạn hàng theo batch", sourceId: "shopify-fulfillment" },
      { step: 3, label: "Giao & tracking", detail: "In nhãn, bàn giao vận chuyển, khách theo dõi trạng thái", sourceId: "shopify-fulfillment" },
      { step: 4, label: "Thanh toán & đối soát", detail: "Capture payment, đối soát tồn kho — tài chính", sourceId: "shopify-fulfillment" },
      { step: 5, label: "Đổi/trả & restock", detail: "Tạo return, kiểm hàng, hoàn tiền/đổi hàng, nhập lại tồn kho", sourceId: "shopify-returns" },
    ],
    metrics: [
      { value: "Pick→Pack→Ship", label: "có tracking" },
      { value: "Restock", label: "khi trả hàng" },
    ],
    sourceIds: ["shopify-fulfillment", "shopify-returns"],
  },
  {
    slug: "education",
    name: "Giáo dục",
    icon: LightBulbIcon,
    image: "/images/industries/education-classroom.jpg",
    imageAlt: "Không gian học tập và làm việc nhóm — minh họa vòng đời người học",
    challenge: "Tuyển sinh — theo dõi chuyên cần — đánh giá tách rời khiến can thiệp muộn và thiếu bức tranh người học.",
    solution: "Vòng đời người học + UIS: chuẩn hóa enrolment/attendance, so sánh enrolment vs attendance thực qua SIS & khảo sát hộ gia đình.",
    product: "Hồ sơ người học xuyên suốt: tuyển sinh → đăng ký → chuyên cần → đánh giá → tốt nghiệp.",
    workflow: [
      { step: 1, label: "Tuyển sinh", detail: "Nộp hồ sơ, xét tuyển, offer & xác nhận nhập học", sourceId: "unesco-uis" },
      { step: 2, label: "Đăng ký/Ghi danh", detail: "Ghi danh vào SIS, phân lớp, intake & tạo student snapshot", sourceId: "unesco-uis" },
      { step: 3, label: "Chuyên cần", detail: "Điểm danh theo buổi; đối chiếu enrolment (sổ sách) vs attendance (khảo sát)", sourceId: "unesco-uis" },
      { step: 4, label: "Giảng dạy & đánh giá", detail: "Tín chỉ/học phần, kiểm tra — đánh giá — phản hồi", sourceId: "unesco-uis" },
      { step: 5, label: "Hoàn thành & chuyển tiếp", detail: "Tích lũy tín chỉ, tốt nghiệp, lưu vết hồ sơ cho báo cáo UIS", sourceId: "unesco-uis" },
    ],
    metrics: [
      { value: "Enrolment≠Attendance", label: "UIS lưu ý" },
      { value: "SIS", label: "handoff khi enrol" },
    ],
    sourceIds: ["unesco-uis"],
  },
  {
    slug: "logistics",
    name: "Logistics",
    icon: CursorArrowRaysIcon,
    image: "/images/industries/logistics-warehouse.jpg",
    imageAlt: "Kho vận với kiện hàng — minh họa vòng đời kiện hàng logistics",
    challenge: "Mỗi điểm bàn giao có thể trễ; thiếu scan và ngoại lệ không được bề mặt hóa kịp.",
    solution: "Vòng đời scan UPS: Label Created → In Transit → Out for Delivery → Delivered, kèm Exception scan khi gián đoạn.",
    product: "Pickup scan, departure/destination scan, bàn giao chặng cuối và xử lý ngoại lệ 1–7 ngày.",
    workflow: [
      { step: 1, label: "Label Created", detail: "Tạo nhãn, UPS nhận thông tin & cước — chưa scan kiện thực", sourceId: "ups-tracking" },
      { step: 2, label: "Shipped / In Transit", detail: "Scan vào mạng lưới, di chuyển giữa các hub (departure scan)", sourceId: "ups-tracking" },
      { step: 3, label: "Destination scan", detail: "Đến hub địa phương — cơ sở phân loại cuối trước khi giao", sourceId: "ups-tracking" },
      { step: 4, label: "Out for Delivery", detail: "Giao cho tài xế, giao trong ngày (thường 9h–19h)", sourceId: "ups-tracking" },
      { step: 5, label: "Delivered / Exception", detail: "Đã giao có timestamp; nếu Exception (địa chỉ/thời tiết/hải quan) → xử lý 1–7 ngày", sourceId: "ups-tracking" },
    ],
    metrics: [
      { value: "Scan/checkpoint", label: "mỗi chặng" },
      { value: "Exception", label: "bề mặt hóa ngay" },
    ],
    sourceIds: ["ups-tracking"],
  },
] as const;

export function getIndustryOps(slug: string) {
  return industryOperations.find((i) => i.slug === slug);
}
