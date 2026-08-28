"use client";
import { motion, useReducedMotion } from "framer-motion";

export default function Loading() {
  const r = useReducedMotion();
  return (
    <div style={{ minHeight: "65vh", display: "grid", placeItems: "center", padding: 40 }}>
      <div style={{ textAlign: "center" }}>
        <motion.div
          className="brand-mark"
          style={{ width: 38, height: 38, display: "inline-block", borderRadius: 10 }}
          animate={r ? undefined : { scale: [1, 1.06, 1], opacity: [1, 0.95, 1] }}
          transition={r ? undefined : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div style={{ marginTop: 18, width: 96, height: 2, borderRadius: 999, background: "rgba(29,32,74,.12)", overflow: "hidden", marginInline: "auto" }}>
          <motion.div
            style={{ height: "100%", background: "linear-gradient(90deg,#5b5cef 0%, #17b3dc 100%)", transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={r ? { scaleX: 1 } : { scaleX: [0, 1, 0.85, 1] }}
            transition={r ? { duration: 0 } : { duration: 1.2, repeat: Infinity, ease: [0.22, 1, 0.36, 1], repeatDelay: 0.3 }}
          />
        </div>
        <p style={{ marginTop: 12, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)" }}>Loading</p>
      </div>
    </div>
  );
}
