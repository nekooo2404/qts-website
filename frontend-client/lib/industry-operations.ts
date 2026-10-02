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
    challenge: "Luồng khám ngoại trú phải điều phối tiếp đón, khám, cận lâm sàng, thanh toán và lĩnh thuốc trong cùng một quy trình bệnh viện Việt Nam.",
    solution: "Quy trình Khoa Khám bệnh theo Quyết định 1313/QĐ-BYT: tiếp đón → khám lâm sàng và chẩn đoán → thanh toán viện phí → phát/lĩnh thuốc, có nhánh cận lâm sàng.",
    product: "Sổ khám điện tử, hàng đợi theo số, chỉ định xét nghiệm/CĐHA/TDCN và trả kết quả về đúng hồ sơ trong cùng luồng.",
    workflow: [
      { step: 1, label: "Tiếp đón & lấy số", detail: "Lấy số thứ tự, xuất trình CCCD/BHYT, giấy chuyển tuyến", sourceId: "moh-1313" },
      { step: 2, label: "Đăng ký & vào khám", detail: "Nhập thông tin, in phiếu khám, đo sinh hiệu, vào buồng khám", sourceId: "moh-1313" },
      { step: 3, label: "Khám lâm sàng", detail: "Hỏi bệnh — thăm khám — chẩn đoán sơ bộ / kê đơn nếu không cần CLS", sourceId: "moh-1313" },
      { step: 4, label: "Cận lâm sàng (nếu có)", detail: "XN, CĐHA, TDCN; chờ & nhận kết quả", sourceId: "moh-1313" },
      { step: 5, label: "Kết luận & dặn dò", detail: "Bác sĩ kết luận, giải thích phác đồ, hẹn tái khám", sourceId: "moh-1313" },
      { step: 6, label: "Thanh toán & lĩnh thuốc", detail: "Thanh toán viện phí, nhận thuốc tại quầy — chỉ tiêu <2h (khám đơn) đến <4h (3 KT phối hợp)", sourceId: "moh-1313" },
    ],
    metrics: [
      { value: "<2h", label: "khám đơn thuần · QĐ 1313" },
      { value: "<4h", label: "3 kỹ thuật CLS · QĐ 1313" },
    ],
    sourceIds: ["moh-1313"],
  },
  {
    slug: "manufacturing",
    name: "Sản xuất",
    icon: BuildingOffice2Icon,
    image: "/images/industries/manufacturing-line.jpg",
    imageAlt: "Xưởng sản xuất với dây chuyền và kết cấu thép — minh họa vận hành nhà máy",
    challenge: "Nhà máy Việt Nam vừa phải duy trì sản lượng, vừa nâng năng lực chế biến, chế tạo và kết nối dữ liệu máy — xưởng — tồn kho — tài chính.",
    solution: "Bối cảnh sản xuất Việt Nam 2024: IIP tăng 8,4%, chế biến, chế tạo tăng khoảng 9,6–9,7%; Quyết định 2289/QĐ-TTg đặt hướng ứng dụng công nghệ mới của CMCN lần thứ tư.",
    product: "Theo dõi trạng thái máy và lệnh sản xuất, cảnh báo chất lượng, đối soát tồn kho — giao hàng — tài chính theo từng ca.",
    workflow: [
      { step: 1, label: "Kết nối máy — xưởng", detail: "Thu nhận trạng thái thiết bị, lệnh sản xuất và dữ liệu ca từ các điểm trong nhà máy", sourceId: "qdtg-2289-industry40" },
      { step: 2, label: "Sản xuất & chất lượng", detail: "Ghi nhận sản lượng, kiểm tra chất lượng tại nguồn và mở ngoại lệ khi có bất thường", sourceId: "moit-ip-2024" },
      { step: 3, label: "Điều phối theo nhu cầu", detail: "Lập kế hoạch theo đơn hàng, năng lực và tồn kho thay vì báo cáo tách rời", sourceId: "qdtg-2289-industry40" },
      { step: 4, label: "Đối soát liên phòng ban", detail: "Nối sản xuất, tồn kho, giao hàng và tài chính trên cùng một trạng thái vận hành", sourceId: "nso-q4-2024" },
      { step: 5, label: "Báo cáo ngành", detail: "Theo dõi chỉ số sản xuất và bối cảnh tăng trưởng chế biến, chế tạo của Việt Nam", sourceId: "moit-ip-2024" },
    ],
    metrics: [
      { value: "+8,4%", label: "IIP Việt Nam 2024 · MOIT/NSO" },
      { value: "+9,6%", label: "chế biến, chế tạo · NSO" },
    ],
    sourceIds: ["moit-ip-2024", "qdtg-2289-industry40", "nso-q4-2024"],
  },
  {
    slug: "finance",
    name: "Tài chính",
    icon: ShieldCheckIcon,
    image: "/images/industries/finance-operations.jpg",
    imageAlt: "Hạ tầng máy chủ — minh họa vận hành thanh toán và đối soát tài chính",
    challenge: "Vận hành thanh toán và đối soát phải chạy trên nền giao dịch số quy mô lớn và trong khung tuân thủ do NHNN đặt ra.",
    solution: "Kế hoạch chuyển đổi số ngành Ngân hàng 810/QĐ-NHNN (đến 2025, định hướng 2030) cùng thực tiễn thanh toán không dùng tiền mặt tại Việt Nam (99% giao dịch nộp thuế không tiền mặt, hơn 182 triệu tài khoản, khoảng 4,9 tỷ giao dịch trực tuyến trong 4 tháng đầu 2024).",
    product: "eKYC, tách bạch phê duyệt — ghi sổ, kênh thanh toán QR/thẻ/chuyển khoản, đối soát intraday và truy vết kiểm toán.",
    workflow: [
      { step: 1, label: "Khởi tạo & xác thực", detail: "eKYC, kiểm tra hạn mức và xác thực lệnh theo phân quyền", sourceId: "nhnn-810-cds" },
      { step: 2, label: "Phê duyệt & ghi sổ", detail: "Tách bạch phê duyệt — ghi sổ, ghi nhận bút toán và nghĩa vụ thanh toán", sourceId: "nhnn-810-cds" },
      { step: 3, label: "Thanh toán số & đối soát", detail: "Thực hiện qua QR/thẻ/chuyển khoản và đối soát intraday theo kênh số", sourceId: "sbv-cashless-2024" },
      { step: 4, label: "Quản trị rủi ro & tuân thủ", detail: "Áp khung kiểm soát, đối soát tài sản và quy định thanh toán không dùng tiền mặt", sourceId: "nhnn-810-cds" },
      { step: 5, label: "Truy vết & kiểm toán", detail: "Lưu vết đầy đủ lệnh, bút toán và phê duyệt để kiểm tra nội bộ và kiểm toán", sourceId: "sbv-cashless-2024" },
    ],
    metrics: [
      { value: "99%", label: "giao dịch nộp thuế không tiền mặt · SBV" },
      { value: "4,9 tỷ", label: "GD trực tuyến 4T/2024 · SBV" },
    ],
    sourceIds: ["nhnn-810-cds", "sbv-cashless-2024"],
  },
  {
    slug: "retail",
    name: "Bán lẻ",
    icon: GlobeAltIcon,
    image: "/images/industries/retail-store.jpg",
    imageAlt: "Nhóm vận hành trao đổi trước bảng kế hoạch — minh họa điều phối đơn hàng bán lẻ",
    challenge: "Bán lẻ số tại Việt Nam xử lý khối lượng đơn hàng và yêu cầu giao — đổi/trả chặng cuối ngày càng tăng.",
    solution: "Bối cảnh thương mại điện tử Việt Nam: thị trường năm 2024 trên 25 tỷ USD, tăng khoảng 20% và chiếm khoảng 9% tổng mức bán lẻ hàng hóa, dịch vụ tiêu dùng; báo cáo EBI 2024 ghi nhận giao hàng chặng cuối và hoàn tất đơn hàng là năng lực then chốt.",
    product: "Nhận đơn, phân bổ tồn kho/kho theo kênh, soạn — đóng gói — giao có mã theo dõi, thanh toán và đối soát, xử lý đổi/trả.",
    workflow: [
      { step: 1, label: "Nhận & phân bổ đơn", detail: "Đơn từ TMĐT được ghi nhận, phân kho và gán điểm hoàn tất theo tồn kho", sourceId: "moit-ecom-2024" },
      { step: 2, label: "Soạn & đóng gói", detail: "Tạo phiếu soạn hàng, đóng gói theo lô và in nhãn vận chuyển", sourceId: "vecom-ebi-2024" },
      { step: 3, label: "Giao chặng cuối", detail: "Bàn giao cho đơn vị vận chuyển, cấp mã theo dõi và cập nhật trạng thái", sourceId: "moit-logistics-10-2024" },
      { step: 4, label: "Thanh toán & đối soát", detail: "Ghi nhận thanh toán, đối soát tồn kho — tài chính theo kênh bán", sourceId: "moit-ecom-2024" },
      { step: 5, label: "Đổi/trả & bổ sung tồn", detail: "Tiếp nhận yêu cầu đổi/trả, kiểm hàng, hoàn tiền/đổi hàng và bổ sung tồn kho", sourceId: "vecom-ebi-2024" },
    ],
    metrics: [
      { value: ">25 tỷ USD", label: "TMĐT 2024 · MOIT" },
      { value: "9%", label: "tỷ trọng bán lẻ · MOIT" },
    ],
    sourceIds: ["moit-ecom-2024", "vecom-ebi-2024", "moit-logistics-10-2024"],
  },
  {
    slug: "education",
    name: "Giáo dục",
    icon: LightBulbIcon,
    image: "/images/industries/education-classroom.jpg",
    imageAlt: "Không gian học tập và làm việc nhóm — minh họa vòng đời người học",
    challenge: "Nhà trường phải duy trì hồ sơ người học và báo cáo thống kê theo kỳ trên hệ thống dữ liệu ngành, từ tuyển sinh đến kết quả học tập.",
    solution: "Cơ sở dữ liệu ngành Giáo dục và Đào tạo của Bộ GD&ĐT kết nối các cấp mầm non, phổ thông và hệ thống báo cáo; Công văn 5668/BGDĐT-CNTT triển khai báo cáo năm học 2023–2024 và kỳ đầu 2024–2025.",
    product: "Hồ sơ người học theo vòng đời, điểm danh/chuyên cần, đánh giá và bộ báo cáo thống kê theo kỳ trên dữ liệu phân quyền.",
    workflow: [
      { step: 1, label: "Tuyển sinh & nhập học", detail: "Tiếp nhận hồ sơ, xét tuyển và ghi nhận xác nhận nhập học theo đơn vị", sourceId: "moet-csdl-5668" },
      { step: 2, label: "Ghi danh trên CSDL ngành", detail: "Đồng bộ lớp, người học và đơn vị trường trên hệ thống dữ liệu giáo dục", sourceId: "moet-csdl-5668" },
      { step: 3, label: "Điểm danh & chuyên cần", detail: "Ghi nhận tình trạng học tập theo buổi/lớp để giáo viên và nhà trường theo dõi", sourceId: "moet-csdl-5668" },
      { step: 4, label: "Dạy học & đánh giá", detail: "Cập nhật kết quả học tập, rèn luyện và các trạng thái của người học", sourceId: "moet-csdl-5668" },
      { step: 5, label: "Báo cáo theo kỳ", detail: "Nộp báo cáo thống kê năm học 2023–2024 và kỳ đầu 2024–2025 qua CSDL ngành", sourceId: "moet-csdl-5668" },
    ],
    metrics: [
      { value: "CSDL ngành", label: "mầm non → phổ thông · Bộ GD&ĐT" },
      { value: "2023–2025", label: "các kỳ báo cáo giáo dục" },
    ],
    sourceIds: ["moet-csdl-5668"],
  },
  {
    slug: "logistics",
    name: "Logistics",
    icon: CursorArrowRaysIcon,
    image: "/images/industries/logistics-warehouse.jpg",
    imageAlt: "Kho vận với kiện hàng — minh họa vòng đời kiện hàng logistics",
    challenge: "Mạng lưới Việt Nam phải điều phối kho, cảng, đường bộ, chặng cuối và ngoại lệ trong một ngành vận tải — kho bãi đang tăng trưởng nhanh.",
    solution: "Bối cảnh logistics Việt Nam 2024: vận tải — kho bãi tăng 10,82%; Bộ Công Thương ghi nhận cơ chế cảng mở tại Cái Mép, Công viên Logistics Viettel với WMS/TMS/Digital Twin và hướng logistics xanh.",
    product: "Quản lý vận đơn, trạng thái kho — hub — chặng cuối, tích hợp WMS/TMS và bề mặt ngoại lệ để đối soát giao nhận.",
    workflow: [
      { step: 1, label: "Tạo vận đơn", detail: "Ghi nhận lô hàng, người gửi/nhận, tuyến, điểm lấy và điều kiện giao", sourceId: "moit-logistics-10-2024" },
      { step: 2, label: "Nhập mạng lưới & phân loại", detail: "Đưa hàng vào kho/hub, quét kiện và phân loại theo tuyến, cảng hoặc điểm trung chuyển", sourceId: "moit-logistics-10-2024" },
      { step: 3, label: "Trung chuyển & vận tải", detail: "Theo dõi hành trình qua các điểm kết nối cảng, kho, đường bộ và mạng lưới vận tải", sourceId: "nso-q4-2024" },
      { step: 4, label: "Giao chặng cuối", detail: "Bàn giao tới người nhận, cập nhật trạng thái giao và thời điểm hoàn tất", sourceId: "moit-logistics-10-2024" },
      { step: 5, label: "Ngoại lệ & đối soát", detail: "Mở xử lý khi chậm, sai tuyến, thiếu scan hoặc không giao được; đối soát sau chặng", sourceId: "nso-q4-2024" },
    ],
    metrics: [
      { value: "+10,82%", label: "vận tải, kho bãi 2024 · NSO" },
      { value: "2,67 tỷ tấn", label: "hàng hóa vận chuyển · NSO" },
    ],
    sourceIds: ["moit-logistics-10-2024", "nso-q4-2024"],
  },
] as const;

export function getIndustryOps(slug: string) {
  return industryOperations.find((i) => i.slug === slug);
}
