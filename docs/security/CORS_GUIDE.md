# Configuring CORS Origins per Organization

SoroScan supports multi-tenancy and allows organization administrators to specify allowed Cross-Origin Resource Sharing (CORS) origins for browser-based API accesses. This lets third-party web interfaces safely query the SoroScan API from their own domains.

---

## How CORS Works in SoroScan

SoroScan handles CORS in a two-stage middleware pipeline:
1. **Global CORS Rules (`django-cors-headers`)**: Checked first. If the incoming request matches settings like `CORS_ALLOWED_ORIGINS` or `CORS_ALLOW_ALL_ORIGINS` in `settings.py`, it is allowed.
2. **Organization CORS Rules (`OrgCorsMiddleware`)**: Checked second. If the request is not matched by the global rules, SoroScan checks if the incoming `Origin` matches any entry in the whitelists of registered Organizations.

### Key Matching Rules & Restrictions
* **Exact Matching**: Per-organization origins must match exactly.
* **No Wildcards**: SoroScan's per-organization CORS dictionary lookup does **not** support wildcard or pattern matching (e.g., `*.example.com`). All subdomains must be listed individually.
* **No Trailing Slash**: All entries in the configuration must not contain a trailing slash (e.g. use `https://app.example.com` instead of `https://app.example.com/`). Trailing slashes are stripped during API validation.
* **Protocol Required**: Entries must begin with `http://` or `https://`.
* **Caching**: Organization CORS origins are cached in memory for **60 seconds** (`ORG_CORS_CACHE_TTL`). Updates can take up to one minute to propagate to active backend workers.

---

## Step-by-Step Configuration Guide

### Option 1: Configuring via Django Admin (For Staff/Superusers)

1. Log in to the **Django Admin Portal** (typically at `http://localhost:8000/admin/` or your production admin domain).
2. Under the **Ingest** section, click on **Organizations**.
3. Select the target Organization to edit.
4. Locate the **CORS Configuration** fieldset.
5. In the **Cors origins** text field, input a JSON-formatted list of strings:
   ```json
   [
     "https://app.example.com",
     "https://staging.example.com"
   ]
   ```
6. Click **Save**. Django Admin validates the entries and will strip trailing slashes or emit a warning if any entry is missing the protocol.

---

### Option 2: Configuring via REST API (For Members & Developers)

Organization owners and admins can configure CORS settings programmatically via SoroScan's REST API.

#### 1. Fetch Current CORS Settings
* **Endpoint**: `GET /api/organizations/<org_id>/cors/`
* **Headers**: `Authorization: Bearer <your_token>`
* **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "name": "My Organization",
    "cors_origins": [
      "https://app.example.com"
    ]
  }
  ```

#### 2. Update CORS Settings
* **Endpoint**: `PATCH /api/organizations/<org_id>/cors/`
* **Headers**: 
  * `Authorization: Bearer <your_token>`
  * `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "cors_origins": [
      "https://app.example.com",
      "https://dashboard.example.com"
    ]
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "name": "My Organization",
    "cors_origins": [
      "https://app.example.com",
      "https://dashboard.example.com"
    ]
  }
  ```

*Note: The PATCH method replaces the entire list of origins. Only users with the `owner` or `admin` role in the organization can invoke this endpoint.*

---

## Security Implications Overview

1. **Origin Spoofing & Credential Access**: If `CORS_ALLOW_CREDENTIALS` is enabled in `settings.py`, allowing an untrusted origin could expose user sessions or cookies. Keep CORS whitelists audited and restricted to domains you fully control.
2. **Wildcard Pitfalls**: While global settings allow wildcards, the per-org restriction to exact matching prevents admins from inadvertently exposing subdomains they do not control.
3. **HTTP vs. HTTPS**: Avoid whitelisting `http://` origins in production as they are vulnerable to MITM (Man-in-the-Middle) attacks that can hijack API sessions.
4. **Vary Headers**: SoroScan injects `Vary: Origin` headers for per-org matched requests to ensure downstream CDNs and browser caches do not accidentally serve CORS headers meant for a different domain.
