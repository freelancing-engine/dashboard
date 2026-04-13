import Image from "next/image";
import Link from "next/link";
import type { LeadListItem } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "./stats-bar";

const VERDICT_BADGE: Record<string, string> = {
  apply_now: "bg-[#a0ff7a]/15 text-[#a0ff7a] border border-[#a0ff7a]/30",
  strong_maybe: "bg-[#5ce0d8]/10 text-[#5ce0d8] border border-[#5ce0d8]/20",
  maybe: "bg-[#ff8a50]/10 text-[#ff8a50] border border-[#ff8a50]/20",
  ignore: "bg-[#766a94]/10 text-[#8578a4] border border-[#766a94]/20",
};

function ScoreBar({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-[var(--color-text-muted)]">—</span>;
  const pct = Math.min(score, 100);
  let fillClass = "score-bar-fill--low";
  if (pct >= 70) fillClass = "score-bar-fill--high";
  else if (pct >= 55) fillClass = "score-bar-fill--mid";

  return (
    <div className="flex items-center gap-2">
      <div className="score-bar-track w-16">
        <div
          className={`score-bar-fill ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="kpi-number text-sm font-semibold">{score}</span>
    </div>
  );
}

export function LeadTable({ leads }: { leads: LeadListItem[] }) {
  if (leads.length === 0) {
    return (
      <div className="card animate-fade-in p-8 text-center">
        <div className="relative mx-auto mb-4 h-36 w-36 overflow-hidden rounded-xl opacity-70">
          <Image
            src="/empty-state.png"
            alt="No results"
            fill
            className="object-cover"
            style={{ objectPosition: "50% 50%" }}
          />
        </div>
        <p className="text-[var(--color-text-muted)]">
          No se encontraron leads.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated animate-fade-in-up overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-0)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            <th className="px-4 py-3 font-semibold">Título</th>
            <th className="px-4 py-3 font-semibold">Plataforma</th>
            <th className="px-4 py-3 font-semibold">País</th>
            <th className="px-4 py-3 font-semibold">Presupuesto</th>
            <th className="px-4 py-3 font-semibold">Puntaje</th>
            <th className="px-4 py-3 font-semibold">Veredicto</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 font-semibold">Perfil</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)]">
          {leads.map((lead) => (
            <tr key={lead.lead_id} className="table-row-interactive">
              <td className="max-w-xs truncate px-4 py-3">
                <Link
                  href={`/leads/${lead.lead_id}`}
                  className="font-medium text-[#5ce0d8] transition-colors hover:text-[#a0ff7a]"
                >
                  {lead.title || "Sin título"}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize text-[var(--color-text-secondary)]">
                {lead.platform}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {lead.client_country || "—"}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {lead.budget_value || "—"}
              </td>
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
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.lead_status] || "bg-gray-100"}`}
                >
                  {STATUS_LABELS[lead.lead_status] || lead.lead_status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                {lead.best_profile_angle?.replace(/_/g, " ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
