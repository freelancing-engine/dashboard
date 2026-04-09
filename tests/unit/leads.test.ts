const mockQuery = jest.fn();
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { query: mockQuery },
}));

import {
  getLeads,
  getLeadById,
  getStatusCounts,
  getScoreStats,
  updateLeadStatus,
  insertReviewDecision,
  getProposalDrafts,
  selectProposalType,
  markProposalSubmitted,
  getMetrics,
} from "@/lib/leads";

beforeEach(() => {
  mockQuery.mockReset();
});

describe("getLeads", () => {
  it("returns leads and total with no filters", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "3" }] })
      .mockResolvedValueOnce({
        rows: [
          { lead_id: "lead_1", title: "Test Lead", platform: "upwork" },
          { lead_id: "lead_2", title: "Another Lead", platform: "linkedin" },
          { lead_id: "lead_3", title: "Third Lead", platform: "workana" },
        ],
      });

    const result = await getLeads();

    expect(result.total).toBe(3);
    expect(result.leads).toHaveLength(3);
    expect(result.leads[0].lead_id).toBe("lead_1");

    // Count query should have no WHERE
    expect(mockQuery.mock.calls[0][0]).toContain("SELECT COUNT(*)");
    expect(mockQuery.mock.calls[0][0]).not.toContain("WHERE");
  });

  it("applies status filter", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: [{ lead_id: "lead_1" }] });

    await getLeads({ status: "needs_review" });

    expect(mockQuery.mock.calls[0][0]).toContain("WHERE");
    expect(mockQuery.mock.calls[0][0]).toContain("lead_status = $1");
    expect(mockQuery.mock.calls[0][1]).toContain("needs_review");
  });

  it("applies platform filter", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "2" }] })
      .mockResolvedValueOnce({ rows: [] });

    await getLeads({ platform: "upwork" });

    expect(mockQuery.mock.calls[0][1]).toContain("upwork");
  });

  it("applies search filter with ILIKE", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: [] });

    await getLeads({ search: "react" });

    expect(mockQuery.mock.calls[0][0]).toContain("ILIKE");
    expect(mockQuery.mock.calls[0][1]).toContain("%react%");
  });

  it("applies minScore filter", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "5" }] })
      .mockResolvedValueOnce({ rows: [] });

    await getLeads({ minScore: 70 });

    expect(mockQuery.mock.calls[0][0]).toContain("score_total >= $1");
    expect(mockQuery.mock.calls[0][1]).toContain(70);
  });

  it("applies multiple filters together", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: [] });

    await getLeads({ status: "scored", platform: "upwork", minScore: 55 });

    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain("lead_status = $1");
    expect(sql).toContain("platform = $2");
    expect(sql).toContain("score_total >= $3");
  });

  it("applies pagination with limit and offset", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "100" }] })
      .mockResolvedValueOnce({ rows: [] });

    await getLeads({ limit: 25, offset: 50 });

    const dataQuery = mockQuery.mock.calls[1][0];
    expect(dataQuery).toContain("LIMIT");
    expect(dataQuery).toContain("OFFSET");
    const params = mockQuery.mock.calls[1][1];
    expect(params).toContain(25);
    expect(params).toContain(50);
  });

  it("defaults limit to 50 and offset to 0", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "10" }] })
      .mockResolvedValueOnce({ rows: [] });

    await getLeads();

    const params = mockQuery.mock.calls[1][1];
    expect(params).toContain(50);
    expect(params).toContain(0);
  });
});

describe("getLeadById", () => {
  it("returns lead when found", async () => {
    const fakeLead = {
      lead_id: "lead_abc",
      platform: "upwork",
      title: "Test",
      score_total: 75,
      verdict: "apply_now",
    };
    mockQuery.mockResolvedValueOnce({ rows: [fakeLead] });

    const result = await getLeadById("lead_abc");

    expect(result).toEqual(fakeLead);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE lead_id = $1"),
      ["lead_abc"],
    );
  });

  it("returns null when not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await getLeadById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("getStatusCounts", () => {
  it("returns status counts", async () => {
    const counts = [
      { lead_status: "scored", count: 68 },
      { lead_status: "needs_review", count: 35 },
    ];
    mockQuery.mockResolvedValueOnce({ rows: counts });

    const result = await getStatusCounts();

    expect(result).toEqual(counts);
    expect(mockQuery.mock.calls[0][0]).toContain("GROUP BY lead_status");
  });
});

describe("getScoreStats", () => {
  it("returns aggregate score statistics", async () => {
    const stats = { avg: 68, min: 52, max: 88, total: 105 };
    mockQuery.mockResolvedValueOnce({ rows: [stats] });

    const result = await getScoreStats();

    expect(result).toEqual(stats);
    expect(mockQuery.mock.calls[0][0]).toContain("AVG(score_total)");
  });
});

