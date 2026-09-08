"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tabs = ["Tổng quan", "Phân tích", "Tự động", "Trợ lý AI"];
const performanceData = [
  { month: "T1", value: 37 }, { month: "T2", value: 47 }, { month: "T3", value: 44 }, { month: "T4", value: 56 }, { month: "T5", value: 54 }, { month: "T6", value: 68 }, { month: "T7", value: 76 },
];

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  return active && payload?.length ? <div style={{ borderRadius: 8, padding: "8px 10px", background: "#272941", color: "#fff", fontSize: 10, boxShadow: "0 8px 20px rgba(25,27,60,.22)" }}><b>{payload[0].value}%</b><span style={{ color: "#c6c6de", marginLeft: 5 }}>chỉ số vận hành minh họa</span></div> : null;
}

function TrendRows({ tab }: { tab: number }) {
  const rows = tab === 1 ? [["Nhu cầu", "82%", "#675fe8"], ["Giao hàng", "68%", "#25b68d"], ["Rủi ro", "33%", "#e79731"]] : tab === 2 ? [["Ổn định", "94%", "#28bb8e"], ["Cần rà soát", "6%", "#e79731"], ["Lỗi", "0%", "#dd6570"]] : [["Doanh nghiệp", "86%", "#675fe8"], ["Giao hàng", "74%", "#25b68d"], ["Sản phẩm", "63%", "#4aaed8"]];
  return <div className="trend-rows">{rows.map(([label, value, color]) => <div className="trend-row" key={label}><i className="trend-dot" style={{ background: color }} /><span>{label}</span><b>{value}</b><div className="trend-bar" style={{ gridColumn: "2 / 4" }}><i style={{ width: value, background: color }} /></div></div>)}</div>;
}

function AutomationBoard() {
  return <div className="trend-rows" style={{ marginTop: 24 }}>{[["Xử lý yêu cầu khách hàng", "Đã xử lý", "100%"], ["Phê duyệt hóa đơn", "Đang thực hiện", "72%"], ["Cân đối nguồn lực", "Đang chờ", "40%"]].map(([name, status, value]) => <div className="task-row" key={name}><span className="task-check"><CheckIcon width={9} /></span><span style={{ flex: 1 }}><b style={{ display: "block", color: "#484a60", fontSize: 11 }}>{name}</b><small style={{ fontSize: 9, color: "#9093a4" }}>{status}</small></span><span style={{ color: "#5d5de3", fontWeight: 750 }}>{value}</span></div>)}</div>;
}

function AssistantPanel() {
  return <div className="ai-response" style={{ marginTop: 24, minHeight: 190 }}><strong><SparklesIcon width={14} /> Trợ lý QTS</strong><p style={{ fontSize: 13 }}>“Điều gì đang gây rủi ro cho mục tiêu giao hàng trong quý này?”</p><p>Mô hình minh họa cho thấy nguồn lực đang tập trung cao ở hai nhóm; việc điều chuyển luồng công việc có thể tạo thêm dư địa tiến độ mà không ảnh hưởng cam kết hiện tại.</p></div>;
}

function DemoPanel({ tab }: { tab: number }) {
  const titles = ["Hiệu quả vận hành", "Trí tuệ ra quyết định", "Trung tâm tự động hóa", "Trợ lý doanh nghiệp"];
  const subtitles = ["Bức tranh vận hành minh họa theo thời gian.", "Từ tín hiệu thô đến hành động chiến lược.", "Hệ thống giúp công việc tiếp tục mà không cần thúc đẩy thủ công.", "Đặt câu hỏi tốt hơn để nhận câu trả lời hữu ích cho vận hành."];
  return <div className="demo-layout"><div className="demo-card"><h4>{titles[tab]}</h4><p>{subtitles[tab]}</p>{tab === 2 ? <AutomationBoard /> : tab === 3 ? <AssistantPanel /> : <div className="demo-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData} margin={{ top: 10, right: 8, left: -26, bottom: 0 }}><defs><linearGradient id="demoFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#6865e9" stopOpacity=".25" /><stop offset="1" stopColor="#6865e9" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eaebf2" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9295a6", fontSize: 9 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#9295a6", fontSize: 9 }} tickFormatter={(value) => `${value}%`} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="value" stroke="#625fe4" strokeWidth={2} fill="url(#demoFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} /></AreaChart></ResponsiveContainer></div>}</div><aside className="demo-side"><div className="demo-card"><h4>{tab === 0 ? "Trọng tâm" : tab === 1 ? "Tín hiệu phát hiện" : tab === 2 ? "Sức khỏe tự động" : "Mức độ tin cậy AI"}</h4>{tab === 3 ? <div className="ai-response"><strong><SparklesIcon width={13} /> Trợ lý QTS</strong><p>Dữ liệu minh họa: nhóm đổi mới cho thấy khả năng kiểm soát rủi ro được cải thiện, một số tài khoản cần rà soát trong tuần.</p></div> : <TrendRows tab={tab} />}</div><div className="demo-card"><h4>{tab === 0 ? "Đội ngũ đang vận hành" : tab === 1 ? "Tác động quyết định" : tab === 2 ? "Thời gian trả lại cho đội ngũ" : "Hành động đề xuất"}</h4><p>{tab === 0 ? "Bức tranh minh họa về cách nguồn lực được triển khai cho công việc chiến lược." : tab === 1 ? "Ví dụ minh họa: giảm thời gian báo cáo phụ thuộc vào mức độ kết nối dữ liệu." : tab === 2 ? "Ví dụ minh họa về thời gian tiết kiệm khi quy trình được tự động hóa." : "Xem xét nhóm khách hàng cần ưu tiên trước kỳ dự báo tuần này."}</p></div></aside></div>;
}

export default function ProductExperience() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
    <div className="demo-tabs" role="tablist" aria-label="Trải nghiệm sản phẩm QTS">
      {tabs.map((tab, index) => <button key={tab} ref={(el) => { tabRefs.current[index] = el; }} className={`demo-tab ${active === index ? "active" : ""}`} role="tab" id={`experience-tab-${index}`} aria-selected={active === index} aria-controls={`experience-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => handleKeyDown(event, index)}>{tab}</button>)}
    </div>
    <AnimatePresence mode="wait">
      <motion.div key={active} role="tabpanel" id={`experience-panel-${active}`} aria-labelledby={`experience-tab-${active}`} className="demo-stage" initial={{ opacity: 0, y: 12, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .99 }} transition={{ duration: .25 }}><DemoPanel tab={active} /></motion.div>
    </AnimatePresence>
  </div>;
}
