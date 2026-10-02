import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CircleStackIcon, FingerPrintIcon, LockClosedIcon, QueueListIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

function ProductScenario() {
  return (
    <div className="hero-scenario" aria-label="Luồng minh hoạ về vận hành kết nối">
      <div className="hero-scenario-heading">
        <span>Bản minh họa giao diện</span>
        <i><SparklesIcon /></i>
      </div>
      <strong>Portal, Identity và HRM cùng một màn hình điều phối.</strong>
      <p>Minh họa cách người dùng vào đúng ứng dụng, đúng quyền và đúng luồng cần xử lý.</p>
      <ul>
        <li><CheckIcon />Định danh và phiên truy cập</li>
        <li><CheckIcon />Việc cần duyệt theo vai trò</li>
        <li><CheckIcon />Tín hiệu vận hành theo thời gian</li>
      </ul>
    </div>
  );
}

function HeroWorkspace() {
  return (
    <figure className="hero-os" aria-label="Mô phỏng bề mặt sản phẩm QTS" aria-describedby="hero-visual-caption">
      <div className="hero-mac-window" aria-hidden="true">
        <div className="hero-window-bar"><b>QTS Workspace</b><small>Bản minh họa</small></div>
        <div className="hero-window-body">
          <div className="hero-window-side">
            <span className="active" />
            <span />
            <span />
            <span />
          </div>
          <div className="hero-window-main">
            <div className="hero-window-head"><b>Vận hành hôm nay</b><small>Bối cảnh minh họa</small></div>
            <div className="hero-metrics">
              <div><strong>Vai trò</strong><span>phân quyền rõ</span></div>
              <div><strong>Quy trình</strong><span>theo dõi được</span></div>
              <div><strong>Phiên</strong><span>được bảo vệ</span></div>
            </div>
            <div className="hero-flow-list">
              <span><i />Onboarding nhân sự</span>
              <span><i />Yêu cầu mua sắm</span>
              <span><i />Báo cáo vận hành</span>
            </div>
            <div className="hero-workbench-table" aria-hidden="true">
              <div><span>Ứng dụng</span><b>Trạng thái</b><em>Phạm vi</em></div>
              <div><span>Identity</span><b>Phiên hợp lệ</b><em>SSO / MFA</em></div>
              <div><span>HRM</span><b>Chờ phê duyệt</b><em>Theo vai trò</em></div>
              <div><span>Portal</span><b>Sẵn sàng mở</b><em>Ứng dụng được cấp</em></div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-aux-stack">
        <div className="hero-inspector" aria-hidden="true">
          <div className="hero-inspector-title"><small>Bản minh họa</small><b>Phiên truy cập</b></div>
          <div className="hero-inspector-badge"><FingerPrintIcon /><span>Operations Lead</span></div>
          <dl>
            <div><dt>Vai trò</dt><dd>Phân quyền theo vai trò</dd></div>
            <div><dt>Phiên</dt><dd>Phiên truy cập được bảo vệ</dd></div>
            <div><dt>Ứng dụng</dt><dd>Portal, HRM, Workflow</dd></div>
          </dl>
        </div>
        <ProductScenario />
      </div>
      <figcaption id="hero-visual-caption" className="hero-visual-caption">
        Bản minh họa giao diện, không phải ảnh chụp sản phẩm hay dữ liệu khách hàng.
      </figcaption>
    </figure>
  );
}

const trustProofs = [
  {
    tag: "Security",
    value: "Bảo mật là lớp nền",
    label: "Định danh, phiên truy cập, vai trò và phạm vi dữ liệu được thiết kế trước khi mở rộng thêm ứng dụng.",
    scope: "Identity · RBAC · Audit",
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
            <span className="hero-kicker"><ShieldCheckIcon width={15} /> Nền tảng vận hành doanh nghiệp</span>
            <h1 id="landing-hero-title" className="display">Kết nối Portal, HRM, Identity và quy trình trong một hệ sinh thái thống nhất.</h1>
            <p id="landing-hero-copy">QTS giúp doanh nghiệp gom điểm truy cập, phân quyền, hồ sơ nhân sự, phê duyệt, tài liệu và báo cáo vào cùng một trải nghiệm bảo mật, dễ mở rộng.</p>
            <div className="hero-actions">
              <Link href="/contact" className="btn btn-primary">Yêu cầu tư vấn <ArrowRightIcon width={15} /></Link>
              <Link href="/solutions" className="btn btn-light">Xem giải pháp</Link>
            </div>
            <div className="hero-ref-pills" aria-label="Bề mặt vận hành QTS" role="list">
              <span role="listitem"><LockClosedIcon width={14} /> Identity</span>
              <span role="listitem"><CircleStackIcon width={14} /> Portal</span>
              <span role="listitem"><CircleStackIcon width={14} /> HRM</span>
              <span role="listitem"><QueueListIcon width={14} /> Workflow</span>
              <span role="listitem"><CircleStackIcon width={14} /> Reporting</span>
            </div>
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
