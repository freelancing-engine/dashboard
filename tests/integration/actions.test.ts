/**
 * Integration tests for server actions (src/app/actions.ts).
 *
 * Uses real Postgres for DB-writing actions (selectProposal, markProposalSubmitted).
 * Mocks fetch for n8n webhook calls (reviewLead, generateProposal).
 * Mocks next/cache revalidatePath (not available outside Next.js runtime).
 *
 * Requires a running Postgres instance. In CI, provided by service container.
 * Run with: npm run test:integration
 */

import { Pool } from "pg";

// Point the db module at the test database BEFORE importing anything
process.env.POSTGRES_DB = process.env.POSTGRES_DB || "freelancing_engine_test";
process.env.POSTGRES_USER = process.env.POSTGRES_USER || "postgres";
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || "postgres";

// Mock next/cache (not available outside Next.js runtime)
const mockRevalidatePath = jest.fn();
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock global fetch for n8n webhook calls
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import {
  reviewLead,
  selectProposal,
  generateProposal,
  markProposalSubmitted,
} from "@/app/actions";
import pool from "@/lib/db";
import { getLeadById, getProposalDrafts } from "@/lib/leads";

// Direct pool for test data setup/teardown
const testPool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "freelancing_engine_test",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LEAD_REVIEW = {
  lead_id: "action_lead_1",
  platform: "upwork",
  source_type: "manual_link",
  title: "Build a React dashboard",
  raw_description: "We need a React dashboard.",
  score_technical_fit: 18,
  score_budget_attractiveness: 10,
  score_feasibility: 8,
  score_timeline_fit: 6,
  score_client_reliability: 12,
  score_competition_risk: 5,
  score_strategic_value: 10,
  score_close_probability: 9,
  score_total: 78,
  verdict: "strong_maybe",
  best_profile_angle: "flagship",
  best_proposal_type: "standard",
  lead_status: "needs_review",
  review_priority: "high",
};

const LEAD_APPROVED = {
  ...LEAD_REVIEW,
  lead_id: "action_lead_2",
  lead_status: "approved_for_draft",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.set(k, v);
  return fd;
}

async function insertLead(lead: Record<string, unknown>) {
  const defaults: Record<string, unknown> = {
    platform: "upwork",
    source_type: "manual_link",
    raw_description: "test",
    lead_status: "new",
    review_priority: "normal",
  };
  const m: Record<string, unknown> = { ...defaults, ...lead };

  await testPool.query(
    `INSERT INTO leads (
       lead_id, platform, source_type, title, raw_description,
       score_technical_fit, score_budget_attractiveness,
       score_feasibility, score_timeline_fit,
       score_client_reliability, score_competition_risk,
       score_strategic_value, score_close_probability,
       score_total, verdict, best_profile_angle, best_proposal_type,
       lead_status, review_priority
     ) VALUES (
       $1, $2::platform_type, $3::source_type_enum, $4, $5,
       $6, $7, $8, $9, $10, $11, $12, $13,
       $14, $15::verdict_enum, $16::profile_angle_enum, $17::proposal_type_enum,
       $18::lead_status_enum, $19::review_priority_enum
     )`,
    [
      m.lead_id,
      m.platform,
      m.source_type,
      m.title,
      m.raw_description,
      m.score_technical_fit ?? null,
      m.score_budget_attractiveness ?? null,
      m.score_feasibility ?? null,
      m.score_timeline_fit ?? null,
      m.score_client_reliability ?? null,
      m.score_competition_risk ?? null,
      m.score_strategic_value ?? null,
      m.score_close_probability ?? null,
      m.score_total ?? null,
      m.verdict ?? null,
      m.best_profile_angle ?? null,
      m.best_proposal_type ?? null,
      m.lead_status,
      m.review_priority,
    ],
  );
}

