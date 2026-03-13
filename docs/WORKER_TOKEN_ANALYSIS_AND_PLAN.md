# Worker Token Retrieval — Full Analysis & Simplification Plan

**Purpose:** Single source of truth for worker token behavior across the app. Ensure one modal, one retrieval path, and consistent storage (IndexedDB + SQLite where applicable).

**Last updated:** 2026-03

---

## 1. Executive Summary

| Area | Current state | Target |
|------|----------------|--------|
| **Modals** | 2 UI modals (WorkerTokenModalV9 + WorkerTokenModalV8) and 2 “request” modals (WorkerTokenRequestModal, WorkerTokenRequestModalV8) used in different places | **One modal only:** WorkerTokenModalV9, opened via `open-worker-token-modal` event |
| **Retrieval services** | unifiedWorkerTokenService, workerTokenManager, workerTokenServiceV8, workerTokenRepository, tokenGatewayV8, workerTokenModalHelperV8 | **Single read path:** unifiedWorkerTokenService (credentials from SQLite + cache; token from unifiedTokenStorage → IndexedDB + SQLite) |
| **Token storage** | Credentials: SQLite (source of truth) + IndexedDB + localStorage. Token: unifiedWorkerTokenService → IndexedDB + SQLite + localStorage; workerTokenManager → repository → **localStorage only** | **All token writes** go through unifiedWorkerTokenService so token is in IndexedDB and SQLite (no localStorage-only path for token) |
| **Hardcoded endpoints** | WorkerTokenModalV8 builds `https://${domain}/${envId}/as/token`; WorkerTokenModalV9 uses `/api/pingone/token` proxy; WorkerTokenRequestModal can use raw `tokenEndpoint` | **No direct PingOne URL in app:** all token requests via backend proxy `/api/pingone/token` or service that uses proxy |

### Plan status (is it complete?)

**No.** The plan is not complete. Current state:

- **Modal migration (Section 7.2):** 3 of ~16 “pages that render a worker token modal” are migrated to `open-worker-token-modal` and no longer render WorkerTokenModalV8: **DeleteAllDevicesUtilityV8**, **UnifiedErrorDisplayV8**, **CredentialsFormV8U**. The rest (UnifiedFlowSteps, workerTokenUIServiceV8, MFAFlowBaseV8, MFADeviceCreateDemoV8, DeviceAuthenticationDetailsV8, HelioMartPasswordReset, PingOneApplicationPickerModal, ConfigurationURIChecker, WorkerTokenFlowV9, SDKExamplesHome, WorkerTokenTester, CustomDomainTestPage, plus FIDO2/MFA snapshot pages) still render WorkerTokenModalV8 or a local V9 modal.
- **Storage path (Section 5.2):** Path B (workerTokenManager → workerTokenRepository → localStorage only) is still present; token saves from that path do not go through unifiedWorkerTokenService → IndexedDB + SQLite. Recommendation not yet implemented.
- **Section 9 summary checklist:** All items remain unchecked (single modal, single read/write path, no direct PingOne token calls, manager saves via unified, checkboxes, button colors, etc.).

To complete the plan, finish the modal migration list in 7.2, implement manager/repository save via unifiedWorkerTokenService, and satisfy the Section 9 checklist.

---

## 2. Services Inventory

### 2.1 Core services (canonical)

| Service | Role | Storage used | Used by |
|--------|------|--------------|---------|
| **unifiedWorkerTokenService** | Credentials + token load/save; token request via backend proxy (when applicable). **Source of truth for credentials:** SQLite. | Credentials: SQLite (`/api/credentials/sqlite/*`) + memory + IndexedDB + localStorage. Token: `unifiedTokenStorage.saveWorkerToken` → IndexedDB + SQLite + `localStorage` key `unified_worker_token`. | WorkerTokenModalV9, workerTokenServiceV8 (wrapper), WorkerTokenModal (legacy), many flows |
| **unifiedTokenStorageService** | Stores worker token (and other tokens) in IndexedDB and SQLite. | `storeToken` → IndexedDB + `/api/tokens/store` (SQLite). `saveWorkerToken` uses `storeToken`. | unifiedWorkerTokenService.saveToken → saveWorkerToken |
| **workerTokenServiceV8** | **Wrapper only.** All methods delegate to unifiedWorkerTokenService. | Same as unifiedWorkerTokenService. | MFAServiceV8, CredentialsFormV8U, WorkerTokenSectionV8, WorkerTokenModalV8 (reads/writes via this), appDiscoveryServiceV8, etc. |

