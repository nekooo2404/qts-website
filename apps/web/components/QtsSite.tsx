"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  Bars3Icon,
  BoltIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CloudIcon,
  CommandLineIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  CursorArrowRaysIcon,
  GlobeAltIcon,
  HeartIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Icon = typeof SparklesIcon;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function Logo() {
  return (
    <a href="#top" className="brand" aria-label="QTS home">
      <span className="brand-mark" aria-hidden="true" />
      QTS
    </a>
  );
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
  return <button className="close" type="button" onClick={onClick} aria-label={label}>{children}</button>;
}

function Navbar({ onConsultation }: { onConsultation: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const links = [
    ["Solutions", "#solutions"],
    ["Platform", "#platform"],
    ["Industries", "#industries"],
    ["Resources", "#case-study"],
    ["Company", "#technology"],
  ];

  return (
    <header className={`nav ${scrolled ? "scrolled" : ""} ${open ? "mobile-open" : ""}`}>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map(([label, href], index) => (
            <a key={label} href={href} className="nav-link" onClick={() => setOpen(false)}>
              {label}{index < 4 && <ChevronDownIcon width={12} aria-hidden="true" />}
            </a>
          ))}
        </nav>
        <button className="btn btn-dark" type="button" onClick={onConsultation}>Request consultation <ArrowUpRightIcon width={15} /></button>
        <button className="nav-menu" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <XMarkIcon width={22} /> : <Bars3Icon width={22} />}
        </button>
      </div>
    </header>
  );
}

const lineData = [
  { date: "Jan", revenue: 42, projection: 34 }, { date: "Feb", revenue: 48, projection: 38 },
  { date: "Mar", revenue: 44, projection: 42 }, { date: "Apr", revenue: 59, projection: 47 },
  { date: "May", revenue: 55, projection: 49 }, { date: "Jun", revenue: 70, projection: 55 },
  { date: "Jul", revenue: 78, projection: 60 },
];

function MiniHeroChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={lineData} margin={{ top: 7, left: -28, right: 0, bottom: 0 }}>
        <defs><linearGradient id="heroRevenue" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#6c69ed" stopOpacity=".32" /><stop offset="1" stopColor="#6c69ed" stopOpacity="0" /></linearGradient></defs>
        <Area type="monotone" dataKey="projection" stroke="#c6c6de" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
        <Area type="monotone" dataKey="revenue" stroke="#6865e9" strokeWidth={2} fill="url(#heroRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function HeroProduct() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className="product-glow"
      initial={{ opacity: 0, y: 30, scale: .95 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: [0, -8, 0], scale: 1 }}
      transition={{ opacity: { duration: .7 }, scale: { duration: .7 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
    >
      <div className="mock-app" aria-label="QTS Enterprise Operating Platform preview">
        <div className="mock-top"><i className="dot"/><i className="dot"/><i className="dot"/></div>
        <div className="mock-workspace">
          <aside className="mock-sidebar">
            <div className="mock-side-logo"><i className="mock-side-mark" /> QTS Operating</div>
            {["Overview", "Operations", "People", "Automations", "Analytics"].map((label, index) => <div key={label} className={`mock-nav-item ${index === 0 ? "active" : ""}`}><i className="mock-nav-icon" /> {label}</div>)}
          </aside>
          <div className="mock-content">
            <div className="mock-content-header"><div><div className="mock-kicker">GOOD MORNING, ALEX</div><h2 className="mock-title">Enterprise overview</h2></div><span className="live"><i/> All systems live</span></div>
            <div className="mock-stats">
              <div className="mock-stat"><label>Operating revenue</label><strong>$5.8M</strong><small>↑ 18.6%</small></div>
              <div className="mock-stat"><label>Active projects</label><strong>24</strong><small>↑ 4 this week</small></div>
              <div className="mock-stat"><label>Team capacity</label><strong>86%</strong><small>Healthy</small></div>
            </div>
            <div className="mock-main-grid">
              <div className="mock-panel"><div className="panel-head"><span>Revenue intelligence</span><span>Last 7 months</span></div><div className="spark"><MiniHeroChart /></div></div>
              <div className="mock-panel"><div className="panel-head"><span>Live activity</span><BoltIcon width={11}/></div><div className="activity-list">
                <div className="activity"><i className="activity-icon"><SparklesIcon width={8}/></i><span><strong>AI forecast complete</strong>Manufacturing demand updated</span></div>
                <div className="activity"><i className="activity-icon"><CheckIcon width={8}/></i><span><strong>Workflow approved</strong>Invoice routing automated</span></div>
                <div className="activity"><i className="activity-icon"><UserGroupIcon width={8}/></i><span><strong>Team capacity synced</strong>42 allocations rebalanced</span></div>
              </div></div>
            </div>
            <div className="mock-bottom">
              <div className="mock-panel"><div className="panel-head"><span>System health</span><span>↗</span></div><div className="score-ring"><span>96</span></div></div>
              <div className="mock-panel"><div className="panel-head"><span>Workflow automation</span><span>3 live</span></div><div className="workflow-row"><div className="workflow-label"><span>Order to cash</span><span>92%</span></div><div className="progress"><span style={{ width: "92%" }}/></div></div><div className="workflow-row"><div className="workflow-label"><span>Data quality checks</span><span>74%</span></div><div className="progress"><span style={{ width: "74%" }}/></div></div></div>
            </div>
          </div>
        </div>
      </div>
      <motion.div className="floating-note" animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }} transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }}><i className="note-ai"><SparklesIcon /></i><span><strong>QTS AI discovered an opportunity</strong>Forecast accuracy improved by 14%</span></motion.div>
    </motion.div>
  );
}

