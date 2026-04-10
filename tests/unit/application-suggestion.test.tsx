import React from "react";
import { render, screen } from "@testing-library/react";
import { ApplicationSuggestion } from "@/app/leads/[id]/application-suggestion";
import type { Lead } from "@/lib/types";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    lead_id: "lead_test",
    platform: "upwork",
    source_type: "manual_link",
    source_notes: null,
    title: "Test Lead",
    raw_description: "Build something",
    normalized_description: null,
    url: null,
    client_name: null,
    client_country: null,
    client_history_summary: null,
    client_spend: null,
    client_hire_rate: null,
    budget_type: null,
    budget_value: null,
    proposal_count: null,
    posted_at: null,
    received_at: null,
    stack_tags: [],
    lead_status: "scored",
    review_priority: "normal",
    score_technical_fit: 15,
    score_budget_attractiveness: 8,
    score_feasibility: 7,
    score_timeline_fit: 6,
    score_client_reliability: 10,
    score_competition_risk: 5,
    score_strategic_value: 10,
    score_close_probability: 9,
    score_total: 70,
    verdict: "apply_now",
    red_flags: [],
    best_profile_angle: "flagship",
    best_proposal_type: "standard",
    next_step: "draft_proposal",
    reasoning_summary: "Strong technical match.",
    extracted_fields: null,
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

describe("ApplicationSuggestion", () => {
  it("returns null when no verdict and no score", () => {
    const { container } = render(
      <ApplicationSuggestion
        lead={makeLead({ verdict: null, score_total: null })}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders suggestion for apply_now verdict", () => {
    render(<ApplicationSuggestion lead={makeLead({ verdict: "apply_now" })} />);

    expect(screen.getByText(/Aplicar ahora/)).toBeInTheDocument();
    expect(screen.getByText(/Lead de alta prioridad/)).toBeInTheDocument();
  });

  it("renders suggestion for strong_maybe verdict", () => {
    render(
      <ApplicationSuggestion lead={makeLead({ verdict: "strong_maybe" })} />,
    );

    expect(screen.getByText(/Posibilidad fuerte/)).toBeInTheDocument();
  });

  it("renders suggestion for maybe verdict", () => {
    render(<ApplicationSuggestion lead={makeLead({ verdict: "maybe" })} />);

    expect(screen.getByText(/Posible/)).toBeInTheDocument();
    expect(screen.getByText(/Match parcial/)).toBeInTheDocument();
  });

  it("renders suggestion for ignore verdict", () => {
    render(<ApplicationSuggestion lead={makeLead({ verdict: "ignore" })} />);

    expect(screen.getByText(/Ignorar/)).toBeInTheDocument();
  });

  it("shows recommended profile angle in Spanish", () => {
    render(
      <ApplicationSuggestion
        lead={makeLead({ best_profile_angle: "ai_automation" })}
      />,
    );

    expect(screen.getByText("AI & Automation")).toBeInTheDocument();
  });

  it("shows proposal type in Spanish", () => {
    render(
      <ApplicationSuggestion
        lead={makeLead({ best_proposal_type: "consultative" })}
      />,
    );

    expect(
      screen.getByText(/Consultiva \(220–420 palabras\)/),
    ).toBeInTheDocument();
  });

  it("shows next step label", () => {
    render(
      <ApplicationSuggestion
        lead={makeLead({ next_step: "draft_proposal" })}
      />,
    );

    expect(screen.getByText("Generar propuesta")).toBeInTheDocument();
  });

  it("shows reasoning summary", () => {
    render(
      <ApplicationSuggestion
        lead={makeLead({ reasoning_summary: "Strong technical match." })}
      />,
    );

    expect(screen.getByText("Strong technical match.")).toBeInTheDocument();
    expect(screen.getByText("Razonamiento del agente")).toBeInTheDocument();
  });

  it("shows red flags", () => {
    render(
      <ApplicationSuggestion
        lead={makeLead({ red_flags: ["Low budget", "Unclear scope"] })}
      />,
    );

    expect(screen.getByText("Low budget")).toBeInTheDocument();
    expect(screen.getByText("Unclear scope")).toBeInTheDocument();
  });

  it("shows score total", () => {
    render(<ApplicationSuggestion lead={makeLead({ score_total: 85 })} />);

    expect(screen.getByText("85 / 100")).toBeInTheDocument();
  });

  it("renders with only score_total and no verdict", () => {
    render(
      <ApplicationSuggestion
        lead={makeLead({ verdict: null, score_total: 60 })}
      />,
    );

    expect(screen.getByText(/Sin veredicto/)).toBeInTheDocument();
    expect(screen.getByText("60 / 100")).toBeInTheDocument();
  });
});
