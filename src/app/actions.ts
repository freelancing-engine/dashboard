"use server";

import { revalidatePath } from "next/cache";
import { updateLeadStatus, insertReviewDecision } from "@/lib/leads";

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
