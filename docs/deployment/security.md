---
id: deployment/security
title: Pre-Deployment Security Checklist
description: Verifiable checklist for production hardening before go-live.
slug: /deployment/security

title: Security Checklist
description: Network policies, secrets, TLS, and hardening recommendations for production.
sidebar_label: Security
hide_title: false
---

Use this checklist before every production deployment. Every item includes what to verify and how to automate it in CI/CD where possible.

## 1) Environment variable validation

### What to verify
- Required values are present: `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `SOROBAN_RPC_URL`, `STELLAR_NETWORK_PASSPHRASE`, `ALLOWED_HOSTS`.
- No development defaults are used in production (for example `DEBUG=True`, test keys, localhost URLs).
- Allowed origins and hosts are explicit and minimal.

### Automation
- Add a startup or pre-deploy validation command that fails fast if required env vars are missing.
- Add CI checks that reject unsafe production values.

## 2) SSL/TLS configuration

### What to verify
- Public ingress only serves HTTPS.
- TLS certificates are valid and auto-rotated.
- Backend enforces secure cookies and HTTPS redirects.

### Automation
- Include TLS checks in synthetic probes.
- Add certificate expiration alerts.

## 3) Authentication settings

### What to verify
- All protected endpoints require valid API key or JWT authentication.
- Token lifetimes and signing algorithms match policy.
- Default admin credentials do not exist.

### Automation
- Run integration tests for unauthenticated and authenticated access paths.
- Enforce password and token policy checks in CI.

## 4) Authorization rules

### What to verify
- Users cannot access resources from other teams/tenants.
- Admin-only endpoints are restricted and audited.
- Read-only users cannot perform write operations.

### Automation
- Add permission-focused integration tests for each sensitive endpoint.
- Include regression tests for role and tenant boundaries.

## 5) Database encryption

### What to verify
- Database storage encryption at rest is enabled.
- TLS is enabled for database connections in production.
- Backups are encrypted and retention matches policy.

### Automation
- Validate DB connection options at startup.
- Add a periodic control to verify backup encryption and retention policy.

## 6) Secrets management

### What to verify
- Secrets are stored in a secrets manager or sealed secret workflow.
- No plaintext credentials in repository, images, or config maps.
- Rotation runbook exists for API keys, database credentials, and signing keys.

### Automation
- Use secret scanners in CI (commit and PR checks).
- Enforce automatic secret rotation where supported by your platform.

## 7) Rate limiting and abuse controls

### What to verify
- Public and authenticated throttles are enabled.
- API responses include `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`.
- WAF and DDoS protections are enabled at the edge.

### Automation
- Add smoke tests that assert throttle behavior and response headers.
- Alert on sustained 429 spikes and abusive source patterns.

## 8) Final pre-go-live gate

Before deployment, require sign-off from:
- Platform owner (infrastructure and networking)
- Security owner (controls and secrets)
- Application owner (authn/authz and API behavior)

Recommended release gate output:
- Checklist status: pass/fail by section
- Evidence links: CI runs, scanner reports, and probe dashboards
- Exception log: approved temporary waivers with expiry dates
