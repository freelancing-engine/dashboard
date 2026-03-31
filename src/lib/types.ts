export type Platform =
  | "upwork"
  | "linkedin"
  | "contra"
  | "workana"
  | "fiverr"
  | "manual"
  | "other";

export type LeadStatus =
  | "new"
  | "normalized"
  | "scored"
  | "low_priority"
  | "needs_review"
  | "approved_for_draft"
  | "draft_ready"
  | "applied_manually"
  | "replied"
  | "interview"
  | "won"
  | "lost"
  | "archived";

export type Verdict = "ignore" | "maybe" | "strong_maybe" | "apply_now";

export type ProfileAngle =
  | "flagship"
  | "ai_automation"
  | "backend_integrations"
  | "azure_devops_iac";

export type ProposalType = "short" | "standard" | "consultative";

export type ReviewPriority = "low" | "normal" | "high" | "urgent";

export type ReviewDecision =
  | "approve_for_draft"
  | "archive"
  | "save_for_later"
  | "re_score"
  | "reject";

export interface Lead {
  lead_id: string;
  platform: Platform;
  source_type: string;
  title: string;
  raw_description: string;
  normalized_description: string | null;
  url: string | null;
  client_name: string | null;
  client_country: string | null;
  client_history_summary: string | null;
  client_spend: string | null;
  client_hire_rate: string | null;
  budget_type: string | null;
  budget_value: string | null;
  proposal_count: string | null;
  posted_at: string | null;
  received_at: string | null;
  stack_tags: string[];
  lead_status: LeadStatus;
  review_priority: ReviewPriority;
  score_technical_fit: number | null;
  score_budget_attractiveness: number | null;
  score_feasibility: number | null;
  score_timeline_fit: number | null;
  score_client_reliability: number | null;
  score_competition_risk: number | null;
  score_strategic_value: number | null;
  score_close_probability: number | null;
  score_total: number | null;
  verdict: Verdict | null;
  red_flags: string[];
  best_profile_angle: ProfileAngle | null;
  best_proposal_type: ProposalType | null;
  next_step: string | null;
  reasoning_summary: string | null;
  extracted_fields: ExtractedFields | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedFields {
  required_skills?: string[];
  nice_to_have_skills?: string[] | null;
  project_type?: string | null;
  estimated_duration?: string | null;
  work_arrangement?: string | null;
  timezone_preference?: string | null;
  team_size_hint?: string | null;
  key_deliverables?: string[] | null;
  industry_domain?: string | null;
  integration_points?: string[] | null;
  ai_summary?: string;
  extraction_confidence?: number;
}

export interface LeadListItem {
  lead_id: string;
  platform: Platform;
  title: string;
  client_country: string | null;
  budget_value: string | null;
  score_total: number | null;
  verdict: Verdict | null;
  best_profile_angle: ProfileAngle | null;
  lead_status: LeadStatus;
  review_priority: ReviewPriority;
  posted_at: string | null;
  created_at: string;
}

export type DraftStatus =
  | "generated"
  | "selected"
  | "submitted_manually"
  | "archived";

export interface ProposalDraft {
  proposal_id: string;
  lead_id: string;
  profile_angle_used: ProfileAngle;
  recommended_proposal_type: ProposalType;
  selected_proposal_type: ProposalType | null;
  short_version: string | null;
  standard_version: string | null;
  consultative_version: string | null;
  optional_questions: string[];
  internal_note: string | null;
  generator_schema_version: string | null;
  generator_prompt_version: string | null;
  draft_status: DraftStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatusCount {
  lead_status: LeadStatus;
  count: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}
