"use client";

import { useRef, useState } from "react";
import { processFileForCV } from "./actions";

const AGENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_AGENT_SERVICE_URL || "http://localhost:8000";
const AGENT_SERVICE_TOKEN = process.env.NEXT_PUBLIC_AGENT_SERVICE_TOKEN || "";

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
  if (!res.ok) {
    throw new Error(`Agent service error (${res.status})`);
  }
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
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<{
    file_base64: string;
    mime: string;
  } | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Record<
    string,
    unknown
  > | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await processFileForCV(formData);
      if ("error" in result) {
        setError(result.error);
        setFileName(null);
      } else if (result.mode === "text") {
        setCvText(result.text);
        setFileData(null);
      } else {
        // PDF: store base64 to send directly to agent-service
        setCvText("");
        setFileData({ file_base64: result.file_base64, mime: result.mime });
      }
    } catch {
      setError("Error al procesar el archivo");
      setFileName(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleParseCV = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = fileData
        ? {
            cv_file: fileData.file_base64,
            cv_file_mime: fileData.mime,
            language,
          }
        : { cv_text: cvText, language };
      const data = await callAgent("/v1/parse-cv", body);
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

  const handleImportCurrentProfile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setCurrentProfile(data);
    } catch {
      setError("Error al leer el archivo de perfil actual");
    }
    if (profileInputRef.current) profileInputRef.current.value = "";
  };

  return (
    <main className="page-enter mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">Profile Builder</h1>
        <a href="/" className="btn-secondary px-3 py-1.5 text-sm">
          ← Volver al dashboard
        </a>
      </div>

      {/* Steps indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold transition-all duration-300 ${
              step >= s ? "bg-[var(--color-primary-600)] text-white shadow-[0_0_12px_rgb(79_70_229/0.4)]" : "bg-gray-200 text-[var(--color-text-muted)]"
            }`}
          >
            {s}
          </div>
        ))}
        <span className="text-[var(--color-text-muted)]">
          {step === 1 && "Subir o pegar CV"}
          {step === 2 && "Revisar análisis"}
          {step === 3 && "Perfiles generados"}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-scale-in">
          {error}
        </div>
      )}

      {/* Step 1: Upload or Paste CV */}
      {step === 1 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Paso 1: Subí tu CV</h2>

          {/* Primary: File upload zone */}
          <div className="mb-6">
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
                fileName && (fileData || cvText)
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-blue-400", "bg-blue-50");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(
                  "border-blue-400",
                  "bg-blue-50",
                );
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(
                  "border-blue-400",
                  "bg-blue-50",
                );
                const file = e.dataTransfer.files?.[0];
                if (file && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileInputRef.current.files = dt.files;
                  fileInputRef.current.dispatchEvent(
                    new Event("change", { bubbles: true }),
                  );
                }
              }}
            >
              {uploading ? (
                <div className="text-center">
                  <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
                  <span className="text-sm font-medium text-blue-600">
                    Procesando archivo...
                  </span>
                </div>
              ) : fileName && (fileData || cvText) ? (
                <div className="text-center">
                  <svg
                    className="mb-2 mx-auto h-10 w-10 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-base font-semibold text-green-700">
                    {fileName}
                  </span>
                  <p className="mt-1 text-sm text-gray-500">
                    {fileData
                      ? "PDF listo — se enviará directo al modelo AI"
                      : "Texto extraído correctamente"}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileName(null);
                      setFileData(null);
                      setCvText("");
                    }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Eliminar y subir otro
                  </button>
                </div>
              ) : (
                <>
                  <svg
                    className="mb-3 h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-base font-semibold text-gray-700">
                    Arrastrá un archivo o hacé click para seleccionar
                  </span>
                  <span className="mt-1 text-sm text-gray-500">
                    PDF, DOCX o TXT — máximo 10 MB
                  </span>
                  <span className="mt-2 text-xs text-gray-400">
                    PDF recomendado — se envía directo al modelo AI para mejor
                    análisis
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Secondary: Text paste (collapsed by default) */}
          {!fileName && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowTextInput(!showTextInput)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${showTextInput ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                O pegá el texto de tu CV directamente
              </button>
              {showTextInput && (
                <textarea
                  className="mt-2 w-full rounded-lg border p-3 text-sm focus:border-blue-500 focus:outline-none"
                  rows={8}
                  placeholder="Pegá el texto completo de tu CV aquí..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                />
              )}
            </div>
          )}

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
              disabled={loading || (!fileData && cvText.length < 50)}
              className="btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Analizando..." : "Analizar CV"}
            </button>
            <span className="text-xs text-gray-400">
              {fileData
                ? "PDF listo para enviar"
                : cvText.length > 0
                  ? `Mínimo 50 caracteres (${cvText.length})`
                  : "Subí un archivo o pegá texto"}
            </span>
          </div>
        </div>
      )}

      {/* Step 2: Review parsed CV + configure generation */}
      {step === 2 && parsedCV && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
              Paso 2: Análisis del CV
            </h2>

            {/* Positioning suggestion */}
            <div className="mb-4 rounded-[var(--radius-lg)] bg-[var(--color-primary-50)] p-3 text-sm">
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

          {/* Import current profile for diff */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Comparar con perfil actual</h3>
                <p className="text-xs text-gray-500">
                  Importá el archivo{" "}
                  <code className="rounded bg-gray-100 px-1">
                    current_profile.json
                  </code>{" "}
                  generado por{" "}
                  <code className="rounded bg-gray-100 px-1">
                    upwork-sync profile
                  </code>
                </p>
              </div>
              {currentProfile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">
                    ✓ Perfil importado
                  </span>
                  <button
                    onClick={() => setCurrentProfile(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => profileInputRef.current?.click()}
                  className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Importar perfil
                </button>
              )}
              <input
                ref={profileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportCurrentProfile}
              />
            </div>
            {currentProfile && (
              <div className="mt-3 rounded border bg-gray-50 p-3 text-sm">
                {(currentProfile.title as string) && (
                  <p>
                    <span className="font-medium">Título actual:</span>{" "}
                    {currentProfile.title as string}
                  </p>
                )}
                {(currentProfile.overview as string) && (
                  <p className="mt-1 text-gray-600">
                    {(currentProfile.overview as string).slice(0, 120)}...
                  </p>
                )}
                {Array.isArray(currentProfile.skills) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(currentProfile.skills as string[])
                      .slice(0, 8)
                      .map((s) => (
                        <span
                          key={s}
                          className="rounded bg-gray-200 px-2 py-0.5 text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    {(currentProfile.skills as string[]).length > 8 && (
                      <span className="text-xs text-gray-400">
                        +{(currentProfile.skills as string[]).length - 8} más
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
                {Object.entries(profile.platforms).map(([platform, pData]) => (
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
                          {currentProfile &&
                            platform === "upwork" &&
                            (currentProfile.title as string) &&
                            pData.title !==
                              (currentProfile.title as string) && (
                              <DiffIndicator
                                current={currentProfile.title as string}
                                generated={pData.title}
                              />
                            )}
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
                          {currentProfile &&
                            platform === "upwork" &&
                            (currentProfile.overview as string) &&
                            pData.overview !==
                              (currentProfile.overview as string) && (
                              <DiffIndicator
                                current={
                                  (currentProfile.overview as string).slice(
                                    0,
                                    150,
                                  ) + "..."
                                }
                                generated={pData.overview.slice(0, 150) + "..."}
                              />
                            )}
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
                      {/* Skills diff */}
                      {currentProfile &&
                        platform === "upwork" &&
                        Array.isArray(currentProfile.skills) &&
                        pData.suggested_tags.length > 0 && (
                          <SkillsDiff
                            currentSkills={currentProfile.skills as string[]}
                            suggestedTags={pData.suggested_tags}
                          />
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
                ))}
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
                setFileData(null);
                setFileName(null);
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

function DiffIndicator({
  current,
  generated,
}: {
  current: string;
  generated: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1 mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
        Diferente al perfil actual
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-1 rounded border border-amber-200 bg-amber-50 p-2 text-xs">
          <div className="mb-1">
            <span className="font-medium text-red-600">Actual:</span>{" "}
            <span className="text-gray-600">{current}</span>
          </div>
          <div>
            <span className="font-medium text-green-600">Generado:</span>{" "}
            <span className="text-gray-600">{generated}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillsDiff({
  currentSkills,
  suggestedTags,
}: {
  currentSkills: string[];
  suggestedTags: string[];
}) {
  const currentSet = new Set(currentSkills.map((s) => s.toLowerCase()));
  const suggestedSet = new Set(suggestedTags.map((s) => s.toLowerCase()));
  const added = suggestedTags.filter((s) => !currentSet.has(s.toLowerCase()));
  const removed = currentSkills.filter(
    (s) => !suggestedSet.has(s.toLowerCase()),
  );

  if (added.length === 0 && removed.length === 0) return null;

  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs">
      <label className="mb-1 block font-medium text-amber-700">
        Diferencias en skills/tags
      </label>
      {added.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          <span className="text-green-600">+ Agregar:</span>
          {added.map((s) => (
            <span
              key={s}
              className="rounded bg-green-100 px-2 py-0.5 text-green-700"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      {removed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-red-600">- No en sugeridos:</span>
          {removed.slice(0, 10).map((s) => (
            <span
              key={s}
              className="rounded bg-red-100 px-2 py-0.5 text-red-700"
            >
              {s}
            </span>
          ))}
          {removed.length > 10 && (
            <span className="text-gray-500">+{removed.length - 10} más</span>
          )}
        </div>
      )}
    </div>
  );
}
