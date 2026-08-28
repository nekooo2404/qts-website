import { useEffect, useMemo, useState } from "react";
import { beginAuthorization, beginLogout, identityWebOrigin, isAuthorizationCallback, loadPortalIdentity, redeemAuthorizationResponse } from "./oidc";
import type { PortalEntitlements, UserInfo } from "./oidc";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  CodeBracketSquareIcon,
  CommandLineIcon,
  CreditCardIcon,
  CubeTransparentIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  HomeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
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

type Page = "Dashboard" | "Projects" | "CRM" | "HR" | "Finance" | "Developer" | "Analytics" | "Settings";
type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type Person = { id: string; name: string; title: string; initials: string; email: string };

type IdentityState = {
  accessToken: string;
  person: Person;
  entitlements: PortalEntitlements;
};

const nav: { page: Page; icon: Icon; count?: string }[] = [
  { page: "Dashboard", icon: HomeIcon }, { page: "Projects", icon: FolderIcon, count: "8" }, { page: "CRM", icon: UsersIcon, count: "12" },
  { page: "HR", icon: UserGroupIcon }, { page: "Finance", icon: CreditCardIcon }, { page: "Developer", icon: CommandLineIcon },
];
const secondary: { page: Page; icon: Icon }[] = [{ page: "Analytics", icon: PresentationChartLineIcon }, { page: "Settings", icon: CubeTransparentIcon }];
const allModules = [...nav, ...secondary];

const permissionLabels: Record<Page, string> = {
  Dashboard: "Operational overview",
  Projects: "Program delivery",
  CRM: "Accounts and pipeline",
  HR: "People and teams",
  Finance: "Revenue and invoices",
  Developer: "Services and integrations",
  Analytics: "Decision intelligence",
  Settings: "Organization controls",
};

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "QT";
}

function personFromUserInfo(profile: UserInfo, entitlements: PortalEntitlements): Person {
  return {
    id: profile.sub,
    name: profile.name || profile.email,
    title: entitlements.roles.map(role => role.replace(/-/g, " ")).join(" · ") || "QTS member",
    initials: initialsFor(profile.name || profile.email),
    email: profile.email,
  };
}

const performance = [
  { month: "Jan", revenue: 380, target: 330 }, { month: "Feb", revenue: 440, target: 365 }, { month: "Mar", revenue: 425, target: 400 },
  { month: "Apr", revenue: 510, target: 430 }, { month: "May", revenue: 492, target: 465 }, { month: "Jun", revenue: 570, target: 510 }, { month: "Jul", revenue: 612, target: 550 },
];
const utilization = [{ name:"Platform",value:89 },{ name:"Cloud",value:77 },{ name:"Data",value:73 },{ name:"AI",value:64 },{ name:"Web",value:58 }];
const projects = [
  { name:"QTS Healthcare Platform", client:"Aster Health", progress:"82%", status:"On track", tone:"good", icon:ShieldCheckIcon },
  { name:"Enterprise ERP Modernization", client:"Northstar Group", progress:"67%", status:"On track", tone:"purple", icon:CubeTransparentIcon },
  { name:"Unified Commerce Engine", client:"Coda Retail", progress:"43%", status:"Needs review", tone:"warning", icon:ChartBarIcon },
  { name:"Supply Chain Control Tower", client:"Vektor Logistics", progress:"36%", status:"In discovery", tone:"blue", icon:CloudArrowUpIcon },
];
const activity = [
  { icon:CheckCircleIcon, tone:"green", title:"Sprint 12 was completed", text:"Healthcare Platform moved 14 tasks to done.", time:"18m" },
  { icon:DocumentTextIcon, tone:"", title:"Invoice INV-2048 was approved", text:"Northstar Group · $148,200", time:"42m" },
  { icon:BoltIcon, tone:"orange", title:"Automation detected a delivery risk", text:"Capacity threshold crossed in Platform team.", time:"1h" },
  { icon:UserGroupIcon, tone:"", title:"Three people joined QTS", text:"Engineering and Solutions teams updated.", time:"3h" },
];

function Logo() { return <div className="portal-logo"><i className="portal-logo-mark"/><span>QTS Portal</span></div>; }

function ToolTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="tooltip"><small>{label}</small>{payload.map(point => <div key={point.name}><b>{point.name === "revenue" ? `$${point.value}K` : `$${point.value}K`}</b> <span style={{ color:"#a8aaba" }}>{point.name === "revenue" ? "actual" : "target"}</span></div>)}</div>;
}

type AuthPhase = "unauthenticated" | "authenticating" | "authenticated" | "error";

function ProfileMenu({ person, onSignOut }: { person: Person; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return <div className="profile-menu-shell">
    <div className="profile">
      <i className="profile-avatar">{person.initials}</i>
      <div><span className="profile-name">{person.name}</span><span className="profile-role">{person.title}</span></div>
      <button className="profile-button" onClick={() => setOpen(value => !value)} title="Account options" aria-haspopup="menu" aria-expanded={open}><EllipsisHorizontalIcon width={16}/></button>
    </div>
    {open && <div className="profile-menu" role="menu" aria-label="Account options">
      <span className="profile-menu-label">Signed in as</span>
      <div className="profile-menu-item" role="presentation">
        <i className="profile-avatar">{person.initials}</i>
        <span><b>{person.name}</b><small>{person.email}</small></span>
      </div>
      <span className="profile-menu-divider"/>
      <button className="profile-menu-item danger" role="menuitem" onClick={onSignOut}><ArrowRightOnRectangleIcon width={15}/> Sign out</button>
    </div>}
  </div>;
}

function Sidebar({ page, onPage, person, allowedNav, allowedSecondary, onLogout }: { page: Page; onPage: (page: Page) => void; person: Person; allowedNav: typeof nav; allowedSecondary: typeof secondary; onLogout: () => void }) {
  return <aside className="sidebar"><div className="sidebar-top"><Logo/><button className="workspace-switcher"><i className="workspace-initial">Q</i><span>QTS Global</span><ChevronDownIcon width={14}/></button><div className="nav-section">Workspace</div><nav className="side-nav" aria-label="QTS portal navigation">{allowedNav.map(item => <NavigationButton key={item.page} item={item} active={page===item.page} onClick={()=>onPage(item.page)}/>)}</nav><div className="nav-section">Insights</div><nav className="side-nav">{allowedSecondary.map(item => <NavigationButton key={item.page} item={item} active={page===item.page} onClick={()=>onPage(item.page)}/>)}</nav></div><div className="sidebar-bottom"><ProfileMenu person={person} onSignOut={onLogout}/></div></aside>;
}
function NavigationButton({ item, active, onClick }: { item: {page:Page;icon:Icon;count?:string}; active:boolean;onClick:()=>void }) { const Icon=item.icon; return <button className={`side-link ${active?"active":""}`} onClick={onClick}><Icon/><span>{item.page}</span>{item.count&&<b className="nav-count">{item.count}</b>}</button>; }

function CommandPalette({ onClose, onPage, allowedModules }: { onClose:()=>void;onPage:(page:Page)=>void;allowedModules:Page[] }) {
  const [query,setQuery]=useState("");
  const items = allModules.filter(item => allowedModules.includes(item.page)).filter(item => item.page.toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{const handle=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle);},[onClose]);
  return <motion.div className="command-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><motion.div className="command-modal" initial={{opacity:0,y:-10,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.98}}><input className="command-input" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects, teams, or navigate…"/><div className="command-list"><small>Navigate</small>{items.length===0?<p className="command-empty">No permitted modules match your search.</p>:items.map(item=>{const Icon=item.icon;return <button className="command-item" key={item.page} onClick={()=>{onPage(item.page);onClose();}}><Icon/>{item.page}</button>})}</div></motion.div></motion.div>;
}

function Topbar({ page,onCommand }: {page:Page;onCommand:()=>void}) { return <header className="topbar"><div className="breadcrumb"><span>QTS Global</span><span> / </span><b>{page}</b></div><button className="command-button" onClick={onCommand}><MagnifyingGlassIcon/><span>Search or jump to…</span><i className="key">⌘ K</i></button><div className="top-actions"><button className="icon-action" aria-label="Notifications"><BellIcon/></button><button className="icon-action" aria-label="Help"><CircleStackIcon/></button></div></header>; }

