# Unified OAuth Automated Test — API & Credential Needs

**Purpose:** This document captures what we need from you to complete end-to-end automated testing of the Unified OAuth flow (`/v8u/unified`). Fill in the sections below and we can continue implementation.

---

## 1. Test Credentials (for live API tests)

For tests that call real PingOne APIs, we need a test application and environment.

| Field | Your value | Notes |
|-------|------------|-------|
| **Environment ID** | | PingOne environment (e.g. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) |
| **Client ID** | | OAuth app client ID |
| **Client Secret** | | For confidential clients (auth code, client credentials). Store in `.env.test` or env vars, never commit |
| **Redirect URI** | | Must match app config (e.g. `http://localhost:3000/oauth-authz-callback`) |
| **User credentials** (optional) | | Username/password for login flows (Authorization Code, Implicit, Hybrid) — only if testing full login |

**Preference:** Prefer a separate test environment and app for automation. Use a short-lived token or test user if possible.

---

## 2. Backend API Endpoints Used by Unified OAuth

Confirm these endpoints and any additional ones we should test:

| Endpoint | Method | Used by | Parameters |
|----------|---------|---------|------------|
| `/api/token-exchange` | POST | Auth Code, Refresh, Token Exchange | `grant_type`, `client_id`, `code`/`refresh_token`/`subject_token`, `redirect_uri`, `environment_id`, `client_secret` (for confidential) |
| `/api/introspect-token` | POST | Token Introspection step | `token`, `client_id`, `introspection_endpoint`, `client_secret`, `token_type_hint` |
| `/api/userinfo` | GET | UserInfo step | `access_token`, `environment_id` (query params) |
| `/api/client-credentials` | POST | Client Credentials flow | `environment_id`, `auth_method`, `body` (grant_type, client_id, client_secret, scope) |
| OIDC Discovery | Direct to PingOne | Credential config | `https://auth.pingone.com/{envId}/.well-known/openid-configuration` |

**Questions:**
- Are there other backend endpoints the Unified flow calls that we should cover?
- Is `/api/device-authorization` or similar used for Device Code flow? (If yes, add URL and params.)

---

## 3. PingOne Direct API Calls (no proxy)

The frontend or backend may call PingOne directly. Please confirm:

| Call | When | URL pattern |
|------|------|-------------|
| Token endpoint | Token exchange | `https://auth.pingone.com/{envId}/as/token` |
| UserInfo | After token | `https://auth.pingone.com/{envId}/as/userinfo` |
| Introspection | If custom | `{issuer}/as/introspect` |
| Device auth | Device Code flow | `{issuer}/as/device/auth` |
| OIDC Discovery | Config load | `https://auth.pingone.com/{envId}/.well-known/openid-configuration` |

**Question:** Are all token/auth calls proxied through our backend, or does the frontend ever call PingOne directly? (Affects how we mock for tests.)

---

## 4. Logging & Observability

| Item | Location | What to verify |
|------|----------|----------------|
| Unified Flow Logger | `unifiedFlowLoggerServiceV8U` | Logs flow type, step, credentials (sanitized), errors |
| Floating Log Viewer | `EnhancedFloatingLogViewer` | Displays API calls, tokens (truncated), errors |
| Backend logs | `pingone-api.log` | Token exchange, introspection, userinfo calls |

**Question:** Are there specific log entries or formats we must assert in tests (e.g. for compliance or debugging)?

---

## 5. Error Scenarios to Test

| Scenario | How to simulate | Expected behavior |
|----------|-----------------|-------------------|
| Invalid client credentials | Wrong secret | 401, clear error message |
| Invalid/expired code | Reused auth code | 400, "code already used" or similar |
| Missing redirect_uri | Omit in request | 400, validation error |
| Invalid scope | Unknown scope in request | PingOne error forwarded |
| Network timeout | Mock slow/failed fetch | Retry or clear error message |
| CORS / backend down | Backend not running | User sees backend unavailable message |

**Please add:** Any other error cases that are important for your users.

---

## 6. UI Elements & Selectors

For Playwright E2E tests, we need stable selectors. Current approach: use text content and ARIA roles.

**Please confirm or add `data-testid`** for these if you want stronger selectors:

| Element | Suggested `data-testid` | Current fallback |
|---------|------------------------|------------------|
| Flow Type dropdown | `flow-type-select` | `[aria-label="Flow Type"]` or label text |
| Spec Version dropdown | `spec-version-select` | Label "Spec Version" |
| Environment ID input | `environment-id-input` | Input by placeholder/label |
| Client ID input | `client-id-input` | Input by placeholder/label |
| Generate Auth URL button | `generate-auth-url-btn` | Button text "Generate Authorization URL" |
| Next Step / Previous Step | `step-next`, `step-prev` | Button text |

---

## 7. Test Environment Setup

| Requirement | Your setup |
|-------------|------------|
| Base URL for E2E | `http://localhost:3000` (default) |
| Backend port | `3001` |
| Environment file for secrets | `.env.test` or `TEST_*` env vars? |
| Run backend before E2E? | Yes — Playwright `webServer` starts full stack |

---

## 8. Checklist — What We Need From You

- [ ] Test Environment ID
- [ ] Test Client ID (and Secret if confidential)
- [ ] Redirect URI for test app
- [ ] Confirmation of backend endpoints (Section 2)
- [ ] Confirmation of direct vs proxied PingOne calls (Section 3)
- [ ] Any additional error scenarios (Section 5)
- [ ] Optional: `data-testid` values for key UI elements (Section 6)
- [ ] Optional: User credentials for full login flow tests

---

## 9. Known Issues / Blockers

| Issue | Location | Impact |
|-------|----------|--------|
| **effectiveFlowType used before init** | `UnifiedOAuthFlowV8U.tsx` ~line 539 | `usePersistedCollapse(effectiveFlowType, ...)` is called before `effectiveFlowType` is defined (useMemo at line 939). Blocks full component smoke tests in jsdom. E2E (Playwright) works because the real app loads correctly at runtime. |

---

**Next steps after you update this doc:**
1. Add live API integration tests using your credentials (in CI, use env vars)
2. Extend E2E tests for full flow with real login (if credentials provided)
3. Add backend API tests for any missing endpoints
4. Add logging assertion tests if required
