# V9 Migration — Remaining TODOs

**Last Updated:** March 2, 2026  
**Reference:** [migrate_vscode.md](./migrate_vscode.md) — full migration guide  
**Inventory:** See [migrate_vscode.md § V9 Migration Inventory](./migrate_vscode.md#-v9-migration-inventory-march-2-2026) for completed work

---

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