### 2.2 Secondary / legacy services

| Service | Role | Storage used | Issue / note |
|--------|------|--------------|--------------|
| **workerTokenManager** | Fetches token (and can save after fetch). Used by useGlobalWorkerToken when no token in unifiedWorkerTokenService. | **Saves via workerTokenRepository** → unifiedStorageManager → **localStorage only**. Does not write to IndexedDB or SQLite. | Token written by manager is not in unified token storage; other pages that read only from unifiedWorkerTokenService won’t see it. |
| **workerTokenRepository** | Load/save credentials and token for workerTokenManager. | **unifiedStorageManager** → localStorage only (keys `unified_worker_token_credentials`, `unified_worker_token`). No IndexedDB, no SQLite. | Inconsistent with “storage service for IndexedDB + SQLite” goal. |
| **unifiedStorageManager** | Generic key/value persistence. | **localStorage only.** | Used only by workerTokenRepository in worker-token path. |
| **tokenGatewayV8** | V8 auth gateway; can fetch worker token. | Uses workerTokenServiceV8 (so unified underneath). | OK if all callers use workerTokenServiceV8 for persistence. |
| **workerTokenModalHelperV8** | Opens modal and/or fetches token (silent or show modal). | Depends on tokenGatewayV8 / workerTokenServiceV8. | Replaced by “open global modal” (dispatch event) on key pages; many V8 flows still use it and show WorkerTokenModalV8. |

### 2.3 Backend

| Endpoint | Purpose |
|----------|---------|
| `/api/pingone/token` | Proxy for worker token request (avoids CORS; single place for PingOne token URL). |
| `/api/credentials/sqlite/save`, `/load`, `/clear` | Credentials persistence (key `__worker_token__` for default worker credentials). |
| `/api/tokens/store`, `/api/tokens/query` | Token persistence in SQLite (unifiedTokenStorageService). |

---

## 3. Modal Inventory

### 3.1 Modals that obtain or show worker token

| Modal | File | How opened | Writes token to |
|-------|------|------------|------------------|
| **WorkerTokenModalV9** | `src/components/WorkerTokenModalV9.tsx` | App.tsx (global) on `open-worker-token-modal`; or local state on various pages | unifiedWorkerTokenService.saveToken → IndexedDB + SQLite + localStorage |
| **WorkerTokenModalV8** | `src/v8/components/WorkerTokenModalV8.tsx` | Local state on UnifiedFlowSteps, WorkerTokenUIServiceV8, MFAFlowBaseV8, MFADeviceCreateDemoV8, DeviceAuthenticationDetailsV8, FIDO2ConfigurationPageV8, MFAAuthenticationMainPageV8, WorkerTokenSectionV8, TokenMonitoringPage, UnifiedOAuthFlowV8U, plus locked copies. *(DeleteAllDevicesUtilityV8, UnifiedErrorDisplayV8, CredentialsFormV8U migrated to event.)* | unifiedWorkerTokenService (same as V9) |
| **WorkerTokenRequestModal** | `src/components/WorkerTokenRequestModal.tsx` | Educational “request” modal; can call `fetch(tokenEndpoint)` directly if no `onSendRequest` | N/A (display only unless used with callback that saves) |
| **WorkerTokenRequestModalV8** | `src/v8/components/WorkerTokenRequestModalV8.tsx` | From WorkerTokenModalV8 (e.g. “Send Request” step) | workerTokenServiceV8.saveToken |

**Target:** Only **WorkerTokenModalV9** is used to get a worker token. All “Get worker token” / “Fix token” actions dispatch `open-worker-token-modal` and App shows WorkerTokenModalV9. WorkerTokenModalV8 and WorkerTokenRequestModal(V8) are either removed from the open path or reduced to legacy/optional.

### 3.2 Where each modal is rendered (for migration)

