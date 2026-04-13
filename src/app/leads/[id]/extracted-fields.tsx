import type { ExtractedFields } from "@/lib/types";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  mvp_build: "MVP Build",
  maintenance: "Mantenimiento",
  migration: "Migración",
  integration: "Integración",
  consulting: "Consultoría",
  staff_augmentation: "Staff Augmentation",
  redesign: "Rediseño",
  automation: "Automatización",
  data_pipeline: "Data Pipeline",
  devops: "DevOps / Infra",
  other: "Otro",
};

const WORK_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  project_based: "Por proyecto",
  hourly: "Por hora",
};

const TEAM_LABELS: Record<string, string> = {
  solo_dev: "Solo dev",
  small_team: "Equipo chico",
  large_team: "Equipo grande",
};

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 75
      ? "bg-[#a0ff7a]/15 text-[#a0ff7a]"
      : pct >= 50
        ? "bg-[#ff8a50]/15 text-[#ff8a50]"
        : "bg-[#ff5c7a]/15 text-[#ff5c7a]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {pct}% confianza
    </span>
  );
}

function TagList({ items, color = "bg-[#5ce0d8]/10 text-[#5ce0d8]" }: { items: string[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className={`inline-block rounded px-2 py-0.5 text-xs ${color}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export function ExtractedFieldsCard({ fields }: { fields: ExtractedFields }) {
  const hasSkills = fields.required_skills && fields.required_skills.length > 0;
  const hasNice = fields.nice_to_have_skills && fields.nice_to_have_skills.length > 0;
  const hasDeliverables = fields.key_deliverables && fields.key_deliverables.length > 0;
  const hasIntegrations = fields.integration_points && fields.integration_points.length > 0;

  return (
    <div className="rounded-lg card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Análisis IA</h2>
        {fields.extraction_confidence != null && (
          <ConfidenceBadge value={fields.extraction_confidence} />
        )}
      </div>

      {/* AI Summary */}
      {fields.ai_summary && (
        <p className="mb-4 rounded bg-[#0c0614]/60 p-3 text-sm text-[#a898cc]">
          {fields.ai_summary}
        </p>
      )}

      {/* Metadata grid */}
      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {fields.project_type && (
          <>
            <dt className="text-[#8578a4]">Tipo proyecto</dt>
            <dd className="sm:col-span-2">
              {PROJECT_TYPE_LABELS[fields.project_type] || fields.project_type}
            </dd>
          </>
        )}
        {fields.estimated_duration && (
          <>
            <dt className="text-[#8578a4]">Duración</dt>
            <dd className="sm:col-span-2">{fields.estimated_duration}</dd>
          </>
        )}
        {fields.work_arrangement && (
          <>
            <dt className="text-[#8578a4]">Modalidad</dt>
            <dd className="sm:col-span-2">
              {WORK_LABELS[fields.work_arrangement] || fields.work_arrangement}
            </dd>
          </>
        )}
        {fields.timezone_preference && (
          <>
            <dt className="text-[#8578a4]">Zona horaria</dt>
            <dd className="sm:col-span-2">{fields.timezone_preference}</dd>
          </>
        )}
        {fields.team_size_hint && (
          <>
            <dt className="text-[#8578a4]">Equipo</dt>
            <dd className="sm:col-span-2">
              {TEAM_LABELS[fields.team_size_hint] || fields.team_size_hint}
            </dd>
          </>
        )}
        {fields.industry_domain && (
          <>
            <dt className="text-[#8578a4]">Industria</dt>
            <dd className="sm:col-span-2 capitalize">{fields.industry_domain.replace(/_/g, " ")}</dd>
          </>
        )}
      </dl>

      {/* Skills */}
      {hasSkills && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-medium text-[#8578a4]">Skills requeridos</h3>
          <TagList items={fields.required_skills!} />
        </div>
      )}
      {hasNice && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-medium text-[#8578a4]">Nice to have</h3>
          <TagList items={fields.nice_to_have_skills!} color="bg-[#1c1430] text-[#a898cc]" />
        </div>
      )}

      {/* Deliverables */}
      {hasDeliverables && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-medium text-[#8578a4]">Entregables</h3>
          <ul className="list-inside list-disc text-sm text-[#a898cc]">
            {fields.key_deliverables!.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Integrations */}
      {hasIntegrations && (
        <div>
          <h3 className="mb-1 text-xs font-medium text-[#8578a4]">Integraciones</h3>
          <TagList items={fields.integration_points!} color="bg-[#b4a0d4]/10 text-[#b4a0d4]" />
        </div>
      )}
    </div>
  );
}
