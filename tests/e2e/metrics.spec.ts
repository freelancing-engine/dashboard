import { test, expect } from "@playwright/test";

test.describe("Metrics Page", () => {
  test("loads metrics page with KPI cards", async ({ page }) => {
    await page.goto("/metrics");
    await expect(page.locator("h1")).toContainText("Métricas");
    await expect(page.locator("text=Total leads")).toBeVisible();
    await expect(page.locator("text=Puntaje promedio")).toBeVisible();
    await expect(page.locator("text=Alta prioridad")).toBeVisible();
    await expect(page.locator("text=Para revisar")).toBeVisible();
  });

  test("shows all chart sections", async ({ page }) => {
    await page.goto("/metrics");
    await expect(page.locator("text=Pipeline de leads")).toBeVisible();
    await expect(page.locator("text=Distribución de puntajes")).toBeVisible();
    await expect(page.locator("text=Veredictos")).toBeVisible();
    await expect(page.locator("text=Plataformas")).toBeVisible();
    await expect(page.locator("text=Ángulos de perfil")).toBeVisible();
    await expect(page.locator("text=Leads por día")).toBeVisible();
  });

  test("back link returns to dashboard", async ({ page }) => {
    await page.goto("/metrics");
    await page.click("text=← Volver al listado");
    await expect(page).toHaveURL("/");
  });
});

test.describe("Profile Builder Page", () => {
  test("loads profile builder page", async ({ page }) => {
    await page.goto("/profiles");
    // Should show the CV upload/paste step
    await expect(page.locator("textarea")).toBeVisible();
  });
});