describe("updateLeadStatus", () => {
  it("updates lead status with enum cast", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await updateLeadStatus("lead_abc", "approved_for_draft");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("lead_status_enum"),
      ["approved_for_draft", "lead_abc"],
    );
  });
});

describe("insertReviewDecision", () => {
  it("inserts review decision with reviewer", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await insertReviewDecision("lead_abc", "approve_for_draft", "Looks good");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO review_decisions"),
      ["lead_abc", "dashboard_user", "approve_for_draft", "Looks good"],
    );
  });

  it("inserts null reason when not provided", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await insertReviewDecision("lead_abc", "archive");

    const params = mockQuery.mock.calls[0][1];
    expect(params[3]).toBeNull();
  });
});

describe("getProposalDrafts", () => {
  it("returns drafts for a lead ordered by active then date", async () => {
    const drafts = [
      {
        proposal_id: "uuid-1",
        lead_id: "lead_abc",
        profile_angle_used: "flagship",
        is_active: true,
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: drafts });

    const result = await getProposalDrafts("lead_abc");

    expect(result).toEqual(drafts);
    expect(mockQuery.mock.calls[0][0]).toContain("ORDER BY is_active DESC");
    expect(mockQuery.mock.calls[0][1]).toEqual(["lead_abc"]);
  });

  it("returns empty array when no drafts", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await getProposalDrafts("lead_xyz");

    expect(result).toEqual([]);
  });
});

describe("selectProposalType", () => {
  it("updates draft with selected type and status", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await selectProposalType("uuid-1", "standard");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("proposal_type_enum"),
      ["standard", "uuid-1"],
    );
    expect(mockQuery.mock.calls[0][0]).toContain("draft_status = 'selected'");
  });
});

describe("markProposalSubmitted", () => {
  it("updates draft status and lead status", async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await markProposalSubmitted("uuid-1", "lead_abc");

    expect(mockQuery).toHaveBeenCalledTimes(2);
    // First call: update proposal_drafts
    expect(mockQuery.mock.calls[0][0]).toContain("proposal_drafts");
    expect(mockQuery.mock.calls[0][0]).toContain("submitted_manually");
    expect(mockQuery.mock.calls[0][1]).toEqual(["uuid-1"]);
    // Second call: update leads
    expect(mockQuery.mock.calls[1][0]).toContain("leads");
    expect(mockQuery.mock.calls[1][0]).toContain("applied_manually");
    expect(mockQuery.mock.calls[1][1]).toEqual(["lead_abc"]);
  });
});

describe("getMetrics", () => {
  it("runs 8 parallel queries and returns structured metrics", async () => {
    const statusRows = { rows: [{ name: "scored", value: 50 }] };
    const scoreStats = { rows: [{ avg: 68, min: 40, max: 92, total: 88 }] };
    const verdictRows = { rows: [{ name: "maybe", value: 30 }] };
    const platformRows = { rows: [{ name: "upwork", value: 70 }] };
    const profileRows = {
      rows: [{ name: "flagship", value: 40, avg_score: 72 }],
    };
    const dailyRows = { rows: [{ date: "2026-04-01", count: 12 }] };
    const scoreDistRows = { rows: [{ range: "60-69", count: 25 }] };
    const sourceTypeRows = { rows: [{ name: "email_alert", value: 30 }] };

    mockQuery
      .mockResolvedValueOnce(statusRows)
      .mockResolvedValueOnce(scoreStats)
      .mockResolvedValueOnce(verdictRows)
      .mockResolvedValueOnce(platformRows)
      .mockResolvedValueOnce(profileRows)
      .mockResolvedValueOnce(dailyRows)
      .mockResolvedValueOnce(scoreDistRows)
      .mockResolvedValueOnce(sourceTypeRows);

    const result = await getMetrics();

    expect(mockQuery).toHaveBeenCalledTimes(8);
    expect(result.statusBreakdown).toEqual([{ name: "scored", value: 50 }]);
    expect(result.scoreStats).toEqual({
      avg: 68,
      min: 40,
      max: 92,
      total: 88,
    });
    expect(result.verdictBreakdown).toEqual([{ name: "maybe", value: 30 }]);
    expect(result.platformBreakdown).toEqual([{ name: "upwork", value: 70 }]);
    expect(result.profileBreakdown).toEqual([
      { name: "flagship", value: 40, avg_score: 72 },
    ]);
    expect(result.dailyIntake).toEqual([{ date: "2026-04-01", count: 12 }]);
    expect(result.scoreDistribution).toEqual([{ range: "60-69", count: 25 }]);
    expect(result.sourceTypeBreakdown).toEqual([
      { name: "email_alert", value: 30 },
    ]);
  });

  it("returns default scoreStats when no scored leads", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getMetrics();

    expect(result.scoreStats).toEqual({ avg: 0, min: 0, max: 0, total: 0 });
    expect(result.statusBreakdown).toEqual([]);
    expect(result.sourceTypeBreakdown).toEqual([]);
  });
});
