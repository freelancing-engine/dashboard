"use client";

import { useState } from "react";
import type { ProposalDraft, Lead } from "@/lib/types";
import { selectProposal, markProposalSubmitted } from "../../actions";

const TYPE_LABELS: Record<string, string> = {
  short: "Corta",
  standard: "Estándar",
  consultative: "Consultiva",
};

const TYPE_DESC: Record<string, string> = {
  short: "80–160 palabras · Alta competencia, scope simple",
  standard: "140–260 palabras · Leads sólidos, seriedad normal",
  consultative: "220–420 palabras · Alto valor, work estratégico",
};

const STATUS_BADGE: Record<string, string> = {
  generated: "bg-[#5ce0d8]/10 text-[#5ce0d8]",
  selected: "bg-[#a0ff7a]/10 text-[#a0ff7a]",
  submitted_manually: "bg-[#b4a0d4]/10 text-[#b4a0d4]",
  archived: "bg-[#766a94]/10 text-[#8578a4]",
};

function estimateConnectCost(lead: Lead): { connects: number; usd: string } | null {
  if (lead.platform !== "upwork") return null;

  const budget = parseFloat(lead.budget_value || "0");
  let connects: number;

  if (lead.budget_type === "hourly" || !budget || budget === 0) {
    connects = 6;
  } else if (budget < 100) {
    connects = 4;
  } else if (budget < 500) {
    connects = 6;
  } else if (budget < 1000) {
    connects = 10;
  } else {
    connects = 16;
  }

  return { connects, usd: (connects * 0.15).toFixed(2) };
}

export function ProposalPreview({ drafts, lead }: { drafts: ProposalDraft[]; lead: Lead }) {
  if (drafts.length === 0) return null;

  const activeDraft = drafts.find((d) => d.is_active);
  if (!activeDraft) return null;

  const connectCost = estimateConnectCost(lead);

  return (
    <div className="rounded-lg card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Propuesta generada</h2>
        <div className="flex items-center gap-2">
          {connectCost && (
            <span className="rounded-full bg-[#ff8a50]/10 px-2.5 py-0.5 text-xs font-medium text-[#ff8a50]" title="Costo estimado de Upwork Connects">
              ~{connectCost.connects} connects (${connectCost.usd})
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[activeDraft.draft_status] || "bg-gray-100"}`}
          >
            {activeDraft.draft_status === "generated"
              ? "Borrador"
              : activeDraft.draft_status === "selected"
                ? "Seleccionada"
                : activeDraft.draft_status === "submitted_manually"
                  ? "Enviada"
                  : "Archivada"}
          </span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs text-[#8578a4]">
        <span>
          Ángulo:{" "}
          <strong>{activeDraft.profile_angle_used.replace(/_/g, " ")}</strong>
        </span>
        <span>·</span>
        <span>
          Recomendada:{" "}
          <strong>
            {TYPE_LABELS[activeDraft.recommended_proposal_type] ||
              activeDraft.recommended_proposal_type}
          </strong>
        </span>
        {activeDraft.selected_proposal_type && (
          <>
            <span>·</span>
            <span>
              Elegida:{" "}
              <strong>{TYPE_LABELS[activeDraft.selected_proposal_type]}</strong>
            </span>
          </>
        )}
      </div>

      <ProposalTabs draft={activeDraft} lead={lead} />

      {activeDraft.optional_questions?.length > 0 && (
        <div className="mt-4 rounded bg-[#ff8a50]/10 p-3">
          <h3 className="mb-1 text-sm font-medium text-[#ff8a50]">
            Preguntas sugeridas al cliente
          </h3>
          <ul className="list-inside list-disc text-sm text-[#ff8a50]/80">
            {activeDraft.optional_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {activeDraft.internal_note && (
        <div className="mt-3 rounded bg-[#0c0614]/60 p-3">
          <h3 className="mb-1 text-sm font-medium text-[#a898cc]">
            Nota interna
          </h3>
          <p className="text-sm text-[#a898cc]">{activeDraft.internal_note}</p>
        </div>
      )}
    </div>
  );
}

function ProposalTabs({ draft, lead }: { draft: ProposalDraft; lead: Lead }) {
  const tabs = [
    { key: "short" as const, text: draft.short_version },
    { key: "standard" as const, text: draft.standard_version },
    { key: "consultative" as const, text: draft.consultative_version },
  ].filter((t) => t.text);

  const defaultTab =
    draft.selected_proposal_type ||
    draft.recommended_proposal_type ||
    tabs[0]?.key ||
    "short";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selecting, setSelecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeText = tabs.find((t) => t.key === activeTab)?.text;

  async function handleSelect() {
    setSelecting(true);
    const fd = new FormData();
    fd.set("proposalId", draft.proposal_id);
    fd.set("proposalType", activeTab);
    await selectProposal(fd);
    setSelecting(false);
  }

  async function handleCopy() {
    if (!activeText) return;
    await navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const fd = new FormData();
    fd.set("proposalId", draft.proposal_id);
    fd.set("leadId", lead.lead_id);
    await markProposalSubmitted(fd);
    setSubmitting(false);
  }

  const canSubmit =
    draft.draft_status === "selected" ||
    draft.draft_status === "generated";

  return (
    <div>
      <div className="flex gap-1 border-b">
        {tabs.map(({ key }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "border-b-2 border-[#a0ff7a] text-[#a0ff7a]"
                : "text-[#8578a4] hover:text-[#a898cc]"
            }`}
          >
            {TYPE_LABELS[key] || key}
            {key === draft.recommended_proposal_type && (
              <span className="ml-1 text-xs text-[#a0ff7a]">★</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <p className="mb-2 text-xs text-[#8578a4]">{TYPE_DESC[activeTab]}</p>
        <div className="whitespace-pre-wrap rounded bg-[#0c0614]/60 p-3 text-sm leading-relaxed text-[#f0eeff]">
          {activeText}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-[#8578a4]">
            {activeText ? activeText.split(/\s+/).length : 0} palabras
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="rounded border border-[rgba(180,160,212,0.12)] px-3 py-1 text-xs font-medium text-[#a898cc] hover:bg-[#1c1430]"
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
            {draft.draft_status === "generated" && (
              <button
                onClick={handleSelect}
                disabled={selecting}
                className="rounded bg-[#a0ff7a]/20 px-3 py-1 text-xs font-medium text-[#a0ff7a] hover:bg-[#a0ff7a]/30 disabled:opacity-50"
              >
                {selecting
                  ? "..."
                  : `Elegir versión ${TYPE_LABELS[activeTab]?.toLowerCase()}`}
              </button>
            )}
            {canSubmit && lead.url && (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-[#5ce0d8]/20 px-3 py-1 text-xs font-medium text-[#5ce0d8] hover:bg-[#5ce0d8]/30"
              >
                Ir a Upwork ↗
              </a>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded bg-[#b4a0d4]/20 px-3 py-1 text-xs font-medium text-[#b4a0d4] hover:bg-[#b4a0d4]/30 disabled:opacity-50"
                title="Marca la propuesta como enviada manualmente"
              >
                {submitting ? "..." : "Marcar como enviada"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