function PageHeading({ page, description }: {page:string;description:string}) {return <div className="page-heading"><div><h1>{page}</h1><p>{description}</p></div><button className="date-filter"><CalendarDaysIcon/> Last 30 days <ChevronDownIcon width={12}/></button></div>}
function Kpi({ label,value,meta,icon:Icon }: {label:string;value:string;meta:string;icon:Icon}) {return <article className="panel kpi"><span className="kpi-label"><Icon/>{label}</span><strong className="kpi-value">{value}</strong><span className="kpi-meta"><b>↑ {meta.split(" ")[0]}</b> {meta.substring(meta.indexOf(" ")+1)}</span></article>}

function Dashboard({ person }: { person: Person }) { return <><PageHeading page={`Good morning, ${person.name.split(" ")[0]}`} description="Here’s how QTS Global is operating today."/><section className="kpi-grid"><Kpi label="Operating revenue" value="$5.8M" meta="18.6% vs last period" icon={CreditCardIcon}/><Kpi label="Active projects" value="24" meta="4 this week" icon={FolderIcon}/><Kpi label="Team performance" value="86%" meta="5.2% on target" icon={UserGroupIcon}/><Kpi label="System health" value="99.9%" meta="0.1% stable" icon={ShieldCheckIcon}/><Kpi label="Client companies" value="45" meta="3 this quarter" icon={BuildingIcon}/></section><section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h2>Revenue performance</h2><p>$612K in recognized revenue this month</p></div><div className="panel-options"><button className="active">Revenue</button><button>Margin</button></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performance} margin={{top:10,right:9,left:-20,bottom:0}}><defs><linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#7973ed" stopOpacity=".32"/><stop offset="1" stopColor="#7973ed" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.065)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#77798c",fontSize:9}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#77798c",fontSize:9}} tickFormatter={v=>`$${v}K`}/><Tooltip content={<ToolTip/>}/><Area type="monotone" dataKey="target" stroke="#606276" strokeWidth={1.5} strokeDasharray="4 4" fill="none"/><Area type="monotone" dataKey="revenue" stroke="#817af0" strokeWidth={2} fill="url(#revenue)" activeDot={{r:5,stroke:"#1a1b26",strokeWidth:2}}/></AreaChart></ResponsiveContainer></div></article><article className="panel system-panel"><div className="panel-heading"><div><h2>System health</h2><p>All operating systems</p></div><EllipsisHorizontalIcon width={16} color="#7c7e92"/></div><div className="health-score"><i className="score"><b>96</b></i><div className="health-copy"><b>Excellent condition</b><span>No service-impacting events<br/>in the last 30 days.</span></div></div><div className="status-list">{[["Platform API","Operational"],["Cloud delivery","Operational"],["Data pipeline","Operational"],["AI Intelligence","Operational"]].map(([label,status])=><div className="status-row" key={label}><i className="status-dot"/><span>{label}</span><small>{status}</small></div>)}</div></article></section><section className="lower-grid"><article className="panel projects-panel"><div className="panel-heading"><div><h2>Priority projects</h2><p>Programs with active operating milestones</p></div><button className="icon-action" aria-label="Export projects"><ArrowDownTrayIcon/></button></div><ProjectTable compact/></article><article className="panel activity-panel"><div className="panel-heading"><div><h2>Operating activity</h2><p>Signals from across QTS</p></div><button className="icon-action" aria-label="View activity"><EllipsisHorizontalIcon/></button></div><div className="activity-feed">{activity.map(item=><ActivityItem key={item.title} item={item}/>)}</div></article></section></>; }

function BuildingIcon(props: React.ComponentProps<typeof UsersIcon>) { return <UsersIcon {...props}/>; }
function ProjectTable({ compact=false }: {compact?:boolean}) { return <table className="table"><thead><tr><th>Project</th><th>{compact?"Client":"Owner"}</th><th>Progress</th><th>Status</th></tr></thead><tbody>{projects.map(project=>{const Icon=project.icon;return <tr key={project.name}><td><span className="project-title"><i className="project-mark"><Icon/></i>{project.name}</span></td><td>{compact?project.client:"Alex Harper"}</td><td><span className="percent"><i style={{"--progress":project.progress} as React.CSSProperties}/>{project.progress}</span></td><td><span className={`badge ${project.tone}`}>{project.status}</span></td></tr>})}</tbody></table>}
function ActivityItem({item}:{item:typeof activity[number]}){const Icon=item.icon;return <div className="feed-item"><i className={`feed-icon ${item.tone}`}><Icon/></i><div><b>{item.title}</b><p>{item.text}</p></div><time>{item.time}</time></div>}

