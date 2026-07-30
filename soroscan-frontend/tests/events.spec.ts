import {
  test,
  expect,
  CONTRACT_ID,
  expectVisualSnapshot,
} from "./helpers/fixtures";

test.describe("Event Explorer", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(
      `/contracts/${encodeURIComponent(CONTRACT_ID)}/events/explorer`,
    );
    await expect(page.getByTestId("events-table")).toBeVisible({ timeout: 30_000 });
  });

  test("should load events", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("SoroScan Event Explorer")).toBeVisible();
    await expect(page.getByText("Events loaded.")).toBeVisible();
    await expect(page.locator('[data-testid="events-table"] tbody tr')).toHaveCount(20);
  });

  test("should apply filters", async ({ authenticatedPage: page }) => {
    await page.getByTestId("event-type-filter").selectOption("SWAP_COMPLETE");
    await page.getByTestId("apply-filters").click();

    await expect(page.getByText("Events loaded.")).toBeVisible();
    const rows = page.locator('[data-testid="events-table"] tbody tr');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeLessThan(20);
    expect(count).toBeGreaterThan(0);
  });

  test("should export events as CSV", async ({ authenticatedPage: page }) => {
    await page.getByTestId("export-btn").click();
    await expect(page.getByRole("dialog", { name: /Export Events/i })).toBeVisible();

    await page.getByTestId("export-format-csv").check();
    await page.getByTestId("generate-preview-btn").click();
    await expect(page.getByText(/Preview created/i)).toBeVisible({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent("download");
    // Modal preview can push the footer button outside the viewport; click via DOM.
    await page.getByTestId("confirm-export").evaluate((el: HTMLButtonElement) => el.click());
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test("event explorer visual regression", async ({ authenticatedPage: page }, testInfo) => {
    await expect(page.getByTestId("events-table")).toBeVisible();
    await expectVisualSnapshot(page, "event-explorer.png", testInfo);
  });
});
