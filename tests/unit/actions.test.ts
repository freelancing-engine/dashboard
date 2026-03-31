const mockUpdateLeadStatus = jest.fn();
const mockInsertReviewDecision = jest.fn();
const mockSelectProposalType = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("@/lib/leads", () => ({
  updateLeadStatus: (...args: unknown[]) => mockUpdateLeadStatus(...args),
  insertReviewDecision: (...args: unknown[]) =>
    mockInsertReviewDecision(...args),
  selectProposalType: (...args: unknown[]) => mockSelectProposalType(...args),
}));

import { reviewLead, selectProposal } from "@/app/actions";

beforeEach(() => {
  mockUpdateLeadStatus.mockReset();
  mockInsertReviewDecision.mockReset();
  mockSelectProposalType.mockReset();
  mockRevalidatePath.mockReset();
});

describe("reviewLead", () => {
  function makeFormData(data: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.set(k, v);
    return fd;
  }

  it("approve_for_draft → updates status to approved_for_draft", async () => {
    await reviewLead(
      makeFormData({
        leadId: "lead_1",
        decision: "approve_for_draft",
        reason: "Good lead",
      }),
    );

    expect(mockInsertReviewDecision).toHaveBeenCalledWith(
      "lead_1",
      "approve_for_draft",
      "Good lead",
    );
    expect(mockUpdateLeadStatus).toHaveBeenCalledWith(
      "lead_1",
      "approved_for_draft",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("archive → updates status to archived", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_2", decision: "archive", reason: "" }),
    );

    expect(mockUpdateLeadStatus).toHaveBeenCalledWith("lead_2", "archived");
  });

  it("reject → updates status to archived", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_3", decision: "reject", reason: "" }),
    );

    expect(mockUpdateLeadStatus).toHaveBeenCalledWith("lead_3", "archived");
  });

  it("save_for_later → updates status to scored", async () => {
    await reviewLead(
      makeFormData({
        leadId: "lead_4",
        decision: "save_for_later",
        reason: "",
      }),
    );

    expect(mockUpdateLeadStatus).toHaveBeenCalledWith("lead_4", "scored");
  });

  it("re_score → updates status to scored", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_5", decision: "re_score", reason: "" }),
    );

    expect(mockUpdateLeadStatus).toHaveBeenCalledWith("lead_5", "scored");
  });

  it("does nothing when leadId is missing", async () => {
    await reviewLead(makeFormData({ decision: "archive", reason: "" }));

    expect(mockInsertReviewDecision).not.toHaveBeenCalled();
    expect(mockUpdateLeadStatus).not.toHaveBeenCalled();
  });

  it("does nothing when decision is missing", async () => {
    await reviewLead(makeFormData({ leadId: "lead_1", reason: "" }));

    expect(mockInsertReviewDecision).not.toHaveBeenCalled();
  });

  it("does nothing for invalid decision", async () => {
    await reviewLead(
      makeFormData({
        leadId: "lead_1",
        decision: "invalid_action",
        reason: "",
      }),
    );

    expect(mockInsertReviewDecision).not.toHaveBeenCalled();
  });

  it("passes undefined reason when empty", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_1", decision: "archive", reason: "" }),
    );

    expect(mockInsertReviewDecision).toHaveBeenCalledWith(
      "lead_1",
      "archive",
      undefined,
    );
  });
});

describe("selectProposal", () => {
  function makeFormData(data: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.set(k, v);
    return fd;
  }

  it("calls selectProposalType with correct params", async () => {
    await selectProposal(
      makeFormData({ proposalId: "uuid-1", proposalType: "standard" }),
    );

    expect(mockSelectProposalType).toHaveBeenCalledWith("uuid-1", "standard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("does nothing when proposalId is missing", async () => {
    await selectProposal(makeFormData({ proposalType: "short" }));

    expect(mockSelectProposalType).not.toHaveBeenCalled();
  });

  it("does nothing when proposalType is missing", async () => {
    await selectProposal(makeFormData({ proposalId: "uuid-1" }));

    expect(mockSelectProposalType).not.toHaveBeenCalled();
  });
});
