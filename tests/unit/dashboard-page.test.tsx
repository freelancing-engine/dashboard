import React from "react";
import { render, screen } from "@testing-library/react";
import type { LeadListItem, StatusCount } from "@/lib/types";

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
const mockGetLeads = jest.fn();
const mockGetStatusCounts = jest.fn();
const mockGetScoreStats = jest.fn();
jest.mock("@/lib/leads", () => ({
  getLeads: (...args: unknown[]) => mockGetLeads(...args),
  getStatusCounts: () => mockGetStatusCounts(),
  getScoreStats: () => mockGetScoreStats(),
}));

// Mock child components
jest.mock("@/app/components/lead-table", () => ({
  LeadTable: ({ leads }: { leads: LeadListItem[] }) => (
    <div data-testid="lead-table" data-count={leads.length} />
  ),
}));
jest.mock("@/app/components/stats-bar", () => ({
  StatsBar: () => <div data-testid="stats-bar" />,
  STATUS_LABELS: {},
  STATUS_COLORS: {},
}));
jest.mock("@/app/components/filters", () => ({
  Filters: () => <div data-testid="filters" />,
}));

import DashboardPage from "@/app/page";

const sampleLeads: LeadListItem[] = Array.from({ length: 5 }, (_, i) => ({
  lead_id: `lead_${i + 1}`,
  platform: "upwork" as const,
  title: `Lead ${i + 1}`,
  client_country: "US",
  budget_value: "$1000",
  score_total: 60 + i,
  verdict: "maybe" as const,
  best_profile_angle: "flagship" as const,
  lead_status: "scored" as const,
  review_priority: "normal" as const,
  posted_at: "2026-04-01T10:00:00Z",
  created_at: "2026-04-01T10:00:00Z",
}));

const sampleStatusCounts: StatusCount[] = [
  { lead_status: "needs_review" as const, count: 12 },
  { lead_status: "scored" as const, count: 20 },
];

const sampleScoreStats = { avg: 62, min: 18, max: 91, total: 88 };

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLeads.mockResolvedValue({ leads: sampleLeads, total: 5 });
    mockGetStatusCounts.mockResolvedValue(sampleStatusCounts);
    mockGetScoreStats.mockResolvedValue(sampleScoreStats);
  });

  async function renderPage(params: Record<string, string> = {}) {
    const Component = await DashboardPage({
      searchParams: Promise.resolve(params),
    });
    render(Component);
  }

  it("renders page heading", async () => {
    await renderPage();
    expect(screen.getByText("Freelancing Engine — Leads")).toBeInTheDocument();
  });

  it("renders metrics link", async () => {
    await renderPage();
    const link = screen.getByText("Ver métricas");
    expect(link.closest("a")).toHaveAttribute("href", "/metrics");
  });

  it("renders profile builder link", async () => {
    await renderPage();
    const link = screen.getByText("Profile Builder");
    expect(link.closest("a")).toHaveAttribute("href", "/profiles");
  });

  it("renders child components", async () => {
    await renderPage();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("filters")).toBeInTheDocument();
    expect(screen.getByTestId("lead-table")).toBeInTheDocument();
  });

  it("passes leads to LeadTable", async () => {
    await renderPage();
    expect(screen.getByTestId("lead-table")).toHaveAttribute("data-count", "5");
  });

  // ── Pagination ────────────────────────────────────────────────────

  it("hides pagination when single page", async () => {
    await renderPage();
    expect(screen.queryByText(/página/)).not.toBeInTheDocument();
  });

  it("shows pagination when multiple pages", async () => {
    mockGetLeads.mockResolvedValue({ leads: sampleLeads, total: 60 });
    await renderPage();
    expect(screen.getByText(/60 leads — página 1 de 3/)).toBeInTheDocument();
  });

  it("shows next button on first page", async () => {
    mockGetLeads.mockResolvedValue({ leads: sampleLeads, total: 60 });
    await renderPage();
    expect(screen.getByText("Siguiente →")).toBeInTheDocument();
    expect(screen.queryByText("← Anterior")).not.toBeInTheDocument();
  });

  it("shows prev button on page 2", async () => {
    mockGetLeads.mockResolvedValue({ leads: sampleLeads, total: 60 });
    await renderPage({ page: "2" });
    expect(screen.getByText("← Anterior")).toBeInTheDocument();
    expect(screen.getByText("Siguiente →")).toBeInTheDocument();
  });

  it("hides next button on last page", async () => {
    mockGetLeads.mockResolvedValue({ leads: sampleLeads, total: 60 });
    await renderPage({ page: "3" });
    expect(screen.getByText("← Anterior")).toBeInTheDocument();
    expect(screen.queryByText("Siguiente →")).not.toBeInTheDocument();
  });

  // ── Data fetching ─────────────────────────────────────────────────

  it("passes filters to getLeads", async () => {
    await renderPage({ status: "scored", platform: "upwork", search: "react" });
    expect(mockGetLeads).toHaveBeenCalledWith({
      status: "scored",
      platform: "upwork",
      minScore: undefined,
      search: "react",
      limit: 25,
      offset: 0,
    });
  });

  it("calculates offset from page param", async () => {
    await renderPage({ page: "3" });
    expect(mockGetLeads).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 50, limit: 25 }),
    );
  });

  it("defaults to page 1", async () => {
    await renderPage();
    expect(mockGetLeads).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0 }),
    );
  });
});
