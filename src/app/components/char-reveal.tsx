"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { EASING_ENTRANCE } from "@/lib/animation";
import { useA11y } from "./accessibility-provider";

interface CharRevealProps {
  text: string;
  className?: string;
  stagger?: number;
}

export default function CharReveal({
  text,
  className,
  stagger = 0.03,
}: CharRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const { reduceMotion } = useA11y();
  const chars = text.split("");

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className ?? ""}`}>
      {chars.map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : undefined }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.4,
            ease: EASING_ENTRANCE,
            delay: i * stagger,
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
