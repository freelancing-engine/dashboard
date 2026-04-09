import React from "react";
import { render, screen } from "@testing-library/react";
import {
  StatusChart,
  VerdictChart,
  PlatformChart,
  ProfileChart,
  DailyIntakeChart,
  ScoreDistributionChart,
} from "@/app/metrics/charts";

// Mock recharts — SVG rendering doesn't work in jsdom.
// Replace chart components with simple divs that expose the received data.
jest.mock("recharts", () => {
  const Original = jest.requireActual("recharts");
  return {
    ...Original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({
      data,
      children,
    }: {
      data: unknown[];
      children: React.ReactNode;
    }) => (
      <div data-testid="bar-chart" data-len={data.length}>
        {children}
      </div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    LineChart: ({
      data,
      children,
    }: {
      data: unknown[];
      children: React.ReactNode;
    }) => (
      <div data-testid="line-chart" data-len={data.length}>
        {children}
      </div>
    ),
    Pie: ({ data }: { data: unknown[] }) => (
      <div data-testid="pie" data-len={data.length} />
    ),
    Bar: ({ dataKey }: { dataKey: string }) => (
      <div data-testid={`bar-${dataKey}`} />
    ),
    Line: ({ dataKey }: { dataKey: string }) => (
      <div data-testid={`line-${dataKey}`} />
    ),
    Cell: () => <div data-testid="cell" />,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

describe("StatusChart", () => {
  it("renders a bar chart with mapped data", () => {
    const data = [
      { name: "needs_review", value: 12 },
      { name: "scored", value: 5 },
    ];
    render(<StatusChart data={data} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-len", "2");
  });

  it("renders with empty data", () => {
    render(<StatusChart data={[]} />);
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-len", "0");
  });
});

describe("VerdictChart", () => {
  it("renders a pie chart with verdict data", () => {
    const data = [
      { name: "apply_now", value: 8 },
      { name: "maybe", value: 15 },
      { name: "ignore", value: 3 },
    ];
    render(<VerdictChart data={data} />);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("pie")).toHaveAttribute("data-len", "3");
  });

  it("renders with empty data", () => {
    render(<VerdictChart data={[]} />);
    expect(screen.getByTestId("pie")).toHaveAttribute("data-len", "0");
  });
});

describe("PlatformChart", () => {
  it("renders a pie chart with platform data", () => {
    const data = [
      { name: "upwork", value: 50 },
      { name: "linkedin", value: 20 },
    ];
    render(<PlatformChart data={data} />);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("pie")).toHaveAttribute("data-len", "2");
  });
});

describe("ProfileChart", () => {
  it("renders dual-bar chart", () => {
    const data = [
      { name: "flagship", value: 30, avg_score: 65 },
      { name: "ai_automation", value: 20, avg_score: 72 },
    ];
    render(<ProfileChart data={data} />);
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-len", "2");
    expect(screen.getByTestId("bar-value")).toBeInTheDocument();
    expect(screen.getByTestId("bar-avg_score")).toBeInTheDocument();
  });
});

describe("DailyIntakeChart", () => {
  it("renders line chart with date-sliced labels", () => {
    const data = [
      { date: "2026-04-01", count: 5 },
      { date: "2026-04-02", count: 8 },
      { date: "2026-04-03", count: 3 },
    ];
    render(<DailyIntakeChart data={data} />);
    expect(screen.getByTestId("line-chart")).toHaveAttribute("data-len", "3");
    expect(screen.getByTestId("line-count")).toBeInTheDocument();
  });
});

describe("ScoreDistributionChart", () => {
  it("renders sorted score ranges", () => {
    const data = [
      { range: "70-79", count: 10 },
      { range: "0-39", count: 3 },
      { range: "50-59", count: 7 },
    ];
    render(<ScoreDistributionChart data={data} />);
    // Should always render 6 ranges (fills missing with 0)
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-len", "6");
  });

  it("fills missing ranges with zero count", () => {
    render(<ScoreDistributionChart data={[]} />);
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-len", "6");
  });
});
