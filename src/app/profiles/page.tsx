"use client";

import { useState } from "react";

const AGENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_AGENT_SERVICE_URL || "http://localhost:8000";
const AGENT_SERVICE_TOKEN =
  process.env.NEXT_PUBLIC_AGENT_SERVICE_TOKEN || "";

const PROFILE_ANGLES = [
  { value: "flagship", label: "Flagship" },
  { value: "ai_automation", label: "AI & Automation" },
  { value: "backend_integrations", label: "Backend" },
  { value: "azure_devops_iac", label: "Azure/DevOps" },
];

const PLATFORMS = [
  { value: "upwork", label: "Upwork" },
  { value: "linkedin", label: "LinkedIn" },
];

interface ParsedCV {
  projects: Array<{
    project_name: string;
    short_summary: string;
    stack: string[];
    reusable_proof_points: string[];
  }>;
  global_skills: {
    languages: string[];
    frameworks: string[];
    platforms: string[];
    tools: string[];
    domains: string[];
  };
  positioning_suggestion: string;
}

interface PlatformProfile {
  title: string | null;
  headline: string | null;
  overview: string | null;
  summary: string | null;
  key_services: string[];
  selected_proof_points: string[];
  suggested_tags: string[];
}

interface GeneratedProfile {
  profile_angle: string;
  platforms: Record<string, PlatformProfile>;
}

interface ProfilesResult {
  profiles: GeneratedProfile[];
  evidence_quality_notes: string;
  improvement_suggestions: string[];
}

