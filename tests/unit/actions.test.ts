const mockSelectProposalType = jest.fn();
const mockMarkProposalSubmitted = jest.fn();
const mockRevalidatePath = jest.fn();
const mockFetch = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("@/lib/leads", () => ({
  selectProposalType: (...args: unknown[]) => mockSelectProposalType(...args),
  markProposalSubmitted: (...args: unknown[]) =>
    mockMarkProposalSubmitted(...args),
}));

// Mock global fetch
global.fetch = mockFetch as unknown as typeof fetch;

import {
  reviewLead,
  selectProposal,
  generateProposal,
  markProposalSubmitted,
  logOutcome,
} from "@/app/actions";

beforeEach(() => {
  mockSelectProposalType.mockReset();
  mockMarkProposalSubmitted.mockReset();
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
      error: "Error al generar propuesta (500)",
    });
  });

  it("returns friendly error for JSON error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () =>
        JSON.stringify({
          error: "Lead status is scored, expected approved_for_draft",
        }),
    });

    const result = await generateProposal(makeFormData({ leadId: "lead_1" }));

    expect(result).toEqual({
      error:
        "El lead debe estar aprobado para draft antes de generar propuesta. Usá 'Aprobar para draft' primero.",
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

describe("markProposalSubmitted", () => {
  it("calls db markProposalSubmitted and revalidates", async () => {
    await markProposalSubmitted(
      makeFormData({ proposalId: "uuid-1", leadId: "lead_1" }),
    );

    expect(mockMarkProposalSubmitted).toHaveBeenCalledWith("uuid-1", "lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("does nothing when proposalId is missing", async () => {
    await markProposalSubmitted(makeFormData({ leadId: "lead_1" }));

    expect(mockMarkProposalSubmitted).not.toHaveBeenCalled();
  });

  it("does nothing when leadId is missing", async () => {
    await markProposalSubmitted(makeFormData({ proposalId: "uuid-1" }));

    expect(mockMarkProposalSubmitted).not.toHaveBeenCalled();
  });
});

// ── logOutcome ──────────────────────────────────────────────────────────

describe("logOutcome", () => {
  it("replied → calls WF07 webhook", async () => {
    await logOutcome(
      makeFormData({
        leadId: "lead_1",
        outcome: "replied",
        notes: "Client responded",
      }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/log-outcome"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          lead_id: "lead_1",
          outcome: "replied",
          notes: "Client responded",
          reporter: "dashboard",
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("won → calls WF07 webhook with won outcome", async () => {
    await logOutcome(
      makeFormData({ leadId: "lead_2", outcome: "won", notes: "" }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/log-outcome"),
      expect.objectContaining({
        body: JSON.stringify({
          lead_id: "lead_2",
          outcome: "won",
          notes: null,
          reporter: "dashboard",
        }),
      }),
    );
  });

  it("lost → calls WF07 webhook with lost outcome", async () => {
    await logOutcome(
      makeFormData({ leadId: "lead_3", outcome: "lost", notes: "No budget" }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/log-outcome"),
      expect.objectContaining({
        body: JSON.stringify({
          lead_id: "lead_3",
          outcome: "lost",
          notes: "No budget",
          reporter: "dashboard",
        }),
      }),
    );
  });

  it("interview → calls WF07 webhook", async () => {
    await logOutcome(
      makeFormData({ leadId: "lead_4", outcome: "interview", notes: "" }),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/log-outcome"),
      expect.objectContaining({
        body: JSON.stringify({
          lead_id: "lead_4",
          outcome: "interview",
          notes: null,
          reporter: "dashboard",
        }),
      }),
    );
  });

  it("returns error for missing leadId", async () => {
    const result = await logOutcome(
      makeFormData({ outcome: "won", notes: "" }),
    );
    expect(result).toEqual({ error: "Lead ID y outcome requeridos" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns error for missing outcome", async () => {
    const result = await logOutcome(
      makeFormData({ leadId: "lead_1", notes: "" }),
    );
    expect(result).toEqual({ error: "Lead ID y outcome requeridos" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns error for invalid outcome", async () => {
    const result = await logOutcome(
      makeFormData({
        leadId: "lead_1",
        outcome: "invalid_outcome",
        notes: "",
      }),
    );
    expect(result).toEqual({ error: "Outcome inválido" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns error on WF07 failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal error",
    });

    const result = await logOutcome(
      makeFormData({ leadId: "lead_1", outcome: "won", notes: "" }),
    );
    expect(result).toEqual({
      error: "Error registrando outcome (500)",
    });
  });

  it("returns error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await logOutcome(
      makeFormData({ leadId: "lead_1", outcome: "won", notes: "" }),
    );
    expect(result).toEqual({
      error: "Error registrando outcome: Network error",
    });
  });

  it("sends null notes when empty string", async () => {
    await logOutcome(
      makeFormData({ leadId: "lead_1", outcome: "replied", notes: "" }),
    );

    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.notes).toBeNull();
  });
});
