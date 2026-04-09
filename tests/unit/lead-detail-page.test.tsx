import React from "react";
import { render, screen } from "@testing-library/react";
import type { Lead, ProposalDraft, OutcomeLogEntry } from "@/lib/types";

// Mock next/navigation
const mockNotFound = jest.fn();
jest.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NOT_FOUND");
  },
}));

// Mock next/link
jest.mock("next/link", () => {
  return function Link({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock data functions
const mockGetLeadById = jest.fn<Promise<Lead | null>, [string]>();
const mockGetProposalDrafts = jest.fn<Promise<ProposalDraft[]>, [string]>();
const mockGetOutcomeHistory = jest.fn<Promise<OutcomeLogEntry[]>, [string]>();
jest.mock("@/lib/leads", () => ({
  getLeadById: (id: string) => mockGetLeadById(id),
  getProposalDrafts: (id: string) => mockGetProposalDrafts(id),
  getOutcomeHistory: (id: string) => mockGetOutcomeHistory(id),
}));

// Mock child components
jest.mock("@/app/leads/[id]/review-actions", () => ({
  ReviewActions: () => <div data-testid="review-actions" />,
}));
jest.mock("@/app/leads/[id]/application-suggestion", () => ({
  ApplicationSuggestion: () => <div data-testid="app-suggestion" />,
}));
jest.mock("@/app/leads/[id]/proposal-preview", () => ({
  ProposalPreview: () => <div data-testid="proposal-preview" />,
}));
jest.mock("@/app/leads/[id]/generate-proposal-button", () => ({
  GenerateProposalButton: () => <div data-testid="generate-btn" />,
}));
jest.mock("@/app/leads/[id]/extracted-fields", () => ({
  ExtractedFieldsCard: () => <div data-testid="extracted-fields" />,
}));
jest.mock("@/app/leads/[id]/outcome-actions", () => ({
  OutcomeActions: () => <div data-testid="outcome-actions" />,
}));
jest.mock("@/app/leads/[id]/outcome-timeline", () => ({
  OutcomeTimeline: () => <div data-testid="outcome-timeline" />,
}));

import LeadDetailPage from "@/app/leads/[id]/page";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    lead_id: "lead_42",
    platform: "upwork",
    source_type: "manual_link",
    title: "Build a chat system",
    raw_description: "Full-stack chat with real-time messaging",
    normalized_description: null,
    url: "https://example.com/job/123",
    client_name: "Acme Corp",
    client_country: "United States",
    client_history_summary: "5 hires",
    client_spend: "$10k+",
    client_hire_rate: "80%",
    budget_type: "fixed",
    budget_value: "$5,000",
    proposal_count: "15",
    posted_at: null,
    received_at: null,
    stack_tags: ["Node.js", "React"],
    lead_status: "needs_review",
    review_priority: "normal",
    score_technical_fit: 16,
    score_budget_attractiveness: 9,
    score_feasibility: 7,
    score_timeline_fit: 6,
    score_client_reliability: 12,
    score_competition_risk: 5,
    score_strategic_value: 11,
    score_close_probability: 9,
    score_total: 75,
    verdict: "apply_now",
    red_flags: [],
    best_profile_angle: "flagship",
    best_proposal_type: "standard",
    next_step: "draft_proposal",
    reasoning_summary: "Strong match for this lead.",
    extracted_fields: null,
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

describe("LeadDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLeadById.mockResolvedValue(makeLead());
    mockGetProposalDrafts.mockResolvedValue([]);
    mockGetOutcomeHistory.mockResolvedValue([]);
  });

  async function renderPage(id = "lead_42") {
    const Component = await LeadDetailPage({
      params: Promise.resolve({ id }),
    });
    render(Component);
  }

  it("calls notFound when lead does not exist", async () => {
    mockGetLeadById.mockResolvedValue(null);
    await expect(renderPage("nonexistent")).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders lead title", async () => {
    await renderPage();
    expect(screen.getByText("Build a chat system")).toBeInTheDocument();
  });

  it("shows platform, country, budget", async () => {
    await renderPage();
    expect(screen.getByText("upwork")).toBeInTheDocument();
    // Country appears in header metadata and client info section
    expect(screen.getAllByText(/United States/).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
  });

  it("renders link to original posting", async () => {
    await renderPage();
    const link = screen.getByText("Ver publicación ↗");
    expect(link).toHaveAttribute("href", "https://example.com/job/123");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows verdict badge", async () => {
    await renderPage();
    expect(screen.getByText("apply now")).toBeInTheDocument();
  });

  it("shows profile angle badge", async () => {
    await renderPage();
    expect(screen.getByText("flagship")).toBeInTheDocument();
  });

  it("renders score breakdown with all 8 dimensions", async () => {
    await renderPage();
    expect(screen.getByText(/Puntaje: 75/)).toBeInTheDocument();
    expect(screen.getByText("Technical Fit")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(screen.getByText("Feasibility")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Competition")).toBeInTheDocument();
    expect(screen.getByText("Strategic")).toBeInTheDocument();
    expect(screen.getByText("Close Prob.")).toBeInTheDocument();
  });

  it("renders dimension score values", async () => {
    await renderPage();
    expect(screen.getByText("16 / 20")).toBeInTheDocument();
    // 9/12 appears twice (budget_attractiveness and close_probability share same value/max)
    expect(screen.getAllByText("9 / 12")).toHaveLength(2);
  });

  it("renders description", async () => {
    await renderPage();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(
      screen.getByText("Full-stack chat with real-time messaging"),
    ).toBeInTheDocument();
  });

  it("renders client info section", async () => {
    await renderPage();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders stack tags", async () => {
    await renderPage();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders back link to dashboard", async () => {
    await renderPage();
    const link = screen.getByText("← Volver al listado");
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders child components", async () => {
    await renderPage();
    expect(screen.getByTestId("review-actions")).toBeInTheDocument();
    expect(screen.getByTestId("app-suggestion")).toBeInTheDocument();
    expect(screen.getByTestId("proposal-preview")).toBeInTheDocument();
    expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    expect(screen.getByTestId("outcome-actions")).toBeInTheDocument();
    expect(screen.getByTestId("outcome-timeline")).toBeInTheDocument();
  });

  it("renders extracted fields when present", async () => {
    mockGetLeadById.mockResolvedValue(
      makeLead({
        extracted_fields: {
          required_skills: ["Python"],
          ai_summary: "AI project",
          extraction_confidence: 0.9,
        },
      }),
    );
    await renderPage();
    expect(screen.getByTestId("extracted-fields")).toBeInTheDocument();
  });

  it("hides extracted fields when null", async () => {
    await renderPage();
    expect(screen.queryByTestId("extracted-fields")).not.toBeInTheDocument();
  });

  it("shows Sin título when title is empty", async () => {
    mockGetLeadById.mockResolvedValue(makeLead({ title: "" }));
    await renderPage();
    expect(screen.getByText("Sin título")).toBeInTheDocument();
  });

  it("shows dashes for null client info", async () => {
    mockGetLeadById.mockResolvedValue(
      makeLead({
        client_name: null,
        client_country: null,
        client_spend: null,
        client_hire_rate: null,
        client_history_summary: null,
        proposal_count: null,
      }),
    );
    await renderPage();
    // Should render "—" for each null field
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(5);
  });
});
