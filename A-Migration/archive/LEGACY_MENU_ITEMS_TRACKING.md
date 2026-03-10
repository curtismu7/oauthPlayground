# Legacy Menu Items — Developer Tracking

> **Purpose**: Track all sidebar entries labeled "Legacy" — their routes, source files, hooks, migration status, and V9 equivalents. Update this file when work is done on any item.

---

## Table of Contents

1. [Group: Production (Legacy)](#group-production-legacy)
2. [Individual Item: OAuth2 ROPC (Legacy)](#individual-oauth2-ropc-legacy)
3. [Checklist Summary](#checklist-summary)
4. [Migration Rules](#migration-rules)

---

## Group: Production (Legacy)

**Sidebar ID**: `v8-flows`  
**Location in DragDropSidebar.tsx**: ~L672  
**Collapse key**: Defaults to `isOpen: true`

This group contains V8-era flows that have been superseded by V9 equivalents. Items remain in the sidebar for backward-compatibility and educational purposes.

---

### 1. 🔥 New Unified MFA

| Field | Value |
|---|---|
| **Sidebar label** | `🔥 New Unified MFA` |
| **Route** | `/v8/unified-mfa` |
| **Source file** | `src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx` |
| **Exported name** | `UnifiedMFARegistrationFlowV8` |
| **App.tsx** | `React.lazy(() => import(...))` → `<UnifiedMFARegistrationFlowV8_Legacy registrationFlowType="admin" />` |
| **Callback route** | `/v8/unified-mfa-callback` → `CallbackHandlerV8U` |
| **Key services** | `MFAServiceV8`, `MfaAuthenticationServiceV8`, `CredentialsServiceV8`, `MFAFlowBaseV8` |
| **Key hooks** | `useGlobalWorkerToken`, `useStepNavigationV8`, `useCallback` (internal) |
| **V9 equivalent** | None yet — candidate for future V9 MFA flow |
| **`console.*` migration** | ✅ Complete (55 calls → `logger.*`) — 2026-03-06 |
| **Biome clean** | ⬜ Pending biome check |
| **Notes** | `MODULE_TAG = '[🔄 UNIFIED-MFA-FLOW-V8]'` — remove after migration confirmed clean |

---

### 2. DPoP Authorization Code (V8)

| Field | Value |
|---|---|
| **Sidebar label** | `DPoP Authorization Code (V8)` |
| **Route** | `/flows/dpop-authorization-code-v8` |
| **Source file** | N/A — route is a redirect |
| **App.tsx** | `<Navigate to="/flows/dpop-authorization-code-v9" replace />` |
| **Actual component** | `DPoPAuthorizationCodeFlowV9` (`src/pages/flows/v9/DPoPAuthorizationCodeFlowV9.tsx`) |
| **V9 equivalent** | ✅ Already the V9 component — `/flows/dpop-authorization-code-v9` |
| **`console.*` migration** | ✅ N/A (redirect; V9 component handles it) |
| **Biome clean** | ✅ N/A |
| **Notes** | Sidebar entry kept for historical links. Consider removing sidebar entry when V8 group is retired. |

---

### 3. Authorization Code (V8)

| Field | Value |
|---|---|
| **Sidebar label** | `Authorization Code (V8)` |
| **Route** | `/flows/oauth-authorization-code-v8` |
| **Source file** | ⚠️ **No route defined in App.tsx** |
| **App.tsx** | No matching `<Route>` found — path returns 404/falls through to catch-all |
| **V9 equivalent** | `OAuthAuthorizationCodeFlowV9` at `/flows/oauth-authorization-code-v9` |
| **`console.*` migration** | ✅ N/A (dead route) |
| **Biome clean** | ✅ N/A |
| **Notes** | 🚨 **Dead route** — sidebar entry points to a path with no route handler. Either add a redirect `<Navigate to="/flows/oauth-authorization-code-v9" replace />` or remove this sidebar entry. |

---

### 4. Implicit Flow (V8)

| Field | Value |
|---|---|
| **Sidebar label** | `Implicit Flow (V8)` |
| **Route** | `/flows/implicit-v8` |
| **Source file** | `src/v8/flows/ImplicitFlowV8.tsx` |
| **Exported name** | `ImplicitFlowV8` (named export) |
| **App.tsx** | `<Route path="/flows/implicit-v8" element={<ImplicitFlowV8 />} />` |
| **Key services** | `ImplicitFlowIntegrationServiceV8`, `CredentialsServiceV8`, `FlowResetServiceV8`, `RedirectlessServiceV8`, `ValidationServiceV8` |
| **Key hooks** | `usePingOneAppConfig`, `useStepNavigationV8` |
| **V9 equivalent** | `ImplicitFlowV9` at `/flows/implicit-v9` (App.tsx redirects `/flows/implicit-v8` to V9 — **but there are TWO routes**: a redirect AND the direct `<ImplicitFlowV8>` route at line 871) |
| **`console.*` migration** | ✅ Complete (17 calls → `logger.*`) — 2026-03-06 |
| **Biome clean** | ✅ Complete |
| **Notes** | `MODULE_TAG = '[🔓 IMPLICIT-FLOW-V8]'` — line 868 in App.tsx adds a Navigate redirect to `/flows/implicit-v9` but line 871 still serves the V8 component directly. Verify intent. |

---

### 5. All Flows API Test Suite

| Field | Value |
|---|---|
| **Sidebar label** | `All Flows API Test Suite` |
| **Route** | `/test/all-flows-api-test` |
| **Source file** | `src/pages/test/AllFlowsApiTest.tsx` (lazy-loaded) |
| **App.tsx** | `lazy(() => import('./pages/test/AllFlowsApiTest'))` |
| **Purpose** | Test harness for all OAuth/OIDC flow types: Auth Code, Implicit, Hybrid, Device Code, Client Credentials |
| **V9 equivalent** | N/A — test utility, not a production flow |
| **`console.*` migration** | ⬜ Not assessed |
| **Biome clean** | ⬜ Not assessed |
| **Notes** | Listed under Production (Legacy) group but is a test tool, not an actual legacy flow. Consider moving to a "Testing" group. |

---

## Individual: OAuth2 ROPC (Legacy)

**Location in DragDropSidebar.tsx**: ~L1392  
**Sidebar section**: Under a "V7/Educational" group (alongside Mock OIDC ROPC, Advanced OAuth Params Demo)

---

### OAuth2 ROPC (Legacy)

| Field | Value |
|---|---|
| **Sidebar label** | `OAuth2 ROPC (Legacy)` |
| **Route** | `/flows/oauth2-resource-owner-password` |
| **Source file** | `src/pages/flows/OAuth2ResourceOwnerPasswordFlow.tsx` |
| **App.tsx** | Direct `<Route>` at line 1285–1286 |
| **Key hook** | `useResourceOwnerPasswordFlowV7` (`src/hooks/useResourceOwnerPasswordFlowV7.ts`) |
| **Key services** | `CompactAppPickerV8U`, `modernMessaging`, `FlowHeader` (V7-era) |
| **V9 equivalent** | `OAuthROPCFlowV9` at `/flows/oauth-ropc-v9` |
| **`console.*` migration — page** | ✅ Complete (was already 0 calls) — biome-fixed 2026-03-06 |
| **`console.*` migration — hook** | ✅ Complete (`useResourceOwnerPasswordFlowV7`: 16 calls → `logger.*`) — 2026-03-06 |
| **Biome clean** | ✅ Complete |
| **Notes** | `enableDebugger?: boolean` kept in hook interface for backward-compat; removed from destructure and deps arrays |

---

## Checklist Summary

| Item | Route | File | console migration | Biome | Has V9 |
|---|---|---|---|---|---|
| 🔥 New Unified MFA | `/v8/unified-mfa` | `UnifiedMFARegistrationFlowV8_Legacy.tsx` | ✅ | ⬜ | ❌ needed |
| DPoP Auth Code (V8) | `/flows/dpop-authorization-code-v8` | redirect → V9 | ✅ N/A | ✅ N/A | ✅ |
| Auth Code (V8) | `/flows/oauth-authorization-code-v8` | **dead route** | ✅ N/A | ✅ N/A | ✅ → V9 |
| Implicit Flow (V8) | `/flows/implicit-v8` | `ImplicitFlowV8.tsx` | ✅ | ✅ | ✅ `/flows/implicit-v9` |
| All Flows API Test | `/test/all-flows-api-test` | `AllFlowsApiTest.tsx` | ⬜ | ⬜ | ❌ test tool |
| OAuth2 ROPC (Legacy) | `/flows/oauth2-resource-owner-password` | `OAuth2ResourceOwnerPasswordFlow.tsx` + `useResourceOwnerPasswordFlowV7.ts` | ✅ | ✅ | ✅ `/flows/oauth-ropc-v9` |

---

## Migration Rules

When working on a Legacy item, apply these steps in order:

1. **`console.*` → `logger.*`**  
   - Import: `import { logger } from '<relative-path>/utils/logger'`  
   - API: `logger.debug/info/warn/error/success(componentName, message, data?, error?)`  
   - Error pattern: `logger.error('Comp', 'msg', undefined, error instanceof Error ? error : new Error(String(error)))`

2. **Remove `enableDebugger` pattern** (if present in hooks)  
   - Keep `enableDebugger?: boolean` in the params interface (callers won't break)  
   - Remove from destructure and all `useCallback` deps arrays

3. **Run biome auto-fix**  
   ```sh
   npx biome check --write <file>
   ```

4. **Commit** (no verify):  
   ```sh
   git add -A && git commit --no-verify -m "feat: migrate console.* → logger.* in <file>"
   ```

5. **Update this file** — mark the item's status columns.

### Do NOT modify

- `src/pages/OAuthOIDCTraining.tsx`
- `src/pages/PingAIResources.tsx`
- `src/pages/KrogerGroceryStoreMFA.tsx`
- Any of the 7 auth-path deferred services

### Logger path reference

| File location | Logger import path |
|---|---|
| `src/hooks/` | `'../utils/logger'` |
| `src/pages/flows/` | `'../../utils/logger'` |
| `src/v8/flows/` | `'../../utils/logger'` |
| `src/v8/flows/unified/` | `'../../../utils/logger'` |
| `src/v8/hooks/` | `'../../utils/logger'` |
