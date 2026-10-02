"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BoltIcon, ChartBarIcon, CloudIcon, CubeTransparentIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type Module = { name: string; caption: string; impact: string; value: string; icon: Icon; description: string };

function ModuleButton({ module, active, onClick }: { module: Module; active: boolean; onClick: () => void }) {
  const ModuleIcon = module.icon;
  return (
    <button
      type="button"
      className={`module-button ${active ? "active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      aria-controls="platform-preview"
      aria-label={`${module.name}: ${module.caption}`}
    >
      <i className="module-icon"><ModuleIcon /></i><span><strong>{module.name}</strong><small>{module.caption}</small></span>
    </button>
  );
}

const modules: Module[] = [
  { name: "CRM", caption: "Thống nhất quan hệ khách hàng", impact: "Hồ sơ vận hành hợp nhất giữa bán hàng và chăm sóc", value: "Theo vai trò", icon: UserGroupIcon, description: "Đồ thị khách hàng kết nối giúp mọi bộ phận có bối cảnh để hành động kịp thời." },
  { name: "ERP", caption: "Vận hành chính xác", impact: "Dòng đối soát giữa vận hành và tài chính", value: "Theo luồng", icon: CubeTransparentIcon, description: "Dữ liệu vận hành, tài chính và giao hàng trở thành một nguồn tin cậy chung." },
  { name: "AI", caption: "Biến tín hiệu thành hành động", impact: "Tín hiệu được phân loại để con người duyệt", value: "Theo tín hiệu", icon: SparklesIcon, description: "Trí tuệ đáng tin cậy giúp phát hiện rủi ro và đề xuất bước đi tiếp theo phù hợp." },
  { name: "Phân tích dữ liệu", caption: "Nhìn thấy điều quan trọng", impact: "Bảng điều khiển theo dõi vận hành theo thời gian", value: "Theo báo cáo", icon: ChartBarIcon, description: "Số liệu phục vụ quyết định giúp toàn tổ chức theo dõi hiệu quả từ chiến lược đến hiện trường." },
  { name: "Quy trình", caption: "Quy trình trôi chảy", impact: "Tác vụ qua phê duyệt, chuyển bước và ngoại lệ", value: "Theo phê duyệt", icon: BoltIcon, description: "Điều phối con người, phê duyệt và hệ thống mà không làm phát sinh gánh nặng vận hành." },
  { name: "Đám mây", caption: "Mở rộng không vướng víu", impact: "Môi trường triển khai cho phát triển, thử nghiệm và vận hành", value: "Theo môi trường", icon: CloudIcon, description: "Nền tảng đám mây giúp đội ngũ triển khai an toàn ở quy mô doanh nghiệp." },
];

export default function PlatformExplorer() {
  const [selected, setSelected] = useState(0);
  const reducedMotion = useReducedMotion();
  const selectedModule = modules[selected];
  const ModuleIcon = selectedModule.icon;
  return <div className="platform-wrap" aria-label="Bản minh họa nền tảng QTS" aria-describedby="platform-explorer-status">
    <p id="platform-explorer-status" className="sr-only" aria-live="polite">Đang xem: {selectedModule.name}, {selectedModule.caption}.</p>
    <div className="platform-window-bar">
      <b>Minh họa nền tảng QTS</b>
      <small>{selectedModule.name}</small>
    </div>
    <div className="platform-grid">
      <div className="platform-modules">{modules.slice(0, 3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index} onClick={() => setSelected(index)} />)}</div>
      <div className="platform-core"><i className="orbit one" /><i className="orbit two" /><div className="core"><i className="brand-mark" /><strong>Nền tảng doanh nghiệp QTS</strong><span>Kết nối trong thiết kế. Thông minh theo mặc định.</span></div></div>
      <div className="platform-modules">{modules.slice(3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index + 3} onClick={() => setSelected(index + 3)} />)}</div>
    </div>
    <AnimatePresence mode="wait">
      <motion.article id="platform-preview" className="platform-preview" key={selectedModule.name} aria-live="polite" aria-atomic="true" initial={reducedMotion ? false : { opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }} transition={{ duration: reducedMotion ? 0 : .24 }}>
        <div><div className="preview-icon"><ModuleIcon /></div><div className="preview-label">QTS {selectedModule.name}</div><h3 className="preview-title">{selectedModule.caption}</h3><p className="preview-text">{selectedModule.description}</p></div>
        <div className="impact"><b>{selectedModule.value}</b><span>{selectedModule.impact}</span></div>
      </motion.article>
    </AnimatePresence>
  </div>;
}
