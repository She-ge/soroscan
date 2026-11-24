# Admin Dashboard

The admin section lives at `app/admin/` inside the Next.js frontend. It provides a terminal-styled operations dashboard
for platform operators: real-time system metrics, webhook health, CDC sync status, audit logs, and data-quality tooling.

Access is guarded by `AuthGuard` (admin role required). The layout wraps every page in `AppShell` for consistent
navigation.

---

## Local Development

```bash
# from soroscan-frontend/
pnpm install
pnpm dev
```

Open `http://localhost:3000/admin`.

### Environment Setup

1. Start the Django backend (see `django-backend/`) so it is reachable at `http://localhost:8000`.
1. Copy the example env file and adjust values as needed:

   ```bash
   # from soroscan-frontend/
   cp .env.example .env.local
   ```

1. Run `pnpm dev` and sign in at `http://localhost:3000/login` with an admin account.

The admin dashboard reads the following variables. `NEXT_PUBLIC_*` values are inlined at build time, so restart
`pnpm dev` (or rebuild) after changing them.

| Variable                  | Default                          | Used by                                                                                                     |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`     | `http://localhost:8000`          | REST base URL for the admin pages (`dedup/`, `contracts-import/`) and the JWT refresh call in `lib/auth.ts` |
| `NEXT_PUBLIC_GRAPHQL_URL` | `http://localhost:8000/graphql/` | Apollo Client HTTP endpoint (system metrics, audit logs, CDC, data quality)                                 |
| `NEXT_PUBLIC_WS_URL`      | _unset_                          | GraphQL subscriptions / live updates. Leave unset to disable real-time features                             |
| `BACKEND_BASE_URL`        | `http://localhost:8000`          | Server-side GraphQL proxy at `/api/graphql`                                                                 |
| `BACKEND_GRAPHQL_URL`     | `${BACKEND_BASE_URL}/graphql/`   | Overrides the full proxy target URL                                                                         |

Example `.env.local` for running outside Docker:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql/
NEXT_PUBLIC_WS_URL=ws://localhost:8000/graphql/
BACKEND_BASE_URL=http://localhost:8000
```

> **Note:** There is no separate admin API URL or mock-data switch. `NEXT_PUBLIC_ADMIN_API_URL` and
> `NEXT_PUBLIC_ENABLE_MOCK_DATA` are **not** read by the code. The admin section shares `NEXT_PUBLIC_API_URL` /
> `NEXT_PUBLIC_GRAPHQL_URL` with the rest of the frontend and always talks to a live backend.

### npm Scripts

Run from `soroscan-frontend/` (`npm run <script>` works the same as `pnpm <script>`):

| Script     | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
| `dev`      | Start the Next.js dev server on `http://localhost:3000`            |
| `build`    | Run GraphQL codegen, then create a production build (`next build`) |
| `start`    | Serve the production build                                         |
| `codegen`  | Regenerate typed GraphQL hooks from the backend schema             |
| `lint`     | Run ESLint                                                         |
| `test`     | Run Jest unit tests (e.g. `__tests__/admin-login-page.test.tsx`)   |
| `test:e2e` | Run Playwright end-to-end tests (includes `tests/admin.spec.ts`)   |

---

## Directory Layout

```
app/admin/
├── layout.tsx              # AuthGuard + AppShell wrapper for all admin routes
├── page.tsx                # Main system dashboard (metrics, chart, error log)
│
├── components/             # Admin-only UI components (not shared with the rest of the app)
│   ├── ErrorLog.tsx        # Live scrollable system error feed
│   ├── EventChart.tsx      # Ingestion timeline bar/line chart
│   ├── MetricsCard.tsx     # Single-stat card with icon and colour variant
│   └── WebhookStats.tsx    # Webhook success rate and avg delivery time summary
│
├── audit-logs/
│   └── page.tsx            # Audit trail viewer
│
├── cdc/
│   └── page.tsx            # CDC (Change-Data-Capture) sync monitoring
│
├── contracts-import/
│   └── page.tsx            # Bulk contract import tooling
│
├── data-quality/
│   └── page.tsx            # Data quality scorecards and reconciliation
│
├── dedup/
│   └── page.tsx            # Event deduplication log viewer
│
└── queries/
    └── GetSystemMetrics.graphql   # GraphQL query for the main dashboard
```

---

## Component Patterns

### MetricsCard

A single-stat display card. Accepts a `color` variant (`green`, `cyan`, `warning`, `danger`, `gray`) that controls the
border, background tint, and icon colour — all mapped to the terminal design-token palette.

```tsx
<MetricsCard
  title="Webhook Health"
  value="98%"
  subValue="Last 24h Success Rate"
  icon={Webhook}
  color="green"
  loading={false}
/>
```

Props:

| Prop       | Type                                                   | Default   | Description                                            |
| ---------- | ------------------------------------------------------ | --------- | ------------------------------------------------------ |
| `title`    | `string`                                               | —         | Card label shown in brackets above the value           |
| `value`    | `string \| number`                                     | —         | Primary stat value                                     |
| `subValue` | `string`                                               | —         | Optional secondary label below the value               |
| `icon`     | `LucideIcon`                                           | —         | Lucide icon rendered top-right                         |
| `color`    | `"green" \| "cyan" \| "warning" \| "danger" \| "gray"` | `"green"` | Colour variant                                         |
| `loading`  | `boolean`                                              | `false`   | Shows `---` placeholder and pulses the icon while true |

### ErrorLog

A scrollable live error feed. Renders items with `ERROR` (red left border) or `WARNING` (yellow left border) severity
badges, timestamps, and an optional `context` field.

```tsx
<ErrorLog errors={data.recentErrors} loading={loading} />
```

### EventChart

Renders the 24-hour ingestion timeline. Receives a `data` array of `{ label, value }` objects and a `title` string.

### WebhookStats

Displays webhook success rate and average delivery time. Accepts `successRate` (0–100), `avgTime` (ms), and `loading`.

### Page layout helpers

Admin pages use two shared layout components from `components/layout/`:

- `AdminDashboardLayout` — wraps the dashboard in a responsive grid with named `header`, `metrics`, `charts`, and `logs`
  slots.
- `DashboardPanel` — a styled panel container used inside grid cells. Accepts an `elevation` prop (`"default"` |
  `"elevated"`) and an optional `title`.

---

## Data Fetching

The main dashboard polls `fetchSystemMetrics()` (from `components/ingest/graphql.ts`) every 30 seconds. The GraphQL
query is defined in `queries/GetSystemMetrics.graphql`.

After modifying any GraphQL query or the backend schema, regenerate the typed hooks:

```bash
pnpm run codegen
```

---

## Design Conventions

- **Terminal aesthetic**: all text is uppercase, monospaced (`font-terminal-mono`), and uses the `terminal-*` Tailwind
  colour tokens (`terminal-green`, `terminal-cyan`, `terminal-danger`, etc.).
- **No inline styles**: use Tailwind classes and the existing colour token map in each component.
- **Component scope**: components in `app/admin/components/` are local to the admin section. Shared UI primitives
  (buttons, badges, spinners) come from `components/terminal/` or `components/ui/`.
- **Auth**: every admin route inherits `AuthGuard` from `layout.tsx` — individual pages do not need to repeat the guard.
