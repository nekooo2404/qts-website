import type { Transition, Variants } from "framer-motion";

/** Premium ease used across the site — fast start, gentle settle. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Duration tiers (seconds). */
export const DUR = { fast: 0.2, base: 0.3, slow: 0.5 };

/** Spring for the mega menu: settles in ~250ms. */
export const SPRING_MENU: Transition = { type: "spring", stiffness: 380, damping: 30 };

/** Spring for the mobile menu sheet. */
export const SPRING_SHEET: Transition = { type: "spring", stiffness: 300, damping: 32 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

/** Mega menu spec: opacity 0→1, translateY -10→0, scale 0.98→1. */
export const megaMenu: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SPRING_MENU },
  exit: { opacity: 0, y: -6, scale: 0.99, transition: { duration: DUR.fast, ease: "easeIn" } },
};

/** Parent container that staggers its children. */
export function staggerContainer(delay = 0, stagger = 0.1): Variants {
  return {
    hidden: {},
    visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
  };
}

/** Child item used inside a stagger container. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};
