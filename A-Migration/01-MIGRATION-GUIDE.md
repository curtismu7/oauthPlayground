# V7/V8 → V9 Migration Guide

**Primary guide for migrating OAuth/OIDC flows to V9.**  
**Last updated:** February 2026 | **Status:** Production

---

## Start here

- **Before migrating any flow:** Read [02-SERVICES-AND-CONTRACTS.md](./02-SERVICES-AND-CONTRACTS.md) (services, worker token) and [03-TESTING-AND-RULES.md](./03-TESTING-AND-RULES.md) (quality gates, testing).
- **Quick reference:** [04-REFERENCE.md](./04-REFERENCE.md) (flow template, colors, JWKS/MFA pointers).
- **Regression log:** `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` for recent fixes and do-not-break checks.

---

## 1. Mandatory: Modern Messaging

All V9 flows and pages must use **Modern Messaging** (no legacy toast):

- **Wait screens** — blocking work (user cannot proceed).
- **Banner messaging** — persistent context/warnings.
- **Critical errors** — red, with next-step guidance.
- **Footer messaging** — low-noise status (polling, copy, etc.).
- **No `console.error`/`console.warn` for runtime failures** — use app logging + user-facing message.

**Legacy:** `v4ToastManager` is deprecated; remove it when touching a file.

---

## 2. Engineering Quality Gates (every migration)

- [ ] Modern Messaging used (wait / banner / red error / footer).
- [ ] No runtime `console.error`/`console.warn` for failures (use messaging + structured logging).
- [ ] Async cleanup: `AbortController` for fetches; clear intervals/timeouts; no state updates after unmount.
- [ ] Flow state: `idle → loading → success → error`; safe retries; disable submit while in-flight.
- [ ] Input validation with guidance; critical error block for “can’t proceed.”
- [ ] Sanitized technical details (mask tokens; no stack traces by default).
- [ ] Accessibility: keyboard, focus after transitions, `aria-live` for dynamic content.
- [ ] Minimal tests: at least one failure-path assertion + happy path for critical flows.

### Services-first (mandatory)

- No direct fetch/protocol code in UI — use services (or hooks that call services).
- No duplicated protocol logic — centralize in services.
- **Before adding non-trivial logic:** search services first; prefer small composable service functions; capture gaps in **02-SERVICES-AND-CONTRACTS.md**.

---

## 3. V9 Migration Inventory (summary)

**Migrated to V9:** Authorization Code+PKCE, Implicit, Device Auth, Client Credentials, OIDC Hybrid, JWT Bearer, SAML Bearer, RAR, CIBA, Redirectless (see main codebase for routes).

**Not yet V9 (still V7 in sidebar):** Token Exchange (CRITICAL), PingOne PAR, PingOne MFA, MFA Workflow Library, Worker Token (V7), ROPC, condensed/mock flows.

**V8 in sidebar (no V9 yet):** Auth Code V8, Implicit V8, DPoP Auth Code V8.

**Remaining TODOs (high):** Token Exchange V7→V9, PingOne PAR/MFA/Worker Token V7→V9; then ROPC and V8→V9 equivalents. **V9 services:** mfaServiceV8→V9MFAService, workerTokenServiceV8→V9TokenService, credentialsServiceV8→V9CredentialService (see 02 for status).

---

## 4. V8 Architecture (where things live)

**V8** is under `src/v8/`: `components/`, `services/`, `flows/`, `pages/`, `hooks/`, `utils/`, `styles/`, `constants/`, `types/`.

**Key V8 services:** workerTokenStatusServiceV8, specVersionServiceV8, mfaServiceV8, workerTokenServiceV8, credentialsServiceV8, oauthIntegrationServiceV8, environmentIdServiceV8, validationServiceV8, storageServiceV8, uiNotificationServiceV8.

**Key V8 components (use `@/v8/...` when possible):** WorkerTokenSectionV8, WorkerTokenModalV8, WorkerTokenExpiryBannerV8, WorkerTokenStatusDisplayV8, SuperSimpleApiDisplayV8, UserSearchDropdownV8, SilentApiConfigCheckboxV8; messaging via `messaging` from `@/v8/utils/toastNotificationsV8`.

