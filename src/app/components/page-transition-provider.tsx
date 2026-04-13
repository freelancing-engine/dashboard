"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { EASING_ENTRANCE, EASING_EXIT } from "@/lib/animation";
import { useA11y } from "./accessibility-provider";

/* ─────────────────────────────────────────────────────────
   Route-aware transition variants
   ───────────────────────────────────────────────────────── */

type TransitionKind = "default" | "detail" | "metrics" | "profile" | "back";

function classifyTransition(prev: string | null, next: string): TransitionKind {
  // Profile builder — always slide from right
  if (next.startsWith("/profiles")) return "profile";
  // Detail page — scale up from table
  if (next.match(/^\/leads\/[^/]+$/)) return "detail";
  // Metrics — stagger reveal
  if (next === "/metrics") return "metrics";
  // Going back to dashboard from detail/metrics/profiles
  if (
    next === "/" &&
    prev &&
    (prev.startsWith("/leads/") ||
      prev === "/metrics" ||
      prev.startsWith("/profiles"))
  )
    return "back";
  return "default";
}

/* Reduced-motion: simple crossfade */
const reducedVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
const reducedTransition = { duration: 0.15 };

/* Full variants per transition kind */
const variants: Record<
  TransitionKind,
  {
    initial: Record<string, number>;
    animate: Record<string, number>;
    exit: Record<string, number>;
  }
> = {
  default: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98 },
  },
  detail: {
    initial: { opacity: 0, y: 16, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  metrics: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98 },
  },
  profile: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  back: {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 },
  },
};

const enterTransition = { duration: 0.5, ease: EASING_ENTRANCE };
const exitTransition = { duration: 0.3, ease: EASING_EXIT };

/* ─────────────────────────────────────────────────────────
   Provider component
   ───────────────────────────────────────────────────────── */

export default function PageTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const kind = classifyTransition(prevPath.current, pathname);
  const { reduceMotion } = useA11y();

  // Update prevPath after classification
  const currentKind = kind;
  if (prevPath.current !== pathname) {
    prevPath.current = pathname;
  }

  if (reduceMotion) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={reducedVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={reducedTransition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  const v = variants[currentKind];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={v.initial}
        animate={{
          ...v.animate,
          transition: enterTransition,
        }}
        exit={{
          ...v.exit,
          transition: exitTransition,
        }}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
