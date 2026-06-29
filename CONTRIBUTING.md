# Contributing to SoroScan 🔍

Thank you for investing your time in contributing to SoroScan!

SoroScan is an open-source indexing layer designed to make Soroban smart contract data accessible and queryable. Whether you're fixing a bug, improving documentation, or building a new feature, we welcome your involvement.

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

## 🛠️ Overview of Our Development Workflow

For a quick reference, here are the core expectations for contributing:

### 1. Claiming an Issue
Before writing any code, find an issue in the **Issues** tab.
- Filter by `good-first-issue` if you are new.
- Comment **"I'd like to work on this!"** on the issue thread.
- Wait until a maintainer assigns the issue to you before starting work.

### 2. Branching & Commits
- Base your work on the `develop` branch.
- Use **Conventional Commits** for commit messages (e.g. `feat(ingest): add contract event parsing`, `fix(admin): repair network error handling`).

### 3. Running Code Validation
Before staging your commits, run the formatters and tests:

#### Python / Django:
```bash
cd django-backend
black .
ruff check .
pytest
```

#### TypeScript / Next.js:
```bash
cd soroscan-frontend
pnpm install
pnpm lint
pnpm test
```

#### Rust / Soroban:
```bash
cd soroban-contracts/soroscan_core
cargo fmt
cargo clippy -- -D warnings
cargo test
```

### 4. Submitting a Pull Request
- Open your PR against the `develop` branch of the upstream repository.
- Complete the PR description template.
- Ensure all CI workflows pass.
- Address code review comments constructively. Once resolved, the reviewer will approve the PR, and it will be merged via **Squash & Merge**.

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct to ensure SoroScan remains a respectful, safe, and supportive space for everyone. See the [Community Standards Guide](docs/contributing/community-standards.md) for details.
