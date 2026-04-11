"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "needs_review", label: "Para revisar" },
  { value: "scored", label: "Puntuados" },
  { value: "approved_for_draft", label: "Aprobados" },
  { value: "draft_ready", label: "Draft listo" },
  { value: "low_priority", label: "Baja prioridad" },
  { value: "applied_manually", label: "Aplicados" },
  { value: "replied", label: "Con respuesta" },
  { value: "interview", label: "Entrevista" },
  { value: "won", label: "Ganados" },
  { value: "lost", label: "Perdidos" },
  { value: "archived", label: "Archivados" },
];

const PLATFORMS = [
  { value: "", label: "Todas" },
  { value: "upwork", label: "Upwork" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "workana", label: "Workana" },
  { value: "contra", label: "Contra" },
  { value: "fiverr", label: "Fiverr" },
  { value: "manual", label: "Manual" },
];

export function Filters({
  currentStatus,
  currentPlatform,
  currentSearch,
}: {
  currentStatus?: string;
  currentPlatform?: string;
  currentSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 animate-fade-in">
      <select
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-150 focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] focus:outline-none"
        value={currentStatus || ""}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-150 focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] focus:outline-none"
        value={currentPlatform || ""}
        onChange={(e) => updateFilter("platform", e.target.value)}
      >
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Buscar por título..."
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] focus:outline-none"
        defaultValue={currentSearch || ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateFilter("search", e.currentTarget.value);
          }
        }}
      />
    </div>
  );
}
