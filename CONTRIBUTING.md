# Contributing to SoroScan 🔍

Thank you for investing your time in contributing to SoroScan!

SoroScan is an open-source indexing layer designed to make Soroban smart contract data accessible and queryable. Whether
you're fixing a bug, improving documentation, or building a new feature, we welcome your involvement.

---

## 🚀 Quick Links for Contributors

For more detailed contributor guidance:

1. 🔰 **Getting Started**: Read the [Developer Onboarding Guide](docs/contributing/developer-onboarding.md).
1. 🎨 **Code Style & Linting**: Follow the [Code Style Guidelines](docs/contributing/style-guide.md).
1. 🌿 **Git & PR Workflows**: See the [Git & PR Workflow Guide](docs/contributing/git-and-pr-workflow.md).
1. 📄 **Writing Documentation**: See the [Documentation Contribution Guide](docs/contributing/documentation-guide.md).
1. 🤝 **Community & Code of Conduct**: Read the [Community Standards](docs/contributing/community-standards.md).
1. 📝 **Logging Standards**: Follow the [Logging Standards](docs/contributing/LOGGING_STANDARDS.md).
1. 🏛️ **Architecture Decisions**: Review the [Architecture Decision Records](docs/adrs/README.md).

---

## 📜 Code of Conduct

By participating in this project you agree to abide by our
[Community Standards & Code of Conduct](docs/contributing/community-standards.md).

We are committed to making participation in SoroScan a harassment-free experience for everyone, regardless of level of
experience, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size,
race, ethnicity, age, religion, or nationality.

Security vulnerabilities should not be reported through public issues. See the
[security reporting guidance](docs/security/index.md).

---

## ✅ First-Time Contributor Setup Checklist

Before starting your first contribution, complete the following checklist:

- [ ] Fork `SoroScan/soroscan` on GitHub.
- [ ] Clone your fork locally.
- [ ] Add the official SoroScan repository as `upstream`.
- [ ] Fetch the latest upstream changes.
- [ ] Check out an up-to-date `dev` branch.
- [ ] Install the dependencies required for the area you are changing.
- [ ] Configure the local backend environment if required.
- [ ] Install frontend dependencies if required.
- [ ] Install the repository pre-commit hooks.
- [ ] Run the relevant tests and lint checks.
- [ ] Create a contribution branch from `dev`.
- [ ] Keep changes limited to the assigned issue.
- [ ] Push your branch to your fork.
- [ ] Open a pull request against `dev`.

---

## 🛠️ Environment Setup

## 1. Prerequisites

Install the tools required for the area of SoroScan you plan to work on.

Core tools include:

- Git
- Python
- Node.js
- pnpm
- Docker
- Docker Compose

Rust and Cargo are also required when contributing to the Soroban contracts.

Check your installed tools:

```bash
git --version
python --version
node --version
pnpm --version
docker --version
docker compose version
```

On systems where Python is available as `python3`, use:

```bash
python3 --version
```

---

## 2. Fork and Clone the Repository

Fork:

```text
https://github.com/SoroScan/soroscan
```

Then clone your fork:

```bash
git clone https://github.com/<your-username>/soroscan.git
cd soroscan
```

Your fork should be configured as `origin`.

Verify:

```bash
git remote -v
```

---

## 3. Add the Official Repository as `upstream`

Add the main SoroScan repository:

```bash
git remote add upstream https://github.com/SoroScan/soroscan.git
git fetch upstream
```

Verify:

```bash
git remote -v
```

A typical setup should contain:

```text
origin    https://github.com/<your-username>/soroscan.git
upstream  https://github.com/SoroScan/soroscan.git
```

If `upstream` already exists, simply run:

```bash
git fetch upstream
```

---

## 4. Prepare the `dev` Branch

Contributor branches should be created from the latest `dev` branch.

If `dev` already exists locally:

```bash
git switch dev
git pull --ff-only upstream dev
```

If you do not yet have a local `dev` branch:

```bash
git switch -c dev --track upstream/dev
```

Confirm your branch:

```bash
git branch --show-current
```

Expected output:

```text
dev
```

---

## 5. Create a Contribution Branch

Create a descriptive branch from the updated `dev` branch:

```bash
git switch -c <branch-name>
```

Recommended prefixes include:

```text
feat/
fix/
docs/
refactor/
chore/
```

Examples:

```text
feat/add-contract-filter
fix/webhook-retry-status
docs/contributor-onboarding
```

Do not make contribution commits directly on `dev` or `main`.

---

## 🐳 Running the Project with Docker

From the repository root, the quickest way to start the local stack is:

```bash
docker compose up --build
```

Check running services:

```bash
docker compose ps
```

Common local endpoints include:

```text
Backend:  http://localhost:8000
GraphQL:  http://localhost:8000/graphql/
Frontend: http://localhost:3000
```

