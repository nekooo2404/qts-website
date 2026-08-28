"use client";

import { motion } from "framer-motion";
import { ArrowUpRightIcon, CloudIcon, CommandLineIcon, GlobeAltIcon, SparklesIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

type Solution = { title: string; description: string; icon: typeof SparklesIcon; className: string; type: "columns" | "list" | "ai" | "cloud" };

const solutions: Solution[] = [
  { title: "Enterprise Software", description: "Core systems that make complex organizations more responsive.", icon: Squares2X2Icon, className: "enterprise", type: "columns" },
  { title: "SaaS Platforms", description: "Products your customers choose to return to.", icon: GlobeAltIcon, className: "", type: "list" },
  { title: "AI Solutions", description: "Intelligence integrated into the flow of work.", icon: SparklesIcon, className: "", type: "ai" },
  { title: "Cloud Systems", description: "Modern foundations ready for every next move.", icon: CloudIcon, className: "cloud", type: "cloud" },
  { title: "Web Applications", description: "Digital experiences that perform at any scale.", icon: CommandLineIcon, className: "", type: "list" },
];

function MiniGraphic({ type }: { type: Solution["type"] }) {
  if (type === "cloud") return <div className="cloud-graphic"><span /><span /><span /></div>;
  return <div className="mini-window" aria-hidden="true"><i className="mini-line wide" /><i className="mini-line" />{type === "columns" ? <div className="mini-columns">{[43, 68, 56, 85, 70, 94].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div> : <div className="mini-list"><i /><i /><i /></div>}</div>;
}

export default function SolutionsBento() {
  return <motion.div className="bento" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .15 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: .07 } } }}>
    {solutions.map((solution) => {
      const SolutionIcon = solution.icon;
      return <motion.article className={`solution ${solution.className}`} key={solution.title} variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}><i className="solution-icon"><SolutionIcon /></i><h3>{solution.title}</h3><p>{solution.description}</p><MiniGraphic type={solution.type} /><i className="solution-arrow"><ArrowUpRightIcon width={15} /></i></motion.article>;
    })}
  </motion.div>;
}
