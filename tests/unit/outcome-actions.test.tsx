import React from "react";
import { render, screen } from "@testing-library/react";
import { OutcomeActions } from "@/app/leads/[id]/outcome-actions";

const mockFormAction = jest.fn();
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useActionState: jest.fn(() => [null, mockFormAction, false]),
    useState: actual.useState,
  };
});

jest.mock("@/app/actions", () => ({
  logOutcome: jest.fn(),
}));

describe("OutcomeActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockReturnValue([
      null,
      mockFormAction,
      false,
    ]);
  });

  // ── Visibility based on status ────────────────────────────────────

  it.each(["applied_manually", "draft_ready", "replied", "interview"])(
    "renders for eligible status: %s",
    (status) => {
      render(<OutcomeActions leadId="lead_1" currentStatus={status} />);
      expect(screen.getByText("Registrar outcome")).toBeInTheDocument();
    },
  );

  it.each([
    "new",
    "normalized",
    "scored",
    "low_priority",
    "needs_review",
    "approved_for_draft",
    "won",
    "lost",
    "archived",
  ])("returns null for ineligible status: %s", (status) => {
    const { container } = render(
      <OutcomeActions leadId="lead_1" currentStatus={status} />,
    );
    expect(container.innerHTML).toBe("");
  });

  // ── Buttons for applied_manually ──────────────────────────────────

  it("renders all outcome buttons for applied_manually", () => {
    render(<OutcomeActions leadId="lead_1" currentStatus="applied_manually" />);
    expect(screen.getByText("💬 Respondió")).toBeInTheDocument();
    expect(screen.getByText("🎙️ Entrevista")).toBeInTheDocument();
    expect(screen.getByText("🏆 Ganado")).toBeInTheDocument();
    expect(screen.getByText("❌ Perdido")).toBeInTheDocument();
    expect(screen.getByText("📦 Archivar")).toBeInTheDocument();
  });

  // ── Filtered outcomes based on progression ────────────────────────

  it("hides 'replied' button when current status is replied", () => {
    render(<OutcomeActions leadId="lead_1" currentStatus="replied" />);
    expect(screen.queryByText("💬 Respondió")).not.toBeInTheDocument();
    expect(screen.getByText("🎙️ Entrevista")).toBeInTheDocument();
    expect(screen.getByText("🏆 Ganado")).toBeInTheDocument();
    expect(screen.getByText("❌ Perdido")).toBeInTheDocument();
  });

  it("hides 'replied' and 'interview' when current status is interview", () => {
    render(<OutcomeActions leadId="lead_1" currentStatus="interview" />);
    expect(screen.queryByText("💬 Respondió")).not.toBeInTheDocument();
    expect(screen.queryByText("🎙️ Entrevista")).not.toBeInTheDocument();
    expect(screen.getByText("🏆 Ganado")).toBeInTheDocument();
    expect(screen.getByText("❌ Perdido")).toBeInTheDocument();
  });

  // ── Hidden input ──────────────────────────────────────────────────

  it("includes hidden leadId input", () => {
    render(
      <OutcomeActions leadId="lead_42" currentStatus="applied_manually" />,
    );
    const hidden = document.querySelector(
      'input[name="leadId"]',
    ) as HTMLInputElement;
    expect(hidden).toBeTruthy();
    expect(hidden.type).toBe("hidden");
    expect(hidden.value).toBe("lead_42");
  });

  // ── Notes field ───────────────────────────────────────────────────

  it("renders optional notes input", () => {
    render(<OutcomeActions leadId="lead_1" currentStatus="applied_manually" />);
    const notesInput = screen.getByLabelText("Notas (opcional)");
    expect(notesInput).toBeInTheDocument();
    expect(notesInput).toHaveAttribute("name", "notes");
  });

  // ── Button values ─────────────────────────────────────────────────

  it("each button has the correct outcome value", () => {
    render(<OutcomeActions leadId="lead_1" currentStatus="applied_manually" />);
    expect(screen.getByText("💬 Respondió")).toHaveAttribute(
      "value",
      "replied",
    );
    expect(screen.getByText("🎙️ Entrevista")).toHaveAttribute(
      "value",
      "interview",
    );
    expect(screen.getByText("🏆 Ganado")).toHaveAttribute("value", "won");
    expect(screen.getByText("❌ Perdido")).toHaveAttribute("value", "lost");
    expect(screen.getByText("📦 Archivar")).toHaveAttribute(
      "value",
      "archived",
    );
  });

  // ── Pending state ─────────────────────────────────────────────────

  it("disables buttons and shows ellipsis when pending", () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      null,
      mockFormAction,
      true,
    ]);
    render(<OutcomeActions leadId="lead_1" currentStatus="applied_manually" />);

    const dots = screen.getAllByText("...");
    expect(dots).toHaveLength(5);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  // ── Tooltip hints ─────────────────────────────────────────────────

  it("shows tooltip hint on won button", () => {
    render(<OutcomeActions leadId="lead_1" currentStatus="applied_manually" />);
    expect(screen.getByText("🏆 Ganado")).toHaveAttribute(
      "title",
      "Contrato ganado",
    );
  });
});