function Projects() {const [mode,setMode]=useState<"overview"|"board">("overview"); const columns=[{title:"Backlog",tasks:["Confirm care data integration","Migration test plan"]},{title:"In progress",tasks:["Claims ingestion workflow","Executive operations dashboard","Access policy review"]},{title:"Review",tasks:["Billing event schema","Mobile triage flow"]},{title:"Done",tasks:["Platform discovery","Security architecture"]}];return <><PageHeading page="Projects" description="Programs, delivery capacity and the work moving them forward."/><div className="panel" style={{padding:18}}><div className="panel-heading"><div><h2>Portfolio delivery</h2><p>24 active projects across five operating groups</p></div><div className="panel-options"><button className={mode==="overview"?"active":""} onClick={()=>setMode("overview")}>Overview</button><button className={mode==="board"?"active":""} onClick={()=>setMode("board")}>Kanban</button></div></div>{mode==="overview"?<ProjectTable/>:<div className="kanban">{columns.map(column=><div className="kanban-column" key={column.title}><div className="kanban-heading"><b>{column.title}</b><span>{column.tasks.length}</span></div>{column.tasks.map((task,index)=><motion.article layout key={task} className="task-card" whileHover={{y:-2}}><span className={`task-priority priority-${index%3}`}/><b>{task}</b><p>QTS Healthcare Platform</p><div><i className="member">{index%2?"NL":"AH"}</i><small>{index%2?"Mar 19":"Mar 15"}</small></div></motion.article>)}</div>)}</div>}</div></>}

const companies = [{name:"Aster Health",industry:"Healthcare",value:"$1.24M",stage:"Expansion",tone:"good"},{name:"Northstar Group",industry:"Manufacturing",value:"$948K",stage:"Proposal",tone:"purple"},{name:"Coda Retail",industry:"Retail",value:"$624K",stage:"Qualified",tone:"blue"},{name:"Vektor Logistics",industry:"Logistics",value:"$482K",stage:"Discovery",tone:"warning"}];
function CRM() {const stages=["Discovery","Qualified","Proposal","Expansion"];return <><PageHeading page="CRM" description="Every relationship, opportunity and customer signal in context."/><div className="crm-grid">{stages.map(stage=><article className="pipeline-column panel" key={stage}><div className="pipeline-heading"><b>{stage}</b><span>{companies.filter(c=>c.stage===stage).length||1}</span></div>{companies.filter(c=>c.stage===stage).concat(companies.filter(c=>c.stage!==stage).slice(0,stage==="Discovery"?1:0)).map((company,index)=><motion.div className="deal-card" key={`${stage}-${company.name}-${index}`} whileHover={{y:-3}}><i className="company-symbol">{company.name.slice(0,1)}</i><b>{company.name}</b><p>{company.industry}</p><strong>{company.value}</strong><div><span className={`badge ${company.tone}`}>{stage}</span><small>Updated {index+1}d</small></div></motion.div>)}</article>)}</div><article className="panel" style={{padding:18,marginTop:12}}><div className="panel-heading"><div><h2>Enterprise accounts</h2><p>45 active client companies with linked commercial history</p></div><button className="portal-button"><PlusIcon width={13}/> Add account</button></div><table className="table"><thead><tr><th>Company</th><th>Industry</th><th>Annual value</th><th>Pipeline stage</th></tr></thead><tbody>{companies.map(company=><tr key={company.name}><td className="project-title"><i className="project-mark">{company.name[0]}</i>{company.name}</td><td>{company.industry}</td><td>{company.value}</td><td><span className={`badge ${company.tone}`}>{company.stage}</span></td></tr>)}</tbody></table></article></>}

