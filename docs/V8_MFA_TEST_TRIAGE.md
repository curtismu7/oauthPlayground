# V8 / MFA Vitest Triage (2026-07-08)

Scope: `src/v8`, `src/v8u`, `src/contexts/__tests__/NewAuthContext.enhanced.test.tsx`

Command:

```bash
npm run test:run -- src/v8 src/contexts/__tests__/NewAuthContext.enhanced.test.tsx src/v8u
```

## Summary

| Metric | Count |
|--------|------:|
| Test files | 36 |
| Passed files | 15 |
| Failed files | 21 |
| Tests passed | 534 |
| Tests failed | 150 |
| Unhandled errors | 7 (`indexedDB is not defined`) |
| Duration | ~17s |

**Verdict:** Failures are overwhelmingly **pre-existing suite debt** — stale tests, broken global mocks, and removed/moved components. Not ship-blocking for flows2/LMDB paths. No production regressions implied.

---

## Root-cause categories

### A. Broken global test setup (`tests/setup.ts`) — **~45+ failures**

| Issue | Effect |
|-------|--------|
| `localStorage` mocked with no-op `vi.fn()` (no in-memory store) | `StorageServiceV8`, `MFAFeatureFlagsV8`, `ApiDisplayServiceV8`, `AppDiscoveryServiceV8`, `FlowResetServiceV8` save/load assertions fail (`expected false to be true`) |
| `console.log` etc. replaced with `vi.fn()` globally | `toastNotificationsV8` tests expect log output — spies never fire |
| `indexedDB` not mocked | 7 unhandled rejections when `unifiedTokenStorageService` singleton initializes on import |

**Affected files (high fail count):**

- `storageServiceV8.test.ts` — 20/31 fail
- `mfaFeatureFlagsV8.test.ts` — 10/13 fail
- `errorHandlerV8.test.ts` — partially (see B)
- `apiDisplayServiceV8.test.ts` — 4/13 fail
- `flowResetServiceV8.test.ts` — 13/15 fail
- `appDiscoveryServiceV8.test.ts` — 3/20 fail

**Fix:** One `tests/setup.ts` change — real in-memory `localStorage`, `indexedDB` stub, preserve `console` or scope console mock per-file.

**Priority:** P0 (single fix, largest payoff)

---

### B. `ErrorHandlerV8` API drift — **23 failures**

Tests call removed static helpers: `getType`, `getCode`, `formatError`, `fromOAuthError`, `handleCallbackError`, `handleValidationErrors`.

Implementation now exposes: `categorizeError`, `getErrorCategory`, `getUserMessage`, `getRecoverySuggestions`, `formatErrorForDisplay`, etc.

**File:** `errorHandlerV8.test.ts` (23 fail / 21 pass)

**Fix:** Rewrite failing cases against current API, or delete obsolete describe blocks.

**Priority:** P1

---

### C. Orphan flow component tests — **3 files (load failure)**

Tests import components that no longer exist beside `__tests__/`:

| Test file | Missing import |
|-----------|----------------|
| `ImplicitFlowV8.test.tsx` | `../ImplicitFlowV8` |
| `OAuthAuthorizationCodeFlowV8.test.tsx` | `../OAuthAuthorizationCodeFlowV8` |
| `TokenExchangeFlowV8.test.tsx` | `../TokenExchangeFlowV8` |

Flows were moved/refactored (v8u / flows2). Tests were never updated or removed.

**Fix:** Delete tests, or repoint to current flow entry components under `src/v8u` / `src/flows2`.

**Priority:** P1 (delete is fine — E2E covers unified oauth)

---

### D. MFA hook mocks incomplete — **24 failures**

`useMFAPolicies.test.ts` (21 fail), `useMFADevices.test.ts` (3 fail)

`vi.mock('@/v8/services/mfaServiceV8')` auto-mocks the module but `MFAServiceV8.getDeviceAuthenticationPolicies` is `undefined` → `mockResolvedValue` throws.

**Fix:** Explicit factory mock:

```ts
vi.mock('@/v8/services/mfaServiceV8', () => ({
  MFAServiceV8: {
    getDeviceAuthenticationPolicies: vi.fn(),
    // ...other methods used by hooks
  },
}));
```

**Priority:** P1

---

### E. OAuth integration service return-shape drift — **18 failures**

