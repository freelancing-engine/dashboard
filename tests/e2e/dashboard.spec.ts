import { test, expect } from "@playwright/test";

test.describe("Dashboard Home", () => {
  test("loads the lead list page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Freelancing Engine");
  });

  test("shows stats bar with lead counts", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Total leads")).toBeVisible();
  });

  test("shows filter controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("select")).toHaveCount(2); // status + platform
    await expect(page.locator('input[type="text"]')).toBeVisible(); // search
  });

  test("shows lead table with rows", async ({ page }) => {
    await page.goto("/");
    // Table should have at least the header row
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("thead th")).toHaveCount(9);
  });

  test("navigates to metrics page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Ver métricas");
    await expect(page).toHaveURL("/metrics");
    await expect(page.locator("h1")).toContainText("Métricas");
  });

  test("navigates to profile builder", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Profile Builder");
    await expect(page).toHaveURL("/profiles");
  });

  test("filters by status", async ({ page }) => {
    await page.goto("/");
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("scored");
    await expect(page).toHaveURL(/status=scored/);
  });

  test("pagination works when multiple pages exist", async ({ page }) => {
    await page.goto("/");
    const pagination = page.locator("text=Siguiente →");
    if (await pagination.isVisible()) {
      await pagination.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });
});
