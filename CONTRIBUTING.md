# Contributing to SoroScan 🔍

Thank you for investing your time in contributing to SoroScan!

SoroScan is an open-source indexing layer designed to make Soroban smart contract data
accessible and queryable. Whether you're fixing a bug, improving documentation, or
building a new feature, we welcome your involvement.

---

## 🚀 Quick Links for Contributors

To make your onboarding process as smooth as possible, we have detailed guidelines for each stage of your contribution journey:

1. 🔰 **Getting Started**: Read the [Developer Onboarding Guide](docs/contributing/developer-onboarding.md) to set up your local environment in under 2 hours.
2. 🎨 **Code Style & Linting**: Adhere to our [Code Style Guidelines](docs/contributing/style-guide.md) (Python/Django, TypeScript/React, Rust, CSS, SQL).
3. 🌿 **Git & PR Workflows**: Follow our [Git & PR Workflow Guide](docs/contributing/git-and-pr-workflow.md) to learn about branching, Conventional Commits, and code reviews.
4. 📄 **Writing Documentation**: Check the [Documentation Contribution Guide](docs/contributing/documentation-guide.md) to learn how to edit docs and run the Docusaurus preview server.
5. 🤝 **Community & Code of Conduct**: Read our [Community Standards](docs/contributing/community-standards.md) to understand our issue labeling, triage workflows, and Code of Conduct.
6. 📝 **Logging Standards**: Follow our [Logging Standards](docs/contributing/LOGGING_STANDARDS.md) for structured logging formats, field naming conventions, log levels, and sensitive data masking.
7. 🏛️ **Architecture Decisions**: Review our [Architecture Decision Records (ADRs)](docs/adrs/README.md) to understand the rationale behind major technical choices.


---

## 📜 Code of Conduct

By participating in this project you agree to abide by our
[Community Standards & Code of Conduct](docs/contributing/community-standards.md).

We are committed to making participation in SoroScan a harassment-free experience for
everyone, regardless of level of experience, gender, gender identity and expression,
sexual orientation, disability, personal appearance, body size, race, ethnicity, age,
religion, or nationality.

