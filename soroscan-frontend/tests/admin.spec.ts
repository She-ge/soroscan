import { test, expect, expectVisualSnapshot } from "./helpers/fixtures";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/admin");
    await expect(page.getByText("[ADMIN_OVERSIGHT_V1.0]")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("should load system metrics", async ({ authenticatedPage: page }) => {
    await expect(page.getByRole("heading", { name: /System Dashboard/i })).toBeVisible();
    await expect(page.getByTestId("admin-metrics")).toBeVisible();
    await expect(page.getByText("Events Today")).toBeVisible();
    await expect(page.getByText("Total Events")).toBeVisible();
    await expect(page.getByText("Webhook Health")).toBeVisible();
    await expect(page.getByText("Active Contracts")).toBeVisible();
  });

  test("should show system status panel", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("[SYSTEM_STATUS]")).toBeVisible();
    await expect(page.getByText("Database")).toBeVisible();
    await expect(page.getByText("[ONLINE]").first()).toBeVisible();
  });

  test("admin dashboard visual regression", async ({ authenticatedPage: page }, testInfo) => {
    await expect(page.getByTestId("admin-metrics")).toBeVisible();
    await expectVisualSnapshot(page, "admin-dashboard.png", testInfo);
  });
});
