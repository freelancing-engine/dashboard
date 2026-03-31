import pool from "./db";
import type { Lead, LeadListItem, ProposalDraft, StatusCount } from "./types";

export async function getLeads(filters?: {
  status?: string;
  platform?: string;
  minScore?: number;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ leads: LeadListItem[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    conditions.push(`lead_status = $${paramIndex++}`);
    params.push(filters.status);
  }
  if (filters?.platform) {
    conditions.push(`platform = $${paramIndex++}`);
    params.push(filters.platform);
  }
  if (filters?.minScore !== undefined) {
    conditions.push(`score_total >= $${paramIndex++}`);
    params.push(filters.minScore);
  }
  if (filters?.search) {
    conditions.push(`title ILIKE $${paramIndex++}`);
    params.push(`%${filters.search}%`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const countQuery = `SELECT COUNT(*) FROM leads ${where}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  const query = `
    SELECT lead_id, platform::text, title, client_country, budget_value,
           score_total, verdict::text, best_profile_angle::text,
           lead_status::text, review_priority::text,
           posted_at, created_at
    FROM leads
    ${where}
    ORDER BY score_total DESC NULLS LAST, created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return { leads: result.rows as LeadListItem[], total };
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const result = await pool.query(
    `SELECT lead_id, platform::text, source_type::text, title,
            raw_description, normalized_description, url,
            client_name, client_country, client_history_summary,
            client_spend, client_hire_rate,
            budget_type, budget_value, proposal_count,
            posted_at, received_at, stack_tags,
            lead_status::text, review_priority::text,
            score_technical_fit, score_budget_attractiveness,
            score_feasibility, score_timeline_fit,
            score_client_reliability, score_competition_risk,
            score_strategic_value, score_close_probability,
            score_total, verdict::text, red_flags,
            best_profile_angle::text, best_proposal_type::text,
            next_step, reasoning_summary,
            created_at, updated_at
     FROM leads WHERE lead_id = $1`,
    [leadId],
  );
  return (result.rows[0] as Lead) || null;
}

export async function getStatusCounts(): Promise<StatusCount[]> {
  const result = await pool.query(
    `SELECT lead_status::text, COUNT(*)::int as count
     FROM leads GROUP BY lead_status ORDER BY count DESC`,
  );
  return result.rows as StatusCount[];
}

export async function getScoreStats(): Promise<{
  avg: number;
  min: number;
  max: number;
  total: number;
}> {
  const result = await pool.query(
    `SELECT
       ROUND(AVG(score_total))::int as avg,
       MIN(score_total)::int as min,
       MAX(score_total)::int as max,
       COUNT(*)::int as total
     FROM leads WHERE score_total IS NOT NULL`,
  );
  return result.rows[0];
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<void> {
  await pool.query(
    "UPDATE leads SET lead_status = $1::lead_status_enum WHERE lead_id = $2",
    [status, leadId],
  );
}

export async function insertReviewDecision(
  leadId: string,
  decision: string,
  reason?: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO review_decisions (lead_id, reviewer, decision, decision_reason)
     VALUES ($1, $2, $3::review_decision_enum, $4)`,
    [leadId, "dashboard_user", decision, reason || null],
  );
}

export async function getProposalDrafts(
  leadId: string,
): Promise<ProposalDraft[]> {
  const result = await pool.query(
    `SELECT proposal_id, lead_id,
            profile_angle_used::text, recommended_proposal_type::text,
            selected_proposal_type::text,
            short_version, standard_version, consultative_version,
            optional_questions, internal_note,
            generator_schema_version, generator_prompt_version,
            draft_status::text, is_active,
            created_at, updated_at
     FROM proposal_drafts
     WHERE lead_id = $1
     ORDER BY is_active DESC, created_at DESC`,
    [leadId],
  );
  return result.rows as ProposalDraft[];
}

export async function selectProposalType(
  proposalId: string,
  proposalType: string,
): Promise<void> {
  await pool.query(
    `UPDATE proposal_drafts
     SET selected_proposal_type = $1::proposal_type_enum,
         draft_status = 'selected'
     WHERE proposal_id = $2`,
    [proposalType, proposalId],
  );
}

export async function markProposalSubmitted(
  proposalId: string,
  leadId: string,
): Promise<void> {
  await pool.query(
    `UPDATE proposal_drafts
     SET draft_status = 'submitted_manually'
     WHERE proposal_id = $1`,
    [proposalId],
  );
  await pool.query(
    `UPDATE leads
     SET lead_status = 'applied_manually'
     WHERE lead_id = $1`,
    [leadId],
  );
}
