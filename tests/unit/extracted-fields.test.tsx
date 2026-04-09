import React from "react";
import { render, screen } from "@testing-library/react";
import { ExtractedFieldsCard } from "@/app/leads/[id]/extracted-fields";
import type { ExtractedFields } from "@/lib/types";

function makeFields(overrides: Partial<ExtractedFields> = {}): ExtractedFields {
  return {
    extraction_confidence: 0.85,
    ai_summary:
      "A full-stack migration project requiring Node.js and React expertise.",
    project_type: "migration",
    estimated_duration: "3-6 months",
    work_arrangement: "part_time",
    timezone_preference: "UTC-3 to UTC+1",
    team_size_hint: "small_team",
    industry_domain: "health_tech",
    required_skills: ["Node.js", "React", "PostgreSQL"],
    nice_to_have_skills: ["Docker", "Terraform"],
    key_deliverables: ["REST API", "Admin dashboard", "Data migration scripts"],
    integration_points: ["Stripe", "SendGrid"],
    ...overrides,
  };
}

describe("ExtractedFieldsCard", () => {
  it("renders the card heading", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(screen.getByText("Análisis IA")).toBeInTheDocument();
  });

  // ── Confidence badge ──────────────────────────────────────────────

  it("shows green confidence badge for >= 75%", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ extraction_confidence: 0.85 })}
      />,
    );
    const badge = screen.getByText("85% confianza");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-green-100");
  });

  it("shows yellow confidence badge for 50-74%", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ extraction_confidence: 0.6 })}
      />,
    );
    const badge = screen.getByText("60% confianza");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-yellow-100");
  });

  it("shows red confidence badge for < 50%", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ extraction_confidence: 0.3 })}
      />,
    );
    const badge = screen.getByText("30% confianza");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-red-100");
  });

  it("hides confidence badge when not provided", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ extraction_confidence: undefined })}
      />,
    );
    expect(screen.queryByText(/confianza/)).not.toBeInTheDocument();
  });

  // ── AI Summary ────────────────────────────────────────────────────

  it("renders ai_summary when provided", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(
      screen.getByText(/full-stack migration project/),
    ).toBeInTheDocument();
  });

  it("hides summary section when ai_summary is undefined", () => {
    render(
      <ExtractedFieldsCard fields={makeFields({ ai_summary: undefined })} />,
    );
    expect(
      screen.queryByText(/full-stack migration project/),
    ).not.toBeInTheDocument();
  });

  // ── Metadata grid labels ──────────────────────────────────────────

  it("maps project_type to Spanish label", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ project_type: "migration" })}
      />,
    );
    expect(screen.getByText("Migración")).toBeInTheDocument();
  });

  it("shows raw project_type if not in label map", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ project_type: "unknown_type" })}
      />,
    );
    expect(screen.getByText("unknown_type")).toBeInTheDocument();
  });

  it("maps work_arrangement to label", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ work_arrangement: "part_time" })}
      />,
    );
    expect(screen.getByText("Part-time")).toBeInTheDocument();
  });

  it("maps team_size_hint to label", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ team_size_hint: "solo_dev" })}
      />,
    );
    expect(screen.getByText("Solo dev")).toBeInTheDocument();
  });

  it("renders estimated_duration", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(screen.getByText("3-6 months")).toBeInTheDocument();
  });

  it("renders timezone_preference", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(screen.getByText("UTC-3 to UTC+1")).toBeInTheDocument();
  });

  it("renders industry_domain with underscores replaced", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ industry_domain: "health_tech" })}
      />,
    );
    expect(screen.getByText("health tech")).toBeInTheDocument();
  });

  it("hides metadata rows when fields are null", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({
          project_type: null,
          estimated_duration: null,
          work_arrangement: null,
          timezone_preference: null,
          team_size_hint: null,
          industry_domain: null,
        })}
      />,
    );
    expect(screen.queryByText("Tipo proyecto")).not.toBeInTheDocument();
    expect(screen.queryByText("Duración")).not.toBeInTheDocument();
    expect(screen.queryByText("Modalidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Zona horaria")).not.toBeInTheDocument();
    expect(screen.queryByText("Equipo")).not.toBeInTheDocument();
    expect(screen.queryByText("Industria")).not.toBeInTheDocument();
  });

  // ── Skills ────────────────────────────────────────────────────────

  it("renders required skills as tags", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(screen.getByText("Skills requeridos")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("hides required skills section when empty array", () => {
    render(
      <ExtractedFieldsCard fields={makeFields({ required_skills: [] })} />,
    );
    expect(screen.queryByText("Skills requeridos")).not.toBeInTheDocument();
  });

  it("renders nice-to-have skills", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(screen.getByText("Nice to have")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("Terraform")).toBeInTheDocument();
  });

  it("hides nice-to-have skills when null", () => {
    render(
      <ExtractedFieldsCard
        fields={makeFields({ nice_to_have_skills: null })}
      />,
    );
    expect(screen.queryByText("Nice to have")).not.toBeInTheDocument();
  });

  // ── Deliverables ──────────────────────────────────────────────────

  it("renders key deliverables as list", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(screen.getByText("Entregables")).toBeInTheDocument();
    expect(screen.getByText("REST API")).toBeInTheDocument();
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
    expect(screen.getByText("Data migration scripts")).toBeInTheDocument();
  });

  it("hides deliverables section when null", () => {
    render(
      <ExtractedFieldsCard fields={makeFields({ key_deliverables: null })} />,
    );
    expect(screen.queryByText("Entregables")).not.toBeInTheDocument();
  });

  // ── Integrations ──────────────────────────────────────────────────

  it("renders integration points as tags", () => {
    render(<ExtractedFieldsCard fields={makeFields()} />);
    expect(screen.getByText("Integraciones")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("SendGrid")).toBeInTheDocument();
  });

  it("hides integrations section when null", () => {
    render(
      <ExtractedFieldsCard fields={makeFields({ integration_points: null })} />,
    );
    expect(screen.queryByText("Integraciones")).not.toBeInTheDocument();
  });

  // ── Minimal fields ───────────────────────────────────────────────

  it("renders card with only required heading when all fields are empty", () => {
    render(
      <ExtractedFieldsCard
        fields={{
          required_skills: [],
          nice_to_have_skills: null,
          project_type: null,
          estimated_duration: null,
          work_arrangement: null,
          timezone_preference: null,
          team_size_hint: null,
          key_deliverables: null,
          industry_domain: null,
          integration_points: null,
        }}
      />,
    );
    expect(screen.getByText("Análisis IA")).toBeInTheDocument();
    expect(screen.queryByText("Skills requeridos")).not.toBeInTheDocument();
    expect(screen.queryByText("Entregables")).not.toBeInTheDocument();
    expect(screen.queryByText("Integraciones")).not.toBeInTheDocument();
  });
});
