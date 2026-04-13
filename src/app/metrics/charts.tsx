"use client";

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { EASING_DATA, EASING_ENTRANCE } from "@/lib/animation";
import type {
  NameValue,
  ProfileBreakdownItem,
  DailyIntakeItem,
  ScoreDistribution,
} from "@/lib/types";

/* ─────────────────────────────────────────────────────────
   Shared constants
   ───────────────────────────────────────────────────────── */

const REDUCED =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

const STATUS_COLORS: Record<string, string> = {
  needs_review: "#ff8a50",
  scored: "#5ce0d8",
  approved_for_draft: "#b4a0d4",
  draft_ready: "#a0ff7a",
  low_priority: "#766a94",
  applied_manually: "#5ce0d8",
  replied: "#5cffb0",
  interview: "#a0ff7a",
  won: "#a0ff7a",
  lost: "#ff5c7a",
  archived: "#766a94",
  new: "#a0ff7a",
  normalized: "#7bccff",
};

const VERDICT_COLORS: Record<string, string> = {
  apply_now: "#a0ff7a",
  strong_maybe: "#5ce0d8",
  maybe: "#ffd166",
  ignore: "#766a94",
  sin_veredicto: "#766a94",
};

const PIE_COLORS = [
  "#a0ff7a",
  "#5ce0d8",
  "#ff8a50",
  "#ff5c7a",
  "#b4a0d4",
  "#ffd166",
  "#7bccff",
  "#e07aff",
  "#5cffb0",
  "#ff7ac8",
];

const STATUS_LABELS: Record<string, string> = {
  needs_review: "Para revisar",
  scored: "Puntuados",
  approved_for_draft: "Aprobados",
  draft_ready: "Draft listo",
  low_priority: "Baja prioridad",
  applied_manually: "Aplicados",
  replied: "Con respuesta",
  interview: "Entrevista",
  won: "Ganados",
  lost: "Perdidos",
  archived: "Archivados",
  new: "Nuevos",
  normalized: "Normalizados",
};

const VERDICT_LABELS: Record<string, string> = {
  apply_now: "Aplicar ya",
  strong_maybe: "Fuerte quizás",
  maybe: "Quizás",
  ignore: "Ignorar",
  sin_veredicto: "Sin veredicto",
};

const PROFILE_LABELS: Record<string, string> = {
  flagship: "Flagship",
  ai_automation: "AI & Automation",
  backend_integrations: "Backend",
  azure_devops_iac: "Azure/DevOps",
  sin_perfil: "Sin perfil",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  email_alert: "Email alert",
  manual_link: "Manual (link)",
  manual_text: "Manual (texto)",
  saved_search_export: "Búsqueda guardada",
  notification: "Notificación",
  referral: "Referido",
  other: "Otro",
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  email_alert: "#ff5c7a",
  manual_link: "#a0ff7a",
  manual_text: "#5ce0d8",
  saved_search_export: "#ff8a50",
  notification: "#ffd166",
  referral: "#e07aff",
  other: "#766a94",
};

/* ─────────────────────────────────────────────────────────
   1. Pipeline funnel — horizontal bars sliding from left
   ───────────────────────────────────────────────────────── */

