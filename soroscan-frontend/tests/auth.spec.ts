import { test, expect, installGraphqlMocks, clearAuth, expectVisualSnapshot } from "./helpers/fixtures";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    await installGraphqlMocks(page);
  });

  test("should render the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /SOROSCAN_SECURE_AUTH/i })).toBeVisible();
    await expect(page.getByTestId("login-email")).toBeVisible();
    await expect(page.getByTestId("login-password")).toBeVisible();
    await expect(page.getByTestId("login-submit")).toBeVisible();
  });

  test("should show validation errors for invalid credentials input", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-email").fill("not-an-email");
    await page.getByTestId("login-password").fill("short");
    await page.getByTestId("login-submit").click();

    await expect(page.getByText(/INVALID_EMAIL_FORMAT/i)).toBeVisible();
    await expect(page.getByText(/PASSWORD_MIN_8_CHARACTERS/i)).toBeVisible();
  });

  test("should complete the login flow and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-email").fill("operator@soroscan.io");
    await page.getByTestId("login-password").fill("securepass");
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/dashboard(?:\/)?$/, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: /Event Explorer/i }),
    ).toBeVisible();
  });

  test("login page visual regression", async ({ page }, testInfo) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-submit")).toBeVisible();
    await expectVisualSnapshot(page, "login-page.png", testInfo);
  });
});
