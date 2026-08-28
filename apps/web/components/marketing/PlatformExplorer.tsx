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
  { name: "CRM", caption: "Unify relationships", impact: "Shorter sales cycles", value: "31%", icon: UserGroupIcon, color: "#6b68ee", description: "A connected customer graph gives every team the context to move decisively." },
  { name: "ERP", caption: "Run with precision", impact: "Faster close cycles", value: "42%", icon: CubeTransparentIcon, color: "#529fd9", description: "Operational, financial and delivery data becomes one dependable source of truth." },
  { name: "AI", caption: "Turn signals into action", impact: "Higher forecast accuracy", value: "14%", icon: SparklesIcon, color: "#a36be9", description: "Trusted intelligence surfaces opportunities and recommends the right next step." },
  { name: "Analytics", caption: "See what matters", impact: "Faster decisions", value: "8×", icon: ChartBarIcon, color: "#20b78d", description: "Decision-grade metrics put company performance in focus, from strategy to the frontline." },
  { name: "Workflow", caption: "Make work flow", impact: "Fewer manual handoffs", value: "63%", icon: BoltIcon, color: "#e79731", description: "Orchestrate people, approvals and systems without adding operational overhead." },
  { name: "Cloud", caption: "Scale without friction", impact: "More resilient delivery", value: "99.9%", icon: CloudIcon, color: "#2eacd8", description: "An API-first cloud foundation lets teams ship securely at enterprise scale." },
];

export default function PlatformExplorer() {
  const [selected, setSelected] = useState(0);
  const selectedModule = modules[selected];
  const ModuleIcon = selectedModule.icon;
  return <div className="platform-wrap">
    <div className="platform-grid">
      <div className="platform-modules">{modules.slice(0, 3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index} onClick={() => setSelected(index)} />)}</div>
      <div className="platform-core"><i className="orbit one" /><i className="orbit two" /><div className="core"><i className="brand-mark" /><strong>QTS Enterprise Platform</strong><span>Connected by design. Intelligent by default.</span></div></div>
      <div className="platform-modules">{modules.slice(3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index + 3} onClick={() => setSelected(index + 3)} />)}</div>
    </div>
    <AnimatePresence mode="wait">
      <motion.article className="platform-preview" key={selectedModule.name} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .24 }}>
        <div><div className="preview-icon" style={{ background: `linear-gradient(135deg, ${selectedModule.color}, #4ac1df)` }}><ModuleIcon /></div><div className="preview-label">QTS {selectedModule.name}</div><h3 className="preview-title">{selectedModule.caption}</h3><p className="preview-text">{selectedModule.description}</p></div>
        <div className="impact"><b>{selectedModule.value}</b><span>{selectedModule.impact}<br />across connected teams</span></div>
      </motion.article>
    </AnimatePresence>
  </div>;
}
