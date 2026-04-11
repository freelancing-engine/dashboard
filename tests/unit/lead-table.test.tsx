import React from "react";
import { render, screen } from "@testing-library/react";
import { LeadTable } from "@/app/components/lead-table";
import type { LeadListItem } from "@/lib/types";

// Mock next/link to render a plain <a> tag
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function makeLead(overrides: Partial<LeadListItem> = {}): LeadListItem {
  return {
    lead_id: "lead_test",
    platform: "upwork",
    source_type: "manual_link",
    title: "Build a React App",
    client_country: "US",
    budget_value: "$500",
    score_total: 75,
    verdict: "apply_now",
    best_profile_angle: "flagship",
    lead_status: "scored",
    review_priority: "normal",
    posted_at: "2026-03-15T10:00:00Z",
    created_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

describe("LeadTable", () => {
  it("renders empty state message", () => {
    render(<LeadTable leads={[]} />);

    expect(screen.getByText("No se encontraron leads.")).toBeInTheDocument();
  });

  it("renders table headers in Spanish", () => {
    render(<LeadTable leads={[makeLead()]} />);

    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Plataforma")).toBeInTheDocument();
    expect(screen.getByText("País")).toBeInTheDocument();
    expect(screen.getByText("Presupuesto")).toBeInTheDocument();
    expect(screen.getByText("Puntaje")).toBeInTheDocument();
    expect(screen.getByText("Veredicto")).toBeInTheDocument();
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();
  });

  it("renders lead data correctly", () => {
    render(<LeadTable leads={[makeLead()]} />);

    expect(screen.getByText("Build a React App")).toBeInTheDocument();
    expect(screen.getByText("upwork")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("apply now")).toBeInTheDocument();
  });

  it("links to lead detail page", () => {
    render(<LeadTable leads={[makeLead()]} />);

    const link = screen.getByRole("link", { name: "Build a React App" });
    expect(link).toHaveAttribute("href", "/leads/lead_test");
  });

  it("shows dash for null fields", () => {
    render(
      <LeadTable
        leads={[
          makeLead({
            client_country: null,
            budget_value: null,
            score_total: null,
            verdict: null,
            best_profile_angle: null,
          }),
        ]}
      />,
    );

    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("shows 'Sin título' for empty title", () => {
    render(<LeadTable leads={[makeLead({ title: "" })]} />);

    expect(screen.getByText("Sin título")).toBeInTheDocument();
  });

  it("renders multiple leads", () => {
    const leads = [
      makeLead({ lead_id: "lead_1", title: "First" }),
      makeLead({ lead_id: "lead_2", title: "Second" }),
      makeLead({ lead_id: "lead_3", title: "Third" }),
    ];

    render(<LeadTable leads={leads} />);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("renders score bar colors based on score", () => {
    const { container } = render(
      <LeadTable
        leads={[
          makeLead({ lead_id: "l1", score_total: 80 }),
          makeLead({ lead_id: "l2", score_total: 60 }),
          makeLead({ lead_id: "l3", score_total: 40 }),
        ]}
      />,
    );

    const greenBars = container.querySelectorAll(".score-bar-fill--high");
    const yellowBars = container.querySelectorAll(".score-bar-fill--mid");
    const redBars = container.querySelectorAll(".score-bar-fill--low");

    expect(greenBars.length).toBe(1);
    expect(yellowBars.length).toBe(1);
    expect(redBars.length).toBe(1);
  });
});
