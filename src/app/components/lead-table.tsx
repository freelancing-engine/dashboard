import Link from "next/link";
import type { LeadListItem } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "./stats-bar";

const VERDICT_BADGE: Record<string, string> = {
  apply_now: "bg-green-600 text-white",
  strong_maybe: "bg-emerald-100 text-emerald-800",
  maybe: "bg-yellow-100 text-yellow-800",
  ignore: "bg-gray-200 text-gray-500",
};

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400">—</span>;
  const pct = Math.min(score, 100);
  let color = "bg-red-400";
  if (pct >= 70) color = "bg-green-500";
  else if (pct >= 55) color = "bg-yellow-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium">{score}</span>
    </div>
  );
}

export function LeadTable({ leads }: { leads: LeadListItem[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        No se encontraron leads.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Plataforma</th>
            <th className="px-4 py-3">País</th>
            <th className="px-4 py-3">Presupuesto</th>
            <th className="px-4 py-3">Puntaje</th>
            <th className="px-4 py-3">Veredicto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Perfil</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {leads.map((lead) => (
            <tr key={lead.lead_id} className="hover:bg-gray-50">
              <td className="max-w-xs truncate px-4 py-3">
                <Link
                  href={`/leads/${lead.lead_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {lead.title || "Sin título"}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize">{lead.platform}</td>
              <td className="px-4 py-3">{lead.client_country || "—"}</td>
              <td className="px-4 py-3">{lead.budget_value || "—"}</td>
              <td className="px-4 py-3">
                <ScoreBar score={lead.score_total} />
              </td>
              <td className="px-4 py-3">
                {lead.verdict ? (
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${VERDICT_BADGE[lead.verdict] || "bg-gray-100"}`}
                  >
                    {lead.verdict.replace(/_/g, " ")}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[lead.lead_status] || "bg-gray-100"}`}
                >
                  {STATUS_LABELS[lead.lead_status] || lead.lead_status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs">
                {lead.best_profile_angle?.replace(/_/g, " ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