**Violations** can be reported privately to the maintainers via GitHub's
[private vulnerability / contact form](https://github.com/Jessepriase/soroscan/security)
or by emailing the project maintainers.

---

## 🛠️ Development Workflow

### 1. Claiming an Issue

- Browse the [Issues](https://github.com/Jessepriase/soroscan/issues) tab.
- Filter by `good-first-issue` if you are new.
- Comment **"I'd like to work on this!"** — wait for a maintainer to assign the issue
  before starting work.

### 2. Branching & Commits

Branch from `develop` (or `main` for hotfixes only):

```
feat/short-description
fix/short-description
docs/short-description
refactor/short-description
chore/short-description
```

Use **Conventional Commits** for every commit message:

```
<type>(<scope>): <description>

[optional body]

[optional footer — e.g. Closes #123]
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

Examples:

```
feat(ingest): support parallel streaming of event logs
fix(sdk-python): retry on 503 Service Unavailable errors
docs: update deployment credentials setup guide
```

### 3. Code Style & Linting

Run all formatters and linters before committing. **CI will reject PRs that fail these
checks.**

#### Python (Ruff + Black)

```bash
cd django-backend
black .                    # format
ruff check .               # lint (includes import order)
ruff check --fix .         # auto-fix safe violations
pytest                     # run tests
```

**Configuration** — `ruff` is configured in `django-backend/pyproject.toml` (or
`ruff.toml` if present). Key rules enabled: `E`, `F`, `I` (isort), `UP` (pyupgrade),
`B` (flake8-bugbear). Line length: **88** (Black default).

Rules reference: <https://docs.astral.sh/ruff/rules/>

#### TypeScript / React (ESLint + Prettier)

```bash
cd soroscan-frontend
pnpm lint                  # ESLint with next/core-web-vitals config
pnpm test                  # Jest + React Testing Library
```

```bash
cd admin
npm run lint               # ESLint
```

**Configuration** — `soroscan-frontend/eslint.config.mjs` (flat config, Next.js).
Prettier is not a separate step — Next.js ESLint config enforces formatting rules
inline. For standalone Prettier formatting:

```bash
npx prettier --write "**/*.{ts,tsx,js,json,md}"
```

Rules reference: <https://nextjs.org/docs/app/building-your-application/configuring/eslint>

#### Rust (cargo fmt + Clippy)

```bash
cd soroban-contracts/soroscan_core
cargo fmt                  # format
cargo clippy -- -D warnings   # lint (all warnings are errors)
cargo test                 # run tests
```

**Configuration** — `rustfmt.toml` (if present) and the workspace `Cargo.toml`.
Clippy lints are set to deny warnings (`-D warnings`) — zero tolerance for linter
warnings in CI.

Rules reference: <https://rust-lang.github.io/rust-clippy/stable/index.html>

#### TypeScript SDK

```bash
cd sdk/typescript
pnpm lint
pnpm test
```

#### Python SDK

```bash
cd sdk/python
ruff check .
pytest
```

### 4. Testing Requirements

| Sub-project | Test runner | Minimum coverage |
|---|---|---|
| `django-backend` | `pytest` + `pytest-django` | See `.coveragerc` |
| `soroscan-frontend` | `jest` + React Testing Library | 40% lines (CI enforced) |
| `admin` | `jest` + React Testing Library | All new components |
| `soroban-contracts` | `cargo test` | All public functions |
| `sdk/typescript` | `jest` / `vitest` | All exported functions |
| `sdk/python` | `pytest` | All exported functions |

New features must include tests. Bug fixes must include a regression test.

### 5. Submitting a Pull Request

1. Rebase your branch on the latest `develop`:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```
2. Push and open a PR against **`develop`** (not `main`).
3. Fill out the **PR description template** (see below).
4. Ensure all CI checks are green.
5. Address review feedback; do not resolve reviewer threads yourself.
6. Merging: **Squash & Merge** — one clean commit per feature.

---

## 📝 Pull Request Description Template

When opening a PR, copy the template below into the description. GitHub will
pre-populate it automatically from `.github/PULL_REQUEST_TEMPLATE.md`.

```markdown
## Summary
<!-- One or two sentences describing what this PR does and why. -->

## Changes
<!-- Bullet list of the main files/components changed and what was done. -->
-
-

## Related Issues
<!-- Link every issue this PR closes or relates to. -->
Closes #

## Testing
<!-- Describe how you tested this change. Include commands to reproduce. -->
- [ ] Unit tests added / updated
- [ ] Manual test steps:
  1.
  2.

## Screenshots / Recordings (if UI change)
<!-- Drag images here or delete this section for non-UI changes. -->

## Checklist
- [ ] `ruff` / `black` (Python), ESLint / Prettier (TS), `cargo fmt` + `clippy` (Rust) all pass
- [ ] Tests pass locally (`pytest` / `pnpm test` / `cargo test`)
- [ ] Documentation updated (if applicable)
- [ ] Conventional Commit message format used
- [ ] PR is opened against `develop`, not `main`
- [ ] No secrets, credentials, or `.env` files included
```

---

## 🏷️ Issue Labels

| Label | Meaning |
|---|---|
| `good-first-issue` | Simple fix suitable for first-time contributors |
| `bug` | Something is not working as intended |
| `enhancement` | New feature or UX improvement |
| `documentation` | Missing or outdated docs |
| `priority/high` | Blocker, critical bug, or core-path dependency |
| `help-wanted` | Needs external contributor with specific skills |
| `needs-info` | Waiting on reporter for reproduction steps or clarification |
| `wontfix` | Out of scope or duplicate |
| `design` | UI/UX design task or design system spec |

Priority levels used internally by maintainers:

| Priority | Description | Response target |
|---|---|---|
| P0 Critical | Service down, data corruption, security | Immediate |
| P1 High | Major feature broken, indexer regression | Within 48 h |
| P2 Medium | Non-blocking bug, normal feature | Next sprint |
| P3 Low | Minor UI tweak, typo | Best effort |

---

## 🔒 Security Issues

**Do not open a public issue for security vulnerabilities.**
Report them privately via the
[GitHub Security Advisory](https://github.com/Jessepriase/soroscan/security/advisories/new)
page or email the maintainers directly.

---

## 🤝 Community & Recognition

- All contributors are listed in [CONTRIBUTORS.md](CONTRIBUTORS.md) via the
  `all-contributors` bot.
- Mentorship sessions are available — open a topic in the **"Mentorship"** category
  on GitHub Discussions.
- Significant contributors may be invited to join as maintainers. See
  [Community Standards](docs/contributing/community-standards.md) for the path to
  maintainership.

---

*Full details for each section live in the [docs/contributing/](docs/contributing/)
directory. When in doubt, ask in GitHub Discussions.*
