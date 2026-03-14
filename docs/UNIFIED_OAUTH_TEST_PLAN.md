# Unified OAuth & OIDC — Automated Test Plan

**Version:** 1.0  
**Last Updated:** 2025-03-13  
**Scope:** `/v8u/unified` — Unified OAuth & OIDC flows

## Overview

This plan covers automated tests for the Unified OAuth flow UI, APIs, logging, build, and end-to-end flows. Tests are designed to run in CI and locally without requiring real PingOne credentials where possible.

## Test Categories

| Category | Tool | Location | Purpose |
|----------|------|----------|---------|
| Build & syntax | tsc, biome | package.json | No compile/lint errors |
| Component unit | Vitest + RTL | src/v8u/components/__tests__/ | UI components render and behave correctly |
| Service unit | Vitest | src/v8u/services/__tests__/ | Flow logic, credentials, integration |
| Backend API | Vitest + supertest | tests/backend/ | Token exchange, introspect, userinfo, client-credentials |
| Logging | Vitest | src/v8u/services/__tests__/ | Unified flow logger works |
| E2E (UI) | Playwright | tests/e2e/ | Page load, navigation, flow switching |

---

## 1. Build & Syntax Checks

| Check | Command | Notes |
|-------|---------|------|
| TypeScript | `pnpm run type-check` | No type errors in src |
| Lint | `pnpm run lint` | Biome passes |
| Build | `pnpm run build` | Vite build succeeds |

**Regressions:** Ensure `src/v8u/**` passes tsc; new deps don't break build.

---

## 2. UI Component Tests

**Location:** `src/v8u/components/__tests__/`

| Component | Test focus |
|-----------|------------|
| FlowTypeSelector | Renders flow options per spec version; onChange fires; disabled state |
| CredentialsFormV8U | (Optional) Field visibility per flow; validation messages |
| UnifiedFlowSteps | (Optional) Step count per flow; step labels |

**Mocking:** Router (MemoryRouter), worker token hooks, credentials service.

---

## 3. Service Tests

**Location:** `src/v8u/services/__tests__/`

| Service | Test focus |
|---------|------------|
| unifiedFlowIntegrationV8U | Flow availability, auth URL generation, PKCE params |
| unifiedFlowLoggerServiceV8U | Log levels, sanitization, formatMessage |
| SpecVersionServiceV8 | Flow availability per spec |

Existing: `unifiedFlowIntegrationV8U.integration.test.ts` covers flow switching and auth URL.

---

## 4. Backend API Tests

**Location:** `tests/backend/`

| Endpoint | File | Coverage |
|----------|------|----------|
| POST /api/token-exchange | token-exchange.test.js | Validation, success path (mocked PingOne) |
| POST /api/client-credentials | client-credentials.test.js | Validation, success path |
| POST /api/introspect-token | introspect-token.test.js | Validation, auth methods |
| GET /api/userinfo | userinfo-validation.test.js | Validation, success path |

**Credentials:** See `docs/oauth_needs.md` for test credentials strategy.

---

## 5. Logging Tests

| Check | Description |
|-------|-------------|
| Logger levels | debug, info, warn, error, success respect minimum level |
| Sanitization | clientSecret, privateKey redacted in logs |
| Format | formatMessage includes flow type, spec version, step |
| getLogHistory | Returns recent log entries |
| exportLogs | Returns valid JSON |

---

## 6. E2E (Playwright) Tests

**Location:** `tests/e2e/unified-oauth.spec.ts`

| Scenario | Assertions |
|----------|------------|
| Load /v8u/unified | Page loads; flow type selector visible |
| Navigate to /v8u/unified/oauth-authz/0 | Credentials form visible |
| Switch flow type | Dropdown shows Authorization Code; changing updates UI |
| Navigate to /v8u/unified/implicit/0 | Implicit flow step 0 loads |
| Navigate to /v8u/unified/client-credentials/0 | Client credentials step 0 loads |
| Navigate to /v8u/unified/device-code/0 | Device code step 0 loads |
| Navigate to /v8u/unified/helper | Helper page loads |
| Spec version selector | OAuth 2.0 / 2.1 / OIDC options visible |
| Log viewer | Floating log viewer present (if enabled) |

**Note:** E2E tests do NOT perform real OAuth flows (no login). They validate navigation, UI presence, and basic interactions.

---

## 7. Run Commands

```bash
# All checks
pnpm run type-check
pnpm run lint
pnpm run build

# Unit + integration tests
pnpm run test:run

# Unified OAuth focused tests (custom script)
pnpm run test:unified-oauth

# E2E (requires app running or webServer)
pnpm run test:e2e
```

---

## 8. OAuth Needs (Credentials)

For tests that require real or mock PingOne API calls, see **`docs/oauth_needs.md`**. That document lists:

- API call signatures for token exchange, introspect, userinfo
- Test credential strategy (env vars, mock server, or shared test app)
- Any missing API documentation

Update `oauth_needs.md` with your environment details, then extend tests accordingly.

---

## 9. Regression Checklist

After changes to Unified OAuth:

- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` passes
- [ ] `pnpm run test:run` passes (all Vitest tests)
- [ ] `pnpm run test:e2e` passes (or skip if not running Playwright)
- [ ] Manual: Open `/v8u/unified/oauth-authz/0` → credentials form visible
- [ ] Manual: Run Authorization Code flow with test app → tokens received
