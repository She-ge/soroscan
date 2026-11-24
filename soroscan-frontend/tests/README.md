# Frontend Playwright E2E Tests

End-to-end coverage for critical SoroScan UI flows using [Playwright](https://playwright.dev/).

## Specs

| File                      | Coverage                                         |
| ------------------------- | ------------------------------------------------ |
| `tests/auth.spec.ts`      | Login form, validation, successful auth redirect |
| `tests/events.spec.ts`    | Event explorer load, filter, CSV export          |
| `tests/contracts.spec.ts` | Contract register / edit / delete                |
| `tests/webhooks.spec.ts`  | Webhook create / test / delete                   |
| `tests/admin.spec.ts`     | Admin dashboard metrics                          |

GraphQL responses are mocked in-browser so the suite runs without a live Django backend.

## Commands

```bash
cd soroscan-frontend
pnpm install
pnpm exec playwright install
pnpm run build          # required before CI-style runs
pnpm run test:e2e
```

Update visual regression baselines:

```bash
pnpm run test:e2e:update-snapshots
```

Interactive UI mode:

```bash
pnpm run test:e2e:ui
```

## Visual regression baselines

The five `visual regression` tests compare full-page Chromium screenshots
(`login`, `contracts`, `webhooks`, `admin dashboard`, and `event explorer`).

Baselines are platform-specific because font rasterisation differs between
operating systems, and the snapshot path includes the platform:

- `*-chromium-win32.png` — used on Windows dev machines.
- `*-chromium-linux.png` — used by the Linux CI runner.

CI compares against the Linux baselines and fails when a screenshot differs by
more than `maxDiffPixelRatio: 0.02` (see `playwright.config.ts`). A missing
baseline also fails; snapshots are no longer created implicitly during CI.

### Regenerate Windows baselines

```bash
cd soroscan-frontend
pnpm exec playwright test --project=chromium --update-snapshots
```

### Regenerate Linux baselines (CI)

Run Playwright in the official image matching the `@playwright/test` version in
`package.json` (currently 1.62), with the repository mounted. From the repository
root:

```bash
docker run --rm \
  -v "$PWD:/work" -w /work/soroscan-frontend \
  -e CI=true -e UPDATE_E2E_SNAPSHOTS=1 \
  mcr.microsoft.com/playwright:v1.62.0-noble \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm run build && pnpm exec playwright test --project=chromium"
```

This writes the five `*-chromium-linux.png` files next to the existing Windows
baselines. Commit them together with any intentional UI change. If the Docker
image tag is unavailable, use the image whose tag matches the installed
`@playwright/test` version (`pnpm exec playwright --version`).

You can also run the **Update Playwright Visual Baselines** workflow
(`workflow_dispatch` in `.github/workflows/update-visual-baselines.yml`) and
commit the `linux-visual-baselines` artifact it uploads. It runs the same
Ubuntu + Chromium environment as the E2E workflow.

Only the Chromium project produces visual baselines; Firefox continues to run
the functional tests without snapshot comparisons.

## Browsers

Configured projects: **Chromium** and **Firefox**.

## CI

`.github/workflows/e2e.yml` builds the frontend and runs `pnpm run test:e2e` on
every pull request and push to main/develop (Chromium + Firefox).

Visual regression compares against the committed platform-specific Chromium
baselines (`*-chromium-linux.png` on CI) and fails on real visual changes.
Screenshots, traces, and the HTML report are uploaded as artifacts when the job
fails.
