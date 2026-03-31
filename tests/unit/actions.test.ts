const mockSelectProposalType = jest.fn();
const mockRevalidatePath = jest.fn();
const mockFetch = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("@/lib/leads", () => ({
  selectProposalType: (...args: unknown[]) => mockSelectProposalType(...args),
}));

// Mock global fetch
global.fetch = mockFetch as unknown as typeof fetch;

import { reviewLead, selectProposal, generateProposal } from "@/app/actions";

beforeEach(() => {
  mockSelectProposalType.mockReset();
  mockRevalidatePath.mockReset();
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, text: async () => "{}" });
});

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.set(k, v);
  return fd;
}

describe("reviewLead", () => {
  it("approve_for_draft → calls WF05 webhook", async () => {
    await reviewLead(
      makeFormData({
        leadId: "lead_1",
        decision: "approve_for_draft",
        reason: "Good lead",
      }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/review-decision"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          lead_id: "lead_1",
          decision: "approve_for_draft",
          reviewer: "dashboard",
          reason: "Good lead",
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("archive → calls WF05 webhook with archive decision", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_2", decision: "archive", reason: "" }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/review-decision"),
      expect.objectContaining({
        body: JSON.stringify({
          lead_id: "lead_2",
          decision: "archive",
          reviewer: "dashboard",
          reason: null,
        }),
      }),
    );
  });

  it("reject → calls WF05 webhook with reject decision", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_3", decision: "reject", reason: "" }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/review-decision"),
      expect.objectContaining({
        body: JSON.stringify({
          lead_id: "lead_3",
          decision: "reject",
          reviewer: "dashboard",
          reason: null,
        }),
      }),
    );
  });

  it("save_for_later → calls WF05 webhook", async () => {
    await reviewLead(
      makeFormData({
        leadId: "lead_4",
        decision: "save_for_later",
        reason: "",
      }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/review-decision"),
      expect.objectContaining({
        body: JSON.stringify({
          lead_id: "lead_4",
          decision: "save_for_later",
          reviewer: "dashboard",
          reason: null,
        }),
      }),
    );
  });

  it("re_score → calls WF05 webhook", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_5", decision: "re_score", reason: "" }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/review-decision"),
      expect.objectContaining({
        body: JSON.stringify({
          lead_id: "lead_5",
          decision: "re_score",
          reviewer: "dashboard",
          reason: null,
        }),
      }),
    );
  });

  it("does nothing when leadId is missing", async () => {
    await reviewLead(makeFormData({ decision: "archive", reason: "" }));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does nothing when decision is missing", async () => {
    await reviewLead(makeFormData({ leadId: "lead_1", reason: "" }));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does nothing for invalid decision", async () => {
    await reviewLead(
      makeFormData({
        leadId: "lead_1",
        decision: "invalid_action",
        reason: "",
      }),
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends null reason when empty string", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_1", decision: "archive", reason: "" }),
    );

    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.reason).toBeNull();
  });
});

describe("selectProposal", () => {
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

describe("generateProposal", () => {
  it("calls WF06 webhook with lead_id", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => "{}" });

    const result = await generateProposal(makeFormData({ leadId: "lead_1" }));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/generate-proposal"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ lead_id: "lead_1" }),
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it("returns error when leadId is missing", async () => {
    const result = await generateProposal(makeFormData({}));

    expect(result).toEqual({ error: "Lead ID requerido" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns error when WF06 responds with error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal error",
    });

    const result = await generateProposal(makeFormData({ leadId: "lead_1" }));

    expect(result).toEqual({
      error: "Error WF06: 500 — Internal error",
    });
  });

  it("returns error when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const result = await generateProposal(makeFormData({ leadId: "lead_1" }));

    expect(result).toEqual({
      error: "Error generando propuesta: Network failure",
    });
  });

  it("revalidates paths on success", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => "{}" });

    await generateProposal(makeFormData({ leadId: "lead_1" }));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });
});
