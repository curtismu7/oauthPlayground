# Unified MFA — Automated Test Plan

**Version:** 1.0  
**Last Updated:** 2026-03-13  
**Scope:** `/v8/mfa*`, Unified MFA flows, MFA hub, registration & authentication

## Overview

This plan covers automated tests for the Unified MFA (Multi-Factor Authentication) flow UI, services, hooks, and related APIs. Tests are designed to run in CI and locally. Real PingOne MFA (policies, devices, authentication) may be required for integration tests; unit tests use mocks where possible.

**Related docs:** `project/inventory/UNIFIED_MFA_INVENTORY.md` (primary reference), `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` (regression checklist).

## Test Categories

| Category | Tool | Location | Purpose |
|----------|------|----------|---------|
| Build & syntax | tsc, biome | package.json | No compile/lint errors |
| Service unit | Vitest | src/v8/services/__tests__/, src/v8/hooks/__tests__/, src/v8/utils/ | MFA services, hooks, utils |
| Component / UI | Vitest + RTL | src/v8/components/__tests__/, src/v8/services/__tests__/ | Success page, education demo |
| Backend API | Vitest / manual | server.js, tests/ | MFA-related endpoints (if any) |
| E2E (UI) | Playwright | tests/e2e/ | Page load, navigation (optional) |

---

## 1. Build & Syntax Checks

| Check | Command | Notes |
|-------|---------|------|
| TypeScript | `pnpm run type-check` | No type errors in src (includes src/v8/**) |
| Lint | `pnpm run lint` | Biome passes |
| Build | `pnpm run build` | Vite build succeeds |

**Regressions:** Ensure `src/v8/flows/`, `src/v8/services/`, `src/v8/hooks/` (MFA-related) pass tsc.

---

## 2. MFA Service & Hook Tests

**Locations:**

- `src/v8/services/__tests__/`
- `src/v8/hooks/__tests__/`
- `src/v8/utils/` (e.g. mfaNextStepNormalizer)

| Test file | Focus |
|-----------|--------|
| mfaTokenManagerV8.test.ts | Token handling for MFA flows |
| mfaFeatureFlagsV8.test.ts | Feature flags for MFA |
| mfaCredentialManagerV8.test.ts | Credential handling |
| unifiedMFASuccessPageServiceV8.test.tsx | Success page validation, insights, props |
| useMFAPolicies.test.ts | useMFAPolicies hook (policies load, selection) |
| useMFADevices.test.ts | useMFADevices hook (devices load, selection) |
| useMFAAuthentication.test.ts | useMFAAuthentication hook (auth flow) |
| mfaNextStepNormalizer.test.ts | Next-step normalization for MFA flows |

**Note:** Some tests may use Jest-style mocks (`jest.mock`); the project uses Vitest — ensure compatibility or migrate to `vi.mock`. As of 2026-03, `useMFAPolicies.test.ts` and `unifiedMFASuccessPageServiceV8.test.tsx` may need mock migration; one `mfaCredentialManagerV8` validation test may need assertion update (expected error count).

---

## 3. Component / UI Tests

| Component / area | Test focus |
|------------------|-------------|
| UnifiedMFASuccessPageServiceV8 (unifiedMFASuccessPageServiceV8.test.tsx) | Success page data, validation insights, device/policy display |
| MFAEducationDemo | (If tested) Education content, step display |

**Mocking:** Worker token hooks, credentials service, logger, API display service.

---

## 4. Backend API (MFA-related)

| Area | Notes |
|------|--------|
| MFA callback / resume | Callbacks at `/mfa-unified-callback`, `/mfa-hub-callback` — typically exercised via E2E or manual flow |
| Password reset / MFA | See `tests/backend/password-reset.test.js` if it covers MFA-related endpoints |
| Server MFA routes | `server.js` — document any dedicated MFA API routes here as they are added |

**Credentials:** Real PingOne environment with MFA policies and devices for full integration; see `project/inventory/UNIFIED_MFA_INVENTORY.md` for prevention commands and env notes.

---

## 5. Key Routes & Pages (Manual / E2E)

| Route | Purpose |
|-------|---------|
| /v8/mfa-config | MFA configuration page |
| /v8/mfa-feature-flags | MFA feature flags admin |
| /v8/mfa-device-management | Device management flow |
| /v8/mfa-device-ordering | Device ordering flow |
| /v8/mfa-reporting | MFA reporting |
| /v8/mfa/register/totp/device | TOTP registration |
| /v8/mfa/register/fido2 | FIDO2 registration |
| /v8/mfa/register/sms | SMS registration |
| /v8/mfa/register/mobile | Mobile OTP registration |
| /v8/mfa/create-device | Create device demo |
| /flows/mfa-v8 | Legacy MFA flow entry |
| /mfa-unified-callback | Unified MFA callback |
| /mfa-hub-callback | MFA hub callback |

---

## 6. Run Commands

```bash
# All checks
pnpm run type-check
pnpm run lint
pnpm run build

# All Vitest tests (includes MFA tests)
pnpm run test:run

# MFA-focused tests (custom script)
pnpm run test:unified-mfa
```

---

## 7. Regression Checklist

After changes to Unified MFA (flows, services, hooks, callbacks):

- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` passes
- [ ] MFA-related Vitest tests pass (run the command in §6 or `pnpm run test:run` and confirm no MFA regressions)
- [ ] Run prevention commands from `project/inventory/UNIFIED_MFA_INVENTORY.md` § “Quick Prevention Commands” where applicable
- [ ] Manual: Open `/v8/mfa-config` (or main MFA entry) → config/flow loads
- [ ] Manual: Complete one MFA registration flow with test user (if PingOne env available)

---

## 8. Future Additions

| Item | Notes |
|------|--------|
| E2E spec for MFA | Add `tests/e2e/unified-mfa.spec.ts` for navigation and key routes (similar to unified-oauth.spec.ts) |
| test:unified-mfa script | ✅ Added to package.json |
| Backend MFA API tests | Add tests under tests/backend/ for any dedicated MFA API endpoints |
| Jest → Vitest | Migrate any MFA tests still using Jest APIs to Vitest (vi.mock, describe/it from vitest) |
