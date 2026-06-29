---
slug: /contributing/style-guide

title: Code Style Guidelines
description: Coding standards, formatting guidelines, and linting rules for SoroScan's backend, frontend, contracts, and SDKs.
sidebar_label: Style Guide
hide_title: false
---

# Code Style Guidelines

SoroScan is a multi-language project (Python, TypeScript, Rust, CSS, SQL). To keep our codebase clean, maintainable, and readable, all contributors must adhere to the style guidelines detailed below.

---

## 1. Python Style Guidelines (Backend & SDK)

SoroScan's backend is built using Django and Python 3.12+.

### 1.1 Formatting & Linting
- **Formatter**: We use [black](https://github.com/psf/black) with default settings (88 characters line limit).
- **Linter**: We use [ruff](https://github.com/astral-sh/ruff) for linting and import sorting.
- Run checks before committing:
  ```bash
  cd django-backend
  black --check .
  ruff check .
  ```

### 1.2 Type Hints
- **All new code must contain explicit type hints** for function signatures and class definitions.
- Use built-in types for collections (e.g., `list[str]`, `dict[str, int]`) rather than imports from `typing` where possible.
- Example:
  ```python
  def fetch_contract_events(
      contract_id: str, 
      limit: int = 100, 
      offset: int = 0
  ) -> list[dict[str, any]]:
      """Fetches events for a given contract ID with pagination."""
      ...
  ```

### 1.3 Best Practices
- **Explicit Imports**: Do not use wildcard imports (`from module import *`).
- **Docstrings**: Include Google-style docstrings for public classes, methods, and functions.
- **Django ORM**: Use `select_related` and `prefetch_related` to avoid N+1 queries.

---

## 2. TypeScript / JavaScript Style Guidelines (Frontend & SDK)

SoroScan's frontend is a Next.js application, and we maintain a TypeScript SDK.

### 2.1 Formatting & Linting
- **Formatter**: We use [Prettier](https://prettier.io/) for layout style.
- **Linter**: We use [ESLint](https://eslint.org/) configured with Next.js standards.
- Run checks before committing:
  ```bash
  cd soroscan-frontend
  pnpm lint
  ```

### 2.2 TypeScript Typing Rules
- **Avoid `any`**: The use of `any` is strictly prohibited unless parsing raw blockchain payloads. Use `unknown` or define interface types/discriminated unions instead.
- **Strict Null Checks**: Explicitly handle `null` or `undefined` conditions using optional chaining (`?.`) or nullish coalescing (`??`).
- Example:
  ```typescript
  interface EventRowProps {
    eventId: string;
    contractAddress: string;
    timestamp: number;
    payload?: string; // Optional field
  }

  export const EventRow = ({ eventId, contractAddress, timestamp, payload }: EventRowProps): JSX.Element => {
    const displayPayload = payload ?? 'No details provided';
    return (
      <div className="flex justify-between items-center py-2">
        <span>{eventId}</span>
        <span>{displayPayload}</span>
      </div>
    );
  };
  ```

---

## 3. Rust Style Guidelines (Smart Contracts)

SoroScan's blockchain components are written in Rust for Soroban event emission.

### 3.1 Formatting & Linting
- **Formatter**: We use standard `rustfmt`. Run `cargo fmt` to auto-format.
- **Linter**: We use `clippy`. All warnings must be resolved before merging.
- Run checks before committing:
  ```bash
  cd soroban-contracts/soroscan_core
  cargo fmt --check
  cargo clippy -- -D warnings
  ```

### 3.2 Best Practices
- **Error Handling**: Do not use `unwrap()` or `expect()` in library/contract code. Propagate errors via `Result<T, E>`.
- **Panics**: Smart contracts should fail safely and emit diagnostic events rather than panicking, which consumes gas.
- **Safety**: Mark unsafe operations explicitly and include comments explaining the invariant validation.

---

## 4. CSS & Tailwind Class Organization

SoroScan utilizes Tailwind CSS for styling the React interface.

### 4.1 Tailwind Class Sorting
- **Ordering**: Organize classes logically by layout first, then sizing, spacing, typography, and finally effects/states.
  1. **Layout**: `position`, `display`, `flex/grid properties` (e.g., `absolute top-0 flex items-center`)
  2. **Box Model**: `width`, `height`, `margin`, `padding` (e.g., `w-full max-w-md mx-auto p-4`)
  3. **Typography**: `font-family`, `size`, `weight`, `color` (e.g., `font-mono text-sm font-semibold text-emerald-400`)
  4. **Visuals**: `background`, `border`, `rounded` (e.g., `bg-zinc-900 border border-zinc-800 rounded-lg`)
  5. **States & Transitions**: `hover`, `focus`, `transition` (e.g., `hover:bg-zinc-800 transition duration-150`)

#### Clean Code Example:
```tsx
// Correct
<button className="flex items-center w-full p-3 font-mono text-sm bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition duration-150">
  Refresh Ledger
</button>
```

### 4.2 Tailwind Limits
- Avoid creating custom CSS files for simple layouts.
- If you need a complex animation or custom style that cannot be cleanly written in Tailwind, add it to `soroscan-docs/src/css/custom.css` (or `soroscan-frontend/app/globals.css`) using CSS variables.

---

## 5. SQL Style Guidelines

SQL script templates and raw queries in Django (`cursor.execute()`) must follow these standards.

### 5.1 Formatting Conventions
- **Keywords**: Write SQL keywords in UPPERCASE (e.g., `SELECT`, `FROM`, `WHERE`, `JOIN`, `ON`, `GROUP BY`, `ORDER BY`).
- **Identifiers**: Write table names, column names, and schemas in lowercase snake_case (e.g., `ingest_event`, `contract_id`).
- **Indentation**: Format multi-line queries for readability.
- **Parameterized Queries**: Never concatenate inputs directly into raw SQL. Always use query parameters to prevent SQL injection.

#### Good SQL Example:
```sql
SELECT 
  event_type, 
  COUNT(id) AS event_count 
FROM 
  ingest_event 
WHERE 
  contract_id = %s 
  AND status = 'SUCCESS' 
GROUP BY 
  event_type 
ORDER BY 
  event_count DESC;
```