function Hero({ onConsultation }: { onConsultation: () => void }) {
  return <section className="hero noise" id="top">
    <div className="container hero-grid">
      <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: .11 } } }}>
        <motion.span className="eyebrow" variants={fadeUp}>Enterprise technology, engineered</motion.span>
        <motion.h1 className="display" variants={fadeUp}>Building Digital Infrastructure For Enterprise Growth</motion.h1>
        <motion.p variants={fadeUp}>QTS helps organizations build scalable software platforms, enterprise applications and intelligent digital ecosystems.</motion.p>
        <motion.div className="hero-actions" variants={fadeUp}><a href="#solutions" className="btn btn-primary">Explore solutions <ArrowRightIcon width={15}/></a><button type="button" className="btn btn-light" onClick={onConsultation}>Talk with experts</button></motion.div>
        <motion.div className="hero-meta" variants={fadeUp}><div className="avatars"><i className="avatar">AM</i><i className="avatar">JL</i><i className="avatar">RS</i></div><span>Trusted by enterprise teams in 10+ industries</span></motion.div>
      </motion.div>
      <HeroProduct />
    </div>
  </section>;
}

function Trust() {
  const stats = [["500+", "Enterprise projects"], ["99.9%", "Platform uptime"], ["50+", "Enterprise clients"], ["10+", "Industries transformed"]];
  return <section className="trust"><div className="container"><div className="trust-inner">{stats.map(([value, label]) => <div className="trust-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="logo-row"><span>Powering organizations built to lead</span><b className="client-logo">NORTHSTAR</b><b className="client-logo">CIRRUS</b><b className="client-logo">ARCSTONE</b><b className="client-logo">MOTION</b><b className="client-logo">FUSE</b></div></div></section>;
}

const modules: { name: string; caption: string; impact: string; value: string; icon: Icon; color: string; description: string }[] = [
  { name: "CRM", caption: "Unify relationships", impact: "Shorter sales cycles", value: "31%", icon: UserGroupIcon, color: "#6b68ee", description: "A connected customer graph gives every team the context to move decisively." },
  { name: "ERP", caption: "Run with precision", impact: "Faster close cycles", value: "42%", icon: CubeTransparentIcon, color: "#529fd9", description: "Operational, financial and delivery data becomes one dependable source of truth." },
  { name: "AI", caption: "Turn signals into action", impact: "Higher forecast accuracy", value: "14%", icon: SparklesIcon, color: "#a36be9", description: "Trusted intelligence surfaces opportunities and recommends the right next step." },
  { name: "Analytics", caption: "See what matters", impact: "Faster decisions", value: "8×", icon: ChartBarIcon, color: "#20b78d", description: "Decision-grade metrics put company performance in focus, from strategy to the frontline." },
  { name: "Workflow", caption: "Make work flow", impact: "Fewer manual handoffs", value: "63%", icon: BoltIcon, color: "#e79731", description: "Orchestrate people, approvals and systems without adding operational overhead." },
  { name: "Cloud", caption: "Scale without friction", impact: "More resilient delivery", value: "99.9%", icon: CloudIcon, color: "#2eacd8", description: "An API-first cloud foundation lets teams ship securely at enterprise scale." },
];

function Platform() {
  const [selected, setSelected] = useState(0);
  const selectedModule = modules[selected];
  const ModuleIcon = selectedModule.icon;
  return <section className="section" id="platform"><div className="container">
    <motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} variants={fadeUp}><span className="eyebrow">One connected foundation</span><h2>Every essential system, working as one.</h2><p>QTS replaces fragmented technology with an adaptive operating platform designed around how your organization creates value.</p></motion.div>
    <div className="platform-wrap">
      <div className="platform-grid">
        <div className="platform-modules">{modules.slice(0, 3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index} onClick={() => setSelected(index)} />)}</div>
        <div className="platform-core"><i className="orbit one"/><i className="orbit two"/><div className="core"><i className="brand-mark"/><strong>QTS Enterprise Platform</strong><span>Connected by design. Intelligent by default.</span></div></div>
        <div className="platform-modules">{modules.slice(3).map((module, index) => <ModuleButton key={module.name} module={module} active={selected === index + 3} onClick={() => setSelected(index + 3)} />)}</div>
      </div>
      <AnimatePresence mode="wait"><motion.article className="platform-preview" key={selectedModule.name} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .24 }}>
        <div><div className="preview-icon" style={{ background: `linear-gradient(135deg, ${selectedModule.color}, #4ac1df)` }}><ModuleIcon /></div><div className="preview-label">QTS {selectedModule.name}</div><h3 className="preview-title">{selectedModule.caption}</h3><p className="preview-text">{selectedModule.description}</p></div><div className="impact"><b>{selectedModule.value}</b><span>{selectedModule.impact}<br/>across connected teams</span></div>
      </motion.article></AnimatePresence>
    </div>
  </div></section>;
}