function HR() {const people=[{name:"Maya Chen",role:"Principal engineer",team:"Platform",score:"94",status:"Excelling"},{name:"Jonas Lee",role:"Delivery director",team:"Solutions",score:"89",status:"On track"},{name:"Nora Lewis",role:"Product designer",team:"Experience",score:"91",status:"Excelling"},{name:"Luis Ortega",role:"Data engineer",team:"Data",score:"82",status:"On track"}];return <><PageHeading page="People & HR" description="The teams, capacity and operating health behind every outcome."/><section className="kpi-grid"><Kpi label="Employees" value="320" meta="12 this quarter" icon={UserGroupIcon}/><Kpi label="Attendance" value="96.2%" meta="1.1% vs last month" icon={CalendarDaysIcon}/><Kpi label="Performance" value="88%" meta="3.6% against goal" icon={PresentationChartLineIcon}/><Kpi label="Open roles" value="14" meta="3 this week" icon={UsersIcon}/><Kpi label="Team capacity" value="86%" meta="5.2% healthy" icon={BoltIcon}/></section><div className="lower-grid"><article className="panel projects-panel"><div className="panel-heading"><div><h2>Team performance</h2><p>Latest performance review signals</p></div><button className="portal-button"><PlusIcon width={13}/> Add employee</button></div><table className="table"><thead><tr><th>Person</th><th>Team</th><th>Score</th><th>Performance</th></tr></thead><tbody>{people.map(person=><tr key={person.name}><td><span className="project-title"><i className="profile-avatar">{person.name.split(" ").map(n=>n[0]).join("")}</i><span>{person.name}<small style={{display:"block",color:"#787a8e",marginTop:3}}>{person.role}</small></span></span></td><td>{person.team}</td><td>{person.score}%</td><td><span className={`badge ${person.status==="Excelling"?"good":"purple"}`}>{person.status}</span></td></tr>)}</tbody></table></article><article className="panel system-panel"><div className="panel-heading"><div><h2>Organization health</h2><p>Workforce operating indicators</p></div></div><div className="health-score"><i className="score"><b>91</b></i><div className="health-copy"><b>Strong organization health</b><span>Capacity and engagement are<br/>within QTS operating targets.</span></div></div><div className="status-list">{[["Strategic capacity","86%"],["Attendance rate","96.2%"],["Review completion","94%"],["Learning momentum","78%"]].map(([key,value])=><div className="status-row" key={key}><i className="status-dot"/><span>{key}</span><small>{value}</small></div>)}</div></article></div></>}

function Finance() {return <><PageHeading page="Finance" description="Revenue, cash and investment decisions with operational context."/><section className="kpi-grid"><Kpi label="Recognized revenue" value="$5.8M" meta="18.6% vs last period" icon={CreditCardIcon}/><Kpi label="Gross margin" value="68.4%" meta="2.1% vs target" icon={PresentationChartLineIcon}/><Kpi label="Outstanding invoices" value="$842K" meta="9.2% lower" icon={DocumentTextIcon}/><Kpi label="Operating costs" value="$1.7M" meta="4.8% below plan" icon={CircleStackIcon}/><Kpi label="Cash coverage" value="14.2 mo" meta="1.6 mo higher" icon={ShieldCheckIcon}/></section><div className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h2>Revenue by operating group</h2><p>Recognized revenue in the current period</p></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={utilization} margin={{top:12,right:10,left:-20,bottom:0}}><CartesianGrid vertical={false} stroke="rgba(255,255,255,.065)"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"#77798c",fontSize:9}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#77798c",fontSize:9}}/><Tooltip content={<SimpleTooltip/>}/><Bar dataKey="value" fill="#7e77ed" radius={[4,4,0,0]} maxBarSize={24}/></BarChart></ResponsiveContainer></div></article><article className="panel system-panel"><div className="panel-heading"><div><h2>Invoice controls</h2><p>Collections operating normally</p></div></div><div className="status-list" style={{marginTop:19,borderTop:0}}>{[["INV-2051 · Aster Health","$148,200","Due Mar 21"],["INV-2048 · Northstar","$96,400","Approved"],["INV-2040 · Coda Retail","$68,900","Processing"],["INV-2039 · Vektor","$42,600","Scheduled"]].map(([name,value,status])=><div className="status-row" style={{gridTemplateColumns:"1fr auto"}} key={name}><span><b style={{display:"block",fontSize:10,color:"#c9cad5"}}>{name}</b><small>{status}</small></span><span>{value}</span></div>)}</div></article></div></>}

