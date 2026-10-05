import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CircleStackIcon, LockClosedIcon, QueueListIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

function ProductScenario() {
  return (
    <div className="hero-scenario" aria-label="Luồng minh hoạ về vận hành kết nối">
      <div className="hero-scenario-heading">
        <span>Bản minh họa giao diện</span>
        <i><SparklesIcon aria-hidden="true" /></i>
      </div>
      <strong>Portal, Identity và HRM cùng một màn hình điều phối.</strong>
      <p>Minh họa cách người dùng vào đúng ứng dụng, đúng quyền và đúng luồng cần xử lý.</p>
      <ul>
        <li><CheckIcon aria-hidden="true" />Định danh và phiên truy cập</li>
        <li><CheckIcon aria-hidden="true" />Việc cần duyệt theo vai trò</li>
        <li><CheckIcon aria-hidden="true" />Tín hiệu vận hành theo thời gian</li>
      </ul>
    </div>
  );
}

function HeroWorkspace() {
  return (
    <figure className="hero-os hero-system" aria-label="Sơ đồ kiểm soát nền tảng QTS" aria-describedby="hero-visual-caption">
      <div className="hero-system-map" aria-hidden="true">
        <div className="hero-system-head"><b>QTS operating model</b><small>Control map</small></div>
        <div className="hero-system-core">
          <span>Identity</span>
          <strong>Phiên, quyền và phạm vi dữ liệu</strong>
        </div>
        <div className="hero-system-nodes">
          <div><b>Portal</b><span>Ứng dụng được cấp</span></div>
          <div><b>HRM</b><span>Hồ sơ trong phạm vi</span></div>
          <div><b>Workflow</b><span>Phê duyệt có vết</span></div>
          <div><b>Reporting</b><span>Báo cáo theo quyền</span></div>
        </div>
      </div>
      <div className="hero-proof-ledger" aria-hidden="true">
        <div><span>Control</span><b>Evidence</b></div>
        <div><span>SSO session</span><b>OIDC + PKCE</b></div>
        <div><span>Role boundary</span><b>RBAC / Data scope</b></div>
        <div><span>Audit trail</span><b>Action log</b></div>
        <div><span>Release gate</span><b>UAT / OAT checklist</b></div>
      </div>
      <ProductScenario />
      <figcaption id="hero-visual-caption" className="hero-visual-caption">
        Sơ đồ minh họa kiến trúc kiểm soát, không phải ảnh chụp sản phẩm hay dữ liệu khách hàng.
      </figcaption>
    </figure>
  );
}

const trustProofs = [
  {
    tag: "Security",
    value: "Bảo mật là lớp nền",
    label: "Một tài khoản cho mọi ứng dụng, đăng nhập một lần, xác thực đa yếu tố và lưu vết đầy đủ.",
    scope: "SSO · MFA · RBAC · Audit",
  },
  {
    tag: "Integration",
    value: "Kết nối có chủ đích",
    label: "Portal, HRM, tài liệu, phê duyệt và báo cáo đi qua các ranh giới API rõ ràng, dễ kiểm tra.",
    scope: "Portal · HRM · Workflow",
  },
  {
    tag: "Delivery",
    value: "Triển khai có kiểm soát",
    label: "Mỗi giai đoạn có mục tiêu, tiêu chí nghiệm thu và kế hoạch bàn giao để giảm rủi ro phát hành.",
    scope: "Discovery · UAT · Handover",
  },
  {
    tag: "Operations",
    value: "Vận hành lâu dài",
    label: "Theo dõi sức khỏe hệ thống, lưu vết thao tác và chuẩn bị backup/restore cho môi trường sản xuất.",
    scope: "Monitoring · Logs · Backup",
  },
];

const proofArtifacts = [
  "OIDC/PKCE và danh sách ứng dụng được cấp",
  "RBAC, Data Scope, Field-Level Security",
  "Audit log cho thao tác nhạy cảm",
  "UAT/OAT, backup/restore, handover checklist",
];

export function TrustStrip() {
  return (
    <section className="trust" aria-labelledby="trust-proof-title" aria-describedby="trust-proof-copy">
      <div className="container trust-shell">
        <div className="trust-header">
          <span>Trust proof</span>
          <h2 id="trust-proof-title">Những lý do doanh nghiệp có thể bắt đầu với QTS.</h2>
          <p id="trust-proof-copy">Không dùng số liệu phóng đại hay logo khách hàng khi chưa có bằng chứng công khai; QTS trình bày rõ cách hệ thống được thiết kế để kiểm soát, tích hợp và vận hành.</p>
        </div>
        <div className="trust-inner">
          {trustProofs.map((proof) => (
            <article className="trust-stat" key={proof.value}>
              <small>{proof.tag}</small>
              <strong>{proof.value}</strong>
              <span>{proof.label}</span>
              <em>{proof.scope}</em>
            </article>
          ))}
        </div>
        <div className="trust-artifacts" aria-label="Bằng chứng kỹ thuật cần kiểm tra khi triển khai QTS">
          <span>Artifact kiểm chứng</span>
          {proofArtifacts.map((item) => <b key={item}>{item}</b>)}
        </div>
        <div className="logo-row" aria-label="Phạm vi nền tảng QTS">
          <span>Phạm vi nền tảng</span>
          <b className="client-logo">Identity</b>
          <b className="client-logo">Portal</b>
          <b className="client-logo">HRM</b>
          <b className="client-logo">Workflow</b>
          <b className="client-logo">Reporting</b>
        </div>
      </div>
    </section>
  );
}

export default function HomeExperience() {
  return (
    <>
      <section className="hero" aria-labelledby="landing-hero-title" aria-describedby="landing-hero-copy">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker"><ShieldCheckIcon width={15} aria-hidden="true" /> Nền tảng vận hành doanh nghiệp</span>
            <h1 id="landing-hero-title" className="display">QTS - nền tảng vận hành doanh nghiệp.</h1>
            <p id="landing-hero-copy">Kết nối Portal, HRM, Identity và quy trình nội bộ trong một hệ sinh thái thống nhất: đăng nhập một lần, phân quyền theo vai trò, phiên truy cập và nhật ký được kiểm soát tập trung.</p>
            <div className="hero-actions">
              <Link href="/contact" className="btn btn-primary">Yêu cầu tư vấn <ArrowRightIcon width={15} aria-hidden="true" /></Link>
              <Link href="/solutions" className="btn btn-light">Xem giải pháp</Link>
            </div>
            <Link href="/platform#identity" className="hero-deep-link" prefetch={false}>Xem SSO & phân quyền hoạt động thế nào →</Link>
            <ul className="hero-ref-pills" aria-label="Bề mặt vận hành QTS">
              <li><LockClosedIcon width={14} aria-hidden="true" /> Identity</li>
              <li><CircleStackIcon width={14} aria-hidden="true" /> Portal</li>
              <li><CircleStackIcon width={14} aria-hidden="true" /> HRM</li>
              <li><QueueListIcon width={14} aria-hidden="true" /> Workflow</li>
              <li><CircleStackIcon width={14} aria-hidden="true" /> Reporting</li>
            </ul>
          </div>
          <div className="hero-os-wrap">
            <HeroWorkspace />
          </div>
        </div>
      </section>
      <TrustStrip />
    </>
  );
}