- **WorkerTokenModalV9:** App.tsx (global), HelioMartPasswordReset, PingOneApplicationPickerModal, ConfigurationURIChecker, WorkerTokenFlowV9, SDKExamplesHome, WorkerTokenTester, CustomDomainTestPage.
- **WorkerTokenModalV8:** UnifiedFlowSteps, workerTokenUIServiceV8, MFAFlowBaseV8, MFADeviceCreateDemoV8, DeviceAuthenticationDetailsV8, FIDO2ConfigurationPageV8, MFAAuthenticationMainPageV8, WorkerTokenSectionV8, TokenMonitoringPage, UnifiedOAuthFlowV8U, plus locked/snapshot copies. *(Migrated off V8 modal: DeleteAllDevicesUtilityV8, UnifiedErrorDisplayV8, CredentialsFormV8U.)*

Pages that already use **only** the event (no local modal): TokenStatusPageV8U, WorkerTokenStatusDisplayV8, UserInfoPostFlow, PingOneLogoutFlow.

---

## 4. Hardcoded / Non-Service Usage

- **WorkerTokenModalV8** builds token URL: `https://${domain}/${environmentId}/as/token` (e.g. `auth.pingone.com`). It also uses `pingOneFetch(requestDetails.tokenEndpoint, ...)` for the request. So V8 modal can call PingOne directly (CORS permitting) instead of always using `/api/pingone/token`.
- **WorkerTokenModalV9** correctly uses `fetch('/api/pingone/token', ...)` (backend proxy).
- **WorkerTokenRequestModal** takes `tokenEndpoint` and can `fetch(tokenEndpoint)` unless `onSendRequest` is provided.
- **workerTokenManager** (and thus workerTokenRepository) does not use unifiedWorkerTokenService for **saving** the token; it uses only localStorage via unifiedStorageManager. So tokens obtained by the manager are not in IndexedDB/SQLite.
- **unifiedWorkerTokenService.buildTokenEndpoint** uses fixed hostnames (`auth.pingone.com`, `.eu`, `.asia`, `.ca`) for region — this is acceptable as configuration, not a “hardcoded live call” from the client.

**Recommendation:** All token **requests** from the browser go through the backend proxy. All token **saves** go through unifiedWorkerTokenService so that unifiedTokenStorage (IndexedDB + SQLite) is used.

---

## 5. Storage Flow (Credentials vs Token)

### 5.1 Credentials

- **Save:** unifiedWorkerTokenService.saveCredentials → `_saveCredentialsToSQLite` + unifiedTokenStorage.storeWorkerTokenCredentials + memory + localStorage.
- **Load:** unifiedWorkerTokenService._loadCredentials: SQLite first, then memory, IndexedDB, localStorage, legacy keys.
- **Result:** SQLite is source of truth for credentials; IndexedDB/localStorage are cache. OK.

### 5.2 Token (access token)

- **Path A (WorkerTokenModalV9 / V8):** unifiedWorkerTokenService.saveToken → unifiedTokenStorage.saveWorkerToken → storeToken → **IndexedDB + SQLite** + localStorage `unified_worker_token`. OK.
- **Path B (workerTokenManager after fetch):** workerTokenManager.saveToken → workerTokenRepository.saveToken → unifiedStorageManager.save → **localStorage only**. Not written to IndexedDB or SQLite.
- **Result:** Path B should be removed or redirected so that when workerTokenManager (or useGlobalWorkerToken) obtains a token, it is saved via unifiedWorkerTokenService.saveToken so the same storage service (IndexedDB + SQLite) is used.

---

## 6. Simplification Recommendations

1. **Single modal**
   - Use **only WorkerTokenModalV9** for obtaining the worker token.
   - Every “Get worker token” / “Fix token” / “Manage token” action dispatches `open-worker-token-modal`. App.tsx shows WorkerTokenModalV9 with optional wait screen.
   - Migrate all pages that currently render WorkerTokenModalV8 (or open it via workerTokenModalHelperV8) to dispatch `open-worker-token-modal` and remove local WorkerTokenModalV8 rendering.
   - Keep WorkerTokenModalV8 only for locked/snapshot code if required; main app and v8u/v8 active code should not open it.

