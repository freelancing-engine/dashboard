"use client";

import { useActionState } from "react";
import { generateProposal } from "../../actions";

export function GenerateProposalButton({
  leadId,
  currentStatus,
  hasDrafts,
}: {
  leadId: string;
  currentStatus: string;
  hasDrafts: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await generateProposal(formData);
    },
    null,
  );

  const canGenerate =
    ["approved_for_draft", "needs_review", "scored", "draft_ready"].includes(
      currentStatus,
    ) && !hasDrafts;

  if (!canGenerate) return null;

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4">
      <h2 className="mb-2 font-semibold text-blue-800">
        Generar propuesta
      </h2>
      <p className="mb-3 text-sm text-blue-600">
        El agente generará 3 versiones de propuesta (corta, estándar,
        consultiva) basándose en el análisis del lead.
      </p>
      <form action={formAction}>
        <input type="hidden" name="leadId" value={leadId} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Generando propuesta..." : "Generar propuesta con IA"}
        </button>
      </form>
      {state && "error" in state && state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </div>
  );
}
