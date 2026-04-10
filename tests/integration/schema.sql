-- 09-postgres-schema.sql
-- Freelancing system MVP database schema
-- Conservative MVP aligned with the project system files.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
        CREATE TYPE platform_type AS ENUM (
            'upwork','linkedin','contra','workana','fiverr','manual','other'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type_enum') THEN
        CREATE TYPE source_type_enum AS ENUM (
            'email_alert','manual_link','manual_text','saved_search_export','notification','referral','other'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status_enum') THEN
        CREATE TYPE lead_status_enum AS ENUM (
            'new','normalized','scored','low_priority','needs_review',
            'approved_for_draft','draft_ready','applied_manually',
            'replied','interview','won','lost','archived'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_priority_enum') THEN
        CREATE TYPE review_priority_enum AS ENUM ('low','normal','high','urgent');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verdict_enum') THEN
        CREATE TYPE verdict_enum AS ENUM ('ignore','maybe','strong_maybe','apply_now');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_angle_enum') THEN
        CREATE TYPE profile_angle_enum AS ENUM (
            'flagship','ai_automation','backend_integrations','azure_devops_iac'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_type_enum') THEN
        CREATE TYPE proposal_type_enum AS ENUM ('short','standard','consultative');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draft_status_enum') THEN
        CREATE TYPE draft_status_enum AS ENUM ('generated','selected','submitted_manually','archived');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actor_type_enum') THEN
        CREATE TYPE actor_type_enum AS ENUM ('system','agent','human','workflow');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status_enum') THEN
        CREATE TYPE action_status_enum AS ENUM ('success','failed','pending','cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_decision_enum') THEN
        CREATE TYPE review_decision_enum AS ENUM (
            'approve_for_draft','archive','save_for_later','re_score','reject'
        );
    END IF;
END$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS leads (
    lead_id TEXT PRIMARY KEY,
    external_source_id TEXT,
    platform platform_type NOT NULL,
    source_type source_type_enum NOT NULL,
    source_notes TEXT,
    source_message_id TEXT,

    title TEXT NOT NULL,
    raw_description TEXT NOT NULL,
    normalized_description TEXT,
    url TEXT,

    client_name TEXT,
    client_country TEXT,
    client_history_summary TEXT,
    client_spend TEXT,
    client_hire_rate TEXT,

    budget_type TEXT,
    budget_value TEXT,

    proposal_count TEXT,
    posted_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,

    timezone_relevance TEXT,
    language_relevance TEXT,

    stack_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    normalized_payload JSONB NOT NULL DEFAULT '{}'::JSONB,

    lead_status lead_status_enum NOT NULL DEFAULT 'new',
    review_priority review_priority_enum NOT NULL DEFAULT 'normal',

    score_technical_fit SMALLINT,
    score_budget_attractiveness SMALLINT,
    score_feasibility SMALLINT,
    score_timeline_fit SMALLINT,
    score_client_reliability SMALLINT,
    score_competition_risk SMALLINT,
    score_strategic_value SMALLINT,
    score_close_probability SMALLINT,
    score_total SMALLINT,

    verdict verdict_enum,
    red_flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    best_profile_angle profile_angle_enum,
    best_proposal_type proposal_type_enum,
    best_proposal_angle TEXT,
    next_step TEXT,
    reasoning_summary TEXT,
    scoring_notes TEXT,

    extracted_fields JSONB,

    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_score_technical_fit CHECK (score_technical_fit IS NULL OR score_technical_fit BETWEEN 0 AND 20),
    CONSTRAINT chk_score_budget_attractiveness CHECK (score_budget_attractiveness IS NULL OR score_budget_attractiveness BETWEEN 0 AND 12),
    CONSTRAINT chk_score_feasibility CHECK (score_feasibility IS NULL OR score_feasibility BETWEEN 0 AND 10),
    CONSTRAINT chk_score_timeline_fit CHECK (score_timeline_fit IS NULL OR score_timeline_fit BETWEEN 0 AND 8),
    CONSTRAINT chk_score_client_reliability CHECK (score_client_reliability IS NULL OR score_client_reliability BETWEEN 0 AND 15),
    CONSTRAINT chk_score_competition_risk CHECK (score_competition_risk IS NULL OR score_competition_risk BETWEEN 0 AND 8),
    CONSTRAINT chk_score_strategic_value CHECK (score_strategic_value IS NULL OR score_strategic_value BETWEEN 0 AND 15),
    CONSTRAINT chk_score_close_probability CHECK (score_close_probability IS NULL OR score_close_probability BETWEEN 0 AND 12),
    CONSTRAINT chk_score_total CHECK (score_total IS NULL OR score_total BETWEEN 0 AND 100),
    CONSTRAINT chk_score_total_consistency CHECK (
        score_total IS NULL OR
        score_total =
            COALESCE(score_technical_fit, 0) +
            COALESCE(score_budget_attractiveness, 0) +
            COALESCE(score_feasibility, 0) +
            COALESCE(score_timeline_fit, 0) +
            COALESCE(score_client_reliability, 0) +
            COALESCE(score_competition_risk, 0) +
            COALESCE(score_strategic_value, 0) +
            COALESCE(score_close_probability, 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_leads_platform_status ON leads (platform, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_score_total ON leads (score_total DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_review_priority ON leads (review_priority, score_total DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_posted_at ON leads (posted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_received_at ON leads (received_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_best_profile_angle ON leads (best_profile_angle);
CREATE INDEX IF NOT EXISTS idx_leads_url ON leads (url);
CREATE INDEX IF NOT EXISTS idx_leads_raw_payload_gin ON leads USING GIN (raw_payload);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_payload_gin ON leads USING GIN (normalized_payload);

CREATE TRIGGER trg_leads_set_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS proposal_drafts (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,

    profile_angle_used profile_angle_enum NOT NULL,
    recommended_proposal_type proposal_type_enum,
    selected_proposal_type proposal_type_enum,

    short_version TEXT,
    standard_version TEXT,
    consultative_version TEXT,

    optional_questions JSONB NOT NULL DEFAULT '[]'::JSONB,
    internal_note TEXT,

    generator_schema_version TEXT,
    generator_prompt_version TEXT,

    draft_status draft_status_enum NOT NULL DEFAULT 'generated',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_optional_questions_array CHECK (jsonb_typeof(optional_questions) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_proposal_drafts_lead_id ON proposal_drafts (lead_id);
CREATE INDEX IF NOT EXISTS idx_proposal_drafts_status ON proposal_drafts (draft_status);
CREATE INDEX IF NOT EXISTS idx_proposal_drafts_active ON proposal_drafts (lead_id, is_active);

CREATE TRIGGER trg_proposal_drafts_set_updated_at
BEFORE UPDATE ON proposal_drafts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS uq_proposal_drafts_one_active_per_lead
    ON proposal_drafts (lead_id)
    WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS action_logs (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT REFERENCES leads(lead_id) ON DELETE CASCADE,

    action_type TEXT NOT NULL,
    actor_type actor_type_enum NOT NULL,
    payload_summary TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,

    action_status action_status_enum NOT NULL DEFAULT 'success',
    workflow_name TEXT,
    request_id TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_logs_lead_id ON action_logs (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_action_type ON action_logs (action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_status ON action_logs (action_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_payload_gin ON action_logs USING GIN (payload);

CREATE TABLE IF NOT EXISTS review_decisions (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,

    reviewer TEXT NOT NULL,
    decision review_decision_enum NOT NULL,
    decision_reason TEXT,

    selected_profile_angle profile_angle_enum,
    selected_proposal_type proposal_type_enum,
    selected_draft_id UUID REFERENCES proposal_drafts(proposal_id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_decisions_lead_id ON review_decisions (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_decisions_decision ON review_decisions (decision, created_at DESC);

CREATE TABLE IF NOT EXISTS follow_up_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,

    reminder_type TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    reminder_status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_due
    ON follow_up_reminders (reminder_status, scheduled_for);

CREATE TRIGGER trg_follow_up_reminders_set_updated_at
BEFORE UPDATE ON follow_up_reminders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW v_review_queue AS
SELECT
    l.lead_id,
    l.platform,
    l.title,
    l.client_country,
    l.budget_type,
    l.budget_value,
    l.score_total,
    l.verdict,
    l.best_profile_angle,
    l.best_proposal_type,
    l.red_flags,
    l.review_priority,
    l.lead_status,
    l.posted_at,
    l.received_at,
    l.created_at,
    l.updated_at
FROM leads l
WHERE l.lead_status IN ('needs_review', 'approved_for_draft', 'draft_ready')
ORDER BY
    CASE l.review_priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        ELSE 4
    END,
    l.score_total DESC NULLS LAST,
    l.received_at DESC NULLS LAST;

CREATE OR REPLACE VIEW v_lead_outcomes AS
SELECT
    platform,
    lead_status,
    COUNT(*) AS total
FROM leads
GROUP BY platform, lead_status
ORDER BY platform, lead_status;

COMMIT;