async function callAgent(endpoint: string, body: object) {
  const res = await fetch(`${AGENT_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AGENT_SERVICE_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.status !== "success") {
    throw new Error(data.error?.message || "Unknown error");
  }
  return data.data;
}

export default function ProfileBuilderPage() {
  const [cvText, setCvText] = useState("");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [profiles, setProfiles] = useState<ProfilesResult | null>(null);
  const [selectedAngles, setSelectedAngles] = useState<string[]>(
    PROFILE_ANGLES.map((a) => a.value),
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    PLATFORMS.map((p) => p.value),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleParseCV = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callAgent("/v1/parse-cv", {
        cv_text: cvText,
        language,
      });
      setParsedCV(data);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error parsing CV");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProfiles = async () => {
    if (!parsedCV) return;
    setLoading(true);
    setError(null);
    try {
      const data = await callAgent("/v1/generate-profiles", {
        projects_json: JSON.stringify(parsedCV.projects),
        global_skills_json: JSON.stringify(parsedCV.global_skills),
        positioning_suggestion: parsedCV.positioning_suggestion,
        profile_angles: selectedAngles,
        target_platforms: selectedPlatforms,
        language,
      });
      setProfiles(data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generating profiles");
    } finally {
      setLoading(false);
    }
  };

  const toggleAngle = (v: string) =>
    setSelectedAngles((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  const togglePlatform = (v: string) =>
    setSelectedPlatforms((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile Builder</h1>
        <a href="/" className="text-sm text-blue-600 hover:underline">
          ← Volver al dashboard
        </a>
      </div>

      {/* Steps indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
              step >= s
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {s}
          </div>
        ))}
        <span className="text-gray-500">
          {step === 1 && "Pegar CV"}
          {step === 2 && "Revisar análisis"}
          {step === 3 && "Perfiles generados"}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Paste CV */}
      {step === 1 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">
            Paso 1: Pegar tu CV / Resume
          </h2>
          <textarea
            className="mb-3 w-full rounded-lg border p-3 text-sm focus:border-blue-500 focus:outline-none"
            rows={16}
            placeholder="Pegá el texto completo de tu CV aquí..."
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "es")}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
            <button
              onClick={handleParseCV}
              disabled={loading || cvText.length < 50}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Analizando..." : "Analizar CV"}
            </button>
            <span className="text-xs text-gray-400">
              Mínimo 50 caracteres ({cvText.length})
            </span>
          </div>
        </div>
      )}

      {/* Step 2: Review parsed CV + configure generation */}
      {step === 2 && parsedCV && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">
              Paso 2: Análisis del CV
            </h2>

            {/* Positioning suggestion */}
            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm">
              <span className="font-semibold">Posicionamiento sugerido:</span>{" "}
              {parsedCV.positioning_suggestion}
            </div>

            {/* Projects */}
            <h3 className="mb-2 font-semibold">
              Proyectos ({parsedCV.projects.length})
            </h3>
            <div className="mb-4 space-y-2">
              {parsedCV.projects.map((p, i) => (
                <div key={i} className="rounded border p-3 text-sm">
                  <div className="font-medium">{p.project_name}</div>
                  <div className="text-gray-600">{p.short_summary}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <h3 className="mb-2 font-semibold">Skills globales</h3>
            <div className="mb-4 flex flex-wrap gap-1">
              {[
                ...parsedCV.global_skills.languages,
                ...parsedCV.global_skills.frameworks,
                ...parsedCV.global_skills.platforms,
                ...parsedCV.global_skills.tools,
              ].map((s) => (
                <span
                  key={s}
                  className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Generation config */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold">Configurar generación</h3>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">
                Ángulos de perfil
              </label>
              <div className="flex flex-wrap gap-2">
                {PROFILE_ANGLES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => toggleAngle(a.value)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      selectedAngles.includes(a.value)
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                Plataformas
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      selectedPlatforms.includes(p.value)
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                ← Volver
              </button>
              <button
                onClick={handleGenerateProfiles}
                disabled={
                  loading ||
                  selectedAngles.length === 0 ||
                  selectedPlatforms.length === 0
                }
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Generando..." : "Generar perfiles"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generated profiles */}
      {step === 3 && profiles && (
        <div className="space-y-6">
          {/* Quality notes */}
          {profiles.evidence_quality_notes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <span className="font-semibold">Calidad de evidencia:</span>{" "}
              {profiles.evidence_quality_notes}
            </div>
          )}

          {/* Improvement suggestions */}
          {profiles.improvement_suggestions.length > 0 && (
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-semibold">Sugerencias de mejora</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                {profiles.improvement_suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Profiles */}
          {profiles.profiles.map((profile) => (
            <div
              key={profile.profile_angle}
              className="rounded-lg border bg-white shadow-sm"
            >
              <div className="border-b bg-gray-50 px-6 py-3">
                <h2 className="text-lg font-bold capitalize">
                  {profile.profile_angle.replace(/_/g, " ")}
                </h2>
              </div>
              <div className="p-6">
                {Object.entries(profile.platforms).map(
                  ([platform, pData]) => (
                    <div key={platform} className="mb-6 last:mb-0">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                        {platform}
                      </h3>
                      <div className="space-y-3">
                        {pData.title && (
                          <div>
                            <label className="text-xs font-medium text-gray-400">
                              Título
                            </label>
                            <CopyableField text={pData.title} />
                          </div>
                        )}
                        {pData.headline && (
                          <div>
                            <label className="text-xs font-medium text-gray-400">
                              Headline
                            </label>
                            <CopyableField text={pData.headline} />
                          </div>
                        )}
                        {pData.overview && (
                          <div>
                            <label className="text-xs font-medium text-gray-400">
                              Overview
                            </label>
                            <CopyableField text={pData.overview} multiline />
                          </div>
                        )}
                        {pData.key_services.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-gray-400">
                              Servicios clave
                            </label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {pData.key_services.map((s) => (
                                <span
                                  key={s}
                                  className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {pData.suggested_tags.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-gray-400">
                              Tags sugeridos
                            </label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {pData.suggested_tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded bg-gray-100 px-2 py-0.5 text-xs"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {pData.selected_proof_points.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-gray-400">
                              Proof points
                            </label>
                            <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
                              {pData.selected_proof_points.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              ← Reconfigurar
            </button>
            <button
              onClick={() => {
                setParsedCV(null);
                setProfiles(null);
                setStep(1);
              }}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Empezar de nuevo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CopyableField({
  text,
  multiline = false,
}: {
  text: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative mt-1 rounded border bg-gray-50 p-2 text-sm">
      {multiline ? (
        <pre className="whitespace-pre-wrap font-sans">{text}</pre>
      ) : (
        <span>{text}</span>
      )}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs text-gray-500 opacity-0 shadow-sm hover:text-gray-700 group-hover:opacity-100"
      >
        {copied ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  );
}