function ModuleButton({ module, active, onClick }: { module: typeof modules[number]; active: boolean; onClick: () => void }) {
  const ModuleIcon = module.icon;
  return <button type="button" className={`module-button ${active ? "active" : ""}`} onClick={onClick} aria-pressed={active}><i className="module-icon"><ModuleIcon /></i><span><strong>{module.name}</strong><small>{module.caption}</small></span></button>;
}

const solutions = [
  { title: "Enterprise Software", description: "Core systems that make complex organizations more responsive.", icon: Squares2X2Icon, className: "enterprise", type: "columns" },
  { title: "SaaS Platforms", description: "Products your customers choose to return to.", icon: GlobeAltIcon, className: "", type: "list" },
  { title: "AI Solutions", description: "Intelligence integrated into the flow of work.", icon: SparklesIcon, className: "", type: "ai" },
  { title: "Cloud Systems", description: "Modern foundations ready for every next move.", icon: CloudIcon, className: "cloud", type: "cloud" },
  { title: "Web Applications", description: "Digital experiences that perform at any scale.", icon: CommandLineIcon, className: "", type: "list" },
];

function MiniGraphic({ type }: { type: string }) {
  if (type === "cloud") return <div className="cloud-graphic"><span/><span/><span/></div>;
  return <div className="mini-window" aria-hidden="true"><i className="mini-line wide"/><i className="mini-line"/>{type === "columns" ? <div className="mini-columns">{[43,68,56,85,70,94].map((height, index) => <i key={index} style={{ height: `${height}%` }}/>)}</div> : type === "ai" ? <div className="mini-list"><i/><i/><i/></div> : <div className="mini-list"><i/><i/><i/></div>}</div>;
}