2. **Single retrieval and write path**
   - **Read:** All callers that need a worker token use **unifiedWorkerTokenService.getToken()** (or workerTokenServiceV8.getToken() which delegates). useGlobalWorkerToken should prefer unifiedWorkerTokenService.hasValidTokenSync/getTokenDataSync first and only call workerTokenManager when unified has no token and auto-fetch is desired; when manager fetches a token, it should **save via unifiedWorkerTokenService.saveToken** so the token is in IndexedDB + SQLite.
   - **Write:** Every token save goes through **unifiedWorkerTokenService.saveToken** (and thus unifiedTokenStorage.saveWorkerToken → IndexedDB + SQLite). Deprecate workerTokenRepository for token persistence in favor of unifiedWorkerTokenService (or make repository delegate to unifiedWorkerTokenService for token save).

3. **No hardcoded token requests from the client**
   - All browser-originated token requests go to **`/api/pingone/token`** (backend proxy). Remove or refactor WorkerTokenModalV8 so it does not call `pingOneFetch(tokenEndpoint)` directly; either use the proxy or open the global V9 modal.

4. **Storage consistency**
   - Credentials: already correct (SQLite + cache).
   - Token: ensure workerTokenManager (and any other fetcher) saves the token with unifiedWorkerTokenService.saveToken so that IndexedDB and SQLite are updated. Optionally reduce or remove workerTokenRepository’s token storage so there is a single place (unifiedWorkerTokenService + unifiedTokenStorage) for token persistence.

---

## 7. Plan to Check All Files in `/src`

Use this as a checklist to ensure no hardcoded usage, no stray modals, and consistent use of the chosen service and storage.

### 7.1 Search patterns (run in `/src`)

- `WorkerTokenModal` (V8, V9, or no suffix)
- `open-worker-token-modal` | `showWorkerTokenModal` | `setShowWorkerTokenModal`
- `workerTokenManager` | `workerTokenRepository` | `workerTokenServiceV8` | `unifiedWorkerTokenService`
- `handleShowWorkerTokenModal` | `workerTokenModalHelperV8`
- `getWorkerToken` | `getToken()` in worker-token context
- `saveToken` in worker-token context
- `auth.pingone` + `token` or `/as/token`
- `pingOneFetch` with token endpoint

### 7.2 Files to audit (non-locked, under `src/`)

**Modals and opening flow**

- [ ] `src/App.tsx` — global WorkerTokenModalV9 and `open-worker-token-modal` listener.
- [ ] `src/components/WorkerTokenModalV9.tsx` — uses unifiedWorkerTokenService; requests via `/api/pingone/token`.
- [ ] `src/components/WorkerTokenModalV8.tsx` — replace opening with event or refactor to use proxy only.
- [ ] `src/components/WorkerTokenModal.tsx` — legacy; ensure it uses unifiedWorkerTokenService and does not add a second modal flow.
- [ ] `src/components/WorkerTokenRequestModal.tsx` — ensure no direct PingOne URL when used; prefer proxy.
- [ ] `src/v8/components/WorkerTokenRequestModalV8.tsx` — same; save via workerTokenServiceV8 (unified).

**Pages that render a worker token modal**

- [x] `src/v8/pages/DeleteAllDevicesUtilityV8.tsx` — switch to `open-worker-token-modal`, remove WorkerTokenModalV8. **(Done)**
- [x] `src/v8u/components/CredentialsFormV8U.tsx` — switch to event, remove local WorkerTokenModalV8. **(Done)**
- [ ] `src/v8u/components/UnifiedFlowSteps.tsx` — switch to event, remove local WorkerTokenModalV8.
- [ ] `src/v8/services/workerTokenUIServiceV8.tsx` — switch to event, remove local WorkerTokenModalV8.
- [ ] `src/v8/flows/shared/MFAFlowBaseV8.tsx` — switch to event, remove local WorkerTokenModalV8.
- [ ] `src/v8/pages/MFADeviceCreateDemoV8.tsx` — switch to event, remove local WorkerTokenModalV8.
- [ ] `src/v8/pages/DeviceAuthenticationDetailsV8.tsx` — switch to event, remove local WorkerTokenModalV8.
- [x] `src/v8/flows/unified/components/UnifiedErrorDisplayV8.tsx` — switch to event, remove local WorkerTokenModalV8. **(Done)**
- [ ] `src/pages/security/HelioMartPasswordReset.tsx` — use event + global modal or keep single local V9 modal.
- [ ] `src/components/PingOneApplicationPickerModal.tsx` — use event or keep single local V9 modal.
- [ ] `src/components/ConfigurationURIChecker.tsx` — use event or keep single local V9 modal.
- [ ] `src/pages/flows/v9/WorkerTokenFlowV9.tsx` — use event or keep single local V9 modal.
- [ ] `src/pages/sdk-examples/SDKExamplesHome.tsx` — use event or keep single local V9 modal.
- [ ] `src/pages/WorkerTokenTester.tsx` — use event or keep single local V9 modal.
- [ ] `src/pages/CustomDomainTestPage.tsx` — use event; already uses V9 modal, ensure no V8 helper for open.

