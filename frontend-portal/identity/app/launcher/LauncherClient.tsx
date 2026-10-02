"use client";

import { useMemo, useState } from "react";
import type { LauncherApplication } from "@/lib/identity";
import { dateTime } from "@/lib/identity";
import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  ClockIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type LauncherClientProps = {
  applications: LauncherApplication[];
  user: { name: string; email: string };
  tenantName: string;
};

function targetFor(application: LauncherApplication) {
  try {
    const target = new URL(application.redirect_uri);
    if (!["http:", "https:"].includes(target.protocol)) return null;
    target.pathname = target.pathname.replace(/\/auth\/callback$|\/callback$/, "/");
    target.search = "?sso=1";
    target.hash = "";
    return target.toString();
  } catch {
    return null;
  }
}

function iconFor(application: LauncherApplication) {
  if (application.slug === "qts-hrm" || application.client_id === "qts-hrm") return UserGroupIcon;
  if (application.slug === "qts-portal" || application.client_id === "qts-portal") return BuildingOffice2Icon;
  return Squares2X2Icon;
}

export default function LauncherClient({ applications, user, tenantName }: LauncherClientProps) {
  const [query, setQuery] = useState("");
  const launchableApplications = useMemo(() => applications.map(application => ({ application, href: targetFor(application) })).filter((item): item is { application: LauncherApplication; href: string } => Boolean(item.href)), [applications]);
  const visibleApplications = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi-VN");
    if (!needle) return launchableApplications;
    return launchableApplications.filter(({ application }) => [application.name, application.description, application.slug, application.client_id].some(value => value.toLocaleLowerCase("vi-VN").includes(needle)));
  }, [query, launchableApplications]);

  return <section className="launcher-stage" aria-labelledby="launcher-title">
    <div className="launcher-hero">
      <div>
        <span className="launcher-kicker"><ShieldCheckIcon width={16} aria-hidden="true"/> QTS Identity</span>
        <h1 id="launcher-title">Trình khởi chạy QTS</h1>
        <p>Mở nhanh các phần mềm được cấp cho tài khoản của bạn. Mật khẩu và phiên đăng nhập vẫn được quản lý tập trung tại QTS Identity.</p>
      </div>
      <aside className="launcher-profile" aria-label="Tài khoản hiện tại">
        <i aria-hidden="true">{user.name.slice(0, 2).toUpperCase()}</i>
        <b>{user.name}</b>
        <small>{user.email}</small>
        <span>{tenantName}</span>
      </aside>
    </div>

    <div className="launcher-toolbar">
      <label className="launcher-searchbox">
        <MagnifyingGlassIcon width={17} aria-hidden="true"/>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm Portal, HRM hoặc ứng dụng..." aria-label="Tìm ứng dụng"/>
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Xóa tìm kiếm"><XMarkIcon width={16}/></button>}
      </label>
      <div className="launcher-count" aria-live="polite"><b>{visibleApplications.length}</b><span>/{launchableApplications.length} ứng dụng</span></div>
    </div>

    {launchableApplications.length === 0 ? <div className="launcher-empty-state">
      <Squares2X2Icon width={26} aria-hidden="true"/>
      <b>Chưa có ứng dụng được cấp</b>
      <p>Vui lòng liên hệ quản trị viên QTS để được cấp quyền truy cập phần mềm.</p>
    </div> : visibleApplications.length === 0 ? <div className="launcher-empty-state">
      <MagnifyingGlassIcon width={26} aria-hidden="true"/>
      <b>Không tìm thấy ứng dụng phù hợp</b>
      <p>Thử tìm theo tên ứng dụng hoặc xóa nội dung tìm kiếm.</p>
      <button type="button" onClick={() => setQuery("")}>Xóa tìm kiếm</button>
    </div> : <div className="launcher-grid" aria-label="Ứng dụng được cấp">
      {visibleApplications.map(({ application, href }) => {
        const Icon = iconFor(application);
        return <a href={href} className="launcher-card" key={application.id}>
          <span className="launcher-card-icon"><Icon width={24} height={24} aria-hidden="true"/></span>
          <span className="launcher-card-copy">
            <b>{application.name}</b>
            <small>{application.description}</small>
          </span>
          <span className="launcher-card-meta"><ClockIcon width={14} aria-hidden="true"/> {dateTime(application.last_accessed_at)}</span>
          <span className="launcher-card-action">Mở ứng dụng <ArrowTopRightOnSquareIcon width={14} aria-hidden="true"/></span>
        </a>;
      })}
    </div>}
  </section>;
}
