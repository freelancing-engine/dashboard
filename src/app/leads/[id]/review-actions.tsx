"use client";

import { useActionState } from "react";
import { reviewLead } from "../../actions";

const ACTIONS = [
  {
    decision: "approve_for_draft",
    label: "Aprobar para draft",
    color: "bg-[#a0ff7a]/20 hover:bg-[#a0ff7a]/30 text-[#a0ff7a]",
    hint: "Genera propuesta automáticamente",
  },
  {
    decision: "save_for_later",
    label: "Guardar",
    color: "bg-[#5ce0d8]/15 hover:bg-[#5ce0d8]/25 text-[#5ce0d8]",
  },
  {
    decision: "archive",
    label: "Archivar",
    color: "bg-[#766a94]/15 hover:bg-[#766a94]/25 text-[#8578a4]",
  },
  {
    decision: "re_score",
    label: "Re-puntuar",
    color: "bg-[#ff8a50]/15 hover:bg-[#ff8a50]/25 text-[#ff8a50]",
  },
  {
    decision: "reject",
    label: "Rechazar",
    color: "bg-[#ff5c7a]/15 hover:bg-[#ff5c7a]/25 text-[#ff5c7a]",
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
    <div className="rounded-lg card p-4">
      <h2 className="mb-3 font-semibold">Acciones de revisión</h2>
      <form action={formAction}>
        <input type="hidden" name="leadId" value={leadId} />
        <div className="mb-3">
          <label htmlFor="reason" className="mb-1 block text-sm text-[#a898cc]">
            Motivo (opcional)
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            className="w-full rounded border border-[rgba(180,160,212,0.12)] bg-[#1c1430] px-3 py-1.5 text-sm text-[#f0eeff]"
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
