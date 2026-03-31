import React from "react";
import { render, screen } from "@testing-library/react";
import { ProposalPreview } from "@/app/leads/[id]/proposal-preview";
import type { ProposalDraft } from "@/lib/types";

// Mock server action
jest.mock("@/app/actions", () => ({
  selectProposal: jest.fn(),
}));

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
    const { container } = render(<ProposalPreview drafts={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when no active draft", () => {
    const { container } = render(
      <ProposalPreview drafts={[makeDraft({ is_active: false })]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders proposal header", () => {
    render(<ProposalPreview drafts={[makeDraft()]} />);

    expect(screen.getByText("Propuesta generada")).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
  });

  it("renders selected status badge", () => {
    render(
      <ProposalPreview drafts={[makeDraft({ draft_status: "selected" })]} />,
    );

    expect(screen.getByText("Seleccionada")).toBeInTheDocument();
  });

  it("renders submitted_manually status badge", () => {
    render(
      <ProposalPreview
        drafts={[makeDraft({ draft_status: "submitted_manually" })]}
      />,
    );

    expect(screen.getByText("Enviada")).toBeInTheDocument();
  });

  it("renders profile angle and recommended type", () => {
    render(<ProposalPreview drafts={[makeDraft()]} />);

    expect(screen.getByText(/flagship/)).toBeInTheDocument();
    expect(screen.getAllByText(/Estándar/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders all three tabs", () => {
    render(<ProposalPreview drafts={[makeDraft()]} />);

    expect(screen.getByText("Corta")).toBeInTheDocument();
    // "Estándar" appears in both the recommended label and the tab
    const matches = screen.getAllByText(/Estándar/);
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Consultiva")).toBeInTheDocument();
  });

  it("shows recommended tab with star", () => {
    const { container } = render(<ProposalPreview drafts={[makeDraft()]} />);

    expect(container.querySelector(".text-green-600")).not.toBeNull();
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("renders optional questions", () => {
    render(
      <ProposalPreview
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
        drafts={[makeDraft({ internal_note: "Focus on AI experience" })]}
      />,
    );

    expect(screen.getByText("Focus on AI experience")).toBeInTheDocument();
    expect(screen.getByText("Nota interna")).toBeInTheDocument();
  });

  it("does not render questions section when empty", () => {
    render(
      <ProposalPreview drafts={[makeDraft({ optional_questions: [] })]} />,
    );

    expect(
      screen.queryByText("Preguntas sugeridas al cliente"),
    ).not.toBeInTheDocument();
  });

  it("shows selected proposal type when present", () => {
    render(
      <ProposalPreview
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
        drafts={[makeDraft({ recommended_proposal_type: "standard" })]}
      />,
    );

    // The standard version has words, so word count should be > 0
    expect(screen.getByText(/palabras$/)).toBeInTheDocument();
  });

  it("shows 'Elegir versión' button for generated status", () => {
    render(<ProposalPreview drafts={[makeDraft()]} />);

    expect(
      screen.getByRole("button", { name: /Elegir versión/ }),
    ).toBeInTheDocument();
  });

  it("hides select button for selected status", () => {
    render(
      <ProposalPreview drafts={[makeDraft({ draft_status: "selected" })]} />,
    );

    expect(
      screen.queryByRole("button", { name: /Elegir versión/ }),
    ).not.toBeInTheDocument();
  });

  it("only renders tabs for present versions", () => {
    render(
      <ProposalPreview drafts={[makeDraft({ consultative_version: null })]} />,
    );

    expect(screen.getByText("Corta")).toBeInTheDocument();
    expect(screen.queryByText("Consultiva")).not.toBeInTheDocument();
  });
});
