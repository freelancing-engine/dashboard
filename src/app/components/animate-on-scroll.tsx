"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { EASING_ENTRANCE } from "@/lib/animation";
import { useA11y } from "./accessibility-provider";

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimateOnScroll({
  children,
  className,
  delay = 0,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { reduceMotion } = useA11y();

  useEffect(() => {
    if (reduceMotion) {
      setIsVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: EASING_ENTRANCE, delay }}
    >
      {children}
    </motion.div>
  );
}