function SimpleTooltip({active,payload,label}:{active?:boolean;payload?:{value:number}[];label?:string}){return active&&payload?.length?<div className="tooltip"><small>{label}</small><b>{payload[0].value}%</b> <span style={{color:"#aaaabd"}}>operating contribution</span></div>:null}
function Developer() {const logs=["GET /v1/operations/health 200  ·  82ms","POST /v1/workflows/run 202  ·  136ms","GET /v1/intelligence/forecast 200  ·  218ms","PATCH /v1/projects/qhp 200  ·  91ms"];return <><PageHeading page="Developer" description="The services, releases and integrations powering QTS Global."/><section className="kpi-grid"><Kpi label="API availability" value="99.99%" meta="0.04% month over month" icon={CloudArrowUpIcon}/><Kpi label="Deployments" value="38" meta="7 this week" icon={CommandLineIcon}/><Kpi label="API requests" value="18.4M" meta="22.8% vs last period" icon={CodeBracketSquareIcon}/><Kpi label="Service latency" value="96ms" meta="12ms faster" icon={BoltIcon}/><Kpi label="Active keys" value="76" meta="4 this quarter" icon={ShieldCheckIcon}/></section><div className="lower-grid"><article className="panel projects-panel"><div className="panel-heading"><div><h2>Deployment operations</h2><p>Production services synchronized with QTS core</p></div><button className="portal-button"><CloudArrowUpIcon width={13}/> Deploy</button></div><table className="table"><thead><tr><th>Service</th><th>Environment</th><th>Release</th><th>Status</th></tr></thead><tbody>{[["platform-api","Production","v2.18.4","Operational"],["intelligence-engine","Production","v1.9.2","Operational"],["workflow-orchestrator","Production","v3.4.1","Operational"],["client-gateway","Staging","v2.18.5-rc","Verifying"]].map(([service,environment,release,status])=><tr key={service}><td className="project-title"><i className="project-mark"><CommandLineIcon/></i>{service}</td><td>{environment}</td><td>{release}</td><td><span className={`badge ${status==="Operational"?"good":"warning"}`}>{status}</span></td></tr>)}</tbody></table></article><article className="panel activity-panel"><div className="panel-heading"><div><h2>Live request log</h2><p>Most recent API activity</p></div><i className="status-dot"/></div><div className="terminal">{logs.map((log,index)=><p key={log}><span>{String(index+1).padStart(2,"0")}</span>{log}</p>)}</div></article></div></>}

function Analytics() {return <><PageHeading page="Analytics" description="Decision intelligence for the full enterprise operating system."/><section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h2>Operating momentum</h2><p>Composite health index across all strategic programs</p></div><div className="panel-options"><button className="active">30D</button><button>90D</button></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performance} margin={{top:10,right:9,left:-20,bottom:0}}><defs><linearGradient id="analytics" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#4ccca0" stopOpacity=".26"/><stop offset="1" stopColor="#4ccca0" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.065)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#77798c",fontSize:9}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#77798c",fontSize:9}}/><Tooltip content={<ToolTip/>}/><Area type="monotone" dataKey="revenue" stroke="#50cda1" strokeWidth={2} fill="url(#analytics)"/></AreaChart></ResponsiveContainer></div></article><article className="panel system-panel"><div className="panel-heading"><div><h2>Signals worth attention</h2><p>Generated by QTS Intelligence</p></div><BoltIcon width={15} color="#9b95ff"/></div><div className="activity-feed">{[{title:"Revenue acceleration",text:"Manufacturing is tracking 8.2% above its operating plan."},{title:"Capacity risk",text:"Platform delivery is within 6% of the 92% intervention threshold."},{title:"Renewal opportunity",text:"Three EMEA accounts show positive expansion signals."}].map((x,index)=><div className="feed-item" key={x.title}><i className={`feed-icon ${index===0?"green":""}`}><BoltIcon/></i><div><b>{x.title}</b><p>{x.text}</p></div></div>)}</div></article></section></>}

function AccessSummaryChip({ label, tone }: { label: string; tone: "good" | "warning" | "blue" | "purple" }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}

