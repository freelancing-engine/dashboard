"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { EASING_DATA } from "@/lib/animation";
import { useA11y } from "./accessibility-provider";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function CountUp({
  value,
  duration = 0.8,
  className,
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  const { reduceMotion } = useA11y();

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    if (!isInView) return;

    const start = performance.now();
    const durationMs = duration * 1000;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // Apply easing (approximation of EASING_DATA curve)
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isInView, value, duration]);

  if (reduceMotion) {
    return (
      <span ref={ref} className={`font-mono ${className ?? ""}`}>
        {prefix}
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={`font-mono ${className ?? ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: EASING_DATA }}
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}
