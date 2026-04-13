"use client";

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { EASING_DATA, STAGGER_DEFAULT } from "@/lib/animation";

interface ScoreDimension {
  label: string;
  value: number;
  max: number;
}

interface SpiderChartProps {
  dimensions: ScoreDimension[];
  size?: number;
  className?: string;
}

const REDUCED_MOTION =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

export default function SpiderChart({
  dimensions,
  size = 260,
  className,
}: SpiderChartProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const center = size / 2;
  const radius = (size - 60) / 2; // leave room for labels
  const n = dimensions.length;
  const angleStep = (2 * Math.PI) / n;

  // Web rings (background grid)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Calculate points for each dimension
  const points = useMemo(
    () =>
      dimensions.map((dim, i) => {
        const angle = i * angleStep - Math.PI / 2; // start from top
        const pct = dim.value / dim.max;
        return {
          ...dim,
          pct,
          x: center + radius * pct * Math.cos(angle),
          y: center + radius * pct * Math.sin(angle),
          labelX: center + (radius + 20) * Math.cos(angle),
          labelY: center + (radius + 20) * Math.sin(angle),
          axisEndX: center + radius * Math.cos(angle),
          axisEndY: center + radius * Math.sin(angle),
        };
      }),
    [dimensions, center, radius, angleStep, n],
  );

  // SVG path for the filled area
  const areaPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const closedPath = `${areaPath} Z`;

  // Target path for animation (starts from center)
  const centerPath = points
    .map((_, i) => `${i === 0 ? "M" : "L"} ${center} ${center}`)
    .join(" ");
  const closedCenterPath = `${centerPath} Z`;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${size} ${size}`}
      className={`w-full max-w-[300px] mx-auto ${className ?? ""}`}
    >
      {/* Web rings */}
      {rings.map((ringPct) => (
        <polygon
          key={ringPct}
          points={Array.from({ length: n })
            .map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x = center + radius * ringPct * Math.cos(angle);
              const y = center + radius * ringPct * Math.sin(angle);
              return `${x},${y}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(180, 160, 212, 0.15)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {points.map((p, i) => (
        <line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={p.axisEndX}
          y2={p.axisEndY}
          stroke="rgba(180, 160, 212, 0.1)"
          strokeWidth={0.5}
        />
      ))}

      {/* Filled area — animate from center outward */}
      <motion.path
        d={closedPath}
        fill="rgba(160, 255, 122, 0.12)"
        stroke="#a0ff7a"
        strokeWidth={1.5}
        initial={{
          d: REDUCED_MOTION ? closedPath : closedCenterPath,
          opacity: 0,
        }}
        animate={
          isInView
            ? { d: closedPath, opacity: 1 }
            : { d: closedCenterPath, opacity: 0 }
        }
        transition={{
          duration: REDUCED_MOTION ? 0 : 0.8,
          ease: EASING_DATA,
        }}
      />

      {/* Data points — staggered appearance */}
      {points.map((p, i) => (
        <motion.circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill="#a0ff7a"
          stroke="#0c0614"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{
            duration: REDUCED_MOTION ? 0 : 0.4,
            ease: EASING_DATA,
            delay: REDUCED_MOTION ? 0 : i * STAGGER_DEFAULT,
          }}
        />
      ))}

      {/* Labels */}
      {points.map((p, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const angleDeg = (angle * 180) / Math.PI;
        // Determine text anchor based on position
        let anchor: "start" | "middle" | "end" = "middle";
        if (angleDeg > -80 && angleDeg < 80) anchor = "start";
        else if (angleDeg > 100 || angleDeg < -100) anchor = "end";

        return (
          <motion.text
            key={`label-${i}`}
            x={p.labelX}
            y={p.labelY}
            textAnchor={anchor}
            dominantBaseline="central"
            className="fill-[#a898cc] text-[9px]"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{
              duration: REDUCED_MOTION ? 0 : 0.3,
              delay: REDUCED_MOTION ? 0 : 0.4 + i * STAGGER_DEFAULT,
            }}
          >
            {p.label}
          </motion.text>
        );
      })}

      {/* Value labels */}
      {points.map((p, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const valX = center + (radius * p.pct + 10) * Math.cos(angle);
        const valY = center + (radius * p.pct + 10) * Math.sin(angle);
        return (
          <motion.text
            key={`val-${i}`}
            x={valX}
            y={valY}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[#f0eeff] text-[8px] font-mono font-bold"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{
              duration: REDUCED_MOTION ? 0 : 0.3,
              delay: REDUCED_MOTION ? 0 : 0.5 + i * STAGGER_DEFAULT,
            }}
          >
            {p.value}
          </motion.text>
        );
      })}
    </svg>
  );
}
