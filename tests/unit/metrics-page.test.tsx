import React from "react";
import { render, screen } from "@testing-library/react";
import type { MetricsData } from "@/lib/types";

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

// Mock getMetrics
const mockGetMetrics = jest.fn<Promise<MetricsData>, []>();
jest.mock("@/lib/leads", () => ({
  getMetrics: () => mockGetMetrics(),
}));

// Mock charts — we test chart logic separately
jest.mock("@/app/metrics/charts", () => ({
  StatusChart: () => <div data-testid="status-chart" />,
  VerdictChart: () => <div data-testid="verdict-chart" />,
  PlatformChart: () => <div data-testid="platform-chart" />,
  ProfileChart: () => <div data-testid="profile-chart" />,
  DailyIntakeChart: () => <div data-testid="daily-chart" />,
  ScoreDistributionChart: () => <div data-testid="score-dist-chart" />,
}));

function makeMetrics(overrides: Partial<MetricsData> = {}): MetricsData {
  return {
    statusBreakdown: [
      { name: "needs_review", value: 12 },
      { name: "scored", value: 20 },
    ],
    scoreStats: { avg: 62, min: 18, max: 91, total: 88 },
    verdictBreakdown: [
      { name: "apply_now", value: 5 },
      { name: "maybe", value: 30 },
      { name: "ignore", value: 10 },
    ],
    platformBreakdown: [
      { name: "upwork", value: 70 },
      { name: "linkedin", value: 18 },
    ],
    profileBreakdown: [
      { name: "flagship", value: 40, avg_score: 65 },
      { name: "ai_automation", value: 25, avg_score: 72 },
    ],
    dailyIntake: [
      { date: "2026-04-01", count: 5 },
      { date: "2026-04-02", count: 8 },
    ],
    scoreDistribution: [
      { range: "70-79", count: 15 },
      { range: "50-59", count: 10 },
    ],
    ...overrides,
  };
}

// Import after mocks
import MetricsPage from "@/app/metrics/page";

describe("MetricsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMetrics.mockResolvedValue(makeMetrics());
  });

  async function renderPage() {
    const Component = await MetricsPage();
    render(Component);
  }

  it("renders page heading", async () => {
    await renderPage();
    expect(screen.getByText("Métricas")).toBeInTheDocument();
  });

  it("renders back link", async () => {
    await renderPage();
    const link = screen.getByText("← Volver al listado");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  // ── KPI cards ─────────────────────────────────────────────────────

  it("shows total leads count", async () => {
    await renderPage();
    expect(screen.getByText("Total leads")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
  });

  it("shows average score with range", async () => {
    await renderPage();
    expect(screen.getByText("Puntaje promedio")).toBeInTheDocument();
    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText("Rango: 18–91")).toBeInTheDocument();
  });

  it("shows apply_now count from verdict breakdown", async () => {
    await renderPage();
    expect(screen.getByText("Alta prioridad")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows needs_review count from status breakdown", async () => {
    await renderPage();
    expect(screen.getByText("Para revisar")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows 0 when apply_now not present", async () => {
    mockGetMetrics.mockResolvedValue(
      makeMetrics({ verdictBreakdown: [{ name: "maybe", value: 10 }] }),
    );
    await renderPage();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows dash when avg score is null", async () => {
    mockGetMetrics.mockResolvedValue(
      makeMetrics({
        scoreStats: {
          avg: null as unknown as number,
          min: 0,
          max: 0,
          total: 0,
        },
      }),
    );
    await renderPage();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // ── Chart sections ────────────────────────────────────────────────

  it("renders all 6 chart sections", async () => {
    await renderPage();
    expect(screen.getByText("Pipeline de leads")).toBeInTheDocument();
    expect(screen.getByText("Distribución de puntajes")).toBeInTheDocument();
    expect(screen.getByText("Veredictos")).toBeInTheDocument();
    expect(screen.getByText("Plataformas")).toBeInTheDocument();
    expect(screen.getByText("Ángulos de perfil")).toBeInTheDocument();
    expect(screen.getByText("Leads por día")).toBeInTheDocument();

    expect(screen.getByTestId("status-chart")).toBeInTheDocument();
    expect(screen.getByTestId("verdict-chart")).toBeInTheDocument();
    expect(screen.getByTestId("platform-chart")).toBeInTheDocument();
    expect(screen.getByTestId("profile-chart")).toBeInTheDocument();
    expect(screen.getByTestId("daily-chart")).toBeInTheDocument();
    expect(screen.getByTestId("score-dist-chart")).toBeInTheDocument();
  });
});
