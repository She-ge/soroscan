# Frontend Playwright E2E Tests

End-to-end coverage for critical SoroScan UI flows using [Playwright](https://playwright.dev/).

## Specs

| File | Coverage |
| --- | --- |
| `tests/auth.spec.ts` | Login form, validation, successful auth redirect |
| `tests/events.spec.ts` | Event explorer load, filter, CSV export |
| `tests/contracts.spec.ts` | Contract register / edit / delete |
| `tests/webhooks.spec.ts` | Webhook create / test / delete |
| `tests/admin.spec.ts` | Admin dashboard metrics |

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

## Browsers

Configured projects: **Chromium** and **Firefox**.

## CI

`.github/workflows/e2e.yml` builds the frontend and runs `pnpm run test:e2e` on every pull request and push to main/develop (Chromium + Firefox).

Visual regression compares against committed Chromium baselines locally. In CI, the same visual tests attach full-page screenshots as artifacts instead of failing on missing linux baselines.
