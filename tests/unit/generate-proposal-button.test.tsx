import React from "react";
import { render, screen } from "@testing-library/react";
import { GenerateProposalButton } from "@/app/leads/[id]/generate-proposal-button";

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
  generateProposal: jest.fn(),
}));

describe("GenerateProposalButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockReturnValue([
      null,
      mockFormAction,
      false,
    ]);
  });

  it("renders null when status is not eligible", () => {
    const { container } = render(
      <GenerateProposalButton
        leadId="lead_1"
        currentStatus="new"
        hasDrafts={false}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders null when hasDrafts is true", () => {
    const { container } = render(
      <GenerateProposalButton
        leadId="lead_1"
        currentStatus="approved_for_draft"
        hasDrafts={true}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it.each(["approved_for_draft", "needs_review", "scored", "draft_ready"])(
    "renders for eligible status: %s",
    (status) => {
      render(
        <GenerateProposalButton
          leadId="lead_1"
          currentStatus={status}
          hasDrafts={false}
        />,
      );
      expect(screen.getByText("Generar propuesta")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Generar propuesta con IA/ }),
      ).toBeInTheDocument();
    },
  );

  it("includes hidden leadId input", () => {
    render(
      <GenerateProposalButton
        leadId="lead_xyz"
        currentStatus="approved_for_draft"
        hasDrafts={false}
      />,
    );
    const input = document.querySelector(
      'input[name="leadId"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe("lead_xyz");
  });

  it("shows description text", () => {
    render(
      <GenerateProposalButton
        leadId="lead_1"
        currentStatus="scored"
        hasDrafts={false}
      />,
    );
    expect(
      screen.getByText(/El agente generará 3 versiones de propuesta/),
    ).toBeInTheDocument();
  });

  it("shows pending state", () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      null,
      mockFormAction,
      true,
    ]);

    render(
      <GenerateProposalButton
        leadId="lead_1"
        currentStatus="scored"
        hasDrafts={false}
      />,
    );

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Generando propuesta...");
  });

  it("shows error message from state", () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { error: "API timeout" },
      mockFormAction,
      false,
    ]);

    render(
      <GenerateProposalButton
        leadId="lead_1"
        currentStatus="scored"
        hasDrafts={false}
      />,
    );

    expect(screen.getByText("API timeout")).toBeInTheDocument();
  });

  it("does not show error when state is null", () => {
    render(
      <GenerateProposalButton
        leadId="lead_1"
        currentStatus="scored"
        hasDrafts={false}
      />,
    );

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("renders null for low_priority status", () => {
    const { container } = render(
      <GenerateProposalButton
        leadId="lead_1"
        currentStatus="low_priority"
        hasDrafts={false}
      />,
    );
    expect(container.innerHTML).toBe("");
  });
});