**Import depth:** From `src/pages/flows/v9/` use `../../../` to `src/` or **`@/v8/...`** to avoid depth errors. When moving a V8 flow into V9, fix V8-internal imports:

```bash
FLOW="src/pages/flows/v9/MyFlowV9.tsx"
sed -i '' "s|from '../services/|from '@/v8/services/|g" "$FLOW"
sed -i '' "s|from '../components/|from '@/v8/components/|g" "$FLOW"
sed -i '' "s|from '../hooks/|from '@/v8/hooks/|g" "$FLOW"
sed -i '' "s|from '../utils/|from '@/v8/utils/|g" "$FLOW"
```

---

## 5. UI Color Standards (mandatory)

**Approved:** Red, Blue, Black, White (and status greens/ambers per below).

- **Primary blue (headers, primary actions):** `#2563eb`, `#1e40af`, `#1e3a8a`, `#eff6ff`, `#dbeafe`.
- **Red (errors, destructive):** `#dc2626`, `#fef2f2`.
- **Neutral:** `#111827`, `#1f2937`, `#6b7280`, `#f9fafb`, `#e5e7eb`, white.

**Headers:** Blue gradient default: `linear-gradient(135deg, #2563eb 0%, #1e40af 100%)`. Red for PingOne Management API pages: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`. **No purple.**

**Status indicators only** (token status, connection badges): Valid `#10b981`, Warning `#f59e0b`, Invalid `#ef4444`. Not for headers or action buttons.

**Forbidden:** Purple, green/orange/amber except status indicators above.

---

## 6. Common Errors and Fixes

| # | Symptom | Fix |
|---|--------|-----|
| 1 | Wrong import depth (`../../services/` fails) | Use `../../../` from `v9/` or `@/` alias. |
| 2 | Config path wrong | Config is sibling of `v9/`, use `../config/`. |
| 3 | Missing V9 helper class | Create V9 version or use existing V9 service. |
| 4 | Wrong utility filename | Use actual file (e.g. `v4ToastMessages.ts`). |
| 5 | Archived file missing | Restore from archive or use current path. |
| 6 | `localStorage` for worker token | Use `unifiedWorkerTokenService` (IndexedDB/SQLite + events). |
| 7 | V8 internal import fails from V9 | Replace `'../services/` with `'@/v8/services/` (and similar). |
| 8 | WorkerTokenSectionV8 import error | Use named import: `import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8'`. |

---

## 7. Programming Patterns (avoid these)

- **Dead state variables** — e.g. `isLoading` never set; remove or wire to spinner/hook.
- **useEffect async without cleanup** — Use `AbortController` and `return () => controller.abort()`; guard setState with `!controller.signal.aborted`.
- **Legacy toast in V9** — Replace with Modern Messaging (see section 1).
- **Unsafe error casting** — Use type guards (`err instanceof Error`) before casting.
- **useState&lt;any&gt;** — Use concrete types or minimal interfaces for API results.

---

## 8. Priority 1 Services (summary)

**Done:** workerTokenStatusServiceV8→V9WorkerTokenStatusService; specVersionServiceV8→V9SpecVersionService; unifiedFlowLoggerServiceV8→V9LoggingService (see docs/UPDATE_LOG).

**Next:** mfaServiceV8→V9MFAService, workerTokenServiceV8→V9TokenService, credentialsServiceV8→V9CredentialService. Details and upgrade candidates: **02-SERVICES-AND-CONTRACTS.md**.

---

## 9. Additional Resources

- **02-SERVICES-AND-CONTRACTS.md** — Service upgrades, worker token consistency, contracts.
- **03-TESTING-AND-RULES.md** — Zero-tolerance checklist, testing prevention, infinite-loop/runtime rules.
- **04-REFERENCE.md** — V9 flow template, colors, JWKS/MFA, historical migrations.
- **docs/UPDATE_LOG_AND_REGRESSION_PLAN.md** — Recent fixes and regression checklist.
- **V7_TO_V8_UPGRADE_TARGETS.md** (in archive) — Priority list of V7 apps and service dependencies.
