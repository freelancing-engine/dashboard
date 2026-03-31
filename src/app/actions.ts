"use server";

import { revalidatePath } from "next/cache";
import {
  updateLeadStatus,
  insertReviewDecision,
  selectProposalType,
} from "@/lib/leads";
import { getEvidenceForAngle } from "@/lib/evidence-bank";

export async function reviewLead(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  const decision = formData.get("decision") as string;
  const reason = formData.get("reason") as string;

  if (!leadId || !decision) return;

  const STATUS_MAP: Record<string, string> = {
    approve_for_draft: "approved_for_draft",
    archive: "archived",
    reject: "archived",
    save_for_later: "scored",
    re_score: "scored",
  };

  const newStatus = STATUS_MAP[decision];
  if (!newStatus) return;

  await insertReviewDecision(leadId, decision, reason || undefined);
  await updateLeadStatus(leadId, newStatus);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

export async function selectProposal(formData: FormData) {
  const proposalId = formData.get("proposalId") as string;
  const proposalType = formData.get("proposalType") as string;

  if (!proposalId || !proposalType) return;

  await selectProposalType(proposalId, proposalType);

  revalidatePath("/");
}

export async function generateProposal(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  if (!leadId) return { error: "Lead ID requerido" };

  const agentUrl = process.env.AGENT_SERVICE_URL || "http://agent-service:8000";
  const token = process.env.AGENT_SERVICE_TOKEN || "";

  const pool = (await import("@/lib/db")).default;

  const leadResult = await pool.query(
    `SELECT lead_id, platform::text, title,
            COALESCE(normalized_description, raw_description) as description,
            budget_type, budget_value, proposal_count,
            best_profile_angle::text, best_proposal_type::text
     FROM leads WHERE lead_id = $1`,
    [leadId],
  );

  const lead = leadResult.rows[0];
  if (!lead) return { error: "Lead no encontrado" };

  const profileAngle = lead.best_profile_angle || "flagship";

  const payload = {
    lead: {
      lead_id: lead.lead_id,
      platform: lead.platform,
      title: lead.title,
      description: lead.description,
      budget_type: lead.budget_type,
      budget_value: lead.budget_value,
      proposal_count: lead.proposal_count,
    },
    profile_angle: profileAngle,
    proposal_type_preference: lead.best_proposal_type || "standard",
    evidence_snippets: getEvidenceForAngle(profileAngle),
    channel_context: {
      channel: lead.platform || "upwork",
      tone_bias: "direct",
      max_length_preference: "medium",
    },
    language: "es",
  };

  try {
    const resp = await fetch(`${agentUrl}/v1/generate-proposal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return { error: `Agent service error: ${resp.status} — ${errBody}` };
    }

    const result = await resp.json();
    const data = result.data;

    await pool.query(
      `INSERT INTO proposal_drafts
         (lead_id, profile_angle_used, recommended_proposal_type,
          short_version, standard_version, consultative_version,
          optional_questions, internal_note,
          generator_schema_version, generator_prompt_version)
       VALUES ($1, $2::profile_angle_enum, $3::proposal_type_enum,
               $4, $5, $6, $7::jsonb, $8, $9, $10)`,
      [
        lead.lead_id,
        data.profile_angle_used,
        data.recommended_proposal_type,
        data.short_proposal,
        data.standard_proposal,
        data.consultative_proposal,
        JSON.stringify(data.optional_clarifying_questions || []),
        data.internal_note,
        result.schema_version || null,
        null,
      ],
    );

    await pool.query(
      "UPDATE leads SET lead_status = 'draft_ready'::lead_status_enum WHERE lead_id = $1 AND lead_status = 'approved_for_draft'::lead_status_enum",
      [lead.lead_id],
    );

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      error: `Error generando propuesta: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
