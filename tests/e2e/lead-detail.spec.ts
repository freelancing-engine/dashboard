import { test, expect } from "@playwright/test";

test.describe("Lead Detail Page", () => {
  test("navigates to a lead detail from the list", async ({ page }) => {
    await page.goto("/");

    // Click the first lead link in the table
    const firstLeadLink = page.locator("table tbody tr a").first();
    if (await firstLeadLink.isVisible()) {
      const href = await firstLeadLink.getAttribute("href");
      await firstLeadLink.click();
      await expect(page).toHaveURL(new RegExp("/leads/"));

      // Should show the back link
      await expect(page.locator("text=← Volver al listado")).toBeVisible();
    }
  });

  test("shows score breakdown section", async ({ page }) => {
    await page.goto("/");
    const firstLeadLink = page.locator("table tbody tr a").first();
    if (await firstLeadLink.isVisible()) {
      await firstLeadLink.click();
      // Score section should be visible
      await expect(page.locator("text=Puntaje:")).toBeVisible();
      // Should show at least one score dimension
      await expect(page.locator("text=Technical Fit")).toBeVisible();
    }
  });

  test("shows description section", async ({ page }) => {
    await page.goto("/");
    const firstLeadLink = page.locator("table tbody tr a").first();
    if (await firstLeadLink.isVisible()) {
      await firstLeadLink.click();
      await expect(page.locator("text=Descripción")).toBeVisible();
    }
  });

  test("shows client info section", async ({ page }) => {
    await page.goto("/");
    const firstLeadLink = page.locator("table tbody tr a").first();
    if (await firstLeadLink.isVisible()) {
      await firstLeadLink.click();
      await expect(page.locator("text=Cliente")).toBeVisible();
    }
  });

  test("back button returns to dashboard", async ({ page }) => {
    await page.goto("/");
    const firstLeadLink = page.locator("table tbody tr a").first();
    if (await firstLeadLink.isVisible()) {
      await firstLeadLink.click();
      await page.click("text=← Volver al listado");
      await expect(page).toHaveURL("/");
    }
  });

  test("shows review actions for reviewable leads", async ({ page }) => {
    // Navigate to a lead that needs review
    await page.goto("/?status=needs_review");
    const firstLeadLink = page.locator("table tbody tr a").first();
    if (await firstLeadLink.isVisible()) {
      await firstLeadLink.click();
      // Should show at least the review actions section or the proposal section
      const reviewSection = page.locator("text=Acciones de revisión");
      const proposalSection = page.locator("text=Propuesta");
      const hasReview = await reviewSection.isVisible().catch(() => false);
      const hasProposal = await proposalSection.isVisible().catch(() => false);
      expect(hasReview || hasProposal).toBeTruthy();
    }
  });
});
