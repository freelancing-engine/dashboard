"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useA11y } from "./accessibility-provider";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const { reduceMotion } = useA11y();

  useEffect(() => {
    if (reduceMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reduceMotion]);

  return <>{children}</>;
}