async function insertProposal(
  leadId: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const defaults: Record<string, unknown> = {
    profile_angle_used: "flagship",
    recommended_proposal_type: "standard",
    short_version: "Short proposal text",
    standard_version: "Standard proposal text",
    consultative_version: "Consultative proposal text",
    draft_status: "generated",
    is_active: true,
  };
  const m: Record<string, unknown> = { ...defaults, ...overrides };

  const result = await testPool.query(
    `INSERT INTO proposal_drafts (
       lead_id, profile_angle_used, recommended_proposal_type,
       short_version, standard_version, consultative_version,
       draft_status, is_active
     ) VALUES (
       $1, $2::profile_angle_enum, $3::proposal_type_enum,
       $4, $5, $6, $7::draft_status_enum, $8
     ) RETURNING proposal_id`,
    [
      leadId,
      m.profile_angle_used,
      m.recommended_proposal_type,
      m.short_version,
      m.standard_version,
      m.consultative_version,
      m.draft_status,
      m.is_active,
    ],
  );
  return result.rows[0].proposal_id as string;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await testPool.query("DELETE FROM review_decisions");
  await testPool.query("DELETE FROM action_logs");
  await testPool.query("DELETE FROM proposal_drafts");
  await testPool.query("DELETE FROM follow_up_reminders");
  await testPool.query("DELETE FROM leads");
  mockFetch.mockReset();
  mockRevalidatePath.mockReset();
  mockFetch.mockResolvedValue({ ok: true, text: async () => "{}" });
});

afterAll(async () => {
  await testPool.end();
  await pool.end();
});

// ---------------------------------------------------------------------------
// Tests: reviewLead (fetch → n8n, mock webhook)
// ---------------------------------------------------------------------------

