"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tabs = ["Dashboard", "Analytics", "Automation", "AI Assistant"];
const performanceData = [
  { month: "Jan", value: 37 }, { month: "Feb", value: 47 }, { month: "Mar", value: 44 }, { month: "Apr", value: 56 }, { month: "May", value: 54 }, { month: "Jun", value: 68 }, { month: "Jul", value: 76 },
];

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  return active && payload?.length ? <div style={{ borderRadius: 8, padding: "8px 10px", background: "#272941", color: "#fff", fontSize: 10, boxShadow: "0 8px 20px rgba(25,27,60,.22)" }}><b>{payload[0].value}%</b><span style={{ color: "#c6c6de", marginLeft: 5 }}>operating index</span></div> : null;
}

function TrendRows({ tab }: { tab: number }) {
  const rows = tab === 1 ? [["Demand", "82%", "#675fe8"], ["Delivery", "68%", "#25b68d"], ["Risk", "33%", "#e79731"]] : tab === 2 ? [["Healthy", "94%", "#28bb8e"], ["Needs review", "6%", "#e79731"], ["Failed", "0%", "#dd6570"]] : [["Enterprise", "86%", "#675fe8"], ["Delivery", "74%", "#25b68d"], ["Product", "63%", "#4aaed8"]];
  return <div className="trend-rows">{rows.map(([label, value, color]) => <div className="trend-row" key={label}><i className="trend-dot" style={{ background: color }} /><span>{label}</span><b>{value}</b><div className="trend-bar" style={{ gridColumn: "2 / 4" }}><i style={{ width: value, background: color }} /></div></div>)}</div>;
}

function AutomationBoard() {
  return <div className="trend-rows" style={{ marginTop: 24 }}>{[["Customer escalation", "Resolved", "100%"], ["Invoice approval", "In progress", "72%"], ["Capacity rebalance", "Queued", "40%"]].map(([name, status, value]) => <div className="task-row" key={name}><span className="task-check"><CheckIcon width={9} /></span><span style={{ flex: 1 }}><b style={{ display: "block", color: "#484a60", fontSize: 11 }}>{name}</b><small style={{ fontSize: 9, color: "#9093a4" }}>{status}</small></span><span style={{ color: "#5d5de3", fontWeight: 750 }}>{value}</span></div>)}</div>;
}

function AssistantPanel() {
  return <div className="ai-response" style={{ marginTop: 24, minHeight: 190 }}><strong><SparklesIcon width={14} /> QTS Intelligence</strong><p style={{ fontSize: 13 }}>“What is putting this quarter’s delivery goal at risk?”</p><p>Two delivery teams are running above 92% capacity. Reassigning the Product Data workstream can restore 11% schedule buffer without affecting active client commitments.</p></div>;
}

function DemoPanel({ tab }: { tab: number }) {
  const titles = ["Operating performance", "Decision intelligence", "Automation command center", "Your enterprise copilot"];
  const subtitles = ["A complete picture of your business, in real time.", "From raw signals to the strategic next move.", "Systems that keep work progressing without chasing it.", "Ask better questions. Get operationally useful answers."];
  return <div className="demo-layout"><div className="demo-card"><h4>{titles[tab]}</h4><p>{subtitles[tab]}</p>{tab === 2 ? <AutomationBoard /> : tab === 3 ? <AssistantPanel /> : <div className="demo-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData} margin={{ top: 10, right: 8, left: -26, bottom: 0 }}><defs><linearGradient id="demoFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#6865e9" stopOpacity=".25" /><stop offset="1" stopColor="#6865e9" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eaebf2" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9295a6", fontSize: 9 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#9295a6", fontSize: 9 }} tickFormatter={(value) => `${value}%`} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="value" stroke="#625fe4" strokeWidth={2} fill="url(#demoFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} /></AreaChart></ResponsiveContainer></div>}</div><aside className="demo-side"><div className="demo-card"><h4>{tab === 0 ? "Focus areas" : tab === 1 ? "Signals detected" : tab === 2 ? "Automation health" : "AI confidence"}</h4>{tab === 3 ? <div className="ai-response"><strong><SparklesIcon width={13} /> QTS Intelligence</strong><p>Revenue risk in EMEA is down 12% after the new renewal playbook. Three accounts need attention this week.</p></div> : <TrendRows tab={tab} />}</div><div className="demo-card"><h4>{tab === 0 ? "Teams in flow" : tab === 1 ? "Decision impact" : tab === 2 ? "Time returned to teams" : "Recommended action"}</h4><p>{tab === 0 ? "86% of team capacity is deployed against strategic work." : tab === 1 ? "Your operations team could reduce reporting cycles by 8×." : tab === 2 ? "1,248 hours automated this quarter across 19 workflows." : "Review the EMEA renewal cohort before Friday’s forecast."}</p></div></aside></div>;
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
    <div className="demo-tabs" role="tablist" aria-label="QTS product experience">
      {tabs.map((tab, index) => <button key={tab} ref={(el) => { tabRefs.current[index] = el; }} className={`demo-tab ${active === index ? "active" : ""}`} role="tab" id={`experience-tab-${index}`} aria-selected={active === index} aria-controls={`experience-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => handleKeyDown(event, index)}>{tab}</button>)}
    </div>
    <AnimatePresence mode="wait">
      <motion.div key={active} role="tabpanel" id={`experience-panel-${active}`} aria-labelledby={`experience-tab-${active}`} className="demo-stage" initial={{ opacity: 0, y: 12, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .99 }} transition={{ duration: .25 }}><DemoPanel tab={active} /></motion.div>
    </AnimatePresence>
  </div>;
}
