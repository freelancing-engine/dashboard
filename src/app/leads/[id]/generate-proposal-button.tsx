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
    <div className="rounded-lg border border-dashed border-[#5ce0d8]/20 bg-[#5ce0d8]/10 p-4">
      <h2 className="mb-2 font-semibold text-[#5ce0d8]">Generar propuesta</h2>
      <p className="mb-3 text-sm text-[#5ce0d8]/80">
        El agente generará 3 versiones de propuesta (corta, estándar,
        consultiva) basándose en el análisis del lead.
      </p>
      <form action={formAction}>
        <input type="hidden" name="leadId" value={leadId} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Generando propuesta..." : "Generar propuesta con IA"}
        </button>
      </form>
      {state && "error" in state && state.error && (
        <div className="mt-3 rounded-md border border-[#ff5c7a]/20 bg-[#ff5c7a]/10 p-3">
          <p className="text-sm text-[#ff5c7a]">{state.error}</p>
        </div>
      )}
      {state && "success" in state && state.success && (
        <div className="mt-3 rounded-md border border-[#a0ff7a]/20 bg-[#a0ff7a]/10 p-3">
          <p className="text-sm text-[#a0ff7a]">
            Propuesta generada. Recargá la página para verla.
          </p>
        </div>
      )}
    </div>
  );
}
