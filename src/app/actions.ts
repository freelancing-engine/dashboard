"use server";

import { revalidatePath } from "next/cache";
import { selectProposalType } from "@/lib/leads";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook";

export async function reviewLead(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  const decision = formData.get("decision") as string;
  const reason = formData.get("reason") as string;

  if (!leadId || !decision) return;

  const validDecisions = [
    "approve_for_draft",
    "archive",
    "reject",
    "save_for_later",
    "re_score",
  ];
  if (!validDecisions.includes(decision)) return;

  const resp = await fetch(`${N8N_WEBHOOK_URL}/review-decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id: leadId,
      decision,
      reviewer: "dashboard",
      reason: reason || null,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error(`WF05 error: ${resp.status} — ${errBody}`);
  }

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

  try {
    const resp = await fetch(`${N8N_WEBHOOK_URL}/generate-proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return { error: `Error WF06: ${resp.status} — ${errBody}` };
    }

    // WF06 handles: agent-service call, proposal_drafts insert,
    // lead status update, action_logs, and Telegram notification.

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      error: `Error generando propuesta: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
