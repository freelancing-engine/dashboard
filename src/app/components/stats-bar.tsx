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
  needs_review: "bg-amber-100 text-amber-800",
  scored: "bg-blue-100 text-blue-800",
  approved_for_draft: "bg-purple-100 text-purple-800",
  draft_ready: "bg-indigo-100 text-indigo-800",
  low_priority: "bg-gray-100 text-gray-600",
  applied_manually: "bg-cyan-100 text-cyan-800",
  replied: "bg-teal-100 text-teal-800",
  interview: "bg-green-100 text-green-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-500",
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
      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <div className="text-xs text-gray-500">Total leads</div>
        <div className="text-2xl font-bold">{totalLeads}</div>
      </div>
      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <div className="text-xs text-gray-500">Puntaje promedio</div>
        <div className="text-2xl font-bold">{scoreStats.avg ?? "—"}</div>
        <div className="text-xs text-gray-400">
          {scoreStats.min}–{scoreStats.max}
        </div>
      </div>
      {statusCounts
        .filter((s) => s.count > 0)
        .slice(0, 4)
        .map((s) => (
          <div
            key={s.lead_status}
            className="rounded-lg border bg-white p-3 shadow-sm"
          >
            <div className="text-xs text-gray-500">
              {STATUS_LABELS[s.lead_status] || s.lead_status}
            </div>
            <div className="text-2xl font-bold">{s.count}</div>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[s.lead_status] || "bg-gray-100"}`}
            >
              {s.lead_status}
            </span>
          </div>
        ))}
    </div>
  );
}

export { STATUS_LABELS, STATUS_COLORS };
