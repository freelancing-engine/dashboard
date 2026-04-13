import type { StatusCount } from "@/lib/types";

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

const STATUS_COLORS: Record<string, string> = {
  needs_review: "bg-[#ff8a50]/10 text-[#ff8a50] border border-[#ff8a50]/20",
  scored: "bg-[#5ce0d8]/10 text-[#5ce0d8] border border-[#5ce0d8]/20",
  approved_for_draft:
    "bg-[#b4a0d4]/10 text-[#b4a0d4] border border-[#b4a0d4]/20",
  draft_ready: "bg-[#a0ff7a]/10 text-[#a0ff7a] border border-[#a0ff7a]/20",
  low_priority: "bg-[#766a94]/10 text-[#8578a4] border border-[#766a94]/20",
  applied_manually: "bg-[#5ce0d8]/10 text-[#5ce0d8] border border-[#5ce0d8]/20",
  replied: "bg-[#5ce0d8]/15 text-[#5ce0d8] border border-[#5ce0d8]/25",
  interview: "bg-[#a0ff7a]/10 text-[#a0ff7a] border border-[#a0ff7a]/20",
  won: "bg-[#a0ff7a]/15 text-[#a0ff7a] border border-[#a0ff7a]/30",
  lost: "bg-[#ff5c7a]/10 text-[#ff5c7a] border border-[#ff5c7a]/20",
  archived: "bg-[#766a94]/10 text-[#8578a4] border border-[#766a94]/20",
  new: "bg-[#b4a0d4]/10 text-[#b4a0d4] border border-[#b4a0d4]/20",
  normalized: "bg-[#b4a0d4]/10 text-[#b4a0d4] border border-[#b4a0d4]/20",
};

const STATUS_ACCENT: Record<string, string> = {
  needs_review: "kpi-card--warning",
  scored: "kpi-card--info",
  approved_for_draft: "kpi-card--primary",
  draft_ready: "kpi-card--primary",
  low_priority: "",
  applied_manually: "kpi-card--info",
  replied: "kpi-card--success",
  interview: "kpi-card--success",
  won: "kpi-card--success",
  lost: "kpi-card--error",
  archived: "",
};

export function StatsBar({
  statusCounts,
  scoreStats,
}: {
  statusCounts: StatusCount[];
  scoreStats: { avg: number; min: number; max: number; total: number };
}) {
  const totalLeads = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <div className="card kpi-card kpi-card--primary animate-fade-in stagger-1 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          Total leads
        </div>
        <div className="kpi-number mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
          {totalLeads}
        </div>
      </div>
      <div className="card kpi-card kpi-card--accent animate-fade-in stagger-2 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          Puntaje promedio
        </div>
        <div className="kpi-number mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
          {scoreStats.avg ?? "—"}
        </div>
        <div className="kpi-number mt-0.5 text-xs text-[var(--color-text-muted)]">
          {scoreStats.min}–{scoreStats.max}
        </div>
      </div>
      {statusCounts
        .filter((s) => s.count > 0)
        .slice(0, 4)
        .map((s, i) => (
          <div
            key={s.lead_status}
            className={`card kpi-card ${STATUS_ACCENT[s.lead_status] || ""} animate-fade-in stagger-${i + 3} p-4`}
          >
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              {STATUS_LABELS[s.lead_status] || s.lead_status}
            </div>
            <div className="kpi-number mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
              {s.count}
            </div>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.lead_status] || "bg-gray-100"}`}
            >
              {s.lead_status}
            </span>
          </div>
        ))}
    </div>
  );
}

export { STATUS_LABELS, STATUS_COLORS };
