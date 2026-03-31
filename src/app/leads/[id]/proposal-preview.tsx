"use client";

import { useState } from "react";
import type { ProposalDraft } from "@/lib/types";
import { selectProposal } from "../../actions";

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
  generated: "bg-blue-100 text-blue-700",
  selected: "bg-green-100 text-green-700",
  submitted_manually: "bg-purple-100 text-purple-700",
  archived: "bg-gray-100 text-gray-500",
};

export function ProposalPreview({ drafts }: { drafts: ProposalDraft[] }) {
  if (drafts.length === 0) return null;

  const activeDraft = drafts.find((d) => d.is_active);
  if (!activeDraft) return null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Propuesta generada</h2>
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

      <div className="mb-3 flex flex-wrap gap-2 text-xs text-gray-500">
        <span>
          Ángulo:{" "}
          <strong>
            {activeDraft.profile_angle_used.replace(/_/g, " ")}
          </strong>
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
              <strong>
                {TYPE_LABELS[activeDraft.selected_proposal_type]}
              </strong>
            </span>
          </>
        )}
      </div>

      <ProposalTabs draft={activeDraft} />

      {activeDraft.optional_questions?.length > 0 && (
        <div className="mt-4 rounded bg-amber-50 p-3">
          <h3 className="mb-1 text-sm font-medium text-amber-800">
            Preguntas sugeridas al cliente
          </h3>
          <ul className="list-inside list-disc text-sm text-amber-700">
            {activeDraft.optional_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {activeDraft.internal_note && (
        <div className="mt-3 rounded bg-gray-50 p-3">
          <h3 className="mb-1 text-sm font-medium text-gray-600">
            Nota interna
          </h3>
          <p className="text-sm text-gray-600">{activeDraft.internal_note}</p>
        </div>
      )}
    </div>
  );
}

function ProposalTabs({ draft }: { draft: ProposalDraft }) {
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

  const activeText = tabs.find((t) => t.key === activeTab)?.text;

  async function handleSelect() {
    setSelecting(true);
    const fd = new FormData();
    fd.set("proposalId", draft.proposal_id);
    fd.set("proposalType", activeTab);
    await selectProposal(fd);
    setSelecting(false);
  }

  return (
    <div>
      <div className="flex gap-1 border-b">
        {tabs.map(({ key }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {TYPE_LABELS[key] || key}
            {key === draft.recommended_proposal_type && (
              <span className="ml-1 text-xs text-green-600">★</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <p className="mb-2 text-xs text-gray-400">{TYPE_DESC[activeTab]}</p>
        <div className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm leading-relaxed text-gray-800">
          {activeText}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {activeText ? activeText.split(/\s+/).length : 0} palabras
          </span>
          {draft.draft_status === "generated" && (
            <button
              onClick={handleSelect}
              disabled={selecting}
              className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {selecting ? "..." : `Elegir versión ${TYPE_LABELS[activeTab]?.toLowerCase()}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
