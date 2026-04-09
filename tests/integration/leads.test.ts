/**
 * Integration tests for src/lib/leads.ts — data layer against real Postgres.
 *
 * Requires a running Postgres instance. In CI, this is provided by a service
 * container. Locally, use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`
 *
 * Run with: npm run test:integration
 */

import { Pool } from "pg";

// Point the db module at the test database BEFORE importing leads.ts
process.env.POSTGRES_DB = process.env.POSTGRES_DB || "freelancing_engine_test";
process.env.POSTGRES_USER = process.env.POSTGRES_USER || "postgres";
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || "postgres";

import {
  getLeads,
  getLeadById,
  getStatusCounts,
  getScoreStats,
  getProposalDrafts,
  updateLeadStatus,
  insertReviewDecision,
  selectProposalType,
  markProposalSubmitted,
  getMetrics,
} from "@/lib/leads";
import pool from "@/lib/db";

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

const LEAD_1 = {
  lead_id: "test_lead_1",
  platform: "upwork",
  source_type: "manual_link",
  title: "Build a React dashboard",
  raw_description: "We need a React dashboard for our internal tools.",
  client_country: "United States",
  budget_value: "$5000",
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

const LEAD_2 = {
  lead_id: "test_lead_2",
  platform: "workana",
  source_type: "email_alert",
  title: "Automatización con IA",
  raw_description: "Necesitamos automatizar procesos con inteligencia artificial.",
  client_country: "Argentina",
  budget_value: "$2000",
  score_technical_fit: 14,
  score_budget_attractiveness: 6,
  score_feasibility: 7,
  score_timeline_fit: 5,
  score_client_reliability: 8,
  score_competition_risk: 4,
  score_strategic_value: 6,
  score_close_probability: 5,
  score_total: 55,
  verdict: "maybe",
  best_profile_angle: "ai_automation",
  best_proposal_type: "short",
  lead_status: "scored",
  review_priority: "normal",
};

const LEAD_3 = {
  lead_id: "test_lead_3",
  platform: "upwork",
  source_type: "manual_text",
  title: "Azure DevOps pipeline setup",
  raw_description: "Setup CI/CD with Azure DevOps for our .NET project.",
  client_country: "Germany",
  score_total: 40,
  verdict: "ignore",
  lead_status: "low_priority",
  review_priority: "low",
};

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
       client_country, budget_value,
       score_technical_fit, score_budget_attractiveness,
       score_feasibility, score_timeline_fit,
       score_client_reliability, score_competition_risk,
       score_strategic_value, score_close_probability,
       score_total, verdict, best_profile_angle, best_proposal_type,
       lead_status, review_priority
     ) VALUES (
       $1, $2::platform_type, $3::source_type_enum, $4, $5,
       $6, $7,
       $8, $9, $10, $11, $12, $13, $14, $15,
       $16, $17::verdict_enum, $18::profile_angle_enum, $19::proposal_type_enum,
       $20::lead_status_enum, $21::review_priority_enum
     )`,
    [
      m.lead_id,
      m.platform,
      m.source_type,
      m.title,
      m.raw_description,
      m.client_country ?? null,
      m.budget_value ?? null,
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

async function insertProposal(leadId: string, overrides: Record<string, unknown> = {}) {
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
  // Clean tables in dependency order
  await testPool.query("DELETE FROM review_decisions");
  await testPool.query("DELETE FROM action_logs");
  await testPool.query("DELETE FROM proposal_drafts");
  await testPool.query("DELETE FROM follow_up_reminders");
  await testPool.query("DELETE FROM leads");
});

afterAll(async () => {
  await testPool.end();
  await pool.end();
});

// ---------------------------------------------------------------------------
// Tests: getLeads
// ---------------------------------------------------------------------------

describe("getLeads", () => {
  it("returns empty list when no leads exist", async () => {
    const { leads, total } = await getLeads();
    expect(leads).toEqual([]);
    expect(total).toBe(0);
  });

  it("returns all leads ordered by score desc", async () => {
    await insertLead(LEAD_1); // score 78
    await insertLead(LEAD_2); // score 55
    await insertLead(LEAD_3); // score 40

    const { leads, total } = await getLeads();
    expect(total).toBe(3);
    expect(leads).toHaveLength(3);
    expect(leads[0].lead_id).toBe("test_lead_1");
    expect(leads[1].lead_id).toBe("test_lead_2");
    expect(leads[2].lead_id).toBe("test_lead_3");
  });

  it("filters by status", async () => {
    await insertLead(LEAD_1); // needs_review
    await insertLead(LEAD_2); // scored

    const { leads, total } = await getLeads({ status: "needs_review" });
    expect(total).toBe(1);
    expect(leads[0].lead_id).toBe("test_lead_1");
  });

  it("filters by platform", async () => {
    await insertLead(LEAD_1); // upwork
    await insertLead(LEAD_2); // workana

    const { leads, total } = await getLeads({ platform: "workana" });
    expect(total).toBe(1);
    expect(leads[0].lead_id).toBe("test_lead_2");
  });

  it("filters by minimum score", async () => {
    await insertLead(LEAD_1); // 78
    await insertLead(LEAD_2); // 55
    await insertLead(LEAD_3); // 40

    const { leads, total } = await getLeads({ minScore: 70 });
    expect(total).toBe(1);
    expect(leads[0].lead_id).toBe("test_lead_1");
  });

  it("filters by search term (title ILIKE)", async () => {
    await insertLead(LEAD_1); // React dashboard
    await insertLead(LEAD_2); // Automatización con IA

    const { leads, total } = await getLeads({ search: "react" });
    expect(total).toBe(1);
    expect(leads[0].lead_id).toBe("test_lead_1");
  });

  it("combines multiple filters", async () => {
    await insertLead(LEAD_1); // upwork, 78, needs_review
    await insertLead(LEAD_2); // workana, 55, scored
    await insertLead(LEAD_3); // upwork, 40, low_priority

    const { leads, total } = await getLeads({
      platform: "upwork",
      minScore: 50,
    });
    expect(total).toBe(1);
    expect(leads[0].lead_id).toBe("test_lead_1");
  });

  it("respects limit and offset", async () => {
    await insertLead(LEAD_1);
    await insertLead(LEAD_2);
    await insertLead(LEAD_3);

    const page1 = await getLeads({ limit: 2, offset: 0 });
    expect(page1.leads).toHaveLength(2);
    expect(page1.total).toBe(3);

    const page2 = await getLeads({ limit: 2, offset: 2 });
    expect(page2.leads).toHaveLength(1);
    expect(page2.total).toBe(3);
  });

  it("returns correct fields per lead", async () => {
    await insertLead(LEAD_1);

    const { leads } = await getLeads();
    const lead = leads[0];
    expect(lead).toEqual(
      expect.objectContaining({
        lead_id: "test_lead_1",
        platform: "upwork",
        title: "Build a React dashboard",
        client_country: "United States",
        budget_value: "$5000",
        score_total: 78,
        verdict: "strong_maybe",
        best_profile_angle: "flagship",
        lead_status: "needs_review",
        review_priority: "high",
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: getLeadById
// ---------------------------------------------------------------------------

describe("getLeadById", () => {
  it("returns null for non-existent lead", async () => {
    const lead = await getLeadById("does_not_exist");
    expect(lead).toBeNull();
  });

  it("returns full lead object", async () => {
    await insertLead(LEAD_1);

    const lead = await getLeadById("test_lead_1");
    expect(lead).not.toBeNull();
    expect(lead!.lead_id).toBe("test_lead_1");
    expect(lead!.title).toBe("Build a React dashboard");
    expect(lead!.raw_description).toBe(
      "We need a React dashboard for our internal tools.",
    );
    expect(lead!.score_total).toBe(78);
    expect(lead!.score_technical_fit).toBe(18);
    expect(lead!.verdict).toBe("strong_maybe");
    expect(lead!.best_profile_angle).toBe("flagship");
    expect(lead!.lead_status).toBe("needs_review");
  });

  it("returns null fields correctly", async () => {
    await insertLead(LEAD_3); // minimal fields

    const lead = await getLeadById("test_lead_3");
    expect(lead).not.toBeNull();
    expect(lead!.client_country).toBe("Germany");
    expect(lead!.budget_value).toBeNull();
    expect(lead!.best_profile_angle).toBeNull();
    expect(lead!.best_proposal_type).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: getStatusCounts
// ---------------------------------------------------------------------------

describe("getStatusCounts", () => {
  it("returns empty array when no leads", async () => {
    const counts = await getStatusCounts();
    expect(counts).toEqual([]);
  });

  it("returns counts grouped by status", async () => {
    await insertLead(LEAD_1); // needs_review
    await insertLead(LEAD_2); // scored
    await insertLead(LEAD_3); // low_priority

    const counts = await getStatusCounts();
    expect(counts).toHaveLength(3);

    const map = Object.fromEntries(
      counts.map((c) => [c.lead_status, c.count]),
    );
    expect(map.needs_review).toBe(1);
    expect(map.scored).toBe(1);
    expect(map.low_priority).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests: getScoreStats
// ---------------------------------------------------------------------------

describe("getScoreStats", () => {
  it("returns stats for scored leads", async () => {
    await insertLead(LEAD_1); // 78
    await insertLead(LEAD_2); // 55
    await insertLead(LEAD_3); // 40

    const stats = await getScoreStats();
    expect(stats.total).toBe(3);
    expect(stats.min).toBe(40);
    expect(stats.max).toBe(78);
    expect(stats.avg).toBe(58); // round((78+55+40)/3) = 58
  });
});

// ---------------------------------------------------------------------------
// Tests: updateLeadStatus
// ---------------------------------------------------------------------------

describe("updateLeadStatus", () => {
  it("updates lead status", async () => {
    await insertLead(LEAD_1); // needs_review

    await updateLeadStatus("test_lead_1", "approved_for_draft");

    const lead = await getLeadById("test_lead_1");
    expect(lead!.lead_status).toBe("approved_for_draft");
  });
});

// ---------------------------------------------------------------------------
// Tests: insertReviewDecision
// ---------------------------------------------------------------------------

describe("insertReviewDecision", () => {
  it("inserts a review decision", async () => {
    await insertLead(LEAD_1);

    await insertReviewDecision("test_lead_1", "approve_for_draft", "Good fit");

    const result = await testPool.query(
      "SELECT * FROM review_decisions WHERE lead_id = $1",
      ["test_lead_1"],
    );
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].decision).toBe("approve_for_draft");
    expect(result.rows[0].decision_reason).toBe("Good fit");
    expect(result.rows[0].reviewer).toBe("dashboard_user");
  });

  it("inserts with null reason", async () => {
    await insertLead(LEAD_1);

    await insertReviewDecision("test_lead_1", "archive");

    const result = await testPool.query(
      "SELECT * FROM review_decisions WHERE lead_id = $1",
      ["test_lead_1"],
    );
    expect(result.rows[0].decision_reason).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: getProposalDrafts + selectProposalType + markProposalSubmitted
// ---------------------------------------------------------------------------

describe("proposal operations", () => {
  it("getProposalDrafts returns empty for lead without proposals", async () => {
    await insertLead(LEAD_1);

    const drafts = await getProposalDrafts("test_lead_1");
    expect(drafts).toEqual([]);
  });

  it("getProposalDrafts returns proposals ordered by is_active desc", async () => {
    await insertLead(LEAD_1);
    const activeId = await insertProposal("test_lead_1", { is_active: true });

    const drafts = await getProposalDrafts("test_lead_1");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].proposal_id).toBe(activeId);
    expect(drafts[0].profile_angle_used).toBe("flagship");
    expect(drafts[0].short_version).toBe("Short proposal text");
    expect(drafts[0].standard_version).toBe("Standard proposal text");
    expect(drafts[0].consultative_version).toBe("Consultative proposal text");
    expect(drafts[0].draft_status).toBe("generated");
    expect(drafts[0].is_active).toBe(true);
  });

  it("selectProposalType updates the proposal", async () => {
    await insertLead(LEAD_1);
    const proposalId = await insertProposal("test_lead_1");

    await selectProposalType(proposalId, "consultative");

    const drafts = await getProposalDrafts("test_lead_1");
    expect(drafts[0].selected_proposal_type).toBe("consultative");
    expect(drafts[0].draft_status).toBe("selected");
  });

  it("markProposalSubmitted updates proposal and lead", async () => {
    await insertLead({ ...LEAD_1, lead_status: "approved_for_draft" });
    const proposalId = await insertProposal("test_lead_1");

    await markProposalSubmitted(proposalId, "test_lead_1");

    const drafts = await getProposalDrafts("test_lead_1");
    expect(drafts[0].draft_status).toBe("submitted_manually");

    const lead = await getLeadById("test_lead_1");
    expect(lead!.lead_status).toBe("applied_manually");
  });
});

// ---------------------------------------------------------------------------
// Tests: getMetrics
// ---------------------------------------------------------------------------

describe("getMetrics", () => {
  it("returns complete metrics structure", async () => {
    await insertLead(LEAD_1);
    await insertLead(LEAD_2);
    await insertLead(LEAD_3);

    const metrics = await getMetrics();

    // statusBreakdown
    expect(metrics.statusBreakdown).toBeDefined();
    expect(metrics.statusBreakdown.length).toBeGreaterThan(0);
    const statusMap = Object.fromEntries(
      metrics.statusBreakdown.map((s) => [s.name, s.value]),
    );
    expect(statusMap.needs_review).toBe(1);
    expect(statusMap.scored).toBe(1);
    expect(statusMap.low_priority).toBe(1);

    // scoreStats
    expect(metrics.scoreStats).toBeDefined();
    expect(metrics.scoreStats.total).toBe(3);
    expect(metrics.scoreStats.min).toBe(40);
    expect(metrics.scoreStats.max).toBe(78);

    // verdictBreakdown
    expect(metrics.verdictBreakdown).toBeDefined();
    const verdictMap = Object.fromEntries(
      metrics.verdictBreakdown.map((v) => [v.name, v.value]),
    );
    expect(verdictMap.strong_maybe).toBe(1);
    expect(verdictMap.maybe).toBe(1);
    expect(verdictMap.ignore).toBe(1);

    // platformBreakdown
    expect(metrics.platformBreakdown).toBeDefined();
    const platMap = Object.fromEntries(
      metrics.platformBreakdown.map((p) => [p.name, p.value]),
    );
    expect(platMap.upwork).toBe(2);
    expect(platMap.workana).toBe(1);

    // profileBreakdown
    expect(metrics.profileBreakdown).toBeDefined();

    // dailyIntake — all inserted on same day
    expect(metrics.dailyIntake).toBeDefined();
    expect(metrics.dailyIntake.length).toBeGreaterThan(0);
    const totalDaily = metrics.dailyIntake.reduce(
      (sum, d) => sum + d.count,
      0,
    );
    expect(totalDaily).toBe(3);

    // scoreDistribution
    expect(metrics.scoreDistribution).toBeDefined();
    expect(metrics.scoreDistribution.length).toBeGreaterThan(0);
  });

  it("returns zero stats when no leads", async () => {
    const metrics = await getMetrics();
    expect(metrics.statusBreakdown).toEqual([]);
    expect(metrics.scoreStats.total).toBe(0);
  });
});
