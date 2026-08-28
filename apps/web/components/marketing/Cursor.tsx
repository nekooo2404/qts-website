"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export default function Cursor() {
  const [ready, setReady] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reduce = useReducedMotion();
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const x = useSpring(mx, { stiffness: 400, damping: 30 });
  const y = useSpring(my, { stiffness: 400, damping: 30 });

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setReady(true);
    function move(e: MouseEvent) {
      mx.set(e.clientX);
      my.set(e.clientY);
    }
    function over(e: MouseEvent) {
      const t = e.target as HTMLElement;
      setHovering(!!t.closest("a, button, [role='button'], [data-cursor-hover]"));
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [mx, my, reduce]);

  if (!ready || reduce) return null;
  return (
    <motion.div
      aria-hidden
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      className={`cursor-ring ${hovering ? "hovering" : ""}`}
    />
  );
}
