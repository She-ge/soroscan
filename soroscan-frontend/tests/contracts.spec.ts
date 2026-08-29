import { test, expect, expectVisualSnapshot } from "./helpers/fixtures";

test.describe("Contract Management", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/contracts");
    await expect(page.getByText("[CONTRACT_MANAGEMENT]")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("should load tracked contracts", async ({ authenticatedPage: page }) => {
    const table = page.getByTestId("contract-desktop-table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("cell", { name: "Demo AMM" })).toBeVisible();
  });

  test("should register a new contract", async ({ authenticatedPage: page }) => {
    await page.getByTestId("register-contract-btn").click();
    await expect(page.getByText("REGISTER_CONTRACT")).toBeVisible();

    await page.getByTestId("contract-id-input").fill(
      "CCCCCCCNEWCONTRACTID000000000000000000000000000000000000",
    );
    await page.getByTestId("contract-name-input").fill("E2E New Contract");
    await page.getByTestId("contract-description-input").fill("Created by Playwright");
    await page.getByTestId("register-submit-btn").click();

    await expect(
      page.getByTestId("contract-desktop-table").getByRole("cell", { name: "E2E New Contract" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("should edit an existing contract", async ({ authenticatedPage: page }) => {
    await page
      .getByTestId("contract-desktop-table")
      .getByRole("cell", { name: "Demo AMM" })
      .click();
    await expect(page.getByTestId("contract-edit-form")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("contract-name-input").fill("Demo AMM Updated");
    await page.getByTestId("contract-save-btn").click();

    await expect(page.getByTestId("contract-status")).toHaveText("CONTRACT_UPDATED", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("contract-name-input")).toHaveValue("Demo AMM Updated");
  });

  test("should delete a contract", async ({ authenticatedPage: page }) => {
    const row = page.locator('[data-testid="contract-desktop-table"] tr', {
      hasText: "Oracle Feed",
    });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /Delete/i }).click();

    await expect(page.getByText("CONFIRM_DELETE")).toBeVisible();
    await page.getByTestId("confirm-delete-btn").click();

    await expect(
      page.getByTestId("contract-desktop-table").getByText("Oracle Feed"),
    ).toHaveCount(0);
  });

  test("contracts page visual regression", async ({ authenticatedPage: page }, testInfo) => {
    await expect(page.getByTestId("contract-desktop-table")).toBeVisible();
    await expectVisualSnapshot(page, "contracts-page.png", testInfo);
  });
});