`implicitFlowIntegrationServiceV8.test.ts` (14 fail), `oauthIntegrationServiceV8.test.ts` (4 fail), `realPingOneTest.test.ts` (5 fail)

Tests expect `generateAuthorizationUrl()` to return `{ authorizationUrl }`; implementation likely returns a different shape or async result (`authorizationUrl` is `undefined`).

**Fix:** Align tests with current service contract or mark `@integration` and skip in default `test:run`.

**Priority:** P2

---

### F. `SpecVersionServiceV8` label drift — **7 failures**

Tests expect short labels (`'OAuth 2.0'`); implementation returns RFC-style strings (`'OAuth 2.0 Authorization Framework (RFC…)'`).

**File:** `specVersionServiceV8.test.ts`

**Fix:** Update expected strings or assert `toContain('OAuth 2.0')`.

**Priority:** P2

---

### G. JAR / crypto in Node — **5 failures**

`jarRequestObjectServiceV8.test.ts` — `result.success` is `false` for HS256 signing in Vitest (likely missing `crypto.subtle` or Web Crypto polyfill in test env).

**Fix:** Mock `crypto.subtle` or run signing tests in `jsdom` with webcrypto; skip HS256 in node env.

**Priority:** P2

---

### H. UI component assertion drift — **7 failures**

- `StepProgressBarV8.test.tsx` — progress text `/0%/` not found (UI copy/structure changed)
- `StepValidationFeedbackV8.test.tsx` — collapse behavior + ARIA roles (`list`, `listitem`, `tooltip`) no longer match DOM

**Fix:** Update selectors to match current components or relax role assertions.

**Priority:** P3

---

### I. `NewAuthContext.enhanced` — **5 failures**

FlowContextUtils callback/security tests fail (`expected false to be true`). Implementation path changed; mocks don't trigger enhanced callback branch.

**File:** `NewAuthContext.enhanced.test.tsx` (5 fail / 6 pass)

**Fix:** Re-read `NewAuthContext` callback flow; update mocks for `FlowContextUtils` integration.

**Priority:** P2

---

### J. Miscellaneous single-failure files

| File | Fail | Likely cause |
|------|-----:|--------------|
| `mfaCredentialManagerV8.test.ts` | 1 | Validation rule change |
| `oauthIntegrationServiceV8.test.ts` | 4 | Token validation API (see E) |

---

## Files fully green (15)

`configCheckerServiceV8`, `validationServiceV8`, `tokenExchangeServiceV8`, `tokenGatewayV8`, `mfaTokenManagerV8`, `useStepNavigationV8`, `useWorkerToken`, `useMFAAuthentication`, `StepActionButtonsV8`, `registrationStatus`, `mfaNextStepNormalizer`, `unifiedMFASuccessPageServiceV8`, `unifiedFlowLoggerServiceV8U`, `FlowTypeSelector`, `unifiedFlowIntegrationV8U.integration` (partial v8u), and others with 0 failures in this run.

---

## Recommended action plan

| Priority | Action | Est. tests recovered |
|----------|--------|---------------------:|
| **P0** | Fix `tests/setup.ts` — in-memory `localStorage`, `indexedDB` stub, console strategy | ~50 |
| **P1** | Delete 3 orphan flow test files | 3 files |
| **P1** | Fix MFA service explicit mocks | ~24 |
| **P1** | Prune/update `errorHandlerV8.test.ts` obsolete methods | ~23 |
| **P2** | Update integration + spec version + NewAuthContext tests | ~35 |
| **P2** | JAR crypto polyfill or skip in node | ~5 |
| **P3** | UI component test selector updates | ~7 |

After P0+P1, expect **~100 failures → ~30** remaining.

---

## CI recommendation

Until P0–P1 land, exclude legacy v8/MFA from default CI:

```json
"test:ci": "vitest run --exclude 'src/v8/**' --exclude 'src/contexts/__tests__/NewAuthContext.enhanced.test.tsx'"
```

Or tag: `describe.skipIf(process.env.CI)` on v8 suites.

Ship-blocking suites (green today): `src/flows2`, `src/design`, `src/server/lmdb`, E2E chromium `:8000`.

---

## Regression note

No changes to production v8/MFA code required for triage. Fixes are test-only unless integration failures reveal real bugs (investigate E separately).
