"use client";

import { useActionState } from "react";
import { reviewLead } from "../../actions";

const ACTIONS = [
  {
    decision: "approve_for_draft",
    label: "Aprobar para draft",
    color: "bg-green-600 hover:bg-green-700 text-white",
    hint: "Genera propuesta automáticamente",
  },
  {
    decision: "save_for_later",
    label: "Guardar",
    color: "bg-blue-100 hover:bg-blue-200 text-blue-800",
  },
  {
    decision: "archive",
    label: "Archivar",
    color: "bg-gray-200 hover:bg-gray-300 text-gray-700",
  },
  {
    decision: "re_score",
    label: "Re-puntuar",
    color: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800",
  },
  {
    decision: "reject",
    label: "Rechazar",
    color: "bg-red-100 hover:bg-red-200 text-red-800",
  },
];

export function ReviewActions({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      await reviewLead(formData);
      return { success: true };
    },
    null,
  );

  const showActions = ["needs_review", "scored", "approved_for_draft"].includes(
    currentStatus,
  );
  if (!showActions) return null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Acciones de revisión</h2>
      <form action={formAction}>
        <input type="hidden" name="leadId" value={leadId} />
        <div className="mb-3">
          <label htmlFor="reason" className="mb-1 block text-sm text-gray-600">
            Motivo (opcional)
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            className="w-full rounded border px-3 py-1.5 text-sm"
            placeholder="Razón de la decisión..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map(({ decision, label, color, hint }) => (
            <button
              key={decision}
              type="submit"
              name="decision"
              value={decision}
              disabled={isPending}
              className={`rounded px-3 py-1.5 text-sm font-medium ${color} disabled:opacity-50`}
              title={hint}
            >
              {isPending ? "..." : label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
