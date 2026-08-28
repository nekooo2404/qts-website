"use client";

import { MotionConfig } from "framer-motion";
import Cursor from "./Cursor";

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Cursor />
      {children}
    </MotionConfig>
  );
}