export function StatusChart({ data }: { data: NameValue[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barH = 28;
  const gap = 8;
  const labelW = 110;
  const chartW = 500;
  const barArea = chartW - labelW - 50;
  const totalH = data.length * (barH + gap);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${chartW} ${totalH}`}
      className="w-full"
      style={{ maxHeight: 340 }}
    >
      {data.map((d, i) => {
        const label = STATUS_LABELS[d.name] || d.name;
        const color = STATUS_COLORS[d.name] || "#766a94";
        const barW = (d.value / maxVal) * barArea;
        const y = i * (barH + gap);

        return (
          <g key={d.name}>
            <text
              x={labelW - 8}
              y={y + barH / 2 + 1}
              textAnchor="end"
              dominantBaseline="central"
              className="fill-[#a898cc] text-[11px]"
            >
              {label}
            </text>
            <rect
              x={labelW}
              y={y + 2}
              width={barArea}
              height={barH - 4}
              rx={4}
              fill="rgba(180, 160, 212, 0.06)"
            />
            <motion.rect
              x={labelW}
              y={y + 2}
              height={barH - 4}
              rx={4}
              fill={color}
              initial={{ width: 0, opacity: 0.6 }}
              animate={
                isInView
                  ? { width: barW, opacity: 1 }
                  : { width: 0, opacity: 0.6 }
              }
              transition={{
                duration: REDUCED ? 0 : 0.6,
                ease: EASING_DATA,
                delay: REDUCED ? 0 : i * 0.08,
              }}
            />
            <motion.text
              x={labelW + barW + 8}
              y={y + barH / 2 + 1}
              dominantBaseline="central"
              className="font-mono text-[11px] font-bold fill-[#f0eeff]"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{
                duration: REDUCED ? 0 : 0.3,
                delay: REDUCED ? 0 : 0.3 + i * 0.08,
              }}
            >
              {d.value}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   2. Verdict donut — animated segments
   ───────────────────────────────────────────────────────── */

export function VerdictChart({ data }: { data: NameValue[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 95;
  const innerR = 60;

  const segments = useMemo(() => {
    let cumAngle = -90;
    return data.map((d) => {
      const pct = d.value / total;
      const angle = pct * 360;
      const startAngle = cumAngle;
      cumAngle += angle;
      const endAngle = cumAngle;

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const x1 = cx + outerR * Math.cos(toRad(startAngle));
      const y1 = cy + outerR * Math.sin(toRad(startAngle));
      const x2 = cx + outerR * Math.cos(toRad(endAngle));
      const y2 = cy + outerR * Math.sin(toRad(endAngle));
      const ix1 = cx + innerR * Math.cos(toRad(endAngle));
      const iy1 = cy + innerR * Math.sin(toRad(endAngle));
      const ix2 = cx + innerR * Math.cos(toRad(startAngle));
      const iy2 = cy + innerR * Math.sin(toRad(startAngle));
      const largeArc = angle > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        "Z",
      ].join(" ");

      const midAngle = toRad(startAngle + angle / 2);
      const labelR = outerR + 18;

      return {
        ...d,
        path,
        pct,
        color: VERDICT_COLORS[d.name] || "#766a94",
        label: VERDICT_LABELS[d.name] || d.name,
        lx: cx + labelR * Math.cos(midAngle),
        ly: cy + labelR * Math.sin(midAngle),
        midAngleDeg: startAngle + angle / 2,
      };
    });
  }, [data, total, cx, cy]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[280px] mx-auto"
    >
      {segments.map((seg, i) => (
        <g key={seg.name}>
          <motion.path
            d={seg.path}
            fill={seg.color}
            fillOpacity={0.85}
            stroke="#0c0614"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{
              duration: REDUCED ? 0 : 0.6,
              ease: EASING_DATA,
              delay: REDUCED ? 0 : i * 0.15,
            }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          {seg.pct > 0.05 && (
            <motion.text
              x={seg.lx}
              y={seg.ly}
              textAnchor={
                seg.midAngleDeg > 0 && seg.midAngleDeg < 180 ? "start" : "end"
              }
              dominantBaseline="central"
              className="fill-[#a898cc] text-[10px]"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{
                delay: REDUCED ? 0 : 0.5 + i * 0.1,
                duration: REDUCED ? 0 : 0.3,
              }}
            >
              {seg.label}: {seg.value}
            </motion.text>
          )}
        </g>
      ))}
      <motion.text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="font-mono text-[22px] font-bold fill-[#f0eeff]"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: REDUCED ? 0 : 0.6, duration: REDUCED ? 0 : 0.4 }}
      >
        {total}
      </motion.text>
      <motion.text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        className="fill-[#a898cc] text-[10px] uppercase tracking-wider"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: REDUCED ? 0 : 0.7, duration: REDUCED ? 0 : 0.3 }}
      >
        leads
      </motion.text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   3. Platform breakdown — donut
   ───────────────────────────────────────────────────────── */

export function PlatformChart({ data }: { data: NameValue[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 95;
  const innerR = 60;

  const segments = useMemo(() => {
    let cumAngle = -90;
    return data.map((d, idx) => {
      const pct = d.value / total;
      const angle = pct * 360;
      const startAngle = cumAngle;
      cumAngle += angle;
      const endAngle = cumAngle;

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const x1 = cx + outerR * Math.cos(toRad(startAngle));
      const y1 = cy + outerR * Math.sin(toRad(startAngle));
      const x2 = cx + outerR * Math.cos(toRad(endAngle));
      const y2 = cy + outerR * Math.sin(toRad(endAngle));
      const ix1 = cx + innerR * Math.cos(toRad(endAngle));
      const iy1 = cy + innerR * Math.sin(toRad(endAngle));
      const ix2 = cx + innerR * Math.cos(toRad(startAngle));
      const iy2 = cy + innerR * Math.sin(toRad(startAngle));
      const largeArc = angle > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        "Z",
      ].join(" ");

      const midAngle = toRad(startAngle + angle / 2);
      const labelR = outerR + 18;

      return {
        ...d,
        path,
        pct,
        color: PIE_COLORS[idx % PIE_COLORS.length],
        lx: cx + labelR * Math.cos(midAngle),
        ly: cy + labelR * Math.sin(midAngle),
        midAngleDeg: startAngle + angle / 2,
      };
    });
  }, [data, total, cx, cy]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[280px] mx-auto"
    >
      {segments.map((seg, i) => (
        <g key={seg.name}>
          <motion.path
            d={seg.path}
            fill={seg.color}
            fillOpacity={0.85}
            stroke="#0c0614"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{
              duration: REDUCED ? 0 : 0.6,
              ease: EASING_DATA,
              delay: REDUCED ? 0 : i * 0.12,
            }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          {seg.pct > 0.05 && (
            <motion.text
              x={seg.lx}
              y={seg.ly}
              textAnchor={
                seg.midAngleDeg > 0 && seg.midAngleDeg < 180 ? "start" : "end"
              }
              dominantBaseline="central"
              className="fill-[#a898cc] text-[10px]"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{
                delay: REDUCED ? 0 : 0.4 + i * 0.1,
                duration: REDUCED ? 0 : 0.3,
              }}
            >
              {seg.name}: {seg.value}
            </motion.text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   4. Profile angle breakdown — grouped bars
   ───────────────────────────────────────────────────────── */

export function ProfileChart({ data }: { data: ProfileBreakdownItem[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.value, d.avg_score)),
    1,
  );
  const chartW = 500;
  const chartH = 260;
  const padL = 10;
  const padB = 40;
  const padT = 20;
  const barArea = chartH - padB - padT;
  const groupW = (chartW - padL) / data.length;
  const barW = groupW * 0.3;

  return (
    <svg ref={ref} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={padL}
          y1={padT + barArea * (1 - pct)}
          x2={chartW}
          y2={padT + barArea * (1 - pct)}
          stroke="rgba(180, 160, 212, 0.08)"
        />
      ))}

      {data.map((d, i) => {
        const label = PROFILE_LABELS[d.name] || d.name;
        const gx = padL + i * groupW + groupW / 2;
        const barH1 = (d.value / maxVal) * barArea;
        const barH2 = (d.avg_score / maxVal) * barArea;

        return (
          <g key={d.name}>
            <motion.rect
              x={gx - barW - 2}
              y={padT + barArea - barH1}
              width={barW}
              height={barH1}
              rx={3}
              fill="#5ce0d8"
              initial={{ height: 0, y: padT + barArea }}
              animate={
                isInView ? { height: barH1, y: padT + barArea - barH1 } : {}
              }
              transition={{
                duration: REDUCED ? 0 : 0.5,
                ease: EASING_ENTRANCE,
                delay: REDUCED ? 0 : i * 0.08,
              }}
            />
            <motion.rect
              x={gx + 2}
              y={padT + barArea - barH2}
              width={barW}
              height={barH2}
              rx={3}
              fill="#b4a0d4"
              initial={{ height: 0, y: padT + barArea }}
              animate={
                isInView ? { height: barH2, y: padT + barArea - barH2 } : {}
              }
              transition={{
                duration: REDUCED ? 0 : 0.5,
                ease: EASING_ENTRANCE,
                delay: REDUCED ? 0 : 0.08 + i * 0.08,
              }}
            />
            <text
              x={gx}
              y={chartH - 10}
              textAnchor="middle"
              className="fill-[#a898cc] text-[10px]"
            >
              {label}
            </text>
          </g>
        );
      })}

      <rect
        x={chartW - 170}
        y={4}
        width={10}
        height={10}
        rx={2}
        fill="#5ce0d8"
      />
      <text x={chartW - 155} y={12} className="fill-[#a898cc] text-[10px]">
        Leads
      </text>
      <rect
        x={chartW - 100}
        y={4}
        width={10}
        height={10}
        rx={2}
        fill="#b4a0d4"
      />
      <text x={chartW - 85} y={12} className="fill-[#a898cc] text-[10px]">
        Puntaje prom.
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   5. Daily intake — animated line chart with gradient
   ───────────────────────────────────────────────────────── */

export function DailyIntakeChart({ data }: { data: DailyIntakeItem[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const chartW = 500;
  const chartH = 260;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const points = data.map((d, i) => ({
    x: padL + (i / Math.max(data.length - 1, 1)) * plotW,
    y: padT + plotH - (d.count / maxCount) * plotH,
    label: d.date.slice(5),
    count: d.count,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? padL} ${padT + plotH} L ${padL} ${padT + plotH} Z`;

  const pathLength = 1500;

  return (
    <svg ref={ref} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a0ff7a" />
          <stop offset="100%" stopColor="#5ce0d8" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0ff7a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#a0ff7a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <g key={pct}>
          <line
            x1={padL}
            y1={padT + plotH * (1 - pct)}
            x2={chartW - padR}
            y2={padT + plotH * (1 - pct)}
            stroke="rgba(180, 160, 212, 0.08)"
          />
          <text
            x={padL - 6}
            y={padT + plotH * (1 - pct) + 3}
            textAnchor="end"
            className="fill-[#a898cc] font-mono text-[9px]"
          >
            {Math.round(maxCount * pct)}
          </text>
        </g>
      ))}

      <motion.path
        d={areaPath}
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: REDUCED ? 0 : 0.8, delay: REDUCED ? 0 : 0.3 }}
      />

      <motion.path
        d={linePath}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{
          strokeDasharray: pathLength,
          strokeDashoffset: REDUCED ? 0 : pathLength,
        }}
        animate={
          isInView ? { strokeDashoffset: 0 } : { strokeDashoffset: pathLength }
        }
        transition={{ duration: REDUCED ? 0 : 1.2, ease: EASING_DATA }}
      />

      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill="#a0ff7a"
          stroke="#0c0614"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{
            duration: REDUCED ? 0 : 0.3,
            delay: REDUCED ? 0 : 0.6 + i * 0.04,
          }}
        />
      ))}

      {points.map((p, i) => {
        if (data.length > 14 && i % 2 !== 0) return null;
        return (
          <text
            key={`xl-${i}`}
            x={p.x}
            y={chartH - 8}
            textAnchor="middle"
            className="fill-[#a898cc] text-[9px]"
          >
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   6. Score distribution — springy histogram bars
   ───────────────────────────────────────────────────────── */

const SCORE_RANGE_ORDER = [
  "0-39",
  "40-49",
  "50-59",
  "60-69",
  "70-79",
  "80-100",
];

function scoreRangeColor(range: string): string {
  const num = parseInt(range);
  if (num >= 70) return "#a0ff7a";
  if (num >= 55) return "#ffd166";
  if (num >= 40) return "#ff8a50";
  return "#ff5c7a";
}

export function ScoreDistributionChart({
  data,
}: {
  data: ScoreDistribution[];
}) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const sorted = SCORE_RANGE_ORDER.map((range) => ({
    range,
    count: data.find((d) => d.range === range)?.count || 0,
  }));

  const maxCount = Math.max(...sorted.map((d) => d.count), 1);
  const chartW = 500;
  const chartH = 260;
  const padL = 40;
  const padR = 20;
  const padT = 10;
  const padB = 40;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const barW = plotW / sorted.length - 8;

  return (
    <svg ref={ref} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <g key={pct}>
          <line
            x1={padL}
            y1={padT + plotH * (1 - pct)}
            x2={chartW - padR}
            y2={padT + plotH * (1 - pct)}
            stroke="rgba(180, 160, 212, 0.08)"
          />
          <text
            x={padL - 6}
            y={padT + plotH * (1 - pct) + 3}
            textAnchor="end"
            className="fill-[#a898cc] font-mono text-[9px]"
          >
            {Math.round(maxCount * pct)}
          </text>
        </g>
      ))}

      {sorted.map((d, i) => {
        const color = scoreRangeColor(d.range);
        const barH = (d.count / maxCount) * plotH;
        const x = padL + i * (plotW / sorted.length) + 4;
        const y = padT + plotH - barH;

        return (
          <g key={d.range}>
            <rect
              x={x}
              y={padT}
              width={barW}
              height={plotH}
              rx={4}
              fill="rgba(180, 160, 212, 0.04)"
            />
            <motion.rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={color}
              fillOpacity={0.85}
              initial={{ height: 0, y: padT + plotH }}
              animate={
                isInView ? { height: barH, y } : { height: 0, y: padT + plotH }
              }
              transition={{
                duration: REDUCED ? 0 : 0.5,
                ease: EASING_ENTRANCE,
                delay: REDUCED ? 0 : i * 0.06,
              }}
            />
            {d.count > 0 && (
              <motion.text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                className="font-mono text-[10px] font-bold fill-[#f0eeff]"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{
                  delay: REDUCED ? 0 : 0.3 + i * 0.06,
                  duration: REDUCED ? 0 : 0.3,
                }}
              >
                {d.count}
              </motion.text>
            )}
            <text
              x={x + barW / 2}
              y={chartH - 10}
              textAnchor="middle"
              className="fill-[#a898cc] text-[10px]"
            >
              {d.range}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   7. Source type — horizontal bars
   ───────────────────────────────────────────────────────── */

export function SourceTypeChart({ data }: { data: NameValue[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barH = 28;
  const gap = 8;
  const labelW = 130;
  const chartW = 500;
  const barArea = chartW - labelW - 50;
  const totalH = data.length * (barH + gap);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${chartW} ${totalH}`}
      className="w-full"
      style={{ maxHeight: 300 }}
    >
      {data.map((d, i) => {
        const label = SOURCE_TYPE_LABELS[d.name] || d.name;
        const color =
          SOURCE_TYPE_COLORS[d.name] || PIE_COLORS[i % PIE_COLORS.length];
        const barW = (d.value / maxVal) * barArea;
        const y = i * (barH + gap);

        return (
          <g key={d.name}>
            <text
              x={labelW - 8}
              y={y + barH / 2 + 1}
              textAnchor="end"
              dominantBaseline="central"
              className="fill-[#a898cc] text-[11px]"
            >
              {label}
            </text>
            <rect
              x={labelW}
              y={y + 2}
              width={barArea}
              height={barH - 4}
              rx={4}
              fill="rgba(180, 160, 212, 0.06)"
            />
            <motion.rect
              x={labelW}
              y={y + 2}
              height={barH - 4}
              rx={4}
              fill={color}
              initial={{ width: 0, opacity: 0.6 }}
              animate={
                isInView
                  ? { width: barW, opacity: 1 }
                  : { width: 0, opacity: 0.6 }
              }
              transition={{
                duration: REDUCED ? 0 : 0.6,
                ease: EASING_DATA,
                delay: REDUCED ? 0 : i * 0.08,
              }}
            />
            <motion.text
              x={labelW + barW + 8}
              y={y + barH / 2 + 1}
              dominantBaseline="central"
              className="font-mono text-[11px] font-bold fill-[#f0eeff]"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{
                delay: REDUCED ? 0 : 0.3 + i * 0.08,
                duration: REDUCED ? 0 : 0.3,
              }}
            >
              {d.value}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}