**Services**

- [ ] `src/services/unifiedWorkerTokenService.ts` — credentials SQLite + token via unifiedTokenStorage (IndexedDB + SQLite).
- [ ] `src/services/unifiedTokenStorageService.ts` — saveWorkerToken → IndexedDB + SQLite; no bypass.
- [ ] `src/services/workerTokenManager.ts` — after fetch, save via unifiedWorkerTokenService.saveToken (not only repository).
- [ ] `src/services/workerTokenRepository.ts` — token save: delegate to unifiedWorkerTokenService or deprecate token save.
- [ ] `src/services/workerTokenServiceV8.ts` — remains thin wrapper over unifiedWorkerTokenService.
- [ ] `src/v8/utils/workerTokenModalHelperV8.ts` — only opens modal via event (no silent fetch that bypasses unified storage).

**Hooks and consumers**

- [ ] `src/hooks/useGlobalWorkerToken.ts` — prefer unifiedWorkerTokenService; when workerTokenManager fetches, save with unifiedWorkerTokenService.saveToken.
- [ ] `src/v8/services/mfaServiceV8.ts` — getWorkerToken from workerTokenServiceV8 only (already delegates to unified).
- [ ] `src/v8/services/workerTokenStatusServiceV8.ts` — reads from workerTokenServiceV8 / unified only.
- [ ] `src/v8/services/workerTokenCacheServiceV8.ts` — uses unifiedWorkerTokenService; OK.
- [ ] `src/v8/services/appDiscoveryServiceV8.ts` — uses workerTokenServiceV8; OK.

**Other**

- [ ] `src/v8/components/WorkerTokenStatusDisplayV8.tsx` — already dispatches `open-worker-token-modal`; no local modal.
- [ ] `src/v8/components/WorkerTokenSectionV8.tsx` — ensure it does not open WorkerTokenModalV8; use event.
- [ ] Any file under `src/` that imports WorkerTokenModalV8 or WorkerTokenRequestModalV8 — change to dispatch event and remove local modal.

### 7.3 Locked / snapshot code

- Files under `src/locked/` can be audited later or left as-is if they are frozen snapshots. Prefer not adding new WorkerTokenModalV8 usage there.

### 7.4 Full list of files under `/src` that reference worker token (exclude `locked/` for active code)

Use this list to ensure each file uses the single modal and storage service. (Locked/snapshot copies under `src/locked/` can be audited separately.)

**App & global modal**

- `src/App.tsx`
- `src/components/WorkerTokenModalV9.tsx`
- `src/components/WorkerTokenModalV8.tsx`
- `src/components/WorkerTokenModal.tsx`
- `src/components/WorkerTokenRequestModal.tsx` (if present in src)
- `src/v8/components/WorkerTokenRequestModalV8.tsx`

**Pages that open or render a worker token modal**

- `src/v8/pages/DeleteAllDevicesUtilityV8.tsx` *(migrated: uses open-worker-token-modal)*
- `src/v8u/pages/TokenStatusPageV8U.tsx`
- `src/v8u/components/CredentialsFormV8U.tsx` *(migrated: uses open-worker-token-modal)*
- `src/v8u/components/UnifiedFlowSteps.tsx`
- `src/v8/services/workerTokenUIServiceV8.tsx`
- `src/v8/flows/shared/MFAFlowBaseV8.tsx`
- `src/v8/pages/MFADeviceCreateDemoV8.tsx`
- `src/v8/pages/DeviceAuthenticationDetailsV8.tsx`
- `src/v8/flows/unified/components/UnifiedErrorDisplayV8.tsx` *(migrated: uses open-worker-token-modal)*
- `src/v8/lockdown/fido2/snapshot/MFAAuthenticationMainPageV8.tsx`
- `src/v8/lockdown/fido2/snapshot/FIDO2ConfigurationPageV8.tsx`
- `src/pages/security/HelioMartPasswordReset.tsx`
- `src/components/PingOneApplicationPickerModal.tsx`
- `src/components/ConfigurationURIChecker.tsx`
- `src/pages/flows/v9/WorkerTokenFlowV9.tsx`
- `src/pages/sdk-examples/SDKExamplesHome.tsx`
- `src/pages/WorkerTokenTester.tsx`
- `src/pages/CustomDomainTestPage.tsx`
- `src/pages/flows/UserInfoPostFlow.tsx`
- `src/pages/flows/PingOneLogoutFlow.tsx`