function AccessManagement({ person, entitlements, canManageAccess }: { person: Person; entitlements: PortalEntitlements; canManageAccess: boolean }) {
  const enabledCount = allModules.filter(module => entitlements.modules[module.page]).length;

  return <article className="panel access-panel">
    <div className="panel-heading"><div><h2>Effective portal access</h2><p>Permissions are evaluated by QTS Identity and cannot be changed from this portal.</p></div><AccessSummaryChip label={`${enabledCount} viewable modules`} tone={enabledCount === 0 ? "warning" : "good"} /></div>
    <div className="access-body">
      <div className="access-detail">
        <div className="access-person-summary">
          <i className="profile-avatar">{person.initials}</i>
          <div><b>{person.name}</b><small>{person.title} · {person.email}</small></div>
          {canManageAccess && <span className="badge purple">Identity administrator</span>}
        </div>
        {enabledCount === 0 && <p className="access-warning" role="status">This account currently has no view access to any portal module.</p>}
        <p className="access-readonly-note">Roles and individual permission grants are managed and audited in QTS Identity.</p>
        <div className="access-matrix" aria-label={`Effective module access for ${person.name}`}>
          <div className="access-matrix-head"><span>Module</span><span>View</span><span>Manage</span></div>
          {allModules.map(module => {
            const ModuleIcon = module.icon;
            const canView = Boolean(entitlements.modules[module.page]);
            const canManage = module.page === "Settings" && canManageAccess;
            return <div className="access-matrix-row" key={module.page}>
              <span className="access-module"><ModuleIcon width={14} aria-hidden="true"/><span><b>{module.page}</b><small>{permissionLabels[module.page]}</small></span></span>
              <span className={`capability-toggle ${canView ? "on" : "readonly"}`}><i aria-hidden="true"/><span>{canView ? "View" : "No view"}</span></span>
              <span className={`capability-toggle ${canManage ? "on" : "readonly"}`}><i aria-hidden="true"/><span>{canManage ? "Manage" : canView ? "View only" : "—"}</span></span>
            </div>;
          })}
        </div>
      </div>
    </div>
  </article>;
}

function Settings({ person, entitlements, canManageAccess }: { person: Person; entitlements: PortalEntitlements; canManageAccess: boolean }) {
  return <><PageHeading page="Settings" description="Review organization access and QTS operating preferences."/>
    <AccessManagement person={person} entitlements={entitlements} canManageAccess={canManageAccess}/>
    <div className="settings-grid settings-support-grid">
      {[["Organization", "QTS Global", "Company profile, regional context and operating defaults", BuildingIcon],["Authentication", "QTS Identity", "Centralized SSO and session security", ShieldCheckIcon],["Identity Console", canManageAccess ? "Administrative access" : "Read-only access", "Roles and individual grants are controlled in the Identity Center", CodeBracketSquareIcon]].map(([title,value,copy,Icon])=>{const Comp=Icon as Icon;return <article className="panel setting-card" key={title as string}><i><Comp/></i><h2>{title as string}</h2><b>{value as string}</b><p>{copy as string}</p><a className="date-filter" href={`${identityWebOrigin}/console`}>Open Identity Center <ChevronDownIcon width={12}/></a></article>})}
    </div>
  </>;
}

function AccessDenied() {
  return <section className="access-denied panel">
    <i className="access-denied-icon"><LockClosedIcon width={22} aria-hidden="true"/></i>
    <h1>No portal access</h1>
    <p>Your account currently has no view permissions for any portal module. Contact an administrator to request access.</p>
  </section>;
}

function Login({ error, onSignIn, busy }: { error?: string; onSignIn: () => void; busy?: boolean }) {
  return <main className="login"><i className="particles"/><motion.section className="login-card" initial={{opacity:0,y:18,scale:.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.45}}><div className="login-logo"><Logo/></div><h1>Welcome to QTS</h1><p>Continue through QTS Identity to access your secure enterprise workspace.</p>{error&&<p className="login-error" role="alert">{error}</p>}<button className="portal-button" type="button" onClick={onSignIn} disabled={busy}>{busy ? "Redirecting to QTS Identity…" : <>Continue to QTS Portal <ArrowRightIcon width={14}/></>}</button><p className="login-hint">Authentication and access permissions are managed by QTS Identity.</p></motion.section></main>;
}

