"use client";

import { motion } from "framer-motion";
import { ArrowUpRightIcon, CloudIcon, CommandLineIcon, GlobeAltIcon, SparklesIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

type Solution = { title: string; description: string; icon: typeof SparklesIcon; className: string; type: "columns" | "list" | "ai" | "cloud" };

const solutions: Solution[] = [
  { title: "Phần mềm doanh nghiệp", description: "Hệ thống cốt lõi giúp tổ chức phức tạp phản ứng nhanh hơn.", icon: Squares2X2Icon, className: "enterprise", type: "columns" },
  { title: "Nền tảng SaaS", description: "Sản phẩm số an toàn, có khả năng mở rộng theo thị trường.", icon: GlobeAltIcon, className: "", type: "list" },
  { title: "Giải pháp AI", description: "Trí tuệ được tích hợp vào luồng công việc thực tế.", icon: SparklesIcon, className: "", type: "ai" },
  { title: "Hệ thống đám mây", description: "Nền tảng hiện đại sẵn sàng cho mỗi bước phát triển tiếp theo.", icon: CloudIcon, className: "cloud", type: "cloud" },
  { title: "Ứng dụng web", description: "Trải nghiệm số hiệu năng cao ở mọi quy mô.", icon: CommandLineIcon, className: "", type: "list" },
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
