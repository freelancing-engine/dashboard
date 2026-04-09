import React from "react";
import { render, screen } from "@testing-library/react";
import { ReviewActions } from "@/app/leads/[id]/review-actions";

// Mock useActionState from React
const mockFormAction = jest.fn();
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useActionState: jest.fn(() => [null, mockFormAction, false]),
  };
});

jest.mock("@/app/actions", () => ({
  reviewLead: jest.fn(),
}));

describe("ReviewActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockReturnValue([
      null,
      mockFormAction,
      false,
    ]);
  });

  // ── Visibility based on status ────────────────────────────────────

  it.each(["needs_review", "scored", "approved_for_draft"])(
    "renders for eligible status: %s",
    (status) => {
      render(<ReviewActions leadId="lead_1" currentStatus={status} />);
      expect(screen.getByText("Acciones de revisión")).toBeInTheDocument();
    },
  );

  it.each([
    "new",
    "normalized",
    "low_priority",
    "draft_ready",
    "applied_manually",
    "archived",
  ])("returns null for ineligible status: %s", (status) => {
    const { container } = render(
      <ReviewActions leadId="lead_1" currentStatus={status} />,
    );
    expect(container.innerHTML).toBe("");
  });

  // ── Buttons ───────────────────────────────────────────────────────

  it("renders all five action buttons", () => {
    render(<ReviewActions leadId="lead_1" currentStatus="needs_review" />);
    expect(screen.getByText("Aprobar para draft")).toBeInTheDocument();
    expect(screen.getByText("Guardar")).toBeInTheDocument();
    expect(screen.getByText("Archivar")).toBeInTheDocument();
    expect(screen.getByText("Re-puntuar")).toBeInTheDocument();
    expect(screen.getByText("Rechazar")).toBeInTheDocument();
  });

  it("each button has the correct decision value", () => {
    render(<ReviewActions leadId="lead_1" currentStatus="needs_review" />);
    const approveBtn = screen.getByText("Aprobar para draft");
    expect(approveBtn).toHaveAttribute("value", "approve_for_draft");
    const saveBtn = screen.getByText("Guardar");
    expect(saveBtn).toHaveAttribute("value", "save_for_later");
    const archiveBtn = screen.getByText("Archivar");
    expect(archiveBtn).toHaveAttribute("value", "archive");
    const rescoreBtn = screen.getByText("Re-puntuar");
    expect(rescoreBtn).toHaveAttribute("value", "re_score");
    const rejectBtn = screen.getByText("Rechazar");
    expect(rejectBtn).toHaveAttribute("value", "reject");
  });

  // ── Hidden input ──────────────────────────────────────────────────

  it("includes hidden leadId input", () => {
    render(<ReviewActions leadId="lead_42" currentStatus="needs_review" />);
    const hidden = document.querySelector(
      'input[name="leadId"]',
    ) as HTMLInputElement;
    expect(hidden).toBeTruthy();
    expect(hidden.type).toBe("hidden");
    expect(hidden.value).toBe("lead_42");
  });

  // ── Reason field ──────────────────────────────────────────────────

  it("renders optional reason input", () => {
    render(<ReviewActions leadId="lead_1" currentStatus="needs_review" />);
    const reasonInput = screen.getByLabelText("Motivo (opcional)");
    expect(reasonInput).toBeInTheDocument();
    expect(reasonInput).toHaveAttribute("name", "reason");
  });

  // ── Pending state ─────────────────────────────────────────────────

  it("disables buttons and shows ellipsis when pending", () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      null,
      mockFormAction,
      true,
    ]);
    render(<ReviewActions leadId="lead_1" currentStatus="needs_review" />);

    const dots = screen.getAllByText("...");
    expect(dots).toHaveLength(5);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  // ── Tooltip hints ─────────────────────────────────────────────────

  it("shows tooltip hint on approve button", () => {
    render(<ReviewActions leadId="lead_1" currentStatus="needs_review" />);
    const approveBtn = screen.getByText("Aprobar para draft");
    expect(approveBtn).toHaveAttribute(
      "title",
      "Genera propuesta automáticamente",
    );
  });
});
