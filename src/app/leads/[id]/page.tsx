import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeadById, getProposalDrafts, getOutcomeHistory } from "@/lib/leads";
import { STATUS_LABELS, STATUS_COLORS } from "../../components/stats-bar";
import { ReviewActions } from "./review-actions";
import { ApplicationSuggestion } from "./application-suggestion";
import { ProposalPreview } from "./proposal-preview";
import { GenerateProposalButton } from "./generate-proposal-button";
import { ExtractedFieldsCard } from "./extracted-fields";
import { OutcomeActions } from "./outcome-actions";
import { OutcomeTimeline } from "./outcome-timeline";
import SpiderChart from "../../components/spider-chart";

const SCORE_DIMENSIONS = [
  { key: "score_technical_fit", label: "Technical Fit", max: 20 },
  { key: "score_budget_attractiveness", label: "Budget", max: 12 },
  { key: "score_feasibility", label: "Feasibility", max: 10 },
  { key: "score_timeline_fit", label: "Timeline", max: 8 },
  { key: "score_client_reliability", label: "Client", max: 15 },
  { key: "score_competition_risk", label: "Competition", max: 8 },
  { key: "score_strategic_value", label: "Strategic", max: 15 },
  { key: "score_close_probability", label: "Close Prob.", max: 12 },
] as const;