function Solutions() {
  return <section className="section" id="solutions"><div className="container"><motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once:true, amount:.3 }} variants={fadeUp}><span className="eyebrow">Designed around your ambition</span><h2>Technology that moves the business forward.</h2><p>From the system of record to the interface your customers love, QTS transforms the work that defines your advantage.</p></motion.div><div className="bento">{solutions.map((solution) => { const SolutionIcon = solution.icon; return <article className={`solution ${solution.className}`} key={solution.title}><i className="solution-icon"><SolutionIcon /></i><h3>{solution.title}</h3><p>{solution.description}</p><MiniGraphic type={solution.type}/><i className="solution-arrow"><ArrowUpRightIcon width={15}/></i></article>; })}</div></div></section>;
}

const demoTabs = ["Dashboard", "Analytics", "Automation", "AI Assistant"];
const performanceData = [
  { month: "Jan", value: 37 }, { month: "Feb", value: 47 }, { month: "Mar", value: 44 }, { month: "Apr", value: 56 }, { month: "May", value: 54 }, { month: "Jun", value: 68 }, { month: "Jul", value: 76 },
];

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  return active && payload?.length ? <div style={{ borderRadius: 8, padding: "8px 10px", background: "#272941", color: "#fff", fontSize: 10, boxShadow: "0 8px 20px rgba(25,27,60,.22)" }}><b>{payload[0].value}%</b><span style={{ color: "#c6c6de", marginLeft: 5 }}>operating index</span></div> : null;
}

function Experience() {
  const [active, setActive] = useState(0);
  return <section className="section" id="experience"><div className="container"><motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once:true, amount:.25 }} variants={fadeUp}><span className="eyebrow">The QTS experience</span><h2>Built for clarity at the speed of business.</h2><p>Every signal, task and decision lives in an interface that makes complex operations feel immediately understandable.</p></motion.div><div className="experience-shell"><div className="demo-tabs" role="tablist" aria-label="QTS product experience">{demoTabs.map((tab, index) => <button key={tab} className={`demo-tab ${active === index ? "active" : ""}`} role="tab" aria-selected={active === index} onClick={() => setActive(index)}>{tab}</button>)}</div><AnimatePresence mode="wait"><motion.div key={active} className="demo-stage" initial={{ opacity:0, y:12, scale:.985 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:.99 }} transition={{ duration:.25 }}><DemoPanel tab={active}/></motion.div></AnimatePresence></div></div></section>;
}

