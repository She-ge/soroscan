import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/webhooks/testing", "/developer/api-explorer", "/search/advanced"];

async function gotoWithRetry(page: Parameters<Parameters<typeof test>[1]>[0]["page"], path: string) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "commit", timeout: 60000 });
      await page.waitForSelector("#main-content", { timeout: 60000 });
      return;
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }
    }
  }
}

test.describe("WCAG smoke checks", () => {
  test.setTimeout(180000);

  for (const path of PAGES) {
    test(`has no serious or critical axe violations on ${path}`, async ({ page }) => {
      await gotoWithRetry(page, path);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include("#main-content")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const seriousOrCritical = accessibilityScanResults.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );

      expect(seriousOrCritical).toEqual([]);
    });
  }
});
