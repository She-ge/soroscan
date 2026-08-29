# ADR 0005: Multi-Tenancy Design

## Status
Accepted

## Context
SoroScan is a B2B SaaS platform. Developers sign up, generate API keys, and configure webhooks. We must ensure absolute data isolation—Tenant A must never be able to read, modify, or delete Tenant B's webhooks, API keys, or billing information. We had to choose between physical isolation (database per tenant, schema per tenant) or logical isolation (shared database, row-level separation).

## Decision
We adopted a **Logical Isolation (Row-Level)** approach within a single shared PostgreSQL database.
1. We introduced a central `Tenant` model (often mapped 1:1 with a Django `User` or `Organization`).
2. Every tenant-owned resource (e.g., `WebhookConfig`, `ApiKey`, `BillingProfile`) includes a mandatory `tenant_id` foreign key.
3. We enforce isolation at the application level using Django Rest Framework's `get_queryset()` overrides. For example: `return WebhookConfig.objects.filter(tenant=self.request.user.tenant)`.
4. Global blockchain data (e.g., `EventRecord`) is shared and has no `tenant_id`, as it is public network data available to all users.

## Consequences
**Positive:**
* **Simplicity:** Managing a single database schema is vastly easier for migrations, backups, and local development than managing hundreds of tenant-specific schemas.
* **Resource Efficiency:** Connection pooling works efficiently since all connections hit a single database.
* **Shared Data:** Seamlessly allows all tenants to query the massive, shared `EventRecord` table without duplicating on-chain data per tenant.

**Negative:**
* **Data Leak Risk:** A developer error (e.g., forgetting to apply a `.filter(tenant=...)` in a view) can result in catastrophic data cross-contamination. This necessitates rigorous unit testing and peer review for any endpoint handling tenant data.
* **Noisy Neighbors:** A tenant generating massive query loads can impact the database performance for all other tenants. We must implement rate-limiting at the API gateway layer to mitigate this.