Stop the stack with:

```bash
docker compose down
```

---

## 🐍 Backend Setup

From the repository root:

```bash
cd django-backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Linux, macOS, WSL, or Git Bash:

```bash
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file if needed:

```bash
cp .env.example .env
```

Do not commit `.env` files, credentials, API keys, JWTs, webhook secrets, or private keys.

Apply migrations:

```bash
python manage.py migrate
```

Start the backend:

```bash
python manage.py runserver
```

The GraphQL endpoint is available at:

```text
http://localhost:8000/graphql/
```

---

## ⚛️ Frontend Setup

From the repository root:

```bash
cd soroscan-frontend
pnpm install
```

Start the development server:

```bash
pnpm run dev
```

The frontend normally runs at:

```text
http://localhost:3000
```

Generate GraphQL types:

```bash
pnpm run codegen
```

When generating against a running local backend on Bash, Git Bash, Linux, or macOS:

```bash
GRAPHQL_ENDPOINT=http://localhost:8000/graphql/ pnpm run codegen
```

Watch GraphQL files and regenerate automatically:

```bash
pnpm run codegen:watch
```

---

## 🪝 Pre-Commit Hooks

SoroScan provides a repository-level `.pre-commit-config.yaml`.

The configured hooks check:

- trailing whitespace;
- end-of-file newlines;
- YAML syntax;
- accidentally added large files;
- Python formatting with Black;
- Python linting with Flake8;
- Python import ordering with isort.

## Install pre-commit

Install the tool:

```bash
python -m pip install pre-commit
```

From the repository root, install the Git hook:

```bash
pre-commit install
```

Run all hooks manually:

```bash
pre-commit run --all-files
```

After installation, the configured hooks run automatically when you create a commit.

If a hook modifies a file, review the change, stage it again, and rerun the checks.

Do not routinely bypass pre-commit using `--no-verify`. Fix the reported issue instead.

---

## 🧪 Testing Commands Reference

Run tests and checks relevant to the part of the repository you changed.

## Backend

From `django-backend/`:

```bash
pytest
```

Or:

```bash
make test
```

Run linting:

```bash
ruff check .
```

Or:

```bash
make lint
```

Check Black formatting:

```bash
black --check .
```

Apply formatting when required:

```bash
make format
```

Run an individual backend test file when appropriate:

```bash
pytest soroscan/ingest/tests/test_schema.py
```

---

## Frontend

From `soroscan-frontend/`:

Run Jest tests:

```bash
pnpm test
```

Run tests in CI mode:

```bash
pnpm run test:ci
```

Run ESLint:

```bash
pnpm run lint
```

Run GraphQL Code Generator:

```bash
pnpm run codegen
```

Run the production build:

```bash
pnpm run build
```

Run Playwright end-to-end tests:

```bash
pnpm run test:e2e
```

Run accessibility tests:

```bash
pnpm run test:a11y
```

---

## Admin Dashboard

From `admin/`:

```bash
npm install
npm run lint
```

---

## Soroban Contracts

From `soroban-contracts/soroscan_core/`:

```bash
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

---

## TypeScript SDK

From `sdk/typescript/`, run the scripts relevant to your change, including:

```bash
pnpm test
```

---

## Python SDK

From `sdk/python/`:

```bash
ruff check .
pytest
```

---

## Documentation-Only Changes

For documentation-only pull requests:

1. review the rendered Markdown;
1. verify links and file paths;
1. verify commands against the current repository;
1. check examples for obvious syntax errors;
1. run applicable pre-commit checks;
1. confirm that no unrelated files were changed.

Check for whitespace errors with:

```bash
git diff --check
```

---

## 🌿 Development Workflow

## 1. Claim an Issue

- Browse the repository's GitHub Issues.
- Filter by `good-first-issue` if you are new.
- Comment that you would like to work on the issue when required.
- Wait for maintainer assignment when the task requires it.
- Read the complete issue description and acceptance criteria before starting.

Keep your contribution focused on the assigned issue.

Avoid unrelated refactors, dependency upgrades, formatting changes, or bug fixes in the same pull request.

---

## 2. Branching and Commits

Before creating a contribution branch:

```bash
git fetch upstream
git switch dev
git pull --ff-only upstream dev
```

Then create your branch:

```bash
git switch -c <branch-name>
```

Use **Conventional Commits**:

```text
<type>(<optional-scope>): <description>
```

Optional issue footer:

```text
Closes #123
```

Allowed types include:

```text
feat
fix
docs
style
refactor
perf
test
chore
```

Examples:

```text
feat(ingest): support parallel streaming of event logs
fix(sdk-python): retry failed service requests
docs: add contributor onboarding instructions
```

---

## 3. Code Style and Linting

### Python

```bash
cd django-backend
black .
ruff check .
pytest
```

### TypeScript / React

```bash
cd soroscan-frontend
pnpm run lint
pnpm test
```

For GraphQL changes:

```bash
pnpm run codegen
```

### Admin

```bash
cd admin
npm run lint
```

### Rust

```bash
cd soroban-contracts/soroscan_core
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

