import React from "react";
import { render, screen } from "@testing-library/react";
import { StatsBar } from "@/app/components/stats-bar";
import type { StatusCount } from "@/lib/types";

describe("StatsBar", () => {
  const defaultStats = { avg: 68, min: 52, max: 88, total: 105 };

  it("renders total leads count", () => {
    const counts: StatusCount[] = [
      { lead_status: "scored", count: 68 },
      { lead_status: "needs_review", count: 35 },
    ];

    render(<StatsBar statusCounts={counts} scoreStats={defaultStats} />);

    expect(screen.getByText("103")).toBeInTheDocument();
    expect(screen.getByText("Total leads")).toBeInTheDocument();
  });

  it("renders score average", () => {
    render(<StatsBar statusCounts={[]} scoreStats={defaultStats} />);

    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("Puntaje promedio")).toBeInTheDocument();
    expect(screen.getByText("52–88")).toBeInTheDocument();
  });

  it("renders Spanish status labels", () => {
    const counts: StatusCount[] = [
      { lead_status: "needs_review", count: 10 },
      { lead_status: "scored", count: 20 },
    ];

    render(<StatsBar statusCounts={counts} scoreStats={defaultStats} />);

    expect(screen.getByText("Para revisar")).toBeInTheDocument();
    expect(screen.getByText("Puntuados")).toBeInTheDocument();
  });

  it("shows at most 4 status cards", () => {
    const counts: StatusCount[] = [
      { lead_status: "scored", count: 60 },
      { lead_status: "needs_review", count: 30 },
      { lead_status: "low_priority", count: 5 },
      { lead_status: "won", count: 2 },
      { lead_status: "interview", count: 1 },
    ];

    render(<StatsBar statusCounts={counts} scoreStats={defaultStats} />);

    // Should show first 4 only
    expect(screen.getByText("Puntuados")).toBeInTheDocument();
    expect(screen.getByText("Para revisar")).toBeInTheDocument();
    expect(screen.getByText("Baja prioridad")).toBeInTheDocument();
    expect(screen.getByText("Ganados")).toBeInTheDocument();
    expect(screen.queryByText("Entrevista")).not.toBeInTheDocument();
  });

  it("skips statuses with count 0", () => {
    const counts: StatusCount[] = [
      { lead_status: "scored", count: 10 },
      { lead_status: "lost", count: 0 },
    ];

    render(<StatsBar statusCounts={counts} scoreStats={defaultStats} />);

    expect(screen.queryByText("Perdidos")).not.toBeInTheDocument();
  });

  it("handles dash for null avg", () => {
    render(
      <StatsBar
        statusCounts={[]}
        scoreStats={{
          avg: null as unknown as number,
          min: 0,
          max: 0,
          total: 0,
        }}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
