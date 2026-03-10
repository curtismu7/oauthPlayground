# V9 Migration — Remaining TODOs

**Last Updated:** March 2, 2026  
**Reference:** [migrate_vscode.md](./migrate_vscode.md) — full migration guide  
**Inventory:** See [migrate_vscode.md § V9 Migration Inventory](./migrate_vscode.md#-v9-migration-inventory-march-2-2026) for completed work

---

## Modern Messaging (MANDATORY)

All flows and pages migrated or modified during V9 upgrades must use **Modern Messaging**:

- **Wait screens** for blocking work (user cannot proceed)
- **Banner messaging** for persistent context/warnings
- **Critical errors** highlighted in **red** with clear next-step guidance
- **Footer messaging** for low-noise status updates (polling, copying, etc.)
- **No `console.error` / `console.warn` for runtime failures** — convert to user messaging **plus** structured logging

**Legacy Toast (`v4ToastManager`) is deprecated.** If you touch a file that still uses it, remove it and migrate to Modern Messaging in the same change.

## Engineering Quality Gates (MANDATORY)

These are review gates for **every** V9 migration or update (educational app–appropriate: lightweight safety, strong reliability).

- [ ] **Modern Messaging** used appropriately: wait screen / banner / red critical error / footer status
- [ ] **No runtime `console.error` / `console.warn`** for failures — convert to user messaging + structured logging
- [ ] **Async cleanup** everywhere: `AbortController` for fetches; clear intervals/timeouts; unsubscribe listeners; no state updates after unmount
- [ ] **Flow state clarity**: `idle → loading → success → error`; safe retries that reset state cleanly; disable submit while in-flight
- [ ] **Input validation with guidance**: inline field errors for fixable issues; critical error block for “can’t proceed”
- [ ] **Sanitized technical details**: mask/truncate tokens & sensitive values; no stack traces by default
- [ ] **Accessibility basics**: keyboard works; focus management after transitions/errors; `aria-live` for dynamic banners/errors
- [ ] **Minimal tests**: at least one failure-path assertion that verifies a user message appears (plus happy path for critical flows)

### Services-first rule (MANDATORY)

Keep flows/components thin. If code is reusable, protocol-specific, or touches remote APIs, it belongs in a **service** (or a dedicated hook that calls a service), not in the view layer.

- [ ] **No direct fetch/protocol code in UI components** (except wiring to a service call)
- [ ] **No duplicated protocol logic across flows** — centralize in services (token exchange, PAR, MFA operations, credential operations, worker token)
- [ ] **Services own**: API calls, request shaping, response parsing, retries/timeouts, error normalization, and logging context
- [ ] **UI owns**: state transitions, rendering, input collection/validation messages, and calling services
- [ ] When you add “one-off” logic in a flow, ask: *Will another flow need this?* If yes, move it into a service now.

## 🔴 CRITICAL — Flow Migrations

### Token Exchange V7 → V9
- **Sidebar label:** Token Exchange (V8M)
- **Current route:** `/flows/token-exchange-v7`
- **V8 source:** `src/v8/flows/TokenExchangeFlowV8.tsx`
- **Target route:** `/flows/token-exchange-v9`
- **Complexity:** High — RFC 8693 token exchange, uses `tokenExchangeServiceV8`, `tokenExchangeConfigServiceV8`
- [ ] Run pre-migration check script against V8 source
- [ ] Create `src/pages/flows/v9/TokenExchangeFlowV9.tsx`
- [ ] Fix imports (V8-internal `../` → `@/v8/...`)
- [ ] Add route to `App.tsx`
- [ ] Update sidebar entry: replace V7 route with V9
- [ ] Test token exchange flow end-to-end

---

## 🟠 High Priority — Flow Migrations

### PingOne PAR V7 → V9
- **Current route:** `/flows/pingone-par-v7`
- **V8 source:** `src/v8/flows/PingOnePARFlowV8/` (directory)
- **Target route:** `/flows/pingone-par-v9`
- [ ] Run pre-migration check on V8 source
- [ ] Create `src/pages/flows/v9/PingOnePARFlowV9.tsx`
- [ ] Fix V8-internal imports → `@/v8/...`
- [ ] Add route to `App.tsx`
- [ ] Replace `/flows/pingone-par-v7` in `sidebarMenuConfig.ts`
- [ ] Test PAR + PKCE flow

### PingOne MFA V7 → V9
- **Current route:** `/flows/pingone-complete-mfa-v7`
- **V8 source:** `src/v8/flows/CompleteMFAFlowV8.tsx`
- **Target route:** `/flows/pingone-complete-mfa-v9`
- **Complexity:** High — full MFA lifecycle, depends on `mfaServiceV8`, `mfaAuthenticationServiceV8`, `mfaConfigurationServiceV8`
- [ ] Run pre-migration check on V8 source
- [ ] Create `src/pages/flows/v9/PingOneCompleteMFAFlowV9.tsx`
- [ ] Fix V8-internal imports → `@/v8/...`
- [ ] Add route to `App.tsx`
- [ ] Replace `/flows/pingone-complete-mfa-v7` in `sidebarMenuConfig.ts`
- [ ] Test full MFA enrollment + authentication

### PingOne MFA Workflow Library V7 → V9
- **Current route:** `/flows/pingone-mfa-workflow-library-v7`
- **V8 source:** `src/v8/flows/MFAFlowV8.tsx`
- **Target route:** `/flows/pingone-mfa-workflow-library-v9`
- [ ] Run pre-migration check on V8 source
- [ ] Create `src/pages/flows/v9/MFAFlowV9.tsx`
- [ ] Fix V8-internal imports → `@/v8/...`
- [ ] Add route to `App.tsx`
- [ ] Replace `/flows/pingone-mfa-workflow-library-v7` in `sidebarMenuConfig.ts`

### Worker Token V7 → V9
- **Current route:** `/flows/worker-token-v7`
- **V8 source:** `src/pages/flows/WorkerTokenFlowV7.tsx` (no V8 equivalent — build V9 from scratch)
- **Target route:** `/flows/worker-token-v9`
- [ ] Review V7 source and plan V9 structure
- [ ] Migrate to `unifiedWorkerTokenService` (see Error 6 in migration guide)
- [ ] Create `src/pages/flows/v9/WorkerTokenFlowV9.tsx`
- [ ] Add route to `App.tsx`
- [ ] Replace `/flows/worker-token-v7` in `sidebarMenuConfig.ts`

---

## 🟡 Medium Priority — Flow Migrations

### ROPC V7 → V9 (or deprecate)
- **Current route:** `/flows/oauth-ropc-v7`
- **Note:** ROPC is deprecated in OAuth 2.1. Decision needed: migrate as educational-only or remove entirely.
- [ ] **Decision:** Keep as educational mock or remove from sidebar?
- [ ] If keeping: create `src/pages/flows/v9/OAuthROPCFlowV9.tsx`
- [ ] If removing: redirect V7 route to a deprecation notice page

---

## 🟢 Low Priority — Evaluate for Cleanup

### Auth Code Condensed Mock V7
- **Current route:** `/flows/oauth-authorization-code-v7-condensed-mock`
- **Question:** Does `/flows/oauth-authorization-code-v9-condensed` already cover this use case?
- [ ] Compare V7 condensed mock vs V9 condensed — identify any gaps
- [ ] If covered: remove entry from `sidebarMenuConfig.ts`
- [ ] If not covered: create V9 equivalent or merge features

### V7 Condensed Prototype
- **Current route:** `/flows/v7-condensed-mock`
- **Sidebar label:** V7 Condensed (Prototype)
- [ ] Evaluate if this prototype is still needed
- [ ] If not: remove from `sidebarMenuConfig.ts` and archive the component

---

## 🔵 V8 Flows Without V9 Equivalent

These V8 flows are in the sidebar but have no V9 version yet:

### Authorization Code V8 → V9
- **Current route:** `/flows/oauth-authorization-code-v8`
- **V8 source:** `src/v8/flows/OAuthAuthorizationCodeFlowV8.tsx`
- **Target route:** `/flows/oauth-authorization-code-v9` (already exists — check if V8 adds anything beyond V9 current)
- [ ] Diff V8 vs existing V9 to identify unique features
- [ ] Merge unique features into existing V9 flow OR create separate route
- [ ] Remove V8 entry from sidebar if V9 is equivalent

### Implicit Flow V8 → V9
- **Current route:** `/flows/implicit-v8`
- **V8 source:** `src/v8/flows/ImplicitFlowV8.tsx`
- **Target route:** `/flows/implicit-v9` (already exists — same question)
- [ ] Diff V8 vs existing V9
- [ ] Merge or retire V8 sidebar entry

### DPoP Authorization Code V8 → V9
- **Current route:** `/flows/dpop-authorization-code-v8`
- [ ] Locate V8 source file for DPoP
- [ ] Create `src/pages/flows/v9/DPoPAuthorizationCodeFlowV9.tsx`
- [ ] Add route to `App.tsx`
- [ ] Update sidebar entry

---

## ⚙️ V9 Services — Priority 1 Remaining

See [migrate_vscode.md § Priority 1 V8 Services Migration Progress](./migrate_vscode.md#-priority-1-v8-services-migration-progress) for full context.

| Service | Target | Complexity | Status |
|---|---|---|---|
| `mfaServiceV8` | `V9MFAService` | High | 🔄 Planning |
| `workerTokenServiceV8` | `V9TokenService` (partial exists) | Medium | 🔄 Planning |
| `credentialsServiceV8` | `V9CredentialService` (partial exists) | High | 🔄 Planning |
| `unifiedFlowLoggerServiceV8` | `V9LoggingService` | Low | 🔄 Next up |

### unifiedFlowLoggerServiceV8 → V9LoggingService
- **Complexity:** Low
- **Source:** `src/v8/services/` (check for `unifiedFlowLoggerServiceV8.ts`)
- [ ] Locate source file
- [ ] Create `src/services/v9/V9LoggingService.ts`
- [ ] Fix import paths
- [ ] Create adapter for backward compatibility
- [ ] Update consumers

### workerTokenServiceV8 → V9TokenService
- **Complexity:** Medium
- **Source:** `src/v8/services/workerTokenServiceV8.ts`
- **Note:** `V9TokenService.ts` already exists — review gaps
- [ ] Diff `workerTokenServiceV8` vs `V9TokenService`
- [ ] Add missing methods to `V9TokenService`
- [ ] Create `V8ToV9WorkerTokenAdapter.ts` if needed
- [ ] Update consumers

### mfaServiceV8 → V9MFAService
- **Complexity:** High
- **Source:** `src/v8/services/mfaServiceV8.ts`
- [ ] Audit all `mfaServiceV8` consumers (~75 imports)
- [ ] Design `V9MFAService` interface
- [ ] Implement `src/services/v9/V9MFAService.ts`
- [ ] Create adapter for backward compatibility
- [ ] Gradual rollout — update consumers flow by flow

### credentialsServiceV8 → V9CredentialService
- **Complexity:** High
- **Source:** `src/v8/services/credentialsServiceV8.ts`
- **Note:** `credentialsServiceV9.ts` already exists — review gaps
- [ ] Diff `credentialsServiceV8` vs `credentialsServiceV9`
- [ ] Merge missing functionality
- [ ] Update consumers (~70 imports)

---

## � Existing V9 Flows — Spec Compliance Audit (March 2, 2026)

Audited against: migrate_vscode.md color standards, Modern Messaging standard, programming patterns, and V9_FLOW_TEMPLATE.md spec.

> **Key for issues below:**
> - 🔴 = functional bug or broken behavior (must fix)
> - 🟠 = spec violation / legacy pattern still present
> - 🟡 = missing feature / improvement (should fix)
> - ✅ = compliant
>
> **Column definitions:**
> - **Messaging:** Wait screens + banners + critical error blocks + footer messaging are used appropriately; failures provide clear user guidance (no silent failures).
> - **Console errors:** Runtime failures are NOT surfaced via `console.error` / `console.warn`; errors are routed to user messaging + structured logging.
> - **Header Color:** Flow headers use approved gradients (blue for flows; red only for PingOne admin pages).
> - **FlowUIService:** Uses `FlowUIService.getContainer()` / `getContentWrapper()` / shared StepHeader patterns as appropriate.
> - **usePageScroll:** `usePageScroll()` integrated for step/scenario transitions where the page meaningfully changes.
> - **EducationMode:** `EducationModeToggle` present where required by V9 spec/template conventions.
> - **`../../../v8/` alias issue:** No deep relative imports; V8 module imports use `@/v8/...` alias.
> - **useEffect cleanups:** Async effects use cleanup (`AbortController` / unsubscribes / interval clears) to prevent state updates after unmount.


### Quick Reference Matrix

| File | Messaging | Console errors | Header Color | FlowUIService | usePageScroll | EducationMode | `@/v8/` alias issue | useEffect cleanups |
|---|---|---|---|---|---|---|---|---|
| `ClientCredentialsFlowV9` | 🟠 Legacy | 🟡 TBD | 🟠 Green | ✅ partial | ✅ | ✅ | — | 🔴 0/3 |
| `DeviceAuthorizationFlowV9` | 🟠 Legacy | 🟡 TBD | 🟠 Mixed¹ | ✅ partial | ✅ | 🟡 Missing | — | 🔴 2/13 |
| `ImplicitFlowV9` | 🟠 Legacy | 🟡 TBD | ✅ Blue | ✅ partial | ✅ | ✅ | — | 🔴 0/10 |
| `JWTBearerTokenFlowV9` | 🟠 Legacy | 🟡 TBD | ✅ from FUS² | ✅ full | ✅ | 🟡 Missing | — | 🔴 0/3 |
| `OAuthAuthorizationCodeFlowV9` | 🟠 Legacy | 🟡 TBD | ✅ Blue | ✅ partial | ✅ | 🟡 Missing | — | 🔴 1/15 |
| `OAuthAuthorizationCodeFlowV9_Condensed` | ✅ Modern | 🟡 TBD | ✅ Blue | 🟡 own Container | ✅ | 🟡 Missing | 🟠 Error 7 | ✅ 0/0 |
| `OIDCHybridFlowV9` | 🟠 Legacy | 🟡 TBD | ✅ from FUS² | ✅ full | ✅ | 🟡 Missing | — | 🔴 0/7 |
| `RARFlowV9` | 🟠 Mixed | 🟡 TBD | ✅ Blue | ✅ full | ✅ | 🟡 Missing | 🟠 Error 7 | ✅ 0/0 |
| `SAMLBearerAssertionFlowV9` | 🟠 Legacy | 🟡 TBD | ✅ from FUS² | ✅ full | ✅ | 🟡 Missing | — | 🔴 0/3 |

> ¹ DeviceAuth has two variants: `oidc` = blue, `oauth` = green — `oauth` variant is non-compliant  
> ² Header color via `FlowUIService.getFlowUIComponents()` StepHeader — compliant if FlowUIService uses spec blue  
> ³ RARFlowV9 imports both `Modern Messaging` ✅ and `Legacy Toast (`v4ToastManager`)` ❌ — v4 import needs removal  

---

### Per-File Fix Lists

#### `ClientCredentialsFlowV9.tsx`
- [ ] 🟠 Fix file header comment — says "V7.0.0 OAuth 2.0 Client Credentials Flow - Complete V7 Implementation" (line 2)
- [ ] 🟠 Update header gradient: `#16a34a → #2563eb`, `#15803d → #1e40af`
- [ ] 🟠 Replace legacy messaging/toasts with Modern Messaging (import + all call sites)
- [ ] 🔴 Add `AbortController` + `return () => controller.abort()` to 3 `useEffect` blocks
- [ ] 🟡 Replace inline `StepHeader` styled-component with `FlowUIService.getFlowUIComponents()` StepHeader (or keep own but fix color)

#### `DeviceAuthorizationFlowV9.tsx`
- [ ] 🟠 Replace legacy messaging/toasts with Modern Messaging
- [ ] 🟠 Fix `oauth` variant header color: `#16a34a → #2563eb`, `#15803d → #1e40af` (line ~82-83)
- [ ] 🟠 Fix `oidc` variant to use exact spec blue: `#3b82f6 → #2563eb`, `#1d4ed8 → #1e40af` (line ~82)
- [ ] 🔴 Add cleanup to 11 `useEffect` blocks that lack `return () =>` (13 effects, only 2 cleaned up)
- [ ] 🟡 Add `EducationModeToggle`

#### `ImplicitFlowV9.tsx`
- [ ] 🟠 Replace legacy messaging/toasts with Modern Messaging
- [ ] 🔴 Add cleanup to 10 `useEffect` blocks that lack `return () =>`

#### `JWTBearerTokenFlowV9.tsx`
- [ ] 🟠 Replace legacy messaging/toasts with Modern Messaging
- [ ] 🔴 Add cleanup to 3 `useEffect` blocks that lack `return () =>`
- [ ] 🟡 Add `EducationModeToggle`

#### `OAuthAuthorizationCodeFlowV9.tsx`
- [ ] 🟠 Replace legacy messaging/toasts with Modern Messaging
- [ ] 🔴 Add cleanup to 14 `useEffect` blocks that lack `return () =>` (15 effects, only 1 with cleanup)
- [ ] 🟡 Add `EducationModeToggle`

#### `OAuthAuthorizationCodeFlowV9_Condensed.tsx`
- [ ] 🟠 Fix Error 7 import: `'../../../v8/components/WorkerTokenStatusDisplayV8'` → `'@/v8/components/WorkerTokenStatusDisplayV8'` (line 13)
- [ ] 🟠 Fix Error 7 import: `'../../../v8/utils/toastNotificationsV8'` → `'@/v8/utils/toastNotificationsV8'` (line 14)
- [ ] 🟡 Replace own `Container = styled.div` with `FlowUIService.getContainer()` for layout consistency
- [ ] 🟡 Add `EducationModeToggle`

#### `OIDCHybridFlowV9.tsx`
- [ ] 🟠 Replace legacy messaging/toasts with Modern Messaging
- [ ] 🔴 Add cleanup to 7 `useEffect` blocks that lack `return () =>`
- [ ] 🟡 Add `EducationModeToggle`

#### `RARFlowV9.tsx`
- [ ] 🟠 Remove `Legacy Toast (`v4ToastManager`)` import — `Modern Messaging` is already imported and used; remove old import and any remaining v4 call sites
- [ ] 🟠 Fix Error 7 import: `'../../../v8/components/WorkerTokenStatusDisplayV8'` → `'@/v8/components/WorkerTokenStatusDisplayV8'` (line 22)
- [ ] 🟠 Fix Error 7 import: `'../../../v8/utils/toastNotificationsV8'` → `'@/v8/utils/toastNotificationsV8'` (line 23)
- [ ] 🟡 Add `EducationModeToggle`

#### `SAMLBearerAssertionFlowV9.tsx`
- [ ] 🟠 Replace legacy messaging/toasts with Modern Messaging
- [ ] 🔴 Add cleanup to 3 `useEffect` blocks that lack `return () =>`
- [ ] 🟡 Add `EducationModeToggle`

---

### Batch Fix Commands (Messaging + Console — Run Per File)

```bash
# Replace Legacy Toast calls in a V9 file. Run once per file, then manually add Modern Messaging import.
FILE="src/pages/flows/v9/ClientCredentialsFlowV9.tsx"  # change per file

sed -i '' "s/Legacy Toast (`v4ToastManager`)\.showSuccess(/messaging.success(/g" "$FILE"
sed -i '' "s/Legacy Toast (`v4ToastManager`)\.showError(/messaging.error(/g" "$FILE"
sed -i '' "s/Legacy Toast (`v4ToastManager`)\.showWarning(/messaging.warning(/g" "$FILE"
sed -i '' "s/Legacy Toast (`v4ToastManager`)\.showInfo(/messaging.info(/g" "$FILE"
# Then: remove Legacy Toast (`v4ToastManager`) import line, add: import { messaging } from '@/v8/utils/toastNotificationsV8';
```

```bash
# Fix Error 7 (relative v8 imports) in Condensed and RAR:
for f in src/pages/flows/v9/OAuthAuthorizationCodeFlowV9_Condensed.tsx src/pages/flows/v9/RARFlowV9.tsx; do
  sed -i '' "s|from '../../../v8/|from '@/v8/|g" "$f"
done
```

---

## �🔧 Code Quality (From Programming Patterns Audit — Mar 2, 2026)

> Full details in [`migrate_vscode.md` → `🔬 Programming Patterns`](./migrate_vscode.md)

### 🔴 P1 — Must Fix Before/During Migration

- [ ] **V9 toast system migration** — 8 of 9 V9 flows still using `Legacy Toast (`v4ToastManager`)`; replace with `Modern Messaging`
  - [ ] `OIDCHybridFlowV9.tsx`
  - [ ] `DeviceAuthorizationFlowV9.tsx`
  - [ ] `ImplicitFlowV9.tsx`
  - [ ] `SAMLBearerAssertionFlowV9.tsx`
  - [ ] `ClientCredentialsFlowV9.tsx`
  - [ ] `RARFlowV9.tsx`
  - [ ] `OAuthAuthorizationCodeFlowV9.tsx`
  - [ ] `JWTBearerTokenFlowV9.tsx`
- [ ] **Dead `_setIsLoading` state** — `TokenExchangeFlowV8.tsx` line 250; `isLoading` never updates because `useProductionSpinner` owns it now
- [ ] **`useEffect` async without `AbortController`** — apply to Token Exchange V8, all MFA flows; prevents state update on unmounted component

### 🟠 P2 — Fix When Touching Each File

- [ ] **Unsafe error casting** — replace `err as SomeErrorClass` with `instanceof` type guards (`TokenExchangeFlowV8.tsx` and others)
- [ ] **`useState<any>` in V7 flows** — replace with typed state before copying to V9 (`TokenExchangeFlowV7.tsx` L1697 and others)
- [ ] **Spinner objects in `useCallback`/`useEffect` deps** — verify `useProductionSpinner` stability; if new ref each render, remove from deps with a comment

### 💡 P3 — Improve When Refactoring

- [ ] **Add `usePageScroll`** to all V8 flows being migrated to V9 (V7 had it, V8 dropped it)
- [ ] **Switch V8 `Container` → `FlowUIService.getContainer()`** when placing V8 flows in V9 folder
- [ ] **Replace `console.log` with `debugLog` pattern** in any services created or touched during migration

---

## ✅ Completed (for reference)

| Item | Date |
|---|---|
| Implicit Flow V7 → V9 | Feb 26, 2026 |
| Client Credentials V7 → V9 | Feb 26, 2026 |
| Device Authorization V7 → V9 | Feb 26, 2026 |
| Authorization Code V7 → V9 | Feb 26, 2026 |
| OIDC Hybrid V7 → V9 | Feb 26, 2026 |
| JWT Bearer Token → V9 | Feb 26, 2026 |
| SAML Bearer Assertion → V9 | Feb 26, 2026 |
| RAR Flow → V9 | Feb 26, 2026 |
| CIBA Flow → V9 | Feb 28, 2026 |
| `workerTokenStatusServiceV8` → `V9WorkerTokenStatusService` | Feb 28, 2026 |
| `specVersionServiceV8` → `V9SpecVersionService` | Feb 28, 2026 |
| Remove duplicate V7 sidebar entries (Hybrid, JWT, SAML, RAR) | Mar 2, 2026 |