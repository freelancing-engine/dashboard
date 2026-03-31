"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type {
  NameValue,
  ProfileBreakdownItem,
  DailyIntakeItem,
  ScoreDistribution,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Color palettes
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  needs_review: "#f59e0b",
  scored: "#3b82f6",
  approved_for_draft: "#8b5cf6",
  draft_ready: "#6366f1",
  low_priority: "#9ca3af",
  applied_manually: "#06b6d4",
  replied: "#14b8a6",
  interview: "#22c55e",
  won: "#10b981",
  lost: "#ef4444",
  archived: "#6b7280",
  new: "#a3e635",
  normalized: "#60a5fa",
};

const VERDICT_COLORS: Record<string, string> = {
  apply_now: "#16a34a",
  strong_maybe: "#22c55e",
  maybe: "#eab308",
  ignore: "#9ca3af",
  sin_veredicto: "#d1d5db",
};

const PIE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const PROFILE_LABELS: Record<string, string> = {
  flagship: "Flagship",
  ai_automation: "AI & Automation",
  backend_integrations: "Backend",
  azure_devops_iac: "Azure/DevOps",
  sin_perfil: "Sin perfil",
};

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

// ---------------------------------------------------------------------------
// Pipeline funnel (status breakdown)
// ---------------------------------------------------------------------------

export function StatusChart({ data }: { data: NameValue[] }) {
  const mapped = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.name] || d.name,
    fill: STATUS_COLORS[d.name] || "#9ca3af",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={mapped} layout="vertical" margin={{ left: 100 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="label" width={90} fontSize={12} />
        <Tooltip />
        <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]}>
          {mapped.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Verdict distribution (pie)
// ---------------------------------------------------------------------------

export function VerdictChart({ data }: { data: NameValue[] }) {
  const mapped = data.map((d) => ({
    ...d,
    label: VERDICT_LABELS[d.name] || d.name,
    fill: VERDICT_COLORS[d.name] || "#9ca3af",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={mapped}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(props: PieLabelRenderProps) => {
            const d = props.payload as Record<string, unknown>;
            return `${d.label ?? d.name}: ${props.value}`;
          }}
        >
          {mapped.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Platform breakdown (pie)
// ---------------------------------------------------------------------------

export function PlatformChart({ data }: { data: NameValue[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(props: PieLabelRenderProps) => `${props.name}: ${props.value}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Profile angle breakdown (bar + avg score)
// ---------------------------------------------------------------------------

export function ProfileChart({ data }: { data: ProfileBreakdownItem[] }) {
  const mapped = data.map((d) => ({
    ...d,
    label: PROFILE_LABELS[d.name] || d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={mapped}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="value"
          name="Leads"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="right"
          dataKey="avg_score"
          name="Puntaje prom."
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Daily lead intake (line)
// ---------------------------------------------------------------------------

export function DailyIntakeChart({ data }: { data: DailyIntakeItem[] }) {
  const mapped = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mapped}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="count"
          name="Leads"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Score distribution (histogram)
// ---------------------------------------------------------------------------

const SCORE_RANGE_ORDER = ["0-39", "40-49", "50-59", "60-69", "70-79", "80-100"];

export function ScoreDistributionChart({
  data,
}: {
  data: ScoreDistribution[];
}) {
  const sorted = SCORE_RANGE_ORDER.map((range) => ({
    range,
    count: data.find((d) => d.range === range)?.count || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sorted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" fontSize={12} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="Leads" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
          {sorted.map((entry, i) => {
            const num = parseInt(entry.range);
            let color = "#ef4444"; // red
            if (num >= 70) color = "#22c55e";
            else if (num >= 55) color = "#eab308";
            else if (num >= 40) color = "#f97316";
            return <Cell key={i} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
