import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeadById, getProposalDrafts } from "@/lib/leads";
import { STATUS_LABELS, STATUS_COLORS } from "../../components/stats-bar";
import { ReviewActions } from "./review-actions";
import { ApplicationSuggestion } from "./application-suggestion";
import { ProposalPreview } from "./proposal-preview";
import { GenerateProposalButton } from "./generate-proposal-button";

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
  apply_now: "bg-green-600 text-white",
  strong_maybe: "bg-emerald-100 text-emerald-800",
  maybe: "bg-yellow-100 text-yellow-800",
  ignore: "bg-gray-200 text-gray-500",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, drafts] = await Promise.all([
    getLeadById(id),
    getProposalDrafts(id),
  ]);
  if (!lead) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Volver al listado
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{lead.title || "Sin título"}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span className="capitalize">{lead.platform}</span>
          {lead.client_country && <span>· {lead.client_country}</span>}
          {lead.budget_value && <span>· {lead.budget_value}</span>}
          {lead.url && (
            <a
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
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
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
              {lead.best_profile_angle.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score breakdown */}
        <div className="rounded-lg border bg-white p-4 shadow-sm lg:col-span-1">
          <h2 className="mb-3 font-semibold">
            Puntaje: {lead.score_total ?? "—"} / 100
          </h2>
          <div className="space-y-2">
            {SCORE_DIMENSIONS.map(({ key, label, max }) => {
              const value = lead[key as keyof typeof lead] as number | null;
              const pct = value !== null ? (value / max) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{label}</span>
                    <span>
                      {value ?? "—"} / {max}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead info */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold">Descripción</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {lead.normalized_description ||
                lead.raw_description ||
                "Sin descripción"}
            </p>
          </div>

          {/* Client info */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold">Cliente</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Nombre</dt>
              <dd>{lead.client_name || "—"}</dd>
              <dt className="text-gray-500">País</dt>
              <dd>{lead.client_country || "—"}</dd>
              <dt className="text-gray-500">Historial</dt>
              <dd>{lead.client_history_summary || "—"}</dd>
              <dt className="text-gray-500">Gasto total</dt>
              <dd>{lead.client_spend || "—"}</dd>
              <dt className="text-gray-500">Tasa contratación</dt>
              <dd>{lead.client_hire_rate || "—"}</dd>
              <dt className="text-gray-500">Propuestas</dt>
              <dd>{lead.proposal_count || "—"}</dd>
            </dl>
          </div>

          {/* Tags and metadata */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-semibold">Detalles</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Stack tags</dt>
              <dd>
                {lead.stack_tags?.length
                  ? lead.stack_tags.map((tag) => (
                      <span
                        key={tag}
                        className="mr-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))
                  : "—"}
              </dd>
              <dt className="text-gray-500">Próximo paso</dt>
              <dd>{lead.next_step?.replace(/_/g, " ") || "—"}</dd>
              <dt className="text-gray-500">Tipo propuesta</dt>
              <dd>{lead.best_proposal_type || "—"}</dd>
            </dl>
          </div>

          {/* Application suggestion */}
          <ApplicationSuggestion lead={lead} />

          {/* Proposal drafts */}
          <ProposalPreview drafts={drafts} />

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
        </div>
      </div>
    </main>
  );
}
