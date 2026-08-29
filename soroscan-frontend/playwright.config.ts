import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

/**
 * Playwright E2E configuration for SoroScan frontend.
 * Runs Chromium + Firefox with visual regression snapshots.
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}-{platform}{ext}",
  // Prefer config-level "missing" so first CI runs can create linux baselines.
  // Workflow also passes --update-snapshots missing because Playwright defaults to
  // "none" under CI=true even when config says otherwise on some versions.
  updateSnapshots: process.env.UPDATE_E2E_SNAPSHOTS === "1" ? "all" : "missing",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Avoid requiring Playwright's ffmpeg binary for local runs with system Chrome.
    video: process.env.CI ? "retain-on-failure" : "off",
    locale: "en-US",
    timezoneId: "UTC",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Prefer system Chrome locally when Playwright browser downloads fail/timeout.
        ...(process.env.CI || process.env.PLAYWRIGHT_BUNDLED_BROWSERS === "1"
          ? {}
          : { channel: "chrome" }),
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command: process.env.CI
      ? `pnpm exec next start --port ${PORT}`
      : `pnpm exec next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