describe("reviewLead (integration)", () => {
  it("sends correct payload to n8n review-decision webhook", async () => {
    await reviewLead(
      makeFormData({
        leadId: "action_lead_1",
        decision: "approve_for_draft",
        reason: "Good technical fit",
      }),
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/review-decision");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body).toEqual({
      lead_id: "action_lead_1",
      decision: "approve_for_draft",
      reviewer: "dashboard",
      reason: "Good technical fit",
    });
  });

  it("sends null reason when empty", async () => {
    await reviewLead(
      makeFormData({ leadId: "lead_x", decision: "archive", reason: "" }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reason).toBeNull();
  });

  it("revalidates lead page and index after review", async () => {
    await reviewLead(
      makeFormData({
        leadId: "action_lead_1",
        decision: "reject",
        reason: "",
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/action_lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("skips fetch for invalid decision", async () => {
    await reviewLead(
      makeFormData({
        leadId: "action_lead_1",
        decision: "bad_decision",
        reason: "",
      }),
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("skips fetch when leadId is missing", async () => {
    await reviewLead(makeFormData({ decision: "archive", reason: "" }));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("logs error but still revalidates on webhook failure", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await reviewLead(
      makeFormData({
        leadId: "action_lead_1",
        decision: "archive",
        reason: "",
      }),
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("WF05 error: 500"),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/action_lead_1");
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Tests: selectProposal (real Postgres)
// ---------------------------------------------------------------------------

describe("selectProposal (integration)", () => {
  it("updates proposal type and status in Postgres", async () => {
    await insertLead(LEAD_APPROVED);
    const proposalId = await insertProposal("action_lead_2");

    await selectProposal(
      makeFormData({ proposalId, proposalType: "consultative" }),
    );

    const drafts = await getProposalDrafts("action_lead_2");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].selected_proposal_type).toBe("consultative");
    expect(drafts[0].draft_status).toBe("selected");
  });

  it("can switch from one type to another", async () => {
    await insertLead(LEAD_APPROVED);
    const proposalId = await insertProposal("action_lead_2");

    await selectProposal(makeFormData({ proposalId, proposalType: "short" }));

    let drafts = await getProposalDrafts("action_lead_2");
    expect(drafts[0].selected_proposal_type).toBe("short");

    await selectProposal(
      makeFormData({ proposalId, proposalType: "standard" }),
    );

    drafts = await getProposalDrafts("action_lead_2");
    expect(drafts[0].selected_proposal_type).toBe("standard");
  });

  it("revalidates index after selection", async () => {
    await insertLead(LEAD_APPROVED);
    const proposalId = await insertProposal("action_lead_2");

    await selectProposal(
      makeFormData({ proposalId, proposalType: "standard" }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("does nothing when proposalId is missing", async () => {
    await selectProposal(makeFormData({ proposalType: "short" }));

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("does nothing when proposalType is missing", async () => {
    await selectProposal(makeFormData({ proposalId: "some-uuid" }));

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: generateProposal (fetch → n8n, mock webhook)
// ---------------------------------------------------------------------------

describe("generateProposal (integration)", () => {
  it("sends correct payload to n8n generate-proposal webhook", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => "{}" });

    const result = await generateProposal(
      makeFormData({ leadId: "action_lead_1" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/generate-proposal");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body).toEqual({ lead_id: "action_lead_1" });
  });

  it("revalidates paths on success", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => "{}" });

    await generateProposal(makeFormData({ leadId: "action_lead_1" }));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/action_lead_1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("returns error when leadId is missing", async () => {
    const result = await generateProposal(makeFormData({}));

    expect(result).toEqual({ error: "Lead ID requerido" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns plain error for non-JSON error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const result = await generateProposal(
      makeFormData({ leadId: "action_lead_1" }),
    );

    expect(result).toEqual({ error: "Error al generar propuesta (500)" });
  });

  it("maps 'expected approved_for_draft' to friendly Spanish error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () =>
        JSON.stringify({
          error: "Lead status is scored, expected approved_for_draft",
        }),
    });

    const result = await generateProposal(
      makeFormData({ leadId: "action_lead_1" }),
    );

    expect(result).toEqual({
      error:
        "El lead debe estar aprobado para draft antes de generar propuesta. Usá 'Aprobar para draft' primero.",
    });
  });

  it("maps 'Lead not found' to friendly error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: "Lead not found" }),
    });

    const result = await generateProposal(
      makeFormData({ leadId: "nonexistent" }),
    );

    expect(result).toEqual({
      error: "Lead no encontrado en la base de datos.",
    });
  });

  it("maps 'already has active proposal' to friendly error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({ error: "Lead already has active proposal draft" }),
    });

    const result = await generateProposal(
      makeFormData({ leadId: "action_lead_1" }),
    );

    expect(result).toEqual({
      error: "Ya existe una propuesta activa para este lead.",
    });
  });

  it("handles fetch network error gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await generateProposal(
      makeFormData({ leadId: "action_lead_1" }),
    );

    expect(result).toEqual({
      error: "Error generando propuesta: ECONNREFUSED",
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: markProposalSubmitted (real Postgres)
// ---------------------------------------------------------------------------

describe("markProposalSubmitted (integration)", () => {
  it("marks proposal as submitted and lead as applied_manually", async () => {
    await insertLead(LEAD_APPROVED);
    const proposalId = await insertProposal("action_lead_2");

    await markProposalSubmitted(
      makeFormData({ proposalId, leadId: "action_lead_2" }),
    );

    // Verify proposal status in DB
    const drafts = await getProposalDrafts("action_lead_2");
    expect(drafts[0].draft_status).toBe("submitted_manually");

    // Verify lead status in DB
    const lead = await getLeadById("action_lead_2");
    expect(lead!.lead_status).toBe("applied_manually");
  });

  it("revalidates lead page and index after marking submitted", async () => {
    await insertLead(LEAD_APPROVED);
    const proposalId = await insertProposal("action_lead_2");

    await markProposalSubmitted(
      makeFormData({ proposalId, leadId: "action_lead_2" }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith("/leads/action_lead_2");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("does nothing when proposalId is missing", async () => {
    await markProposalSubmitted(makeFormData({ leadId: "action_lead_2" }));

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("does nothing when leadId is missing", async () => {
    await markProposalSubmitted(makeFormData({ proposalId: "some-uuid" }));

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
