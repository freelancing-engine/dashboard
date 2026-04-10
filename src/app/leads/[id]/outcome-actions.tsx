"use client";

import { useActionState, useState } from "react";
import { logOutcome } from "../../actions";

const OUTCOMES = [
  {
    value: "replied",
    label: "Respondió",
    emoji: "💬",
    color: "bg-teal-100 hover:bg-teal-200 text-teal-800",
    hint: "El cliente respondió a tu propuesta",
  },
  {
    value: "interview",
    label: "Entrevista",
    emoji: "🎙️",
    color: "bg-purple-100 hover:bg-purple-200 text-purple-800",
    hint: "Entrevista agendada o realizada",
  },
  {
    value: "won",
    label: "Ganado",
    emoji: "🏆",
    color: "bg-green-600 hover:bg-green-700 text-white",
    hint: "Contrato ganado",
  },
  {
    value: "lost",
    label: "Perdido",
    emoji: "❌",
    color: "bg-red-100 hover:bg-red-200 text-red-800",
    hint: "Lead perdido (sin respuesta, rechazado, etc.)",
  },
  {
    value: "archived",
    label: "Archivar",
    emoji: "📦",
    color: "bg-gray-200 hover:bg-gray-300 text-gray-700",
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
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Registrar outcome</h2>
      <p className="mb-3 text-sm text-gray-500">
        Registrá el resultado de esta propuesta para hacer seguimiento.
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <form action={formAction}>
        <input type="hidden" name="leadId" value={leadId} />
        <div className="mb-3">
          <label htmlFor="notes" className="mb-1 block text-sm text-gray-600">
            Notas (opcional)
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            className="w-full rounded border px-3 py-1.5 text-sm"
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
