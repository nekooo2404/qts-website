"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BoltIcon, ChartBarIcon, CloudIcon, CubeTransparentIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type Module = { name: string; caption: string; impact: string; value: string; icon: Icon; color: string; description: string };

function ModuleButton({ module, active, onClick }: { module: Module; active: boolean; onClick: () => void }) {
  const ModuleIcon = module.icon;
  return <button type="button" className={`module-button ${active ? "active" : ""}`} onClick={onClick} aria-pressed={active}><i className="module-icon"><ModuleIcon /></i><span><strong>{module.name}</strong><small>{module.caption}</small></span></button>;
}

const modules: Module[] = [
  { name: "CRM", caption: "Thống nhất quan hệ khách hàng", impact: "Chu kỳ bán hàng mạch lạc hơn", value: "Minh họa", icon: UserGroupIcon, color: "#6b68ee", description: "Đồ thị khách hàng kết nối giúp mọi bộ phận có bối cảnh để hành động kịp thời." },
  { name: "ERP", caption: "Vận hành chính xác", impact: "Dữ liệu tài chính và vận hành nhất quán", value: "Minh họa", icon: CubeTransparentIcon, color: "#529fd9", description: "Dữ liệu vận hành, tài chính và giao hàng trở thành một nguồn tin cậy chung." },
  { name: "AI", caption: "Biến tín hiệu thành hành động", impact: "Đề xuất từ tín hiệu vận hành", value: "Minh họa", icon: SparklesIcon, color: "#a36be9", description: "Trí tuệ đáng tin cậy giúp phát hiện rủi ro và đề xuất bước đi tiếp theo phù hợp." },
  { name: "Analytics", caption: "Nhìn thấy điều quan trọng", impact: "Báo cáo theo dõi theo thời gian", value: "Minh họa", icon: ChartBarIcon, color: "#20b78d", description: "Số liệu phục vụ quyết định giúp toàn tổ chức theo dõi hiệu quả từ chiến lược đến hiện trường." },
  { name: "Workflow", caption: "Quy trình trôi chảy", impact: "Ít điểm tắc nghẽn thủ công", value: "Minh họa", icon: BoltIcon, color: "#e79731", description: "Điều phối con người, phê duyệt và hệ thống mà không làm phát sinh gánh nặng vận hành." },
  { name: "Cloud", caption: "Mở rộng không vướng víu", impact: "Nền tảng ưu tiên API", value: "Minh họa", icon: CloudIcon, color: "#2eacd8", description: "Nền tảng đám mây giúp đội ngũ triển khai an toàn ở quy mô doanh nghiệp." },
];

export default function PlatformExplorer() {
  const [selected, setSelected] = useState(0);
  const selectedModule = modules[selected];
  const ModuleIcon = selectedModule.icon;
  return <div className="platform-wrap">
    <div className="platform-grid">
      <div className="platform-modules">{modules.slice(0, 3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index} onClick={() => setSelected(index)} />)}</div>
      <div className="platform-core"><i className="orbit one" /><i className="orbit two" /><div className="core"><i className="brand-mark" /><strong>QTS Enterprise Platform</strong><span>Kết nối trong thiết kế. Thông minh theo mặc định.</span></div></div>
      <div className="platform-modules">{modules.slice(3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index + 3} onClick={() => setSelected(index + 3)} />)}</div>
    </div>
    <AnimatePresence mode="wait">
      <motion.article className="platform-preview" key={selectedModule.name} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .24 }}>
        <div><div className="preview-icon" style={{ background: `linear-gradient(135deg, ${selectedModule.color}, #4ac1df)` }}><ModuleIcon /></div><div className="preview-label">QTS {selectedModule.name}</div><h3 className="preview-title">{selectedModule.caption}</h3><p className="preview-text">{selectedModule.description}</p></div>
        <div className="impact"><b>{selectedModule.value}</b><span>{selectedModule.impact}</span></div>
      </motion.article>
    </AnimatePresence>
  </div>;
}
