import React from "react";
import { render, screen } from "@testing-library/react";
import { OutcomeTimeline } from "@/app/leads/[id]/outcome-timeline";
import type { OutcomeLogEntry } from "@/lib/types";

function makeEntry(overrides: Partial<OutcomeLogEntry> = {}): OutcomeLogEntry {
  return {
    action_id: "act_1",
    lead_id: "lead_1",
    action_type: "outcome_logged",
    actor_type: "human",
    payload: { outcome: "replied", notes: "Good conversation" },
    action_status: "success",
    workflow_name: "wf07_outcome_logging",
    created_at: "2026-04-09T14:30:00Z",
    ...overrides,
  };
}

describe("OutcomeTimeline", () => {
  // ── Empty state ───────────────────────────────────────────────────

  it("renders nothing when entries is empty", () => {
    const { container } = render(<OutcomeTimeline entries={[]} />);
    expect(container.innerHTML).toBe("");
  });

  // ── Basic rendering ───────────────────────────────────────────────

  it("renders timeline with entries", () => {
    render(<OutcomeTimeline entries={[makeEntry()]} />);
    expect(screen.getByText("Historial de acciones")).toBeInTheDocument();
  });

  it("shows action type label", () => {
    render(<OutcomeTimeline entries={[makeEntry()]} />);
    expect(screen.getByText("Outcome registrado")).toBeInTheDocument();
  });

  it("shows emoji icon for outcome_logged", () => {
    render(<OutcomeTimeline entries={[makeEntry()]} />);
    expect(screen.getByText("🎯")).toBeInTheDocument();
  });

  it("shows actor type", () => {
    render(<OutcomeTimeline entries={[makeEntry({ actor_type: "human" })]} />);
    expect(screen.getByText("por human")).toBeInTheDocument();
  });

  // ── Outcome payload rendering ─────────────────────────────────────

  it("shows outcome label and notes for outcome_logged", () => {
    render(
      <OutcomeTimeline
        entries={[
          makeEntry({
            payload: { outcome: "won", notes: "Contract signed" },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Ganado: Contract signed")).toBeInTheDocument();
  });

  it("shows outcome label without notes", () => {
    render(
      <OutcomeTimeline
        entries={[
          makeEntry({
            payload: { outcome: "lost", notes: null },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Perdido")).toBeInTheDocument();
  });

  // ── Review decision rendering ─────────────────────────────────────

  it("shows review decision with reason", () => {
    render(
      <OutcomeTimeline
        entries={[
          makeEntry({
            action_type: "review_decision",
            payload: {
              decision: "approve_for_draft",
              reason: "Strong candidate",
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Decisión de revisión")).toBeInTheDocument();
    expect(
      screen.getByText("Aprobado para draft: Strong candidate"),
    ).toBeInTheDocument();
  });

  // ── Lead scored rendering ─────────────────────────────────────────

  it("shows score and verdict for lead_scored", () => {
    render(
      <OutcomeTimeline
        entries={[
          makeEntry({
            action_type: "lead_scored",
            payload: { score_total: 85, verdict: "apply_now" },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Lead puntuado")).toBeInTheDocument();
    expect(screen.getByText("Score: 85, apply_now")).toBeInTheDocument();
  });

  // ── Other action types ────────────────────────────────────────────

  it("shows lead_ingested with correct icon", () => {
    render(
      <OutcomeTimeline
        entries={[
          makeEntry({
            action_type: "lead_ingested",
            payload: null,
          }),
        ]}
      />,
    );
    expect(screen.getByText("📥")).toBeInTheDocument();
    expect(screen.getByText("Lead ingresado")).toBeInTheDocument();
  });

  it("shows proposal_generated with correct icon", () => {
    render(
      <OutcomeTimeline
        entries={[
          makeEntry({
            action_type: "proposal_generated",
            payload: null,
          }),
        ]}
      />,
    );
    expect(screen.getByText("📝")).toBeInTheDocument();
    expect(screen.getByText("Propuesta generada")).toBeInTheDocument();
  });

  // ── Multiple entries ──────────────────────────────────────────────

  it("renders multiple entries in order", () => {
    render(
      <OutcomeTimeline
        entries={[
          makeEntry({
            action_id: "act_3",
            action_type: "outcome_logged",
            payload: { outcome: "won" },
          }),
          makeEntry({
            action_id: "act_2",
            action_type: "outcome_logged",
            payload: { outcome: "replied" },
          }),
          makeEntry({
            action_id: "act_1",
            action_type: "lead_ingested",
            payload: null,
          }),
        ]}
      />,
    );
    const labels = screen.getAllByText("Outcome registrado");
    expect(labels).toHaveLength(2);
    expect(screen.getByText("Lead ingresado")).toBeInTheDocument();
  });

  // ── Date formatting ───────────────────────────────────────────────

  it("shows formatted date", () => {
    render(
      <OutcomeTimeline
        entries={[makeEntry({ created_at: "2026-04-09T14:30:00Z" })]}
      />,
    );
    // The component uses es-AR locale
    const dateText = screen.getByText(/abr/i);
    expect(dateText).toBeInTheDocument();
  });
});