---

## 4. Testing Requirements

| Sub-project                    | Main test command           |
| ------------------------------ | --------------------------- |
| `django-backend`               | `pytest`                    |
| `soroscan-frontend`            | `pnpm test`                 |
| `soroscan-frontend` end-to-end | `pnpm run test:e2e`         |
| `admin`                        | Run relevant package checks |
| `soroban-contracts`            | `cargo test`                |
| `sdk/typescript`               | `pnpm test`                 |
| `sdk/python`                   | `pytest`                    |

New features should include appropriate tests.

Bug fixes should include a regression test where practical.

Documentation-only changes should validate documentation, links, examples, and applicable repository checks.

---

## 📤 Pull Request Submission Guidelines

## 1. Update Your Branch Before Submission

Fetch the latest upstream changes:

```bash
git fetch upstream
```

Make sure you are on your contribution branch:

```bash
git branch --show-current
```

Then rebase on the latest `dev`:

```bash
git rebase upstream/dev
```

If conflicts occur:

1. resolve the conflicting files;
1. stage the resolved files:

```bash
git add <resolved-file>
```

1. continue the rebase:

```bash
git rebase --continue
```

---

## 2. Review Your Changes

Before committing or opening the PR:

```bash
git status
git diff
git diff --check
```

Confirm:

- only files required by the issue were changed;
- no credentials or environment files were added;
- required tests or documentation checks pass;
- the acceptance criteria are satisfied.

---

## 3. Push Your Branch

Push to your fork:

```bash
git push -u origin <branch-name>
```

For later updates:

```bash
git push
```

If you rebased a branch that was already pushed, use:

```bash
git push --force-with-lease origin <branch-name>
```

Use force-with-lease only for your own contribution branch.

---

## 4. Open the Pull Request

Open the PR with:

```text
base: dev
compare: <your-branch>
```

Use a clear Conventional Commit-style title.

Examples:

```text
docs: add contributor onboarding guide
fix(webhooks): handle delivery timeout
feat(graphql): add event filtering
```

---

## 5. Link Issues

Use GitHub closing keywords when the PR fully resolves an issue:

```text
Closes #123
```

If one PR intentionally resolves multiple assigned issues:

```text
Closes #123
Closes #124
Closes #125
```

Only list issues actually resolved by the PR.

---

## 📝 Pull Request Description Template

Use the structure below when appropriate:

````markdown
## Summary

Briefly describe what this PR changes and why.

## Changes

- Change one
- Change two
- Change three

## Testing

Describe how the change was verified.

Commands run:

```bash
<command>
```
````

## Related Issues

Closes #123

## Screenshots

Add screenshots when required by the issue or when they help reviewers verify a UI change.

## Checklist

- [ ] Changes are limited to the assigned issue
- [ ] Relevant tests/checks pass
- [ ] Documentation is updated where required
- [ ] No secrets or environment files are committed
- [ ] Conventional Commit format is used
- [ ] PR targets `dev`

```

---

## 👀 Review Process

After opening the PR:

1. wait for CI checks to complete;
2. respond to reviewer feedback;
3. make requested changes on the same branch;
4. commit and push the updates;
5. allow GitHub to update the existing PR.

Do not open a new PR for each review round.

Accepted contributions are normally merged according to the maintainers' repository workflow.

---

## 🏷️ Issue Labels

| Label | Meaning |
|---|---|
| `good-first-issue` | Simple fix suitable for first-time contributors |
| `bug` | Something is not working as intended |
| `enhancement` | New feature or UX improvement |
| `documentation` | Missing or outdated documentation |
| `priority/high` | Blocker, critical bug, or core-path dependency |
| `help-wanted` | Needs an external contributor with specific skills |
| `needs-info` | Waiting for reproduction details or clarification |
| `wontfix` | Out of scope or duplicate |
| `design` | UI/UX design task or design-system specification |

---

## Security Issues

**Do not open a public issue for security vulnerabilities.**

Use the repository's private GitHub Security reporting features or contact the maintainers directly.

Never publish credentials, private keys, access tokens, webhook secrets, or security-sensitive exploit details in a public issue or pull request.

---

## 🤝 Community & Recognition

When asking for help with a setup problem, include:

- your operating system;
- the command you ran;
- the relevant error output;
- troubleshooting you already attempted.

Never include credentials or other sensitive information in logs posted publicly.

Full contributor documentation is available under [`docs/contributing/`](docs/contributing/).

Thank you for contributing to SoroScan!
```
