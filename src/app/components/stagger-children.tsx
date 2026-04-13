"use client";

import { motion } from "framer-motion";
import { EASING_ENTRANCE, STAGGER_DEFAULT } from "@/lib/animation";
import { useA11y } from "./accessibility-provider";
import type { ReactNode } from "react";

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

const container = (stagger: number) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
    },
  },
});

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASING_ENTRANCE },
  },
};

export default function StaggerChildren({
  children,
  className,
  stagger = STAGGER_DEFAULT,
}: StaggerChildrenProps) {
  const { reduceMotion } = useA11y();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={container(stagger)}
      initial="hidden"
      animate="show"
    >
      {Array.isArray(children) ? (
        children.map((child, i) => (
          <motion.div key={i} variants={item}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={item}>{children}</motion.div>
      )}
    </motion.div>
  );
}