function AuthenticationStatus() {
  return <main className="login"><i className="particles"/><motion.section className="login-card" initial={{opacity:0,y:18,scale:.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.45}}><div className="login-logo"><Logo/></div><h1>Completing sign-in</h1><p>Verifying your QTS Identity session and portal access.</p></motion.section></main>;
}

export default function PortalApp() {
  const [identity, setIdentity] = useState<IdentityState | null>(null);
  const [phase, setPhase] = useState<AuthPhase>(() => isAuthorizationCallback() ? "authenticating" : "unauthenticated");
  const [authenticationError, setAuthenticationError] = useState("");
  const [page,setPage]=useState<Page>("Dashboard");
  const [command,setCommand]=useState(false);

  useEffect(() => {
    if (!isAuthorizationCallback()) return;
    let cancelled = false;

    void (async () => {
      try {
        const tokens = await redeemAuthorizationResponse();
        const { profile, entitlements } = await loadPortalIdentity(tokens.access_token);
        if (cancelled) return;
        setIdentity({
          accessToken: tokens.access_token,
          person: personFromUserInfo(profile, entitlements),
          entitlements,
        });
        setPhase("authenticated");
        window.history.replaceState({}, document.title, "/");
      } catch (error) {
        if (cancelled) return;
        setAuthenticationError(error instanceof Error ? error.message : "Sign-in could not be completed.");
        setPhase("error");
        window.history.replaceState({}, document.title, "/");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(()=>{const shortcut=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setCommand(true);}};window.addEventListener("keydown",shortcut);return()=>window.removeEventListener("keydown",shortcut);},[]);

  const allowedModules = useMemo(() => identity ? allModules.filter(module => identity.entitlements.modules[module.page]).map(module => module.page) : [], [identity]);
  const allowedNav = useMemo(() => nav.filter(item => allowedModules.includes(item.page)), [allowedModules]);
  const allowedSecondary = useMemo(() => secondary.filter(item => allowedModules.includes(item.page)), [allowedModules]);
  const canManageSettings = Boolean(identity?.entitlements.manage.Settings);

  useEffect(() => {
    if (!identity || allowedModules.includes(page)) return;
    const fallback = allowedModules[0];
    if (fallback) setPage(fallback);
  }, [allowedModules, identity, page]);

  const signIn = () => {
    setAuthenticationError("");
    setPhase("authenticating");
    void beginAuthorization().catch(error => {
      setAuthenticationError(error instanceof Error ? error.message : "Sign-in could not be started.");
      setPhase("error");
    });
  };

  const signOut = () => {
    setCommand(false);
    setIdentity(null);
    setPhase("unauthenticated");
    void beginLogout().catch(error => {
      setAuthenticationError(error instanceof Error ? error.message : "Sign-out could not be completed.");
      setPhase("error");
    });
  };

  if (phase === "authenticating") return <AuthenticationStatus/>;
  if (!identity) return <Login error={phase === "error" ? authenticationError : undefined} onSignIn={signIn}/>;

  const person = identity.person;
  if (allowedModules.length === 0) {
    return <main className="portal-shell portal-shell-empty"><div className="workspace"><Topbar page={page} onCommand={()=>setCommand(true)}/><main className="main-content"><AccessDenied/></main></div><div className="portal-empty-sidebar"><ProfileMenu person={person} onSignOut={signOut}/></div></main>;
  }

  const renderPage=()=>({Dashboard:<Dashboard person={person}/>,Projects:<Projects/>,CRM:<CRM/>,HR:<HR/>,Finance:<Finance/>,Developer:<Developer/>,Analytics:<Analytics/>,Settings:<Settings person={person} entitlements={identity.entitlements} canManageAccess={canManageSettings}/>}[page]);
  return <div className="portal-shell"><Sidebar page={page} onPage={setPage} person={person} allowedNav={allowedNav} allowedSecondary={allowedSecondary} onLogout={signOut}/><div className="workspace"><Topbar page={page} onCommand={()=>setCommand(true)}/><main className="main-content"><AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.18}}>{renderPage()}</motion.div></AnimatePresence></main></div><AnimatePresence>{command&&<CommandPalette onClose={()=>setCommand(false)} onPage={setPage} allowedModules={allowedModules}/>}</AnimatePresence></div>;
}
