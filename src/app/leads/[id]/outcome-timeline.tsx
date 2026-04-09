import type { OutcomeLogEntry } from "@/lib/types";

const ACTION_LABELS: Record<string, string> = {
  lead_ingested: "Lead ingresado",
  lead_scored: "Lead puntuado",
  review_decision: "Decisión de revisión",
  auto_draft_triggered: "Draft automático disparado",
  proposal_generated: "Propuesta generada",
  proposal_submitted: "Propuesta enviada",
  outcome_logged: "Outcome registrado",
};

const ACTION_ICONS: Record<string, string> = {
  lead_ingested: "📥",
  lead_scored: "📊",
  review_decision: "✅",
  auto_draft_triggered: "⚡",
  proposal_generated: "📝",
  proposal_submitted: "📤",
  outcome_logged: "🎯",
};

const OUTCOME_LABELS: Record<string, string> = {
  applied_manually: "Enviada manualmente",
  replied: "Respondió",
  interview: "Entrevista",
  won: "Ganado",
  lost: "Perdido",
  archived: "Archivado",
  approve_for_draft: "Aprobado para draft",
  archive: "Archivado",
  reject: "Rechazado",
  save_for_later: "Guardado",
  re_score: "Re-puntuado",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPayloadSummary(entry: OutcomeLogEntry): string | null {
  const payload = entry.payload;
  if (!payload) return null;

  if (entry.action_type === "outcome_logged") {
    const outcome = payload.outcome as string;
    const notes = payload.notes as string;
    const label = OUTCOME_LABELS[outcome] || outcome;
    return notes ? `${label}: ${notes}` : label;
  }

  if (entry.action_type === "review_decision") {
    const decision = payload.decision as string;
    const reason = payload.reason as string;
    const label = OUTCOME_LABELS[decision] || decision;
    return reason ? `${label}: ${reason}` : label;
  }

  if (entry.action_type === "lead_scored") {
    const score = payload.score_total ?? payload.score;
    const verdict = payload.verdict;
    if (score !== undefined && verdict) return `Score: ${score}, ${verdict}`;
    if (score !== undefined) return `Score: ${score}`;
    return null;
  }

  return null;
}

export function OutcomeTimeline({ entries }: { entries: OutcomeLogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Historial de acciones</h2>
      <div className="space-y-3">
        {entries.map((entry) => {
          const icon = ACTION_ICONS[entry.action_type] || "•";
          const label = ACTION_LABELS[entry.action_type] || entry.action_type;
          const summary = getPayloadSummary(entry);

          return (
            <div key={entry.action_id} className="flex gap-3 text-sm">
              <span className="mt-0.5 text-base leading-none">{icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900">{label}</span>
                  <span className="text-xs text-gray-400">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                {summary && (
                  <p className="mt-0.5 text-gray-600">{summary}</p>
                )}
                {entry.actor_type && (
                  <span className="text-xs text-gray-400">
                    por {entry.actor_type}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
