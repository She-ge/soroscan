---
id: security
title: Pre-Deployment Security Checklist
description: Verifiable checklist for production hardening before go-live.
slug: /deployment/security
sidebar_label: Security
hide_title: false
---

Use this checklist before every production deployment. Every item includes what to verify and how to automate it in
CI/CD where possible.

> **Related guides:** `docs/security/index.md` (hardening concepts) · `docs/deployment/kubernetes.md` ·
> `docs/deployment/runbooks.md`

---

## 1. Environment Variable Validation

### What to verify

- Required variables are present: `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `SOROBAN_RPC_URL`,
  `STELLAR_NETWORK_PASSPHRASE`, `ALLOWED_HOSTS`.
- No development defaults leak into production: `DEBUG=False`, no `localhost` URLs, no placeholder secret keys.
- `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` are explicit and minimal.
- `ADMIN_URL_PATH` is set to a non-default path.

### Verification steps

```bash
# Confirm required env vars are set (non-empty) in the running container
kubectl exec -it deploy/soroscan-backend -- \
  python manage.py shell -c "
import os
required = ['SECRET_KEY','DATABASE_URL','REDIS_URL','SOROBAN_RPC_URL',
            'STELLAR_NETWORK_PASSPHRASE','ALLOWED_HOSTS']
missing = [k for k in required if not os.environ.get(k)]
assert not missing, f'Missing env vars: {missing}'
print('All required env vars present.')
"

# Confirm DEBUG is False
kubectl exec -it deploy/soroscan-backend -- \
  python manage.py shell -c "from django.conf import settings; assert not settings.DEBUG, 'DEBUG must be False in production'"
```

### Automation

- Add a `check_env` management command that fails fast on startup if required vars are missing or default values are
  detected.
- Add a CI step that lints `.env.example` for unsafe defaults and rejects `DEBUG=True` in production manifests.
- Use `python-decouple` or `django-environ` `env()` calls with `required=True` for critical settings.

---

## 2. SSL/TLS Configuration

### What to verify

- All public ingress serves HTTPS only — HTTP requests redirect to HTTPS (301).
- TLS certificate is valid, not self-signed, and not expiring within 30 days.
- Backend sets `SECURE_SSL_REDIRECT = True`, `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`.
- HSTS header (`Strict-Transport-Security`) is present with at least `max-age=31536000`.
- No mixed-content (HTTP assets on HTTPS pages).

### Verification steps

```bash
# Check TLS certificate expiry (OpenSSL)
echo | openssl s_client -servername api.soroscan.io -connect api.soroscan.io:443 2>/dev/null \
  | openssl x509 -noout -dates

# Check HTTPS redirect
curl -I http://api.soroscan.io/health/
# Expect: HTTP/1.1 301 Moved Permanently + Location: https://...

# Check HSTS header
curl -sI https://api.soroscan.io/health/ | grep -i strict-transport
```

### Automation

- Configure certificate expiration alerts in Prometheus Alertmanager (use `ssl_expiry_days` from `blackbox_exporter`).
- Add a synthetic probe in CI that asserts HTTPS redirect and valid TLS.
- Use cert-manager in Kubernetes for automatic certificate rotation.

---

## 3. Authentication Settings

### What to verify

- All protected endpoints require a valid JWT Bearer token or API key.
- JWT `ACCESS_TOKEN_LIFETIME` is ≤ 15 minutes in production (`SIMPLE_JWT` settings).
- `SIGNING_KEY` (`SECRET_KEY`) is a cryptographically random 50+ character string — not the Django default.
- No default admin credentials exist (`python manage.py check --deploy` reports no warnings).
- API key authentication uses `soroscan.authentication.APIKeyAuthentication` — keys are hashed at rest.

### Verification steps

```bash
# Confirm unauthenticated access is rejected on a protected endpoint
curl -o /dev/null -w "%{http_code}" https://api.soroscan.io/api/ingest/contracts/
# Expect: 401

# Run Django deployment check
kubectl exec -it deploy/soroscan-backend -- python manage.py check --deploy
# Expect: System check identified no issues (0 silenced).

# Verify token lifetime from settings
kubectl exec -it deploy/soroscan-backend -- \
  python manage.py shell -c "
from django.conf import settings
lt = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
assert lt.total_seconds() <= 900, f'Access token lifetime too long: {lt}'
print(f'Token lifetime OK: {lt}')
"
```

### Automation

- Run `python manage.py check --deploy` in the CI pipeline and fail the build on any warning.
- Add integration tests for each auth path (no token, expired token, valid token, wrong scope).

---

## 4. Authorization Rules

### What to verify

- Users cannot access contracts or events belonging to other teams/tenants.
- Admin-only endpoints (`/api/admin/`, `/api/meta/db-pool/`, `/api/ingest/admin/`) return 403 for non-staff users.
- Read-only users (no write permissions) receive 403 or 405 on mutation endpoints.
- `ADMIN_URL_PATH` is not the default `admin/`.

### Verification steps

```bash
# Confirm non-staff user cannot access staff endpoint
curl -w "%{http_code}" \
  -H "Authorization: Bearer <non_staff_token>" \
  https://api.soroscan.io/api/meta/db-pool/
