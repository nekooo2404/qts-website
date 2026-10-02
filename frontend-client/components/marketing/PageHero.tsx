"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { staggerContainer, staggerItem } from "@/lib/motion";

export default function PageHero({ eyebrow, title, children, aside }: { eyebrow: string; title: string; children: ReactNode; aside?: ReactNode }) {
  const reducedMotion = useReducedMotion();
  return <section className="page-hero noise"><div className="container page-hero-grid">
    <motion.div initial={reducedMotion ? false : "hidden"} animate="visible" variants={staggerContainer(0.1, 0.12)}>
      <motion.span className="eyebrow" variants={staggerItem}>{eyebrow}</motion.span>
      <motion.h1 className="display" variants={staggerItem}>{title}</motion.h1>
      <motion.div className="page-hero-copy" variants={staggerItem}>{children}</motion.div>
    </motion.div>
    {aside && <motion.div className="page-hero-aside" initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}>{aside}</motion.div>}
  </div></section>;
}
