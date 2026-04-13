"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { EASING_ENTRANCE, STAGGER_FAST } from "@/lib/animation";
import { useA11y } from "./accessibility-provider";

interface DigitFlipProps {
  value: number;
  className?: string;
}

export default function DigitFlip({ value, className }: DigitFlipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const { reduceMotion } = useA11y();
  const digits = String(value).split("");

  if (reduceMotion) {
    return (
      <span className={`inline-flex font-mono ${className ?? ""}`}>
        {value}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={`inline-flex overflow-hidden font-mono ${className ?? ""}`}
    >
      {digits.map((digit, i) => (
        <motion.span
          key={`${i}-${digit}`}
          className="inline-block"
          initial={{ y: "100%", opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{
            duration: 0.4,
            ease: EASING_ENTRANCE,
            delay: i * STAGGER_FAST,
          }}
        >
          {digit}
        </motion.span>
      ))}
    </span>
  );
}
