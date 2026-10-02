import { buildMetadata, landingPageJsonLd } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import MarketingShell from "@/components/marketing/MarketingShell";
import HomeExperience from "@/components/marketing/HomeExperience";
import PlatformExplorer from "@/components/marketing/PlatformExplorer";
import SolutionsBento from "@/components/marketing/SolutionsBento";
import CallToAction from "@/components/marketing/CallToAction";
import LandingFAQ from "@/components/marketing/LandingFAQ";
import Reveal from "@/components/marketing/Reveal";

export const metadata = buildMetadata({
  title: "QTS - Nền tảng vận hành doanh nghiệp, Portal, HRM và Identity",
  description: "QTS kết nối Portal, HRM, Identity, workflow, tài liệu và báo cáo trong một hệ sinh thái doanh nghiệp bảo mật, có khả năng mở rộng.",
  path: "/",
  keywords: [
    "QTS",
    "nền tảng doanh nghiệp",
    "phần mềm doanh nghiệp",
    "HRM",
    "SSO",
    "Identity",
    "workflow",
    "portal doanh nghiệp",
  ],
});

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const problems: Array<{ label: string; title: string; copy: string }> = [
  {
    label: "Dữ liệu",
    title: "Dữ liệu nằm ở nhiều nơi",
    copy: "Nhân sự, tài liệu, phê duyệt và báo cáo tách rời khiến đội ngũ mất thời gian đối soát trước khi ra quyết định.",
  },
  {
    label: "Quy trình",
    title: "Quy trình phụ thuộc vào con người",
    copy: "Yêu cầu, trạng thái và trách nhiệm dễ bị trôi khi công việc đi qua email, chat và nhiều bảng tính riêng lẻ.",
  },
  {
    label: "Quyền truy cập",
    title: "Phân quyền khó kiểm soát",
    copy: "Khi số lượng ứng dụng tăng lên, doanh nghiệp cần một lớp định danh và quyền truy cập nhất quán hơn.",
  },
];

const outcomes: Array<{ title: string; copy: string; icon: IconComponent }> = [
  {
    title: "Một điểm vào chung",
    copy: "Người dùng truy cập Portal, chọn phần mềm được cấp quyền và tiếp tục công việc trong đúng bối cảnh.",
    icon: PuzzlePieceIcon,
  },
  {
    title: "Quy trình có thể theo dõi",
    copy: "Trạng thái, phê duyệt và trách nhiệm được đặt trong luồng việc để giảm điểm mù vận hành.",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: "Dữ liệu phục vụ quyết định",
    copy: "Báo cáo và tín hiệu quan trọng được tổng hợp từ các phần mềm liên quan thay vì gom thủ công.",
    icon: SparklesIcon,
  },
  {
    title: "An toàn khi mở rộng",
    copy: "Identity, vai trò và phạm vi truy cập được xem là nền móng, không phải phần bổ sung về sau.",
    icon: ShieldCheckIcon,
  },
];

const readiness: Array<{ title: string; copy: string; icon: IconComponent }> = [
  {
    title: "Bảo mật từ kiến trúc",
    copy: "Định danh, phiên truy cập và phân quyền được thiết kế như một lớp nền dùng chung cho hệ sinh thái.",
    icon: LockClosedIcon,
  },
  {
    title: "Tích hợp có kiểm soát",
    copy: "QTS ưu tiên ranh giới dữ liệu rõ ràng, API có chủ đích và khả năng kết nối với hệ thống đang vận hành.",
    icon: PuzzlePieceIcon,
  },
  {
    title: "Triển khai theo giai đoạn",
    copy: "Bắt đầu từ bài toán quan trọng nhất, sau đó mở rộng theo phòng ban, quy trình và mức độ sẵn sàng.",
    icon: Cog6ToothIcon,
  },
  {
    title: "Bàn giao để vận hành lâu dài",
    copy: "Tài liệu, quy trình hỗ trợ và nguyên tắc quản trị giúp đội ngũ nội bộ tiếp tục phát triển hệ thống.",
    icon: CheckCircleIcon,
  },
];

const processSteps = [
  {
    title: "Làm rõ bối cảnh",
    copy: "Xác định mục tiêu, người dùng, dữ liệu, ràng buộc bảo mật và hệ thống liên quan.",
  },
  {
    title: "Thiết kế nền tảng",
    copy: "Định nghĩa luồng người dùng, mô hình quyền, điểm tích hợp và trải nghiệm sản phẩm.",
  },
  {
    title: "Triển khai theo lát cắt",
    copy: "Xây dựng những phần tạo giá trị sớm nhất, kiểm thử cùng người dùng và giảm rủi ro phát hành.",
  },
  {
    title: "Vận hành và mở rộng",
    copy: "Theo dõi sử dụng thực tế, tối ưu quy trình và mở thêm phân hệ khi doanh nghiệp sẵn sàng.",
  },
] as const;

