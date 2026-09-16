"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { DUR, EASE } from "@/lib/motion";

type Variant = "up" | "scale" | "blur";

const variants = {
  up: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
  blur: { hidden: { opacity: 0, filter: "blur(10px)", y: 12 }, visible: { opacity: 1, filter: "blur(0px)", y: 0 } },
} as const;

export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const v = variants[variant];
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={v as never}
      transition={{ duration: reducedMotion ? 0 : DUR.slow, ease: EASE, delay: reducedMotion ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
