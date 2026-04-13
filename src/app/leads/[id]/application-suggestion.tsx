import type { Lead } from "@/lib/types";

const ANGLE_LABELS: Record<string, string> = {
  flagship: "Flagship (Full-stack senior)",
  ai_automation: "AI & Automation",
  backend_integrations: "Backend & Integraciones",
  azure_devops_iac: "Azure / DevOps / IaC",
};

const PROPOSAL_TYPE_LABELS: Record<string, string> = {
  short: "Corta (80–160 palabras)",
  standard: "Estándar (140–260 palabras)",
  consultative: "Consultiva (220–420 palabras)",
};

const VERDICT_LABELS: Record<
  string,
  { label: string; desc: string; color: string }
> = {
  apply_now: {
    label: "Aplicar ahora",
    desc: "Lead de alta prioridad — match fuerte con perfil y buen potencial de cierre",
    color: "bg-[#a0ff7a]/10 border-[#a0ff7a]/20 text-[#f0eeff]",
  },
  strong_maybe: {
    label: "Posibilidad fuerte",
    desc: "Buen match general — vale la pena aplicar con propuesta cuidadosa",
    color: "bg-[#5ce0d8]/10 border-[#5ce0d8]/20 text-[#f0eeff]",
  },
  maybe: {
    label: "Posible",
    desc: "Match parcial — aplicar solo si hay tiempo disponible",
    color: "bg-[#ff8a50]/10 border-[#ff8a50]/20 text-[#f0eeff]",
  },
  ignore: {
    label: "Ignorar",
    desc: "No vale la pena — mal match, bajo presupuesto o red flags",
    color: "bg-[#766a94]/10 border-[#766a94]/20 text-[#8578a4]",
  },
};

const NEXT_STEP_LABELS: Record<string, string> = {
  draft_proposal: "Generar propuesta",
  manual_review: "Revisar manualmente",
  save_for_later: "Guardar para después",
  ask_for_clarification: "Pedir aclaración al cliente",
  ignore: "Ignorar",
};

export function ApplicationSuggestion({ lead }: { lead: Lead }) {
  if (!lead.verdict && !lead.score_total) return null;

  const verdict = lead.verdict ? VERDICT_LABELS[lead.verdict] : null;
  const shouldApply =
    lead.verdict === "apply_now" || lead.verdict === "strong_maybe";

  return (
    <div
      className={`rounded-lg border p-4 ${verdict?.color || "bg-[#1c1430] border-[rgba(180,160,212,0.12)]"}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">
          {shouldApply ? "✅" : lead.verdict === "maybe" ? "🤔" : "⛔"}
        </span>
        <h2 className="font-semibold">
          Sugerencia: {verdict?.label || "Sin veredicto"}
        </h2>
      </div>

      {verdict && <p className="mb-3 text-sm">{verdict.desc}</p>}

      <div className="grid gap-2 text-sm">
        {lead.best_profile_angle && (
          <div className="flex items-start gap-2">
            <span className="font-medium text-[#a898cc] shrink-0">
              Perfil recomendado:
            </span>
            <span className="font-semibold">
              {ANGLE_LABELS[lead.best_profile_angle] ||
                lead.best_profile_angle.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {lead.best_proposal_type && (
          <div className="flex items-start gap-2">
            <span className="font-medium text-[#a898cc] shrink-0">
              Tipo de propuesta:
            </span>
            <span className="font-semibold">
              {PROPOSAL_TYPE_LABELS[lead.best_proposal_type] ||
                lead.best_proposal_type}
            </span>
          </div>
        )}

        {lead.next_step && (
          <div className="flex items-start gap-2">
            <span className="font-medium text-[#a898cc] shrink-0">
              Próximo paso:
            </span>
            <span className="font-semibold">
              {NEXT_STEP_LABELS[lead.next_step] ||
                lead.next_step.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {lead.score_total !== null && (
          <div className="flex items-start gap-2">
            <span className="font-medium text-[#a898cc] shrink-0">
              Puntaje total:
            </span>
            <span className="font-semibold">{lead.score_total} / 100</span>
          </div>
        )}
      </div>

      {lead.reasoning_summary && (
        <div className="mt-3 rounded bg-[#0c0614]/60 p-3">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-[#8578a4]">
            Razonamiento del agente
          </h3>
          <p className="whitespace-pre-wrap text-sm">
            {lead.reasoning_summary}
          </p>
        </div>
      )}

      {lead.red_flags && lead.red_flags.length > 0 && (
        <div className="mt-3">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-[#ff5c7a]">
            Red flags
          </h3>
          <div className="flex flex-wrap gap-1">
            {lead.red_flags.map((flag, i) => (
              <span
                key={i}
                className="inline-block rounded bg-[#ff5c7a]/10 px-2 py-0.5 text-xs text-[#ff5c7a]"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
