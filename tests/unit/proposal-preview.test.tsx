import React from "react";
import { render, screen } from "@testing-library/react";
import { ProposalPreview } from "@/app/leads/[id]/proposal-preview";
import type { ProposalDraft, Lead } from "@/lib/types";

// Mock server actions
jest.mock("@/app/actions", () => ({
  selectProposal: jest.fn(),
  markProposalSubmitted: jest.fn(),
}));

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    lead_id: "lead_test",
    platform: "upwork",
    source_type: "manual",
    title: "Test Lead",
    raw_description: "Test description",
    normalized_description: null,
    url: "https://www.upwork.com/jobs/test",
    client_name: null,
    client_country: null,
    client_history_summary: null,
    client_spend: null,
    client_hire_rate: null,
    budget_type: "fixed",
    budget_value: "500",
    proposal_count: null,
    posted_at: null,
    received_at: null,
    stack_tags: [],
    lead_status: "draft_ready",
    review_priority: "normal",
    score_technical_fit: null,
    score_budget_attractiveness: null,
    score_feasibility: null,
    score_timeline_fit: null,
    score_client_reliability: null,
    score_competition_risk: null,
    score_strategic_value: null,
    score_close_probability: null,
    score_total: null,
    verdict: null,
    red_flags: [],
    best_profile_angle: null,
    best_proposal_type: null,
    next_step: null,
    reasoning_summary: null,
    extracted_fields: null,
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

function makeDraft(overrides: Partial<ProposalDraft> = {}): ProposalDraft {
  return {
    proposal_id: "uuid-test",
    lead_id: "lead_test",
    profile_angle_used: "flagship",
    recommended_proposal_type: "standard",
    selected_proposal_type: null,
    short_version: "Short proposal text here for testing.",
    standard_version:
      "Standard proposal text that is longer than the short version for testing purposes.",
    consultative_version:
      "Consultative proposal text covering all the details for a comprehensive approach.",
    optional_questions: [],
    internal_note: null,
    generator_schema_version: "1.0",
    generator_prompt_version: null,
    draft_status: "generated",
    is_active: true,
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

describe("ProposalPreview", () => {
  it("returns null for empty drafts", () => {
    const { container } = render(
      <ProposalPreview lead={makeLead()} drafts={[]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null when no active draft", () => {
    const { container } = render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ is_active: false })]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders proposal header", () => {
    render(<ProposalPreview lead={makeLead()} drafts={[makeDraft()]} />);

    expect(screen.getByText("Propuesta generada")).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
  });

  it("renders selected status badge", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ draft_status: "selected" })]}
      />,
    );

    expect(screen.getByText("Seleccionada")).toBeInTheDocument();
  });

  it("renders submitted_manually status badge", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ draft_status: "submitted_manually" })]}
      />,
    );

    expect(screen.getByText("Enviada")).toBeInTheDocument();
  });

  it("renders profile angle and recommended type", () => {
    render(<ProposalPreview lead={makeLead()} drafts={[makeDraft()]} />);

    expect(screen.getByText(/flagship/)).toBeInTheDocument();
    expect(screen.getAllByText(/Estándar/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders all three tabs", () => {
    render(<ProposalPreview lead={makeLead()} drafts={[makeDraft()]} />);

    expect(screen.getByText("Corta")).toBeInTheDocument();
    // "Estándar" appears in both the recommended label and the tab
    const matches = screen.getAllByText(/Estándar/);
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Consultiva")).toBeInTheDocument();
  });

  it("shows recommended tab with star", () => {
    const { container } = render(
      <ProposalPreview lead={makeLead()} drafts={[makeDraft()]} />,
    );

    expect(container.querySelector(".text-green-600")).not.toBeNull();
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("renders optional questions", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[
          makeDraft({
            optional_questions: [
              "What is the timeline?",
              "Do you have a design?",
            ],
          }),
        ]}
      />,
    );

    expect(screen.getByText("What is the timeline?")).toBeInTheDocument();
    expect(screen.getByText("Do you have a design?")).toBeInTheDocument();
    expect(
      screen.getByText("Preguntas sugeridas al cliente"),
    ).toBeInTheDocument();
  });

  it("renders internal note", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ internal_note: "Focus on AI experience" })]}
      />,
    );

    expect(screen.getByText("Focus on AI experience")).toBeInTheDocument();
    expect(screen.getByText("Nota interna")).toBeInTheDocument();
  });

  it("does not render questions section when empty", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ optional_questions: [] })]}
      />,
    );

    expect(
      screen.queryByText("Preguntas sugeridas al cliente"),
    ).not.toBeInTheDocument();
  });

  it("shows selected proposal type when present", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[
          makeDraft({
            selected_proposal_type: "short",
            draft_status: "selected",
          }),
        ]}
      />,
    );

    expect(screen.getByText(/Elegida/)).toBeInTheDocument();
  });

  it("shows word count", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ recommended_proposal_type: "standard" })]}
      />,
    );

    // The standard version has words, so word count should be > 0
    expect(screen.getByText(/palabras$/)).toBeInTheDocument();
  });

  it("shows 'Elegir versión' button for generated status", () => {
    render(<ProposalPreview lead={makeLead()} drafts={[makeDraft()]} />);

    expect(
      screen.getByRole("button", { name: /Elegir versión/ }),
    ).toBeInTheDocument();
  });

  it("hides select button for selected status", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ draft_status: "selected" })]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Elegir versión/ }),
    ).not.toBeInTheDocument();
  });

  it("only renders tabs for present versions", () => {
    render(
      <ProposalPreview
        lead={makeLead()}
        drafts={[makeDraft({ consultative_version: null })]}
      />,
    );

    expect(screen.getByText("Corta")).toBeInTheDocument();
    expect(screen.queryByText("Consultiva")).not.toBeInTheDocument();
  });

  it("shows connect cost estimate for Upwork leads", () => {
    render(
      <ProposalPreview
        lead={makeLead({
          platform: "upwork",
          budget_type: "fixed",
          budget_value: "500",
        })}
        drafts={[makeDraft()]}
      />,
    );

    expect(screen.getByText(/connects/)).toBeInTheDocument();
  });

  it("hides connect cost for non-Upwork platforms", () => {
    render(
      <ProposalPreview
        lead={makeLead({ platform: "linkedin" })}
        drafts={[makeDraft()]}
      />,
    );

    expect(screen.queryByText(/connects/)).not.toBeInTheDocument();
  });

  it("shows copy button", () => {
    render(<ProposalPreview lead={makeLead()} drafts={[makeDraft()]} />);

    expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument();
  });

  it("shows submit button for generated drafts", () => {
    render(<ProposalPreview lead={makeLead()} drafts={[makeDraft()]} />);

    expect(
      screen.getByRole("button", { name: "Marcar como enviada" }),
    ).toBeInTheDocument();
  });

  it("shows Upwork link when lead has URL", () => {
    render(
      <ProposalPreview
        lead={makeLead({ url: "https://www.upwork.com/jobs/test" })}
        drafts={[makeDraft()]}
      />,
    );

    expect(screen.getByText("Ir a Upwork ↗")).toBeInTheDocument();
  });

  it("hides Upwork link when lead has no URL", () => {
    render(
      <ProposalPreview lead={makeLead({ url: null })} drafts={[makeDraft()]} />,
    );

    expect(screen.queryByText("Ir a Upwork ↗")).not.toBeInTheDocument();
  });
});