const VERDICT_BADGE: Record<string, string> = {
  apply_now: "bg-[#a0ff7a]/15 text-[#a0ff7a] border border-[#a0ff7a]/30",
  strong_maybe: "bg-[#5ce0d8]/10 text-[#5ce0d8] border border-[#5ce0d8]/20",
  maybe: "bg-[#ff8a50]/10 text-[#ff8a50] border border-[#ff8a50]/20",
  ignore: "bg-[#766a94]/10 text-[#8578a4] border border-[#766a94]/20",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, drafts, outcomeHistory] = await Promise.all([
    getLeadById(id),
    getProposalDrafts(id),
    getOutcomeHistory(id),
  ]);
  if (!lead) notFound();

  return (
    <main className="page-enter mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="btn-secondary mb-4 inline-block px-3 py-1.5 text-sm"
      >
        ← Volver al listado
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gradient">
          {lead.title || "Sin título"}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <span className="capitalize">{lead.platform}</span>
          {lead.client_country && <span>· {lead.client_country}</span>}
          {lead.budget_value && <span>· {lead.budget_value}</span>}
          {lead.url && (
            <a
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5ce0d8] transition-colors hover:text-[#a0ff7a]"
            >
              Ver publicación ↗
            </a>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.lead_status] || "bg-gray-100"}`}
          >
            {STATUS_LABELS[lead.lead_status] || lead.lead_status}
          </span>
          {lead.verdict && (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${VERDICT_BADGE[lead.verdict] || "bg-gray-100"}`}
            >
              {lead.verdict.replace(/_/g, " ")}
            </span>
          )}
          {lead.best_profile_angle && (
            <span className="rounded-full bg-[#a0ff7a]/10 px-2.5 py-0.5 text-xs text-[#a0ff7a]">
              {lead.best_profile_angle.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score breakdown */}
        <div className="card-elevated animate-fade-in p-4 lg:col-span-1">
          <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">
            Puntaje: {lead.score_total ?? "—"} / 100
          </h2>
          <SpiderChart
            dimensions={SCORE_DIMENSIONS.map(({ key, label, max }) => ({
              label,
              value: (lead[key as keyof typeof lead] as number | null) ?? 0,
              max,
            }))}
          />
        </div>

        {/* Lead info */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <div className="card animate-fade-in-up p-4">
            <h2 className="mb-2 font-semibold text-[var(--color-text-primary)]">
              Descripción
            </h2>
            <p className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
              {lead.normalized_description ||
                lead.raw_description ||
                "Sin descripción"}
            </p>
          </div>

          {/* AI extracted fields */}
          {lead.extracted_fields && (
            <ExtractedFieldsCard fields={lead.extracted_fields} />
          )}

          {/* Client info */}
          <div
            className="card animate-fade-in-up p-4"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="mb-2 font-semibold text-[var(--color-text-primary)]">
              Cliente
            </h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">Nombre</dt>
              <dd>{lead.client_name || "—"}</dd>
              <dt className="text-[var(--color-text-muted)]">País</dt>
              <dd>{lead.client_country || "—"}</dd>
              <dt className="text-[var(--color-text-muted)]">Historial</dt>
              <dd>{lead.client_history_summary || "—"}</dd>
              <dt className="text-[var(--color-text-muted)]">Gasto total</dt>
              <dd>{lead.client_spend || "—"}</dd>
              <dt className="text-[var(--color-text-muted)]">
                Tasa contratación
              </dt>
              <dd>{lead.client_hire_rate || "—"}</dd>
              <dt className="text-[var(--color-text-muted)]">Propuestas</dt>
              <dd>{lead.proposal_count || "—"}</dd>
            </dl>
          </div>

          {/* Tags and metadata */}
          <div
            className="card animate-fade-in-up p-4"
            style={{ animationDelay: "120ms" }}
          >
            <h2 className="mb-2 font-semibold text-[var(--color-text-primary)]">
              Detalles
            </h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">Stack tags</dt>
              <dd>
                {lead.stack_tags?.length
                  ? lead.stack_tags.map((tag) => (
                      <span
                        key={tag}
                        className="mr-1 inline-block rounded bg-[#1c1430] px-2 py-0.5 text-xs text-[#a898cc]"
                      >
                        {tag}
                      </span>
                    ))
                  : "—"}
              </dd>
              <dt className="text-[var(--color-text-muted)]">Próximo paso</dt>
              <dd>{lead.next_step?.replace(/_/g, " ") || "—"}</dd>
              <dt className="text-[var(--color-text-muted)]">Tipo propuesta</dt>
              <dd>{lead.best_proposal_type || "—"}</dd>
            </dl>
          </div>

          {/* Source attribution */}
          <div
            className="card animate-fade-in-up p-4"
            style={{ animationDelay: "180ms" }}
          >
            <h2 className="mb-2 font-semibold text-[var(--color-text-primary)]">
              Origen
            </h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-[var(--color-text-muted)]">Plataforma</dt>
              <dd className="capitalize">{lead.platform}</dd>
              <dt className="text-[var(--color-text-muted)]">Tipo fuente</dt>
              <dd>{lead.source_type?.replace(/_/g, " ") || "—"}</dd>
              {lead.source_notes && (
                <>
                  <dt className="text-[var(--color-text-muted)]">
                    Notas fuente
                  </dt>
                  <dd>{lead.source_notes}</dd>
                </>
              )}
              <dt className="text-[var(--color-text-muted)]">Recibido</dt>
              <dd>
                {lead.received_at
                  ? new Date(lead.received_at).toLocaleDateString("es-AR")
                  : lead.created_at
                    ? new Date(lead.created_at).toLocaleDateString("es-AR")
                    : "—"}
              </dd>
            </dl>
          </div>

          {/* Application suggestion */}
          <ApplicationSuggestion lead={lead} />

          {/* Proposal drafts */}
          <ProposalPreview drafts={drafts} lead={lead} />

          {/* Generate proposal button */}
          <GenerateProposalButton
            leadId={lead.lead_id}
            currentStatus={lead.lead_status}
            hasDrafts={drafts.length > 0}
          />

          {/* Review actions */}
          <ReviewActions
            leadId={lead.lead_id}
            currentStatus={lead.lead_status}
          />

          {/* Outcome tracking */}
          <OutcomeActions
            leadId={lead.lead_id}
            currentStatus={lead.lead_status}
          />

          {/* Action history timeline */}
          <OutcomeTimeline entries={outcomeHistory} />
        </div>
      </div>
    </main>
  );
}