# Expect: 403

# Confirm cross-tenant isolation — user A cannot read user B's contract
curl -w "%{http_code}" \
  -H "Authorization: Bearer <user_a_token>" \
  https://api.soroscan.io/api/ingest/contracts/<user_b_contract_id>/
# Expect: 404 (object not found, not leaked as 403)
```

### Automation

- Add permission-focused integration tests for each sensitive endpoint covering: anonymous, non-owner authenticated,
  owner authenticated, and staff roles.
- Run these as part of the regression suite on every PR.

---

## 5. Database Encryption

### What to verify

- Database storage encryption at rest is enabled (AWS RDS: `StorageEncrypted=true`; GCP CloudSQL: CMEK enabled).
- `DATABASE_URL` uses `sslmode=require` or `sslmode=verify-full`.
- Backups are encrypted with the same key policy and retention is ≥ 30 days.

### Verification steps

```bash
# Confirm sslmode in the database URL
kubectl exec -it deploy/soroscan-backend -- \
  python manage.py shell -c "
from django.conf import settings
db_url = settings.DATABASES['default'].get('OPTIONS', {})
print('DB OPTIONS:', db_url)
"

# For AWS RDS — check encryption via AWS CLI
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,StorageEncrypted]'
```

### Automation

- Add a startup assertion that `DATABASE_URL` contains `sslmode=require` when `DEBUG=False`.
- Add a periodic control (CloudWatch / Prometheus alert) that monitors backup encryption status.

---

## 6. Secrets Management

### What to verify

- All secrets are stored in a secrets manager (AWS Secrets Manager, HashiCorp Vault, Kubernetes Sealed Secrets) — not in
  plain text in ConfigMaps, Dockerfiles, or source control.
- No secrets appear in container environment variables in plain text in the Kubernetes manifest — use `secretKeyRef`.
- A rotation runbook exists for: `SECRET_KEY`, `DATABASE_URL` credentials, `INDEXER_SECRET_KEY`, API key signing
  material.
- Git history does not contain leaked secrets (scan with `trufflehog` or `gitleaks`).

### Verification steps

```bash
# Scan repo for secrets
docker run --rm -v $(pwd):/repo trufflesecurity/trufflehog:latest filesystem /repo

# Confirm no plain-text secrets in K8s manifests
grep -rn "SECRET_KEY\|password\|token" k8s/ | grep -v 'secretKeyRef\|#'
```

### Automation

- Add `trufflehog` or `gitleaks` as a pre-commit hook and CI gate.
- Use Kubernetes External Secrets Operator to sync secrets from AWS Secrets Manager.
- Set secret rotation reminders in your on-call runbook.

---

## 7. Rate Limiting and Abuse Controls

### What to verify

- `DEFAULT_THROTTLE_CLASSES` includes `DynamicEndpointThrottle`, `APIKeyThrottle`, `AnonRateThrottle`, and
  `UserRateThrottle`.
- Every API response includes `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers.
- `RATE_LIMIT_ANON` is set to a conservative value (default: `60/minute`).
- WAF and DDoS protection (AWS Shield, Cloudflare) are enabled at the edge.
- Sustained `429` spikes trigger an alert.

### Verification steps

```bash
# Confirm rate limit headers are present on a public endpoint
curl -sI https://api.soroscan.io/api/ingest/networks/ | grep -i ratelimit

# Confirm 429 is returned after exhausting the anonymous quota (run in a loop)
for i in $(seq 1 70); do
  code=$(curl -s -o /dev/null -w "%{http_code}" https://api.soroscan.io/api/ingest/networks/)
  echo "$i: $code"
done
# Expect: first 60 return 200, subsequent return 429
```

### Automation

- Add smoke tests to CI that assert `RateLimit-*` headers are present on all API responses.
- Add Prometheus alerting rule on `rate(soroscan_http_responses_total{status_class="4xx"}[5m]) > threshold`.

---

## 8. Final Pre-Go-Live Gate

Before deploying to production, require sign-off from:

| Role              | Responsibility                          |
| ----------------- | --------------------------------------- |
| Platform owner    | Infrastructure, networking, TLS, WAF    |
| Security owner    | Secrets, credentials, controls          |
| Application owner | Auth/authz, API behavior, rate limiting |

**Release gate output:**

```
Checklist status: PASS / FAIL by section
Evidence links:
  - CI run: https://github.com/SoroScan/soroscan/actions/runs/<id>
  - Secret scan: <scan report URL>
  - Load test report: <report URL>
Exception log:
  - <Item>: <Approved waiver> | Expires: <date>
```

> **Linked from:** `docs/deployment/README.md` · `docs/security/index.md`
