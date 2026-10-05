import type { ReactNode } from "react";

type Variant = "up" | "scale" | "blur";

export default function Reveal({
  children,
  className,
  ...motionProps
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
}) {
  // Keep the public API stable for existing pages, but intentionally render
  // content statically. A marketing page should never make core copy depend
  // on an intersection observer or a blanket fade-up animation.
  // Animate.css is reserved for newly mounted feedback (forms), not scroll reveal.
  void motionProps;
  return (
    <div className={className}>{children}</div>
  );
}
