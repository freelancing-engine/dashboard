import { getEvidenceForAngle } from "@/lib/evidence-bank";

describe("getEvidenceForAngle", () => {
  it("returns snippets for flagship angle", () => {
    const result = getEvidenceForAngle("flagship");
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => {
      expect(s.project_name).toBeTruthy();
      expect(s.confidence).toBeTruthy();
      expect(s.snippet.length).toBeGreaterThan(0);
    });
  });

  it("returns snippets for ai_automation angle", () => {
    const result = getEvidenceForAngle("ai_automation");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((s) => s.project_name === "Recruitment Chatbot")).toBe(
      true,
    );
  });

  it("returns snippets for backend_integrations angle", () => {
    const result = getEvidenceForAngle("backend_integrations");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((s) => s.project_name === "Upload App")).toBe(true);
  });

  it("returns snippets for azure_devops_iac angle", () => {
    const result = getEvidenceForAngle("azure_devops_iac");
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.some(
        (s) =>
          s.project_name === "Azure Infrastructure and Delivery Automation",
      ),
    ).toBe(true);
  });

  it("falls back to flagship for unknown angle", () => {
    const result = getEvidenceForAngle("nonexistent_angle");
    const flagship = getEvidenceForAngle("flagship");
    expect(result).toEqual(flagship);
  });

  it("all snippets have valid confidence values", () => {
    const angles = [
      "flagship",
      "ai_automation",
      "backend_integrations",
      "azure_devops_iac",
    ];
    for (const angle of angles) {
      const snippets = getEvidenceForAngle(angle);
      snippets.forEach((s) => {
        expect(["strong", "moderate", "weak"]).toContain(s.confidence);
      });
    }
  });

  it("each angle has exactly 3 snippets", () => {
    const angles = [
      "flagship",
      "ai_automation",
      "backend_integrations",
      "azure_devops_iac",
    ];
    for (const angle of angles) {
      expect(getEvidenceForAngle(angle)).toHaveLength(3);
    }
  });
});