function DemoPanel({ tab }: { tab: number }) {
  const titles = ["Operating performance", "Decision intelligence", "Automation command center", "Your enterprise copilot"];
  const subtitles = ["A complete picture of your business, in real time.", "From raw signals to the strategic next move.", "Systems that keep work progressing without chasing it.", "Ask better questions. Get operationally useful answers."];
  return <div className="demo-layout"><div className="demo-card"><h4>{titles[tab]}</h4><p>{subtitles[tab]}</p>{tab === 2 ? <AutomationBoard/> : tab === 3 ? <AssistantPanel/> : <div className="demo-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData} margin={{ top:10,right:8,left:-26,bottom:0 }}><defs><linearGradient id="demoFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#6865e9" stopOpacity=".25"/><stop offset="1" stopColor="#6865e9" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#eaebf2"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:"#9295a6", fontSize:9 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill:"#9295a6", fontSize:9 }} tickFormatter={(value) => `${value}%`}/><Tooltip content={<ChartTooltip/>}/><Area type="monotone" dataKey="value" stroke="#625fe4" strokeWidth={2} fill="url(#demoFill)" activeDot={{ r:5, strokeWidth:2, stroke:"#fff" }}/></AreaChart></ResponsiveContainer></div>}</div><aside className="demo-side"><div className="demo-card"><h4>{tab === 0 ? "Focus areas" : tab === 1 ? "Signals detected" : tab === 2 ? "Automation health" : "AI confidence"}</h4>{tab === 3 ? <div className="ai-response"><strong><SparklesIcon width={13}/> QTS Intelligence</strong><p>Revenue risk in EMEA is down 12% after the new renewal playbook. Three accounts need attention this week.</p></div> : <TrendRows tab={tab}/>}</div><div className="demo-card"><h4>{tab === 0 ? "Teams in flow" : tab === 1 ? "Decision impact" : tab === 2 ? "Time returned to teams" : "Recommended action"}</h4><p>{tab === 0 ? "86% of team capacity is deployed against strategic work." : tab === 1 ? "Your operations team could reduce reporting cycles by 8×." : tab === 2 ? "1,248 hours automated this quarter across 19 workflows." : "Review the EMEA renewal cohort before Friday’s forecast."}</p></div></aside></div>;
}

function TrendRows({ tab }: { tab: number }) {
  const rows = tab === 1 ? [["Demand", "82%", "#675fe8"], ["Delivery", "68%", "#25b68d"], ["Risk", "33%", "#e79731"]] : tab === 2 ? [["Healthy", "94%", "#28bb8e"], ["Needs review", "6%", "#e79731"], ["Failed", "0%", "#dd6570"]] : [["Enterprise", "86%", "#675fe8"], ["Delivery", "74%", "#25b68d"], ["Product", "63%", "#4aaed8"]];
  return <div className="trend-rows">{rows.map(([label, value, color]) => <div className="trend-row" key={label as string}><i className="trend-dot" style={{background:color as string}}/><span>{label}</span><b>{value}</b><div className="trend-bar" style={{gridColumn:"2 / 4"}}><i style={{width:value as string, background:color as string}}/></div></div>)}</div>;
}

function AutomationBoard() { return <div className="trend-rows" style={{marginTop:24}}>{[["Customer escalation", "Resolved", "100%"], ["Invoice approval", "In progress", "72%"], ["Capacity rebalance", "Queued", "40%"]].map(([name, status, value]) => <div className="task-row" key={name}><span className="task-check"><CheckIcon width={9}/></span><span style={{flex:1}}><b style={{display:"block", color:"#484a60", fontSize:11}}>{name}</b><small style={{fontSize:9,color:"#9093a4"}}>{status}</small></span><span style={{color:"#5d5de3",fontWeight:750}}>{value}</span></div>)}</div>; }
function AssistantPanel() { return <div className="ai-response" style={{marginTop:24, minHeight:190}}><strong><SparklesIcon width={14}/> QTS Intelligence</strong><p style={{fontSize:13}}>“What is putting this quarter’s delivery goal at risk?”</p><p>Two delivery teams are running above 92% capacity. Reassigning the Product Data workstream can restore 11% schedule buffer without affecting active client commitments.</p></div>; }

const industryData = [
  ["01", "Healthcare", HeartIcon, "Fragmented systems obscure the patient journey.", "One secure care operations platform.", "22% faster coordination"],
  ["02", "Manufacturing", BuildingOffice2Icon, "Manual reporting slows every operational decision.", "Real-time production intelligence.", "8× faster reporting"],
  ["03", "Finance", ShieldCheckIcon, "Data must move quickly, securely and audibly.", "Trusted workflows with complete control.", "34% less reconciliation"],
  ["04", "Retail", GlobeAltIcon, "Customer signals live across disconnected channels.", "Connected commerce and demand insight.", "19% higher conversion"],
  ["05", "Education", LightBulbIcon, "Teams need visibility without administrative burden.", "Adaptive learning operations.", "41% fewer manual tasks"],
  ["06", "Logistics", CursorArrowRaysIcon, "Every handoff creates a potential delay.", "A command layer for fulfillment flows.", "27% more predictable delivery"],
] as const;

function Industries() { return <section className="section industries" id="industries"><div className="container"><div className="section-heading"><span className="eyebrow">Built for the real world</span><h2>Infrastructure shaped by the industries it serves.</h2><p>We start with the constraint that matters most, then build the platform advantage that changes the outcome.</p></div><div className="industry-list">{industryData.map(([number,name,Icon,problem,solution,impact]) => <article className="industry-item" key={name}><span className="industry-num">{number}</span><h3 className="industry-name"><i><Icon/></i>{name}</h3><p className="industry-copy"><b style={{color:"#fff"}}>Problem:</b> {problem}<br/><b style={{color:"#fff"}}>QTS solution:</b> {solution}</p><span className="industry-impact">{impact}<br/>measurable impact</span></article>)}</div></div></section>; }

function CaseStudy() { return <section className="section case-study" id="case-study"><div className="container case-grid"><motion.div initial="hidden" whileInView="visible" viewport={{once:true,amount:.3}} variants={{visible:{transition:{staggerChildren:.12}}}}><motion.span className="eyebrow" variants={fadeUp}>Client transformation</motion.span><motion.h2 className="display" style={{fontSize:"clamp(39px,4vw,58px)",margin:"18px 0"}} variants={fadeUp}>From lagging reports to a live operating advantage.</motion.h2><motion.p style={{color:"var(--muted)",fontSize:16,lineHeight:1.65,maxWidth:490}} variants={fadeUp}>Global Manufacturing Corp needed one view of a rapidly changing operation. QTS made it possible without forcing teams to abandon the tools that worked.</motion.p><div className="case-steps"><div className="case-step"><small>BEFORE</small><h4>Manual reporting everywhere</h4><p>Teams spent days reconciling production, delivery and finance data.</p></div><div className="case-step"><small>QTS SOLUTION</small><h4>A connected operations platform</h4><p>QTS unified essential data and automated the decisions that held teams back.</p></div><div className="case-step"><small>AFTER</small><h4>Real-time operational control</h4><p>Leaders see risk early and redirect resources while there is time to act.</p></div></div></motion.div><motion.div className="case-dashboard" initial={{opacity:0,x:35}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.3}} transition={{duration:.55}} aria-label="Manufacturing operations dashboard preview"><div className="case-dashboard-top"><span>Global Manufacturing Corp</span><span style={{color:"#6ee0b2"}}>● Operating live</span></div><div className="case-body"><aside className="case-side"><p>Operations</p><i className="case-site-item active"/><i className="case-site-item"/><i className="case-site-item"/><i className="case-site-item"/></aside><div className="case-visuals"><div className="dark-panel"><label>Production output</label><strong>94.8%</strong><span>↑ 8.2% vs plan</span></div><div className="dark-panel"><label>Delivery confidence</label><strong>97.1%</strong><span>↑ 3.4% vs last week</span></div><div className="dark-panel wide"><label>Factory performance</label><div className="dark-bars">{[52,75,63,86,79,96,72,91].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div></div></div></motion.div></div></section>; }

function Technology() { const stacks: Array<{ title: string; copy: string; technologies: string[] }> = [{ title: "Experience layer", copy: "Interfaces engineered for decisive work.", technologies: ["Next.js", "React", "TypeScript"] }, { title: "Foundation", copy: "A secure, connected enterprise core.", technologies: ["Django", "PostgreSQL", "REST API"] }, { title: "Intelligence layer", copy: "Scalable systems that learn with you.", technologies: ["Cloud", "Data", "AI"] }]; return <section className="section" id="technology"><div className="container"><div className="section-heading"><span className="eyebrow">Engineering credibility</span><h2>The architecture behind resilient growth.</h2><p>Modern technology choices matter only when they make your business more capable, secure and ready for change.</p></div><div className="tech-grid">{stacks.map(({ title, copy, technologies },index)=><article className="tech-group" key={title}>{index !== 1 && <i className="arch-line"/>}{index===1?<div className="arch-node"><div><i className="brand-mark"/><strong>QTS Platform Core</strong><span>Composable, secure and API-first</span></div></div>:<><h3>{title}</h3><p>{copy}</p><div className="tech-stack">{technologies.map(tech=><span className="tech-pill" key={tech}><i/>{tech}</span>)}</div></>}</article>)}</div></div></section>; }

function Footer() { const groups: Array<{ label: string; links: string[] }> = [{ label: "Solutions", links: ["Enterprise Software","SaaS Platforms","AI Solutions","Cloud Systems"] }, { label: "Industries", links: ["Healthcare","Manufacturing","Finance","Retail"] }, { label: "Company", links: ["About QTS","Careers","Newsroom","Contact"] }, { label: "Resources", links: ["Insights","Case studies","Technology","Help center"] }, { label: "Contact", links: ["hello@qts.com","+1 800 555 0199","Security","Compliance"] }]; return <footer className="footer"><div className="container"><div className="footer-top"><div><Logo/><p className="footer-about">QTS builds the digital infrastructure that helps ambitious enterprises turn complexity into progress.</p></div>{groups.map(({ label, links })=><div className="footer-col" key={label}><h4>{label}</h4>{links.map(link=><a href="#top" key={link}>{link}</a>)}</div>)}</div><div className="footer-bottom"><span>© 2026 QTS. Building what business becomes next.</span><div className="footer-legal"><a href="#top">Privacy</a><a href="#top">Terms</a><a href="#top">Accessibility</a></div></div></div></footer>; }

function ConsultationModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<"idle"|"sending"|"success"|"error">("idle");
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("sending"); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/leads/consultation/`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      if (!response.ok) throw new Error("We could not send your request. Please try again.");
      setStatus("success");
    } catch {
      setStatus("error"); setError("The QTS API is unavailable right now. Start the API or try again shortly.");
    }
  }
  return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={(event)=>{if(event.target===event.currentTarget) onClose();}} role="presentation"><motion.div className="modal" initial={{opacity:0,y:20,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.98}} role="dialog" aria-modal="true" aria-labelledby="consultation-title"><div className="modal-head"><div><h2 id="consultation-title">Build the next advantage.</h2><p>Tell us what your organization is solving. A QTS expert will be in touch within one business day.</p></div><IconButton label="Close consultation form" onClick={onClose}><XMarkIcon width={17}/></IconButton></div>{status === "success" ? <div className="form-success" style={{marginTop:24}}><b>Request received.</b><br/>Your QTS consultation is in motion. We will use the details you shared to make the conversation useful from the first minute.</div> : <form className="form" onSubmit={handleSubmit}><label className="field">Work email<input required name="email" type="email" placeholder="you@company.com"/></label><label className="field">Full name<input required name="name" placeholder="Your name"/></label><label className="field">Company<input required name="company" placeholder="Organization name"/></label><label className="field">What are you building?<textarea required name="message" rows={3} placeholder="Describe the challenge, platform or outcome."/></label>{status === "error" && <p className="form-error">{error}</p>}<button className="btn btn-primary" disabled={status === "sending"} type="submit">{status === "sending" ? "Sending request…" : "Request consultation"}<ArrowRightIcon width={15}/></button></form>}</motion.div></motion.div>;
}

export default function QtsSite() {
  const [consultation, setConsultation] = useState(false);
  return <><Navbar onConsultation={() => setConsultation(true)}/><main><Hero onConsultation={() => setConsultation(true)}/><Trust/><Platform/><Solutions/><Experience/><Industries/><CaseStudy/><Technology/></main><Footer/><AnimatePresence>{consultation && <ConsultationModal onClose={() => setConsultation(false)}/>}</AnimatePresence></>;
}