export default function Page() {
  return <MarketingShell>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(landingPageJsonLd()).replace(/</g, "\\u003c") }}
    />
    <HomeExperience />
    <section className="section landing-problems" aria-labelledby="landing-problems-title">
      <div className="container">
        <Reveal><div className="section-heading">
          <h2 id="landing-problems-title">Doanh nghiệp thường chậm lại ở những điểm bàn giao.</h2>
          <p>QTS bắt đầu từ các điểm nghẽn đang làm dữ liệu, trách nhiệm và quyết định bị phân tán trong vận hành hằng ngày.</p>
        </div></Reveal>
        <div className="landing-context-panel" aria-label="Bản minh họa các điểm nghẽn vận hành">
          <div className="landing-context-header">
            <b>Điểm nghẽn vận hành</b>
            <small>Ba nhóm vấn đề vận hành</small>
          </div>
          <div className="landing-problem-grid">
            {problems.map((problem, index) => (
              <Reveal delay={index * 0.08} key={problem.title}>
                <article className="landing-problem-card">
                  <span>{problem.label}</span>
                  <div>
                    <h3>{problem.title}</h3>
                    <p>{problem.copy}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
    <section className="section landing-outcomes" aria-labelledby="landing-outcomes-title">
      <div className="container">
        <Reveal><div className="section-heading">
          <h2 id="landing-outcomes-title">Kết quả cần thấy là một hệ thống dễ hiểu hơn.</h2>
          <p>Mỗi phần mềm, quy trình và báo cáo nên cùng phục vụ một mục tiêu vận hành chung, không tạo thêm lớp phức tạp cho đội ngũ.</p>
        </div></Reveal>
        <div className="landing-outcome-grid">
          {outcomes.map(({ title, copy, icon: OutcomeIcon }, index) => (
            <Reveal delay={index * 0.06} key={title}>
              <article className="landing-outcome-card">
                <i><OutcomeIcon /></i>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
    <section className="section landing-platform" aria-labelledby="landing-platform-title">
      <div className="container">
        <Reveal><div className="section-heading">
          <h2 id="landing-platform-title">Nền tảng hoạt động như một lớp kết nối chung.</h2>
          <p>QTS kết nối Portal, Identity, HRM, workflow, tài liệu và báo cáo trên một lõi có thể mở rộng theo từng giai đoạn.</p>
        </div></Reveal>
        <Reveal delay={0.1}><PlatformExplorer /></Reveal>
      </div>
    </section>
    <section className="section landing-solutions" aria-labelledby="landing-solutions-title">
      <div className="container">
        <Reveal><div className="section-heading">
          <h2 id="landing-solutions-title">Giải pháp được chia theo mục tiêu của từng phòng ban.</h2>
          <p>Doanh nghiệp có thể bắt đầu từ HRM, Portal, tài liệu, phê duyệt hoặc báo cáo, rồi mở rộng khi mô hình vận hành rõ hơn.</p>
        </div></Reveal>
        <Reveal delay={0.1}><SolutionsBento /></Reveal>
        <Reveal delay={0.15}><div className="section-actions"><Link href="/contact" className="btn btn-primary">Trao đổi <ArrowRightIcon width={15} /></Link><Link href="/solutions" className="btn btn-light">Xem giải pháp</Link></div></Reveal>
      </div>
    </section>
    <section className="section case-study" aria-labelledby="landing-case-title">
      <div className="container case-grid">
        <Reveal><div>
          <h2 id="landing-case-title" className="display case-study-heading">Từ dữ liệu phân tán đến một góc nhìn vận hành chung.</h2>
          <p className="case-copy">Mô hình này minh hoạ cách QTS tiếp cận một bài toán thường gặp khi nhiều bộ phận cùng tham gia một quy trình nhưng dữ liệu chưa liền mạch.</p>
          <div className="case-steps">
            <div className="case-step"><small>Hiện trạng</small><h3>Nhiều công cụ, nhiều điểm bàn giao</h3><p>Dữ liệu và trạng thái công việc được đối soát qua các hệ thống khác nhau.</p></div>
            <div className="case-step"><small>Cách tiếp cận</small><h3>Nền tảng kết nối theo vai trò</h3><p>Quy trình, dữ liệu và quyền truy cập được thiết kế thành một bối cảnh có thể kiểm tra.</p></div>
            <div className="case-step"><small>Mục tiêu</small><h3>Nhận diện tín hiệu để chủ động điều phối</h3><p>Đội ngũ có thêm bối cảnh để thảo luận và quyết định trong đúng luồng việc.</p></div>
          </div>
        </div></Reveal>
        <Reveal delay={0.15}><figure className="case-photo">
          <Image src="/images/home/industrial-operations.jpg" alt="Không gian vận hành công nghiệp với hệ thống máy móc và kết cấu thép" fill sizes="(max-width: 700px) calc(100vw - 32px), 50vw" />
          <figcaption><span>Mô hình minh hoạ</span><strong>Vận hành có bối cảnh chung</strong><small>Hình ảnh chỉ dùng để minh hoạ bối cảnh sản xuất.</small></figcaption>
        </figure></Reveal>
      </div>
    </section>
    <section className="section landing-readiness" aria-labelledby="landing-readiness-title">
      <div className="container">
        <Reveal><div className="section-heading">
          <h2 id="landing-readiness-title">Vì sao QTS phù hợp với hệ thống doanh nghiệp.</h2>
          <p>Các quyết định thiết kế đều hướng tới khả năng quản trị lâu dài: bảo mật, tích hợp, triển khai và bàn giao rõ ràng.</p>
        </div></Reveal>
        <div className="company-points company-points-foundation">
          {readiness.map(({ title, copy, icon: ReadinessIcon }, index) => (
            <Reveal delay={index * 0.08} key={title}>
              <div className="company-point"><i><ReadinessIcon /></i><h3>{title}</h3><p>{copy}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
    <section className="section landing-process" aria-labelledby="landing-process-title">
      <div className="container">
        <Reveal><div className="section-heading">
          <h2 id="landing-process-title">Quy trình làm việc giữ mọi bên cùng một nhịp.</h2>
          <p>QTS không bắt đầu bằng một danh sách tính năng dài. Mỗi giai đoạn đều làm rõ mục tiêu, rủi ro và kết quả cần bàn giao.</p>
        </div></Reveal>
        <div className="process-grid">
          {processSteps.map((step, index) => (
            <Reveal delay={index * 0.06} key={step.title}>
              <article className="process-step">
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
    <LandingFAQ />
    <CallToAction />
  </MarketingShell>;
}