**Components that show status or open modal**

- `src/v8/components/WorkerTokenStatusDisplayV8.tsx`
- `src/v8/components/WorkerTokenSectionV8.tsx`
- `src/v8/components/WorkerTokenExpiryBannerV8.tsx`
- `src/components/WorkerTokenSectionV9.tsx`
- `src/components/WorkerTokenStatusLabel.tsx`

**Services (core)**

- `src/services/unifiedWorkerTokenService.ts`
- `src/services/unifiedTokenStorageService.ts`
- `src/services/workerTokenManager.ts`
- `src/services/workerTokenRepository.ts`
- `src/v8/services/workerTokenServiceV8.ts`
- `src/v8/utils/workerTokenModalHelperV8.ts`
- `src/v8/services/mfaServiceV8.ts`
- `src/v8/services/mfaAuthenticationServiceV8.ts`
- `src/v8/services/appDiscoveryServiceV8.ts`
- `src/v8/services/workerTokenCacheServiceV8.ts`
- `src/v8/services/workerTokenStatusServiceV8.ts`
- `src/v8/services/globalWorkerTokenService.ts`
- `src/v8/services/auth/tokenGatewayV8.ts`
- `src/services/workerTokenCredentialsService.ts`
- `src/services/aiAssistantWorkerTokenService.ts`
- `src/services/v9/V9WorkerTokenStatusService.ts`

**Hooks**

- `src/hooks/useGlobalWorkerToken.ts`
- `src/v8/hooks/useWorkerToken.ts`

**Other references**

- `src/components/AIAssistant.tsx`
- `src/components/DiscoveryPanel.tsx`
- `src/services/flowHeaderService.tsx`
- `src/pages/Configuration.tsx`
- `src/pages/ClientGenerator.tsx`
- `src/utils/productionAppCredentialHelperV2.ts`
- `src/utils/productionAppCredentialHelper.ts`
- `src/v8/flows/unified/components/UnifiedConfigurationStep.tsx`
- `src/v8u/services/tokenMonitoringService.ts`
- `src/pages/AdvancedConfiguration.tsx`
- `src/v8u/components/CompactAppPickerV8U.tsx`
- `src/v8/flows/unified/components/UnifiedActivationStep.modern.tsx`
- `src/pages/JWKSTroubleshooting.tsx`
- `src/services/unifiedWorkerTokenBackupServiceV8.ts`
- `src/services/comprehensiveCredentialsService.tsx`
- `src/services/commonImportsService.ts`
- `src/hooks/useAutoEnvironmentId.ts`
- Plus remaining flows/pages that reference worker token (MFAFlow, PingOneUserProfile, EnvironmentManagementPageV8, etc.).

### 7.5 Verification commands

```bash
# From repo root
grep -Rl "WorkerTokenModalV8\|WorkerTokenModalV9\|WorkerTokenModal[^V]" src --include="*.tsx" --include="*.ts" | grep -v locked
grep -Rn "open-worker-token-modal\|showWorkerTokenModal" src --include="*.tsx" --include="*.ts" | grep -v locked
grep -Rn "workerTokenManager\|workerTokenRepository\|unifiedWorkerTokenService\|workerTokenServiceV8" src --include="*.ts" --include="*.tsx" | grep -v locked
grep -Rn "auth\.pingone.*token\|/as/token" src --include="*.ts" --include="*.tsx" | grep -v locked
```

---

## 8. UX & behavior requirements

### 8.1 Checkboxes (Silent API Retrieval, Show Token at End)

