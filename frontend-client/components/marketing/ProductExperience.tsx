"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from "recharts";

const tabs = ["Tổng quan", "Phân tích", "Tự động", "Trợ lý AI"];
const performanceData = [
  { month: "T1", value: 37 }, { month: "T2", value: 47 }, { month: "T3", value: 44 }, { month: "T4", value: 56 }, { month: "T5", value: 54 }, { month: "T6", value: 68 }, { month: "T7", value: 76 },
];

function TrendRows({ tab }: { tab: number }) {
  const rows = tab === 1
    ? [["Nhu cầu", "Ưu tiên", "var(--ink)", "82%"], ["Giao hàng", "Theo dõi", "var(--signal)", "68%"], ["Rủi ro", "Cần xem xét", "var(--signal)", "33%"]]
    : tab === 2
      ? [["Ổn định", "Đang kiểm tra", "var(--signal)", "94%"], ["Ngoại lệ", "Cần rà soát", "var(--signal)", "46%"], ["Lỗi", "Chưa ghi nhận", "var(--signal)", "10%"]]
      : [["Doanh nghiệp", "Theo dõi", "var(--ink)", "86%"], ["Giao hàng", "Theo dõi", "var(--ink)", "74%"], ["Sản phẩm", "Cần xem xét", "var(--signal)", "63%"]];
  return <div className="trend-rows">{rows.map(([label, value, color, width]) => <div className="trend-row" key={label}><i className="trend-dot" style={{ background: color }} /><span>{label}</span><b>{value}</b><div className="trend-bar" style={{ gridColumn: "2 / 4" }}><i style={{ width, background: color }} /></div></div>)}</div>;
}

function AutomationBoard() {
  return <div className="trend-rows" style={{ marginTop: 24 }}>{[["Xử lý yêu cầu khách hàng", "Đã mô phỏng"], ["Phê duyệt hóa đơn", "Đang mô phỏng"], ["Cân đối nguồn lực", "Chờ kiểm tra"]].map(([name, status]) => <div className="task-row" key={name}><span className="task-check"><CheckIcon width={9} /></span><span style={{ flex: 1 }}><b style={{ display: "block", color: "var(--ink)", fontSize: 11 }}>{name}</b><small style={{ fontSize: 9, color: "var(--muted)" }}>{status}</small></span></div>)}</div>;
}

function AssistantPanel() {
  return <div className="ai-response" style={{ marginTop: 24, minHeight: 190 }}><strong><SparklesIcon width={14} /> Trợ lý QTS</strong><p style={{ fontSize: 13 }}>“Điều gì đang gây rủi ro cho mục tiêu giao hàng trong quý này?”</p><p>Luồng minh hoạ cho thấy nguồn lực đang tập trung cao ở hai nhóm; việc điều chuyển luồng công việc có thể tạo thêm dư địa tiến độ mà không ảnh hưởng cam kết hiện tại.</p></div>;
}

function ExperiencePanel({ tab }: { tab: number }) {
  const titles = ["Hiệu quả vận hành", "Trí tuệ ra quyết định", "Trung tâm tự động hóa", "Trợ lý doanh nghiệp"];
  const subtitles = ["Bức tranh vận hành theo thời gian.", "Từ tín hiệu thô đến hành động chiến lược.", "Hệ thống giúp công việc tiếp tục mà không cần thúc đẩy thủ công.", "Đặt câu hỏi tốt hơn để nhận câu trả lời hữu ích cho vận hành."];
  return <div className="experience-layout"><div className="experience-card"><h4>{titles[tab]}</h4><p>{subtitles[tab]}</p>{tab === 2 ? <AutomationBoard /> : tab === 3 ? <AssistantPanel /> : <div className="experience-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="experienceFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="var(--signal)" stopOpacity=".25" /><stop offset="1" stopColor="var(--signal)" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} /><Area type="monotone" dataKey="value" stroke="var(--signal)" strokeWidth={2} fill="url(#experienceFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} /></AreaChart></ResponsiveContainer><small className="experience-disclaimer">Đường xu hướng minh họa — không phải KPI hoặc kết quả khách hàng.</small></div>}</div><aside className="experience-side"><div className="experience-card"><h4>{tab === 0 ? "Trọng tâm" : tab === 1 ? "Tín hiệu phát hiện" : tab === 2 ? "Sức khỏe tự động" : "Mức độ tin cậy AI"}</h4>{tab === 3 ? <div className="ai-response"><strong><SparklesIcon width={13} /> Trợ lý QTS</strong><p>Luồng minh hoạ: nhóm đổi mới cho thấy khả năng kiểm soát rủi ro được cải thiện, một số tài khoản cần rà soát trong tuần.</p></div> : <TrendRows tab={tab} />}</div><div className="experience-card"><h4>{tab === 0 ? "Đội ngũ đang vận hành" : tab === 1 ? "Tác động quyết định" : tab === 2 ? "Thời gian trả lại cho đội ngũ" : "Hành động đề xuất"}</h4><p>{tab === 0 ? "Bức tranh minh hoạ về cách nguồn lực được triển khai cho công việc chiến lược." : tab === 1 ? "Luồng minh hoạ: giảm thời gian báo cáo phụ thuộc vào mức độ kết nối dữ liệu." : tab === 2 ? "Luồng minh hoạ về thời gian tiết kiệm khi quy trình được tự động hóa." : "Xem xét nhóm khách hàng cần ưu tiên trước kỳ dự báo tuần này."}</p></div></aside></div>;
}

export default function ProductExperience() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== null) {
      event.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    }
  }

  return <div className="experience-shell">
    <div className="experience-tabs" role="tablist" aria-label="Trải nghiệm sản phẩm QTS">
      {tabs.map((tab, index) => <button key={tab} ref={(el) => { tabRefs.current[index] = el; }} className={`experience-tab ${active === index ? "active" : ""}`} role="tab" id={`experience-tab-${index}`} aria-selected={active === index} aria-controls={`experience-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => handleKeyDown(event, index)}>{tab}</button>)}
    </div>
    <p className="experience-disclaimer experience-shell-note">Các tỷ lệ và đường xu hướng trong khối này là dữ liệu mô phỏng để minh họa cách đọc thông tin, không phải KPI hoặc kết quả khách hàng.</p>
    <AnimatePresence mode="wait">
      <motion.div key={active} role="tabpanel" id={`experience-panel-${active}`} aria-labelledby={`experience-tab-${active}`} className="experience-stage" initial={reduceMotion ? false : { opacity: 0, y: 8, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: .99 }} transition={{ duration: reduceMotion ? 0 : .25 }}><ExperiencePanel tab={active} /></motion.div>
    </AnimatePresence>
  </div>;
}
