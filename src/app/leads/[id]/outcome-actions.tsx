"use client";

import { useActionState, useState } from "react";
import { logOutcome } from "../../actions";

const OUTCOMES = [
  {
    value: "replied",
    label: "Respondió",
    emoji: "💬",
    color: "bg-[#5ce0d8]/15 hover:bg-[#5ce0d8]/25 text-[#5ce0d8]",
    hint: "El cliente respondió a tu propuesta",
  },
  {
    value: "interview",
    label: "Entrevista",
    emoji: "🎙️",
    color: "bg-[#b4a0d4]/15 hover:bg-[#b4a0d4]/25 text-[#b4a0d4]",
    hint: "Entrevista agendada o realizada",
  },
  {
    value: "won",
    label: "Ganado",
    emoji: "🏆",
    color: "bg-[#a0ff7a]/20 hover:bg-[#a0ff7a]/30 text-[#a0ff7a]",
    hint: "Contrato ganado",
  },
  {
    value: "lost",
    label: "Perdido",
    emoji: "❌",
    color: "bg-[#ff5c7a]/15 hover:bg-[#ff5c7a]/25 text-[#ff5c7a]",
    hint: "Lead perdido (sin respuesta, rechazado, etc.)",
  },
  {
    value: "archived",
    label: "Archivar",
    emoji: "📦",
    color: "bg-[#766a94]/15 hover:bg-[#766a94]/25 text-[#8578a4]",
    hint: "Dejar de hacer seguimiento",
  },
] as const;

export function OutcomeActions({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      setError(null);
      const result = await logOutcome(formData);
      if (result?.error) {
        setError(result.error);
        return { error: result.error };
      }
      return { success: true };
    },
    null,
  );

  // Show for statuses where outcome tracking makes sense
  const showOutcomes = [
    "applied_manually",
    "draft_ready",
    "replied",
    "interview",
  ].includes(currentStatus);
  if (!showOutcomes) return null;

  // Filter outcomes based on current status progression
  const available = OUTCOMES.filter(({ value }) => {
    // Can't go backwards in the funnel
    if (currentStatus === "replied" && value === "replied") return false;
    if (
      currentStatus === "interview" &&
      ["replied", "interview"].includes(value)
    )
      return false;
    return true;
  });

  return (
    <div className="rounded-lg card p-4">
      <h2 className="mb-3 font-semibold">Registrar outcome</h2>
      <p className="mb-3 text-sm text-[#8578a4]">
        Registrá el resultado de esta propuesta para hacer seguimiento.
      </p>
      {error && <p className="mb-3 text-sm text-[#ff5c7a]">{error}</p>}
      <form action={formAction}>
        <input type="hidden" name="leadId" value={leadId} />
        <div className="mb-3">
          <label htmlFor="notes" className="mb-1 block text-sm text-[#a898cc]">
            Notas (opcional)
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            className="w-full rounded border border-[rgba(180,160,212,0.12)] bg-[#1c1430] px-3 py-1.5 text-sm text-[#f0eeff]"
            placeholder="Detalles del resultado..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {available.map(({ value, label, emoji, color, hint }) => (
            <button
              key={value}
              type="submit"
              name="outcome"
              value={value}
              disabled={isPending}
              className={`rounded px-3 py-1.5 text-sm font-medium ${color} disabled:opacity-50`}
              title={hint}
            >
              {isPending ? "..." : `${emoji} ${label}`}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