- **Must work:** The "Silent API Token Retrieval" and "Show Token at End" (or "Show Token After Generation") checkboxes must be **functional and persist**. State is stored in **MFAConfigurationServiceV8** / **WorkerTokenConfigServiceV8** and must load/save correctly so toggles are not lost on refresh or navigation.
- **Fix if broken:** If checkboxes do not reflect saved state or do not persist, fix the config load/save path (WorkerTokenConfigServiceV8, MFA config save, `mfaConfigurationUpdated` / `workerTokenConfigUpdated` events) so all surfaces that show these checkboxes read from and write to the same source.

### 8.2 Modal behavior (silent vs show modal)

- **When credentials exist:** Use **silent** retrieval when the "Silent API Retrieval" checkbox is ON: try to fetch the worker token in the background without showing the modal. Only show the modal if the user explicitly clicks "Get Worker Token" (always show in that case) or if silent retrieval fails (e.g. network error) and the user needs to fix credentials.
- **When no credentials exist:** Show the modal so the user can enter and save credentials. **Once credentials are set and saved** (via WorkerTokenModalV9 or any form that calls **unifiedWorkerTokenService.saveCredentials()**), they persist in **IndexedDB and SQLite**, so "no credentials" should not recur unless the user clears them or uses a different environment.
- **Persistence:** Credentials are stored by unifiedWorkerTokenService to SQLite (source of truth) and IndexedDB/localStorage (cache). No credentials should be "lost" after first set unless explicitly cleared.

### 8.3 Configuration / credential changes and modal pick-up

- **Single source of truth:** Any UI that lets the user **change worker token credentials** (e.g. Configuration page, credential form, or worker-token section) must persist via **unifiedWorkerTokenService.saveCredentials()** so that **IndexedDB and SQLite** are both updated.
- **Modal sees the change:** The Worker Token modal loads credentials when it opens (**loadExistingCredentials** in useEffect when **isOpen**). So when the user changes credentials in Configuration (or elsewhere) and that code calls **unifiedWorkerTokenService.saveCredentials()**, the **next time the user opens the modal** it will load the updated credentials. No extra event is required if the modal always reloads on open.
- **Optional:** If the modal is already open while the user changes credentials elsewhere, consider dispatching a custom event (e.g. `workerCredentialsUpdated`) and having the modal listen and call **loadExistingCredentials()** so it refreshes without closing/reopening.

### 8.4 Button colors and labels (Worker Token modal and surfaces)

- **Get Worker Token:** **Red** button when the user does not have a valid token (or wants to fetch a new one). Primary action to obtain the token. Label: "Get Worker Token".
- **Clear Token:** **Yellow** button to clear the current worker token from storage. Does not remove credentials. Label: "Clear Token".
- **Update Token:** **Blue** button when the user already has a worker token and wants to refresh or get a new one. Shown only when a token is already present. Label: "Update Token".

These apply to **WorkerTokenModalV9** and, where applicable, to any other surface that exposes Get/Clear/Update worker token actions (e.g. WorkerTokenSectionV8, status displays).

---

## 9. Summary Checklist

- [ ] Only one modal is used to get worker token: **WorkerTokenModalV9**, opened via **`open-worker-token-modal`**.
- [ ] All token **reads** go through **unifiedWorkerTokenService** (or workerTokenServiceV8 wrapper).
- [ ] All token **writes** go through **unifiedWorkerTokenService.saveToken** so storage is **IndexedDB + SQLite** (and optional localStorage cache).
- [ ] No client-side token request goes directly to PingOne; all go through **`/api/pingone/token`**.
- [ ] workerTokenManager, when it fetches a token, **saves it via unifiedWorkerTokenService.saveToken**.
- [ ] No new uses of WorkerTokenModalV8 in active code; existing uses migrated to dispatch event and use global WorkerTokenModalV9.
- [ ] Checkboxes (Silent API Retrieval, Show Token at End) work and persist (Section 8.1).
- [ ] Modal uses silent retrieval when credentials exist and checkbox is ON; shows modal when no credentials or user clicks Get Worker Token (Section 8.2).
- [ ] Any Configuration (or other) credential form that edits worker credentials calls unifiedWorkerTokenService.saveCredentials() so modal picks up changes (Section 8.3).
- [ ] Buttons: Get Worker Token = red, Clear Token = yellow, Update Token = blue (Section 8.4).
