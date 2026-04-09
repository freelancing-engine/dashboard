"use server";

import { revalidatePath } from "next/cache";
import { selectProposalType, markProposalSubmitted as dbMarkSubmitted } from "@/lib/leads";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook";

const ERROR_MAP: Record<string, string> = {
  "expected approved_for_draft":
    "El lead debe estar aprobado para draft antes de generar propuesta. Usá 'Aprobar para draft' primero.",
  "Lead not found": "Lead no encontrado en la base de datos.",
  "already has active proposal": "Ya existe una propuesta activa para este lead.",
};

function friendlyError(msg: string): string {
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return friendly;
  }
  return msg;
}

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
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error) {
          return { error: friendlyError(parsed.error) };
        }
      } catch {
        // not JSON
      }
      return { error: `Error al generar propuesta (${resp.status})` };
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

export async function markProposalSubmitted(formData: FormData) {
  const proposalId = formData.get("proposalId") as string;
  const leadId = formData.get("leadId") as string;

  if (!proposalId || !leadId) return;

  await dbMarkSubmitted(proposalId, leadId);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

const VALID_OUTCOMES = [
  "applied_manually",
  "replied",
  "interview",
  "won",
  "lost",
  "archived",
] as const;

export async function logOutcome(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  const outcome = formData.get("outcome") as string;
  const notes = formData.get("notes") as string;

  if (!leadId || !outcome) return { error: "Lead ID y outcome requeridos" };
  if (!VALID_OUTCOMES.includes(outcome as (typeof VALID_OUTCOMES)[number])) {
    return { error: "Outcome inválido" };
  }

  try {
    const resp = await fetch(`${N8N_WEBHOOK_URL}/log-outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        outcome,
        notes: notes || null,
        reporter: "dashboard",
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error(`WF07 error: ${resp.status} — ${errBody}`);
      return { error: `Error registrando outcome (${resp.status})` };
    }

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      error: `Error registrando outcome: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
