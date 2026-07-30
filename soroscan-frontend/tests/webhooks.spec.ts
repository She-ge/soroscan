import { test, expect, expectVisualSnapshot } from "./helpers/fixtures";

test.describe("Webhook Manager", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/webhooks");
    await expect(page.getByText("[WEBHOOK_MANAGER]")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("should load webhook subscriptions", async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId("webhook-desktop-table")).toBeVisible();
    await expect(page.getByText("[WEBHOOK_LIST]")).toBeVisible();
  });

  test("should create a webhook", async ({ authenticatedPage: page }) => {
    const initialCount = await page
      .locator('[data-testid="webhook-desktop-table"] tbody tr')
      .count();

    await page.getByTestId("create-webhook-btn").click();
    await expect(page.getByText("NEW_WEBHOOK_SUBSCRIPTION")).toBeVisible();

    await page.getByTestId("webhook-url-input").fill("https://example.com/hooks/e2e");
    await page.getByTestId("create-webhook-submit").click();

    await expect(page.getByText(/WEBHOOK_CREATED/i)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('[data-testid="webhook-desktop-table"] tbody tr'),
    ).toHaveCount(initialCount + 1);
  });

  test("should test a webhook delivery", async ({ authenticatedPage: page }) => {
    const firstRow = page
      .locator('[data-testid="webhook-desktop-table"] tbody tr')
      .first();
    await firstRow.getByTestId("test-webhook-btn").click();

    await expect(
      page.getByText(/TEST_OK|TEST_FAILED|TESTING/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should delete a webhook", async ({ authenticatedPage: page }) => {
    const table = page.getByTestId("webhook-desktop-table");
    const rows = table.locator("tbody tr");
    const initialCount = await rows.count();
    expect(initialCount).toBeGreaterThan(0);
    await expect(rows.first()).toBeVisible();

    // Click via DOM to avoid detach/scroll races on overflow tables in CI.
    await rows.first().getByTestId("delete-webhook-btn").evaluate((el: HTMLButtonElement) => el.click());

    await expect(page.getByText("[CONFIRM_DELETE]")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("confirm-delete-webhook-btn").click();

    await expect(page.getByText(/WEBHOOK_DELETED/i)).toBeVisible();
    await expect(rows).toHaveCount(initialCount - 1, { timeout: 10_000 });
  });

  test("webhooks page visual regression", async ({ authenticatedPage: page }, testInfo) => {
    await expect(page.getByTestId("webhook-desktop-table")).toBeVisible();
    await expectVisualSnapshot(page, "webhooks-page.png", testInfo);
  });
});
