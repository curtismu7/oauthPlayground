# Update Log & Regression Prevention Plan

## 1. Purpose

This document:

- **Tracks** what was changed and why, so we don’t lose context.
- **Prevents regressions** by listing verification steps and “do not break” areas.
- **Guides** where to look when a bug reappears (“we just fixed this”).

**Update this document on every fix or refactor** so the team can run a short checklist and avoid reintroducing known issues.

---

## 2. How to Use This Doc

| When                        | Action                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Before a refactor**       | Read “Regression checklist” and “Do-not-break areas” for the code you’re touching.              |
| **After every fix**         | Add an entry under “Update log” and, if needed, a regression item under “Regression checklist”. |
| **When a bug “comes back”** | Search this doc for the feature (e.g. “environments”, “worker token”); run the listed checks.   |
| **Release / PR**            | Optionally run the “Quick regression checklist” before merge.                                   |

**IDE and agents:** A Windsurf rule (`.windsurf/rules/regression-plan-check.mdc`) runs when editing regression-sensitive files (sidebar, navbar, worker token, discovery, flow UI, etc.). It tells the agent to read this doc (Section 4 and 7) before changes and to add an Update log entry and run the relevant checks after every fix. That is the standard way for the IDE and agents to avoid reintroducing the errors listed here.

**Automation:** The regression prevention process is fully automated through Windsurf workflows (`.windsurf/workflows/regression-prevention.md`) which provides step-by-step guidance and ensures compliance before allowing commits.

---

## 3. Update Log

_(Newest first. **Update this section on every fix.** Add date and one-line summary; link to files or PRs if useful.)_

### Fix navigation method calls in UnifiedRegistrationStep.modern (2026-03-13)
- **What:** UnifiedRegistrationStep.modern.tsx was calling non-existent navigation methods (nav.previous(), nav.next()) causing TypeError.
- **Fixes:** (1) **Updated navigation calls**: Replaced nav.previous() with nav.goToPrevious() and nav.next() with nav.goToNext(). (2) **Used correct hook methods**: Fixed calls to match useStepNavigationV8 hook interface. (3) **Resolved TypeError**: Fixed "nav.previous is not a function" error that was breaking navigation.
- **Files:** `src/v8/flows/unified/components/UnifiedRegistrationStep.modern.tsx`
- **Regression check:** Navigate through MFA registration steps → Previous/Next buttons work correctly. No more TypeError in console. Navigation between steps functions properly.

### Revert MCP server usage in Unified MFA and SharedCredentials (2026-03-13)
- **What:** Unified MFA and SharedCredentialsServiceV8 were incorrectly using MCP server for credential loading, when only AIAssistant should use MCP server.
- **Fixes:** (1) **Reverted UnifiedMFARegistrationFlowV8**: Removed MCP server credential loading and restored original localStorage/storage service loading chain. (2) **Reverted SharedCredentialsServiceV8**: Removed MCP server dependency and restored localStorage-only credential loading. (3) **Maintained separation**: Ensured Unified MFA and Unified OAuth use proxy/API infrastructure in server.js. (4) **AI-only MCP**: Confirmed only AIAssistant uses MCP server for credential management.
- **Files:** `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`, `src/v8/services/sharedCredentialsServiceV8.ts`
- **Regression check:** Unified MFA flow loads credentials from localStorage/storage services only. Configuration page (reverted) loads from localStorage. AIAssistant continues to use MCP server. All OAuth/MFA flows use server.js proxy endpoints, not MCP server.

### Username dropdown independence from environment ID (2026-03-13)
- **What:** Username dropdown in unified MFA flow was disabled when environment ID field was empty, preventing user search even though worker token modal handles environment context internally.
- **Fixes:** (1) **Made environmentId optional**: Updated UserSearchDropdownV8 props to make environmentId optional since worker token modal provides context. (2) **Removed disabled state**: Removed `disabled={!environmentId}` from username dropdown in unified MFA flow. (3) **Updated loading logic**: Modified loadUsers function and useEffect hooks to not require environment ID for API calls. (4) **Worker token context**: Let MFAServiceV8 handle environment ID internally when not provided.
- **Files:** `src/v8/components/UserSearchDropdownV8.tsx`, `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`
- **Regression check:** Navigate to `/v8/unified-mfa` with empty environment ID → username dropdown is enabled and functional. Click dropdown → opens user search modal → worker token modal handles environment context. Search works regardless of environment ID field state.

### MCP PingOne API debug logging (2026-03)
- **What:** Added logging to verify which host is used for PingOne API calls (api.pingone.com vs api.pingdemo.com).
- **Fix:** In `mcpCallPingOne`, log `host`, `region`, `method`, and truncated `path` via `writeToMcpLog` before each fetch. Check MCP logs to confirm host is api.pingone.com (or regional variant), never api.pingdemo.com.
- **Files:** `server.js`
- **Regression check:** Live MCP ON → "list all users" → inspect MCP log; host should be api.pingone.com or api.pingone.{tld}, never api.pingdemo.com.

### Unified MFA environment ID restoration from MCP server (2026-03-13)
- **What:** Unified MFA flow at `/v8/unified-mfa` wasn't restoring environment ID from stored MCP credentials, showing empty field instead of the stored environment ID.
- **Fixes:** (1) **MCP server as primary source**: Modified environment ID loading to first try `/api/mcp/server/credentials` before falling back to storage services. (2) **Sync to all storage**: When MCP credentials are loaded, sync environment ID to environmentIdPersistenceService, globalEnvironmentService, and localStorage. (3) **Maintain fallback chain**: Preserve existing fallback to storage services and localStorage if MCP server unavailable. (4) **Error handling**: Add proper try/catch with logging for MCP server failures.
- **Files:** `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`
- **Regression check:** Store credentials in Configuration page → navigate to `/v8/unified-mfa` → environment ID field should show the stored value. Refresh page → environment ID persists. MCP server unavailable → falls back to localStorage/stored services.

### MCP "fetch failed": use PingOne API host, not api.pingdemo.com (2026-03)

- **What:** Two Postman generator pages existed (`/postman-collection-generator` and `/postman-collection-generator-v9`) with near-identical UI but different services (postmanCollectionGeneratorV8 vs postmanCollectionGeneratorV9). Unified flows and MFA use V8.
- **Fix:** Removed V9 page and service. Kept single Postman Collection Generator at `/postman-collection-generator` using `postmanCollectionGeneratorV8`. Deleted `PostmanCollectionGeneratorV9.tsx` and `postmanCollectionGeneratorV9.ts`. Removed V9 route, sidebar entry, flowHeaderService config, and recentlyUpdatedApps badge.
- **Files:** `src/App.tsx`, `src/config/sidebarMenuConfig.ts`, `src/services/flowHeaderService.tsx`, `test-routes.js`; deleted `src/pages/v9/PostmanCollectionGeneratorV9.tsx`, `src/services/v9/postmanCollectionGeneratorV9.ts`
- **Regression check:** Open `/postman-collection-generator` → page loads; generate Unified + MFA collections; download works. Sidebar shows single "Postman Collection Generator" under Developer & Tools.

### Postman generators: consolidated to single V8 entry (2026-03)

- **What:** Two Postman generator pages existed (`/postman-collection-generator` and `/postman-collection-generator-v9`) with near-identical UI but different services (postmanCollectionGeneratorV8 vs postmanCollectionGeneratorV9). Unified flows and MFA use V8.
- **Fix:** Removed V9 page and service. Kept single Postman Collection Generator at `/postman-collection-generator` using `postmanCollectionGeneratorV8`. Deleted `PostmanCollectionGeneratorV9.tsx` and `postmanCollectionGeneratorV9.ts`. Removed V9 route, sidebar entry, flowHeaderService config, and recentlyUpdatedApps badge.
- **Files:** `src/App.tsx`, `src/config/sidebarMenuConfig.ts`, `src/services/flowHeaderService.tsx`, `test-routes.js`; deleted `src/pages/v9/PostmanCollectionGeneratorV9.tsx`, `src/services/v9/postmanCollectionGeneratorV9.ts`
- **Regression check:** Open `/postman-collection-generator` → page loads; generate Unified + MFA collections; download works. Sidebar shows single "Postman Collection Generator" under Developer & Tools.

### MCP "fetch failed": use PingOne API host, not api.pingdemo.com (2026-03)

- **What:** "List all users" returned `PingOne API call failed: fetch failed` because the server called `https://api.pingdemo.com/v1/environments/...`. `api.pingdemo.com` is the OAuth playground host, not the PingOne Management API.
- **Fix:** (1) `getStoredCustomDomain()` returns null when no custom domain stored (was returning DEFAULT_CUSTOM_DOMAIN). (2) `mcpCallPingOne` uses `buildRegionUrl(region)` when no valid custom domain; never uses `api.pingdemo.com` for PingOne API calls. (3) Try/catch around fetch surfaces cause (e.g. DNS, TLS).
- **Files:** `server.js` (getStoredCustomDomain, mcpCallPingOne)
- **Regression check:** Live ON → "list all users" → succeeds (or shows real PingOne error like 403). Server must call `https://api.pingone.com/...` (or regional variant), not api.pingdemo.com. Restart server after code changes.

### MCP "fetch failed": use PingOne API host, not api.pingdemo.com (2026-03)
- **What:** "List all users" returned "PingOne API call failed: fetch failed" because MCP used `api.pingdemo.com` (OAuth playground host) as the PingOne Management API base. That host serves the app, not the PingOne API, so the connection failed.
- **Fix:** `getStoredCustomDomain()` returns `null` when no custom domain stored (instead of DEFAULT_CUSTOM_DOMAIN). `mcpCallPingOne` uses `buildRegionUrl(region)` (api.pingone.com, api.pingone.eu, etc.) when no valid custom domain. Explicitly never use `api.pingdemo.com` for PingOne API calls.
- **Files:** `server.js` (getStoredCustomDomain, mcpCallPingOne)
- **Regression check:** Live ON → "Get worker token" → "List all users" → users list loads (or shows real PingOne error, e.g. 403). No "fetch failed". If custom domain is explicitly set in Configuration for a PingOne proxy, that domain is still used.

### MCP list users: "fetch failed" — use region-based PingOne host (2026-03)
- **What:** "List all users" returned `PingOne API call failed: fetch failed` because the server used `api.pingdemo.com` (OAuth playground host) instead of the PingOne Management API (`api.pingone.com` or regional variants).
- **Fix:** `getStoredCustomDomain()` returns null when no custom domain stored (no fallback to api.pingdemo.com). `mcpCallPingOne` uses `buildRegionUrl(region)` (api.pingone.com, .eu, .ca, etc.) when custom domain is null or explicitly api.pingdemo.com; never uses api.pingdemo.com for PingOne API calls.
- **Files:** `server.js`
- **Regression check:** With Live MCP on, ask "list all users" → call reaches api.pingone.com (or regional host), not api.pingdemo.com. Restart server after pulling changes.

### MCP list users: use api.pingone.com instead of api.pingdemo.com (2026-03)

- **What:** "List all users" returned "PingOne API call failed: fetch failed" — the server was calling `https://api.pingdemo.com/v1/environments/...` which is the OAuth playground host, not the PingOne Management API.
- **Fix:** `getStoredCustomDomain()` now returns null when no custom domain is stored (instead of DEFAULT_CUSTOM_DOMAIN). `mcpCallPingOne` uses `api.pingone.com` (or regional variant) when no valid custom domain; explicitly ignores `api.pingdemo.com` even if stored. Added try/catch around fetch to surface the underlying error cause.
- **Files:** `server.js`
- **Regression check:** Live ON → "Get worker token" → "List all users" → users returned (or real PingOne error like 403), not "fetch failed".

### MCP list users: "fetch failed" — use PingOne API host not api.pingdemo.com (2026-03)
- **What:** "List all users" returned "PingOne API call failed: fetch failed" because the server called `https://api.pingdemo.com/...` — the OAuth playground host, not the PingOne Management API.
- **Fix:** `getStoredCustomDomain()` returns null when no custom domain stored (was defaulting to api.pingdemo.com). `mcpCallPingOne` uses region-based host (api.pingone.com, api.pingone.eu, etc.) when customDomain is null or api.pingdemo.com. Never use api.pingdemo.com for PingOne Management API calls.
- **Files:** `server.js` (getStoredCustomDomain, mcpCallPingOne)
- **Regression check:** With no custom domain stored → "list all users" uses api.pingone.com (or region). Restart server after pull. If stored domain is api.pingdemo.com, it is ignored for API calls.

### MCP "fetch failed": use PingOne API host, not api.pingdemo.com (2026-03)
- **What:** "List all users" returned "PingOne API call failed: fetch failed" because the server was calling `https://api.pingdemo.com/...` — the OAuth playground host, not the PingOne Management API.
- **Fix:** `getStoredCustomDomain()` returns null when no custom domain is stored; `mcpCallPingOne` uses `buildRegionUrl(region)` (api.pingone.com, api.pingone.eu, etc.) when custom domain is null or `api.pingdemo.com`. Never use api.pingdemo.com for PingOne Management API calls.
- **Files:** `server.js`
- **Regression check:** "List all users" with worker token → succeeds or shows real PingOne error (401/403), not "fetch failed". Restart server after code changes.

### API key backup system implementation (2026-03-13)
- **What:** API keys (MCP, Groq, Brave Search) were only stored in primary locations with no redundancy, risking loss if storage fails.
- **Fixes:** (1) **ApiKeyBackupService**: Created comprehensive backup service with multi-location storage (localStorage, filesystem, primary). (2) **Backend endpoints**: Added `/api/api-key/backup` POST/GET endpoints for filesystem backup storage. (3) **Automatic backups**: Enhanced apiKeyService to automatically create backups after storing API keys. (4) **UI integration**: Added backup status display and manual backup/restore controls to ApiKeyConfiguration component. (5) **Health monitoring**: Added backup status checking and integrity verification with checksums.
- **Files:** `src/services/apiKeyBackupService.ts`, `src/services/apiKeyService.ts`, `server.js`, `src/components/ApiKeyConfiguration.tsx`
- **Regression check:** Store any API key → automatic backup created. Open Configuration page → backup status shows Primary/Local/File indicators. Click "Create Backup" → manual backup syncs to all locations. Click "Restore from Backup" → keys recovered from backup if primary storage lost. Check `~/.pingone-playground/credentials/api-keys-backup.json` exists after backup creation.

### Complete pages implementation & credential synchronization (2026-03-13)

- **What:** "List all users" and similar MCP queries showed "MCP query failed (500): Internal Server Error" instead of the actual PingOne error (e.g. token expired, 403 Forbidden, wrong region).
- **Fix:** (1) Client (`mcpQueryService`): read response body as text first, then JSON.parse; fallback chain for msg: answer, error, error_description, message, statusText. (2) Server (`mcpCallPingOne`): extract PingOne error from message, detail, error_description, error, code. (3) Server catch: safe `errMsg` extraction when error is not an Error instance.
- **Files:** `src/services/mcpQueryService.ts`, `server.js`
- **Regression check:** Trigger a 500 (e.g. invalid worker token, wrong env) → UI shows actual error (e.g. "Invalid token", "403 Forbidden") instead of generic "Internal Server Error". Check server logs for `[MCP Query] Error:` to debug root cause.

### MCP Query: surface real errors instead of "Internal Server Error" (2026-03)

- **What:** "List all users" and similar MCP queries showed "MCP query failed (500): Internal Server Error" instead of the actual PingOne error (e.g. token expired, 403 Forbidden, wrong region).
- **Fix:** (1) Client (`mcpQueryService`): read response body as text first, then JSON.parse; fallback chain for msg: answer, error, error_description, message, statusText. (2) Server (`mcpCallPingOne`): extract PingOne error from message, detail, error_description, error, code. (3) Server catch: safe `errMsg` extraction when error is not an Error instance.
- **Files:** `src/services/mcpQueryService.ts`, `server.js`
- **Regression check:** Trigger a 500 (e.g. invalid worker token, wrong env) → UI shows actual error (e.g. "Invalid token", "403 Forbidden") instead of generic "Internal Server Error". Check server logs for `[MCP Query] Error:` to debug root cause.

### MCP 500: surface actual PingOne error instead of "Internal Server Error" (2026-03)

- **What:** "List all users" and similar MCP queries showed `MCP query failed (500): Internal Server Error` instead of the real PingOne/API error.
- **Fix:** (1) Client: `mcpQueryService` reads response body as text first, then parses JSON; extracts msg from `answer`, `error`, `error_description`, `message`, or `response.statusText`. (2) Server: `mcpCallPingOne` extracts PingOne error from `message`, `detail`, `error_description`, `error`, `code`. Catch block uses safe `errMsg` for non-Error throws.
- **Files:** `src/services/mcpQueryService.ts`, `server.js`
- **Regression check:** Trigger a known error (e.g. invalid worker token, wrong env) → UI shows actual message (e.g. "401 Unauthorized" or PingOne detail), not generic "Internal Server Error". Check server logs for `[MCP Query] Error:` to debug root cause.

### MCP query: surface real server error instead of "Internal Server Error" (2026-03)

- **What:** When "list all users" (or other PingOne MCP calls) failed, the UI showed generic "MCP query failed (500): Internal Server Error" instead of the actual PingOne API error.
- **Fix:** (1) **Client** (`mcpQueryService`): Read response body as text first, then JSON.parse; fallback chain: `answer` → `error` → `error_description` → `message` → `statusText`; when JSON fails, use plain text if short and non-HTML. (2) **Server**: `mcpCallPingOne` extracts error from PingOne fields (`message`, `detail`, `error_description`, `error`, `code`); MCP catch uses safe `errMsg` extraction for non-Error throws.
- **Files:** `src/services/mcpQueryService.ts`, `server.js`
- **Regression check:** Live ON → "list all users" with invalid/expired worker token → UI shows actual PingOne error (e.g. "Access denied") not "Internal Server Error". Check server console `[MCP Query] Error:` for root cause.

### AI Assistant: MCP-primary when Live toggle is on (2026-03)

- **What:** With Live toggle ON, queries like "list users" still showed Groq's explanatory text ("When the Live toggle is on, a separate request...") instead of actually calling MCP and returning real PingOne data.
- **Fix:** Aligned main app AIAssistant with standalone: when `includeLive && isMcpQuery`, route directly to MCP (skip Groq). Use MCP result as primary content. When `isMcpQuery && !includeLive`, show "turn on Live" nudge. Removed redundant MCP call from Groq path.
- **Files:** `src/components/AIAssistant.tsx`
- **Regression check:** Live ON → ask "list users" or "show all apps" → MCP runs, real data in card. Live OFF → same query → "turn on Live" nudge. Non-MCP queries (OAuth, PKCE) still use Groq.

### AI Assistant: organize checkboxes, close button white background (2026-03)

- **What:** OAuth Assistant header had scattered checkboxes and a semi-transparent close button that blended with the red header.
- **Fix:** (1) Grouped checkboxes: Context (APIs, Specs, Workflows, Guide) and Connections (Web Brave, Live MCP) with `CheckboxGroup` and `CheckboxGroupDivider`. (2) Close button: solid white background (`#ffffff`), dark × icon (`#374151`), lighter gray hover.
- **Files:** `src/components/AIAssistant.tsx`
- **Regression check:** Open OAuth Assistant → checkboxes grouped (Context | Connections); close button has white background with dark ×; collapse/expand/close buttons still work.

### UserServiceV8: avoid ERROR log for expected "no worker token" (2026-03)

- **What:** Console showed `[UserServiceV8] List users error Error: Worker token not available` when opening MFA user search without a worker token. `checkWorkerTokenStatusSync()` and async `getToken()` can disagree (token expired, refresh failed), so the API is still called.
- **Fix:** In UserServiceV8.listUsers catch block, when the error is the expected "worker token not available" precondition, log at debug level instead of error. The UI (UserSearchDropdownV8) already handles this and shows "Worker token required" — no need for ERROR noise.
- **Files:** `src/v8/services/userServiceV8.ts`
- **Regression check:** Open `/v8/unified-mfa` → select device → open user search before getting worker token → no ERROR in console; UI shows worker token prompt. After getting token → user list loads.

### Unified MFA: Restart Flow button moved to bottom (2026-03)

- **What:** Restart Flow button was in the flow header; user wanted it at the bottom with Previous/Next.
- **Fix:** Removed `restart-flow-container` from MFAFlowBaseV8 flow-header; passed Restart Flow button as `children` to StepActionButtonsV8 so it renders with Previous/Next. Added `.restart-flow-button-bottom` styling for the bottom context.
- **Files:** `src/v8/flows/shared/MFAFlowBaseV8.tsx`
- **Regression check:** Open `/v8/unified-mfa` → select device → verify Restart Flow appears at bottom with Previous/Next; click Restart → confirm dialog → flow resets.

### Unified MFA: remove duplicate headers, migrate to red header (2026-03)

- **What:** Unified MFA at `/v8/unified-mfa` showed duplicate headers (blue "V8 SMS OTP Registration" + green "PingOne MFA Device Management") and duplicate rows of navigation buttons. Neither used the standard PingOne red header with white text.
- **Fix:** (1) Removed duplicate `MFAHeaderV8` from `UnifiedMFARegistrationFlowContent` when a device is selected; only `MFAFlowBaseV8`'s header is shown. (2) Passed `titleOverride` and `descriptionOverride` to `MFAFlowBaseV8` so device-specific titles appear. (3) `MFAFlowBaseV8` header already uses red gradient and white text. (4) Device selection screen `MFAHeaderV8` changed from `headerColor="blue"` to `headerColor="pingRed"`.
- **Files:** `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`, `src/v8/flows/shared/MFAFlowBaseV8.tsx`
- **Regression check:** Open `/v8/unified-mfa` → select "SMS OTP Registration" → one header ("SMS OTP Registration"), one row of nav buttons, red header with white text. Device selection screen shows red header with white text.

### Standalone AIAssistant sync with main app (worker token / MCP) (2026-03)

- **What:** Standalone AIAssistant (port 3002) needed to stay in sync with main app for worker token and MCP credential handling. "Get worker token" 403 could occur when credentials were not synced to mcp-config.json before MCP calls.
- **Fix:** Aligned `AIAssistant/src/services/unifiedWorkerTokenService.ts` with `src/services/unifiedWorkerTokenService.ts` (comments and formatting). Both AIAssistant components already call `unifiedWorkerTokenService.loadCredentials()` when opened with Live toggle on, priming SQLite load and mcp-config sync before the first MCP call. Standalone proxies `/api` to backend (3001), so save-mcp-config and sqlite endpoints behave identically.
- **Files:** `AIAssistant/src/services/unifiedWorkerTokenService.ts`, `AIAssistant/src/components/AIAssistant.tsx` (verified existing loadCredentials useEffect)
- **Regression check:** Save credentials via main app (Configuration or Worker Token modal) → open standalone AIAssistant (localhost:3002) with Live on → ask "Get worker token" or "Show all apps" → MCP returns real data. If 403 persists, verify Worker app has client_credentials grant and credentials are valid for the environment.

### Unified MFA: persist section collapse state (2026-03)

- **What:** Section collapse/expand state on Unified MFA device selection screen was lost on flow restart or browser refresh.
- **Fix:** (1) Added `unified-mfa-v8` to FlowType (specVersionServiceV8) and flowSettingsServiceV8U getAllSettings/clearAllSettings. (2) DeviceTypeSelectionScreen uses `usePersistedCollapse('unified-mfa-v8', sectionId, default)` for credentials (Configuration block), worker-token-status, and policy-details. (3) Configuration section has collapsible header; Policy Details uses persisted collapse instead of native `<details>`.
- **Files:** `src/v8/services/specVersionServiceV8.ts`, `src/v8u/services/flowSettingsServiceV8U.ts`, `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`
- **Regression check:** Open `/v8/unified-mfa` → collapse Configuration or Policy Details → refresh browser → sections stay collapsed. Restart flow (select device, go back) → collapse state persists.

### Complete pages implementation & credential synchronization (2026-03-13)

- **What:** Several pages showed "coming soon" or "under maintenance" messages, and credentials weren't syncing between Configuration page, unified flows, and MCP server storage.
- **Fixes:** (1) **SettingsPage**: Replaced placeholder with functional settings management (theme switching, notifications, language preferences, save/reset). (2) **ReportsPage**: Replaced placeholder with comprehensive reporting (report type selection, date ranges, mock generation, recent reports). (3) **UserManagementPage**: Fixed syntax errors and added mock user data with search/filter functionality. (4) **TokenMonitoringPage**: Fixed logger import crash in TokenDisplayService. (5) **Step components**: Implemented PollingStep (interactive token polling) and TokenRequestStep (OAuth token request form). (6) **Configuration page**: Added MCP server credential loading as primary source with localStorage fallback. (7) **SharedCredentialsServiceV8**: Added MCP server loading/saving for unified flow credential synchronization.
- **Files:** `src/v8u/pages/SettingsPage.tsx`, `src/v8u/pages/ReportsPage.tsx`, `src/v8u/pages/UserManagementPage.tsx`, `src/services/tokenDisplayService.ts`, `src/v8u/components/steps/PollingStep.tsx`, `src/v8u/components/steps/TokenRequestStep.tsx`, `src/pages/Configuration.tsx`, `src/v8/services/sharedCredentialsServiceV8.ts`
- **Regression check:** Open `/v8u/settings` → functional theme/settings controls work. Open `/v8u/reports` → report generation interface works. Open `/v8u/user-management` → user list with search/filter works. Open `/token/operations` → no maintenance message, shows TokenMonitoringPage. Open `/configuration` → credentials load from MCP server. Save credentials in unified flow → appear in Configuration page and persist across restarts.

### Unified MFA: persist section collapse state (2026-03)

- **What:** Collapsed/expanded state of sections in Unified MFA device selection screen was lost on flow restart or browser refresh.
- **Fix:** (1) Added `unified-mfa-v8` to FlowType and flowSettingsServiceV8U (getAllSettings, clearAllSettings). (2) DeviceTypeSelectionScreen uses `usePersistedCollapse('unified-mfa-v8', ...)` for `credentials` (Configuration block), `worker-token-status`, and `policy-details`. (3) Configuration section has collapsible header with persisted state. (4) Policy Details (policy-details) replaced native `<details>` with persisted collapse.
- **Files:** `src/v8/services/specVersionServiceV8.ts`, `src/v8u/services/flowSettingsServiceV8U.ts`, `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`
- **Regression check:** Open `/v8/unified-mfa` → collapse Configuration → refresh → Configuration stays collapsed. Collapse Policy Details → refresh → stays collapsed.

### Callback step: CSRF/state_expired retry button (2026-03)

- **What:** When CallbackHandler redirects with `?error=csrf_risk&reason=no_stored_state`, the callback step showed the error but the main Continue button stayed greyed; users had no clear retry path.
- **Fix:** In `renderStep2Callback`, when `callbackError === 'csrf_risk'` or `callbackError === 'state_expired'`, show a "Go Back to Authorization URL" button that calls `navigateToStep(2)` and clears the URL params via `window.history.replaceState`. Error and description are read from sessionStorage or URL (`searchParams`).
- **Files:** `src/v8u/components/UnifiedFlowSteps.tsx`
- **Regression check:** Trigger no_stored_state (e.g. clear sessionStorage, then land on callback URL) → step 3 shows error card with "Go Back to Authorization URL" → click → navigates to step 2 (Auth URL), URL params cleared; user can retry.

### Implicit Grant (V8U): redirect URI and Configuration catalog (2026-03)

- **What:** Unified OAuth Implicit flow needed correct redirect URI (`/oauth-implicit-callback`) and visibility in Configuration redirect URI catalog.
- **Fix:** (1) flowRedirectUriMapping: implicit-v8u callbackPath → `oauth-implicit-callback` (was `unified-callback`). (2) Added `implicit-v8u` to REDIRECT_URI_CATALOG_FLOW_TYPES so Configuration shows Implicit redirect URI. (3) callbackUriService: added `oauthImplicitCallback` for `/oauth-implicit-callback`; getCallbackTypesForFlow returns it for implicit-v8u before generic implicit check.
- **Files:** `src/utils/flowRedirectUriMapping.ts`, `src/services/callbackUriService.ts`
- **Regression check:** Open `/configuration` → "PingOne Redirect & Logout URIs" shows implicit-v8u row with `.../oauth-implicit-callback`. Open `/v8u/unified/implicit/0` → credentials redirect URI auto-fills `.../oauth-implicit-callback`. Add that URI in PingOne app; run Implicit flow → redirect succeeds.

### Unified OAuth: persist section collapse state (2026-03)

- **What:** Collapsed/expanded state of sections in Unified OAuth flow was lost on flow restart or browser refresh.
- **Fix:** (1) Extended FlowSettingsServiceV8U with `credentialsCollapsed`, `workerTokenStatusCollapsed`, and `sectionCollapsed` (Record<string, boolean>) per flow type. (2) Added `usePersistedCollapse(flowType, sectionId, defaultCollapsed)` hook that reads/writes to localStorage. (3) UnifiedOAuthFlowV8U uses the hook for credentials and worker token status. (4) UnifiedFlowSteps uses the hook for all educational sections (quick-start, pkce-overview, pkce-details, auth-request-_, device-code-_, client-credentials-_, authz-code-_, hybrid-_, implicit-_, preflight-validation).
- **Files:** `src/v8u/services/flowSettingsServiceV8U.ts`, `src/v8u/hooks/usePersistedCollapse.ts`, `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`, `src/v8u/components/UnifiedFlowSteps.tsx`
- **Regression check:** Collapse a section on `/v8u/unified/oauth-authz/0` or any step → refresh browser → section stays collapsed. Restart flow (navigate away and back) → section stays collapsed.

### run.sh: MCP Inspector integrated (2026-03)

- **What:** Users had to run `npm run mcp:inspector` separately to test the PingOne MCP server; no single-command startup.
- **Fix:** (1) Added `start_mcp_inspector()` to run.sh — starts `npx @modelcontextprotocol/inspector` with mcp-inspector-config.json. (2) MCP Inspector starts automatically in `-assistant` and `-both` modes (after MCP server). (3) kill_all_servers stops Inspector by PID file and port 6274. (4) Status banners and show_url_banner include MCP Inspector URL (http://localhost:6274). (5) Inspector logs to mcp-inspector.log.
- **Files:** `scripts/development/run.sh`
- **Regression check:** Run `./run.sh -both` or `./run.sh -assistant` → MCP Inspector starts; open http://localhost:6274 to test PingOne MCP tools. Run again to restart — Inspector is killed and restarted cleanly.

### run.sh: MCP Inspector auto-started with -assistant and -both (2026-03)

- **What:** Users had to run `npm run mcp:inspector` separately to test PingOne MCP tools.
- **Fix:** Integrated MCP Inspector into run.sh: (1) Added `start_mcp_inspector()` — starts `npx @modelcontextprotocol/inspector` in background, writes to mcp-inspector.log. (2) Calls it in `run_assistant_mode` and `run_both_mode` after MCP server. (3) kill_all_servers kills Inspector by PID file and port 6274. (4) Status banners and show_url_banner include MCP Inspector URL (http://localhost:6274).
- **Files:** `scripts/development/run.sh`
- **Regression check:** Run `./run.sh -both` or `./run.sh -assistant` → MCP Inspector starts with other services; open http://localhost:6274 to test PingOne MCP tools; re-run script → Inspector is killed and restarted cleanly.

### run.sh: MCP Inspector integrated (2026-03)

- **What:** Users had to run a separate command (`npm run mcp:inspector`) to launch the MCP Inspector for testing PingOne MCP tools.
- **Fix:** (1) Added `start_mcp_inspector()` in run.sh — spawns `npx @modelcontextprotocol/inspector` with mcp-inspector-config.json. (2) MCP Inspector now starts automatically with `./run.sh -assistant` and `./run.sh -both`. (3) Added MCP_INSPECTOR_PORT (6274), MCP_INSPECTOR_PID_FILE; kill_all_servers stops Inspector. (4) Status banners and show_url_banner show MCP Inspector URL.
- **Files:** `scripts/development/run.sh`
- **Regression check:** Run `./run.sh -both` (or `./scripts/development/run.sh -both`) → MCP Inspector starts → open http://localhost:6274 → test PingOne MCP tools. Run `./run.sh` (main mode) → Inspector not started (only -assistant and -both include it).

### MCP Inspector: PingOne MCP server writes to project logs (2026-03)

- **What:** MCP Inspector sessions (`npm run mcp:inspector`) did not write to the project's logs; tool calls and errors went only to the terminal.
- **Fix:** (1) Enhanced `pingone-mcp-server` Logger to append each info/warn/error to `logs/mcp-server.log` in addition to console. (2) Log path: `MCP_LOG_PATH` env (full path), or `MCP_LOG_DIR` (dir for mcp-server.log), or default `process.cwd()/logs/mcp-server.log`. (3) Added `MCP_LOG_DIR: "logs"` to `mcp-inspector-config.json` so Inspector sessions write to project logs. Format matches server.js (`[timestamp] [local] [MCP] [LEVEL] [scope] message`).
- **Files:** `pingone-mcp-server/src/services/logger.ts`, `mcp-inspector-config.json`
- **Regression check:** Run `npm run mcp:inspector` from project root → call a tool (e.g. tools/list) → check `logs/mcp-server.log` for entries. Log Viewer (mcp category) shows them when backend serves logs.

### Unified OAuth flow: red header and V9FlowHeader migration (2026-03)

- **What:** `/v8u/unified/oauth-authz/0` used blue PageHeaderV8 instead of the standard red PingOne header with white text.
- **Fix:** (1) Added `oauth-authz-v8u` to `FLOW_CONFIGS` in flowHeaderService (flowType: 'pingone', title: "Unified OAuth/OIDC Flow", matching subtitle). (2) Replaced `PageHeaderV8` with `V9FlowHeader` in UnifiedOAuthFlowV8U. (3) Moved flow breadcrumbs and action buttons (Flow & Spec Comparison Guide, Postman downloads) into a separate card below the header.
- **Files:** `src/services/flowHeaderService.tsx`, `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`
- **Regression check:** Open `/v8u/unified/oauth-authz/0` — red header with white text "Unified OAuth/OIDC Flow"; breadcrumbs and buttons in card below; Flow & Spec Comparison Guide and Postman buttons still work.

### MCP: sync worker credentials to mcp-config so Live MCP works (2026-03)

- **What:** MCP "Get worker token" and PingOne API calls failed because the backend reads credentials from `mcp-config.json` (MCP Server Config page) while the Worker Token modal saves to SQLite via `unifiedWorkerTokenService`. The two stores were never synced.
- **Cause:** `_mcpReadCredentials()` only reads `mcp-config.json` or env vars. Users who saved credentials via the Worker Token modal never had them written to mcp-config.
- **Fix:** (1) Added `_syncCredentialsToMcpConfig()` in unifiedWorkerTokenService — maps region to apiUrl and POSTs to `/api/credentials/save-mcp-config`. (2) Call it after `_saveCredentialsToSQLite` succeeds. (3) Call it when loading credentials from SQLite so existing creds get synced on app load. (4) Both AI Assistant components call `unifiedWorkerTokenService.loadCredentials()` when opened with Live toggle on, priming the sync before the first MCP call. (5) Applied changes to both `src/services/unifiedWorkerTokenService.ts` and `AIAssistant/src/services/unifiedWorkerTokenService.ts`.
- **Files:** `src/services/unifiedWorkerTokenService.ts`, `AIAssistant/src/services/unifiedWorkerTokenService.ts`, `src/components/AIAssistant.tsx`, `AIAssistant/src/components/AIAssistant.tsx`
- **Regression check:** Save worker credentials via Worker Token modal (Get Worker Token) → open AI Assistant with Live toggle on → ask "Get worker token" or "Show all apps" → MCP card shows real data (not "unknown" or credentials required). Check `~/.pingone-playground/credentials/mcp-config.json` has environmentId, clientId, clientSecret after saving via modal.

### Log viewer popout: white background, black text; reduce blinking (2026-03)

- **What:** Log viewer popout had dark theme (dark background, light text), status indicator was pulsing (blinking), and frequent realtime refresh could cause visual flicker.
- **Fix:** (1) When `standalone` (popout) is true: LogContent uses white background (`#ffffff`) and black text (`#111827`); LogLine hover uses light overlay; LineNum uses gray (`#6b7280`). (2) StatusIndicator pulse animation disabled in standalone mode. (3) Realtime poll interval: 5s in standalone (was 2s) to reduce refresh-induced blinking.
- **Files:** `src/components/EnhancedFloatingLogViewer.tsx`
- **Regression check:** Open Log Viewer popout (`/v9/debug-logs-popout`) — main log area has white background and black text; status dot does not pulse; realtime updates every 5s. In-browser floating log viewer keeps dark theme.

### Worker Token V9: standard collapse icon (2026-03)

- **What:** Section collapse icons on `/flows/worker-token-v9` used the circular theme icon (CollapsibleHeader default) instead of the standard icon from COLLAPSIBLE_HEADER_UNIFICATION_PLAN (⬇️ in white box with blue border, -90° when collapsed).
- **Fix:** (1) Added `useUnifiedIcon?: boolean` to `CollapsibleHeaderProps` in collapsibleHeaderService; when true, renders `UnifiedFlowCollapsibleToggleIcon` (white box, blue border, ⬇️ emoji) instead of circular ArrowIcon. (2) ComprehensiveCredentialsService passes `useUnifiedIcon={flowType === 'worker-token-v9'}` to all CollapsibleHeader instances.
- **Files:** `src/services/collapsibleHeaderService.tsx`, `src/services/comprehensiveCredentialsService.tsx`
- **Regression check:** Open `/flows/worker-token-v9` — collapsible sections (App lookup, Worker Token credentials, Advanced Configuration, JWKS) show white box with blue border and ⬇️ icon; collapsed state points right (-90°). Other flows using ComprehensiveCredentialsService (non-worker-token) keep circular icon.

### Mock Flows: yellow Educational Mock banner at top (2026-03)

- **What:** The yellow "📚 Educational Mock Mode" banner at the top of `/flows/device-authorization-v9` was not present on all Mock flows.
- **Fix:** Added `V7MMockBanner` at the top (before flow header) to all Mock flows that lacked it: JWT Bearer Token, SAML Bearer Assertion, RAR, PAR, DPoP, SPIFFE/SPIRE, SAML SP Dynamic ACS. Replaced inline mock banners with shared `V7MMockBanner` for consistency.
- **Files:** `src/pages/flows/v9/JWTBearerTokenFlowV9.tsx`, `src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx`, `src/pages/flows/v9/RARFlowV9.tsx`, `src/pages/flows/v9/PARFlowV9.tsx`, `src/pages/flows/DPoPFlow.tsx`, `src/v8u/flows/SpiffeSpireFlowV8U.tsx`, `src/pages/flows/SAMLServiceProviderFlowV1.tsx`
- **Regression check:** Open each Mock flow from sidebar (OIDC mock, OAuth 2.0 mock, Unsupported) — yellow "Educational Mock Mode" banner appears at top before the flow header. Device Authorization, Client Credentials, Implicit, etc. already had it; verify they still do.

### Token Monitoring: red header and migration (2026-03)

- **What:** `/v8u/token-monitoring` lacked the standard red PingOne header with white text and had not been fully migrated to the V8U flow page pattern.
- **Fix:** (1) Added `token-monitoring-v8u` to `FLOW_CONFIGS` in flowHeaderService (flowType: 'pingone', title: "Token Monitoring Dashboard", subtitle for real-time token tracking). (2) Added `V9FlowHeader` to TokenStatusPageV8U at top of page. (3) Removed redundant PageHeader/PageTitle/PageDescription (header content now comes from FlowHeader).
- **Files:** `src/services/flowHeaderService.tsx`, `src/v8u/pages/TokenStatusPageV8U.tsx`
- **Regression check:** Open `/v8u/token-monitoring` — red header with white text "Token Monitoring Dashboard", subtitle visible. Worker/User token sections unchanged below.

### AI Assistant: Live toggle nudge when Live is ON (2026-03)

- **What:** When the Live toggle was ON, Groq still output "🔌 Live toggle is off..." and ##LIVE_NUDGE## because the server always used the same system prompt and never received `includeLive` from the client.
- **Cause:** `includeLive` was never sent to `/api/groq/chat` or `/api/groq/chat/stream`; the server always told the LLM to respond with the Live nudge for PingOne data requests.
- **Fix:** (1) Added `GROQ_SYSTEM_PROMPT_LIVE_ON` — when Live is ON, the prompt instructs the LLM to not say "Live toggle is off" or output ##LIVE_NUDGE##. (2) `/api/groq/chat` and `/api/groq/chat/stream` accept `includeLive` from the request body; when `includeLive === true`, use the Live-on prompt. (3) `groqService.callGroq` and `callGroqStream` accept optional `{ includeLive }`; both AIAssistant components pass it. (4) Added logging: `includeLive`, `liveOn` in Groq request logs.
- **Files:** `server.js`, `src/services/groqService.ts`, `AIAssistant/src/services/groqService.ts`, `src/components/AIAssistant.tsx`, `AIAssistant/src/components/AIAssistant.tsx`
- **Regression check:** Live toggle ON → ask "list users" or similar PingOne query → Groq reply does not contain "Live toggle is off" or ##LIVE_NUDGE##. Live toggle OFF → same query → nudge appears. Check AI logs for `includeLive`, `liveOn` in Groq request lines.

### Components and services: fix grey buttons (2026-03)

- **What:** Shared components and services had enabled buttons or hover states using grey (#f3f4f6, #f1f5f9, #e5e7eb), or used V9_COLORS as literal strings (no interpolation) so styles didn’t apply.
- **Fix:** (1) **DiscoveryPanel.tsx:** CloseButton and CopyButton hover changed from #f3f4f6 to #eff6ff (light blue). (2) **EnhancedFloatingLogViewer.tsx:** FilterChip inactive hover #f1f5f9 → #eff6ff; ToolbarBtn hover → #eff6ff and blue border/text; ControlButton popout hover #f1f5f9 → #e0f2fe. (3) **PingOneApplicationPicker.tsx:** CopyButton changed from ghost/grey to outline blue (white bg, #3b82f6 border, #2563eb text, hover #eff6ff). (4) **WorkerTokenModalV9.tsx:** Added V9_COLORS import; Button primary/danger use \${V9_COLORS...} interpolation; secondary variant changed to outline blue (white, blue border/text). (5) **ApiKeyConfiguration.tsx:** Button secondary variant changed to outline blue (blue border and text, hover blue-dark). (6) **EducationModeToggle.tsx:** ToggleButton inactive hover #e5e7eb → #eff6ff; DropdownItem hover/focus #f3f4f6 → #eff6ff. (7) **ClaimsRequestBuilder.tsx:** EssentialToggle when !essential: background #f3f4f6 → white with #e5e7eb border; hover → #eff6ff and blue border.
- **Files:** `src/components/DiscoveryPanel.tsx`, `src/components/EnhancedFloatingLogViewer.tsx`, `src/components/PingOneApplicationPicker.tsx`, `src/components/WorkerTokenModalV9.tsx`, `src/components/ApiKeyConfiguration.tsx`, `src/components/education/EducationModeToggle.tsx`, `src/components/ClaimsRequestBuilder.tsx`
- **Regression check:** Discovery/OIDC modal: close and copy buttons show light blue on hover. Log Viewer: toolbar and filter chips show blue hover. Worker Token modal: primary blue, secondary outline blue. Configuration API key section: secondary outline blue. Education toggle: blue-tinted hover. Claims builder: essential toggle off state white with blue hover.

### Sidebar menu pages: fix grey buttons (enabled state) (2026-03)

- **What:** Several pages linked from the side menu had action buttons (primary, secondary, copy, or default) styled with grey background when enabled, violating the rule "buttons never grey when enabled; grey only when disabled."
- **Fix:** (1) **RedirectlessFlowV9_Real.tsx:** Added `V9_COLORS` import; `LoginFormButton` primary uses interpolated `${V9_COLORS...}`; secondary changed to outline (white bg, blue border/text); `SignInButton` gradient uses interpolation. (2) **URLDecoder.tsx:** Added `V9_COLORS` import; `Button` secondary variant changed to outline primary; all variants use interpolation. (3) **HelioMartPasswordReset.tsx:** `Button` secondary, `CodeCollapseButton`, and `CodeButton` changed from grey fill to outline blue (white + blue border). (4) **PARvsRAR.tsx** and **CIBAvsDeviceAuthz.tsx:** `CopyButton` changed from grey to outline blue. (5) **OrganizationLicensing.tsx:** Non-primary button style changed from grey (`#6b7280`) to outline (white bg, blue border, blue text). (6) **McpServerConfig.tsx:** `Btn` default variant changed from grey to outline blue. (7) **ApplicationGenerator.tsx:** Button default (secondary) variant changed from grey-tinted white to outline blue.
- **Files:** `src/pages/flows/RedirectlessFlowV9_Real.tsx`, `src/pages/URLDecoder.tsx`, `src/pages/security/HelioMartPasswordReset.tsx`, `src/pages/PARvsRAR.tsx`, `src/pages/CIBAvsDeviceAuthz.tsx`, `src/pages/OrganizationLicensing.tsx`, `src/pages/McpServerConfig.tsx`, `src/pages/ApplicationGenerator.tsx`
- **Regression check:** Open each updated page from the side menu; primary/main actions show blue or theme color; secondary and copy-style buttons show outline blue (white + blue border). Grey only when a button is disabled.

### Ultimate Token Display Demo: fix grey buttons (2026-03)

- **What:** Buttons on `/ultimate-token-display-demo` appeared grey because `V9_COLORS` was not imported and was used as a literal string in styled-component CSS (invalid values). Secondary/default action buttons also used grey fill when enabled.
- **Fix:** (1) **UltimateTokenDisplay.tsx:** Import `V9_COLORS` from `@/services/v9/V9ColorStandards`; in `ActionButton` use template interpolation (`${V9_COLORS.PRIMARY.BLUE}` etc.) for all variants; change default (secondary) variant to outline primary (white bg, blue border/text) so enabled buttons are never grey; add explicit disabled styles using grey. (2) **UltimateTokenDisplayDemo.tsx:** Import `V9_COLORS`; interpolate in all styled components (Button, \_Title, \_Subtitle, ControlPanel, ControlLabel, Select, Checkbox, SectionTitle) and in inline style objects for feature cards.
- **Files:** `src/components/UltimateTokenDisplay.tsx`, `src/pages/UltimateTokenDisplayDemo.tsx`
- **Regression check:** Open `/ultimate-token-display-demo` — primary actions (Copy, Decode JWT, Analyze) show blue/green/amber; secondary-style actions show outline blue. Demo page control buttons show blue gradient. Grey only when a button is disabled.

### SecurityScorecard: unified collapsible header (2026-03)

- **What:** Security Scorecard section now uses the same collapsible header style as Advanced OAuth Features, Flow Guidance, and Configuration (green gradient, white box with blue border, ⬇️ icon, -90° when collapsed).
- **Changes:** Replaced local `CollapsibleHeaderButton`, `CollapsibleTitle`, `CollapsibleToggleIcon`, and `CollapsibleContent` in `SecurityScorecard.tsx` with `UnifiedFlowCollapsibleSection`, `UnifiedFlowCollapsibleHeaderButton`, `UnifiedFlowCollapsibleTitle`, `UnifiedFlowCollapsibleToggleIcon`, and `UnifiedFlowCollapsibleContent` from `collapsibleHeaderService`. Outer `ScorecardContainer` retained for card styling.
- **Files:** `src/v8u/components/SecurityScorecard.tsx`
- **Regression check:** Open a page that shows Security Scorecard (e.g. `/v8u/unified/oauth-authz` step 0 if present, or any flow that renders SecurityScorecard). Collapse/expand the "Security Scorecard" section — icon should match other unified sections (⬇️ in white box, points right when collapsed, down when expanded). Score, categories, and recommendations unchanged.

### PingOneApplicationPicker: stop auto-fetch loop on 401 (2026-03)

- **What:** On `/flows/worker-token-v9`, when the applications API returns 401, the picker was re-running the auto-fetch effect on every render, causing an infinite loop of GET requests and console errors.
- **Cause:** The effect condition (credentials present, `applications.length === 0`, `!loading`) stayed true after a failed fetch, so each `setLoading(false)` re-render triggered the effect again.
- **Fix:** Introduced `autoFetchAttemptedRef`: auto-fetch runs only once per credential set; when it fails we do not retry automatically. Ref is reset when `environmentId` / `clientId` / `clientSecret` / `workerToken` change. Manual "Refresh" still calls `fetchApplications()` and is unchanged.
- **Files:** `src/components/PingOneApplicationPicker.tsx`
- **Regression check:** Open `/flows/worker-token-v9` with credentials that produce 401 from `/api/pingone/applications` — one request and one error in console; no repeated GETs. Click Refresh to retry; changing credentials and re-entering the page allows one new auto-fetch.

### Redirectless V9 Real: red PingOne header and FlowHeader config (2026-03)

- **What:** `/flows/redirectless-v9-real` now shows the standard PingOne UI: red header with white text via FlowHeader, and the "No configuration found for flow ID/type: redirectless-v9" warning is resolved.
- **Changes:** (1) **flowHeaderService.tsx:** Added `redirectless-v9` and `redirectless-v9-real` to `FLOW_CONFIGS` with `flowType: 'pingone'` (red gradient, white text), title "Redirectless Login (V9) — response_mode=pi.flow", and V9 subtitle. (2) **RedirectlessFlowV9_Real.tsx:** `FlowHeader` now uses `flowId="redirectless-v9-real"` to match the route and config. (3) **Sections:** All four step sections (PKCE Parameters, Authorization URL Generation, Token Exchange, Token Management) now use `UnifiedFlowCollapsibleHeader` (green gradient, ⬇️ icon) instead of `CollapsibleHeader`.
- **Files:** `src/services/flowHeaderService.tsx`, `src/pages/flows/RedirectlessFlowV9_Real.tsx`
- **Regression check:** Open `https://api.pingdemo.com:3000/flows/redirectless-v9-real` — single red header with white title/subtitle; four step sections use unified green collapsible headers with ⬇️ toggle; no FlowHeaderService config warning in console.

### Collapsible section icons: same direction everywhere (2026-03)

- **What:** All collapsible section toggles now use the same convention: **expanded = icon points down (↓), collapsed = icon points right (→)**.
- **Changes:** (1) **collapsibleHeaderService.tsx:** Legacy `ArrowIcon` now uses `rotate(-90deg)` when collapsed and `rotate(0deg)` when expanded (was 0°/180°). `DefaultArrowIcon` always draws a single down-pointing chevron; rotation handles state. (2) **CollapsibleIcon.tsx:** Always renders ⬇️ (removed ⬆️); parent applies rotation. (3) **flowUIService.tsx:** Toggle icon wrapper adds `transform: collapsed ? rotate(-90deg) : rotate(0deg)` and preserves hover translate.
- **Files:** `src/services/collapsibleHeaderService.tsx`, `src/components/CollapsibleIcon.tsx`, `src/services/flowUIService.tsx`
- **Regression check:** Configuration, PAR/RAR, Unified OAuth, and any page using `CollapsibleHeader` or flowUIService collapsible: expanded section → icon down; collapsed → icon right.

### Configuration page: unified collapsible headers (2026-03)

- **What:** `/configuration` now uses the unified-flow collapsible style (green gradient header, white box with blue border, ⬇️ + -90° rotation) instead of the previous themed `CollapsibleHeader` (circle + 180°).
- **Changes:** (1) **collapsibleHeaderService.tsx:** Added composite `UnifiedFlowCollapsibleHeader` (title, subtitle, icon, defaultCollapsed, children, id) and `UnifiedFlowCollapsibleHeaderProps`; moved `extractStringFromReactNode` above it for aria ids. (2) **Configuration.tsx:** Replaced all 10 `CollapsibleHeader` usages with `UnifiedFlowCollapsibleHeader`; removed `theme` and `variant` props (unified style is fixed). Kept `id="redirect-uri-catalog"` for anchor links.
- **Files:** `src/services/collapsibleHeaderService.tsx`, `src/pages/Configuration.tsx`
- **Regression check:** Open `https://api.pingdemo.com:3000/configuration` (or `/configuration`). All section headers show green gradient and ⬇️ toggle; expand/collapse works; "PingOne Redirect & Logout URIs" section still has id for deep links.

### Collapsible header unification: service exports + AdvancedOAuthFeatures, FlowGuidanceSystem (2026-03)

- **What:** Started implementing collapsible header unification per `docs/COLLAPSIBLE_HEADER_UNIFICATION_PLAN.md`. Unified-flow style (green gradient header, white box with blue border, ⬇️ + -90° rotation) is now provided by the service; two v8u components were migrated to use it.
- **Changes:** (1) **collapsibleHeaderService.tsx:** Added and exported `UnifiedFlowCollapsibleSection`, `UnifiedFlowCollapsibleHeaderButton`, `UnifiedFlowCollapsibleTitle`, `UnifiedFlowCollapsibleToggleIcon`, `UnifiedFlowCollapsibleContent` (matching UnifiedFlowSteps reference). (2) **AdvancedOAuthFeatures.tsx:** Removed local collapsible styled components; imports and uses the five unified-flow components from the service. (3) **FlowGuidanceSystem.tsx:** Same; keeps `GuidanceContainer` as outer wrapper, uses service for header/toggle/content.
- **Files:** `src/services/collapsibleHeaderService.tsx`, `src/v8u/components/AdvancedOAuthFeatures.tsx`, `src/v8u/components/FlowGuidanceSystem.tsx`
- **Regression check:** Open a page that shows Advanced OAuth Features or "Choose the Right OAuth Flow" (e.g. `/v8u/unified/oauth-authz` step 0). Collapse/expand the section; icon should be white box with blue border, ⬇️ rotating -90° when collapsed. No visual regressions.

### Silent API Retrieval: respect checkbox; Get Worker Token always shows modal (2026-03)

- **What:** "Get Worker Token" was always doing silent retrieval and ignoring the "Silent API Token Retrieval" checkbox. When the checkbox was unchecked, users still got silent fetch instead of the modal.
- **Cause:** Several call sites passed `forceShowModal: !silentApiRetrieval` (or `false`) when the user clicked "Get Worker Token", so with Silent checked the modal never showed. The helper is designed so: **button click** → always show modal (`forceShowModal: true`); **automatic/background** fetch → respect checkbox (`forceShowModal: false`, use config `silentApiRetrieval`).
- **Fix:** (1) **WorkerTokenSectionV8**: pass `true` for forceShowModal on "Get Worker Token" click. (2) **workerTokenUIServiceV8**: same. (3) **UnifiedFlowSteps**: pre-flight "Get Worker Token" button and automatic token attempt — button click now passes `forceShowModal: true` and uses config for overrides; automatic attempt uses `undefined` overrides so config (checkbox) is respected. (4) **UnifiedErrorDisplayV8**: button click now passes `forceShowModal: true`. (5) Lockdown snapshot UnifiedFlowSteps updated to match.
- **Files:** `src/v8/components/WorkerTokenSectionV8.tsx`, `src/v8/services/workerTokenUIServiceV8.tsx`, `src/v8u/components/UnifiedFlowSteps.tsx`, `src/v8/flows/unified/components/UnifiedErrorDisplayV8.tsx`, `src/v8u/lockdown/unified/snapshot/components/UnifiedFlowSteps.tsx`
- **Regression check:** Uncheck "Silent API Token Retrieval" on a page that has it (e.g. Token Status, Credentials form). Click "Get Worker Token" → modal opens. Check the box, click again → modal still opens (button always shows modal). Automatic fetches (e.g. pre-flight validation when token missing) use checkbox: silent ON → try silent first; silent OFF → no silent attempt.

### PingOne Dashboard: remove duplicate header (2026-03)

- **What:** `/pingone-dashboard` showed two headers: the FlowHeader (red bar with title/subtitle) and a second inline red gradient block with the same "PingOne Platform Dashboard" title and description.
- **Fix:** Removed the duplicate inline header block. The page now uses only FlowHeader; the "Dashboard updated" status message is shown as a single line above the tabs.
- **Files:** `src/pages/PingOneDashboard.tsx`
- **Regression check:** Open `/pingone-dashboard` — one header (red FlowHeader); tabs and content unchanged.

### Log Viewer: in-browser and popout unified (2026-03)

- **What:** The in-browser "Log Viewer" (floating panel) and the "Debug Log Viewer - V9 Popout" were different components with different defaults (file, line count, tail mode, category filters), so they showed different content. They are now the same: the popout route renders `EnhancedFloatingLogViewer` in standalone mode so both use identical data, API calls, and UI (file list, 50/100/200/500 lines, All/API/Errors/Auth/Debug filters, stats, search, refresh, copy).
- **Cause:** Popout was a separate implementation (`DebugLogViewerPopoutV9`) with its own state and logic; floating viewer used `EnhancedFloatingLogViewer` with different defaults.
- **Fix:** Added `standalone` prop to `EnhancedFloatingLogViewer` (full viewport, no drag, no "Open in new window" button). Replaced `DebugLogViewerPopoutV9` body with a single `<EnhancedFloatingLogViewer isOpen standalone onClose={window.close} />`.
- **Files:** `src/components/EnhancedFloatingLogViewer.tsx` (standalone prop, `$standalone` on container, conditional popout button and header drag), `src/pages/v9/DebugLogViewerPopoutV9.tsx` (now a thin wrapper).
- **Regression check:** Open Log Viewer in-browser → select file, set 50 lines, pick "Errors". Click 🔗 to open in new window → popout shows same file, same line limit, same filters and stats. Category filters must filter displayed content in both.

### AIAssistant: keyboard shortcuts (2026-03-12)

- **What:** Added global keyboard shortcuts to open/close the AI Assistant without clicking the floating button.
  - `Ctrl+/` / `⌘+/` — toggle open/closed
  - `Ctrl+Shift+A` / `⌘+Shift+A` — toggle open/closed (alternate)
  - `Escape` — close and reset expanded/collapsed state
  - Shortcuts are blocked when focus is in an `<input>` or `<textarea>` to avoid conflicts.
- **Files:** `src/components/AIAssistant.tsx` (keydown listener, always-on, replaces the isOpen-gated Escape-only listener)
- **Regression check:** Press `Ctrl+/` from any page — assistant opens. Press again — closes. Press `Escape` while open — closes. Typing in an input field does not accidentally open/close the assistant.

### ApiKeyConfiguration.tsx: 500 compile error fixed (2026-03-12)

- **What:** The configuration page threw a 500 Internal Server Error because `ApiKeyConfiguration.tsx` had a malformed JSX structure. The `{apiKeyInfo && (` conditional for the `KeyValueRow` block was opened but never closed — the `)}` was missing, so the parser emitted `TS1005: ')' expected` and Vite could not compile the file.
- **Cause:** A prior multi-replace edit that added the key-masking row inserted the content at the wrong indentation level and omitted the closing `)}` after `</KeyValueRow>`.
- **Fix:** Corrected indentation and added the missing closing `)}` so the conditional renders correctly.
- **Files:** `src/components/ApiKeyConfiguration.tsx`
- **Regression check:** Open `/configuration` — page loads without 500; API key cards render; configured services show the masked key with eye toggle.

### ApiKeyConfiguration: eye icon to show/hide stored keys (2026-03-12)

- **What:** On `/configuration`, API keys were displayed as plain text. They are now masked by default (first 6 chars + bullet dots) with a per-service 👁️ / 🙈 toggle to reveal/hide. The Add/Update input field also uses `type="password"` with an eye button overlaid on the right edge; clicking it toggles the input between password and text. Resetting to hidden on Cancel.
- **Files:** `src/components/ApiKeyConfiguration.tsx` (new styled components: `InputWrapper`, `EyeButton`, `KeyValueRow`; new state: `showKeys` record, `showInputKey`, `toggleShowKey` helper)
- **Regression check:** Open `/configuration` → API key cards show masked value. Click 👁️ → full key visible. Click 🙈 → masked again. Click "Update" → input is type=password; click eye button → reveals key. Click Cancel → returns to hidden. Saving a key still works (Enter or Save button).

### AIAssistant: collapse button (2026-03-12)

- **What:** Added a ▼ collapse button to the AI Assistant header that shrinks the window to header-only (title bar strip) without closing it. Clicking ▲ (or the button again) restores the full window. Collapsing also exits expanded mode.
- **Files:** `src/components/AIAssistant.tsx` (new `isCollapsed` state; `CollapseButton` styled component; `ChatWindow` now accepts `$collapsed` prop for header-only height; body/input hidden when collapsed; close resets all three states)
- **Regression check:** Open assistant → click ▼ → shrinks to header bar only. Click ▲ → full window restored. Click ⛶ to expand → collapse button still works, exits expanded first. Close (❌) resets collapsed, expanded, and open states.

### AIAssistant: expand to full-screen modal (2026-03-12)

- **What:** Added a ⛶ expand button to the AI Assistant header that switches from the compact 520×680px corner widget to a large centred modal (`min(1100px, 92vw)` × `min(88vh, 900px)`). A dimmed backdrop overlay appears behind the expanded window; clicking it collapses back to compact view. All messages and state are preserved when toggling.
- **Files:** `src/components/AIAssistant.tsx` (new `isExpanded` state; `ExpandOverlay` backdrop; `ExpandButton`; `ChatWindow` `$expanded` prop with conditional CSS; smooth `transition`)
- **Regression check:** Open assistant → click ⛶ → window expands to large modal centred on screen with overlay. Click overlay or ⊡ → returns to corner widget. Messages, toggles, and input are identical in both views. Mobile: still fills screen width/height.

### AIAssistant: Live and Brave (web) default ON (2026-03-12)

- **What:** `includeLive` (MCP live data) and `includeWeb` (Brave Search) toggles now default to `true` so users get the richest results immediately without needing to manually enable toggles.
- **Files:** `src/components/AIAssistant.tsx` (`useState(true)` for both)
- **Regression check:** Open assistant fresh — both Web and Live checkboxes are pre-checked. Sending a query triggers both MCP and Brave enrichment by default.

### Brave Search API key: full persistence (2026-03-12)

- **What:** Stored the Brave Search API key (`BSACMZBQtCyVK64WF136Pupvz8OIqkX`) in all four persistence layers so it survives server restarts:
  1. **Live** — `POST /api/api-key/brave-search` sets `process.env.BRAVE_API_KEY` immediately.
  2. **Disk file** — `~/.pingone-playground/credentials/brave-config.json` (same pattern as `groq-config.json`).
  3. **`.env`** — `BRAVE_API_KEY=BSACMZBQtCyVK64WF136Pupvz8OIqkX`.
  4. **`server.js` startup loader** — reads `brave-config.json` on boot and sets `process.env.BRAVE_API_KEY` (mirrors the Groq startup loader).
     Also added `BRAVE_KEY_FILE` constant at the top of `server.js`, disk-persist logic in `POST /api/api-key/brave-search`, and disk-fallback in `GET /api/api-key/brave-search` (same pattern as Groq).
- **Files:** `server.js` (`BRAVE_KEY_FILE` constant, GET fallback, POST persist, startup loader), `.env` (`BRAVE_API_KEY`), `~/.pingone-playground/credentials/brave-config.json`
- **Regression check:** `GET /api/api-key/brave-search` → `{"success":true,"apiKey":"BSACMZB..."}`. Restart server → key still available from `brave-config.json`. AI Assistant 🌐 Brave status dot shows green.

### AIAssistant: header truncation fixes (2026-03-12)

- **What:** "OAuth Assistant" title was wrapping to two lines and status pills were truncating because `HeaderActions` (6 toggles + 2 buttons) consumed all available space. Fixes applied:
  - `ChatHeader` padding `16px` → `10px 14px`, added `gap: 8px`
  - `HeaderContent` gap `12px` → `8px`, `flex-shrink: 0` (prevents collapse)
  - `AssistantIcon` `32px` → `24px` with `flex-shrink: 0`
  - `HeaderTitle` `16px` → `14px` with `white-space: nowrap`
  - `HeaderActions` gap `12px` → `8px`, `flex: 1` + `flex-wrap: wrap` so toggles wrap rather than squeezing the title
- **Files:** `src/components/AIAssistant.tsx`
- **Regression check:** Open assistant → "OAuth Assistant" title is on one line; ⚡ Groq and 🌐 Brave status pills are fully visible; all 6 toggles visible (possibly wrapped to second row on narrow window).

### SPIFFE/SPIRE V9: red header, remove floating stepper (2026-03)

- **What:** `/flows/spiffe-spire-v9` had no red (PingOne-style) header and still used the floating stepper. **Fix:** (1) Added `spiffe-spire-v9` to FLOW_CONFIGS in flowHeaderService (pingone style, title, subtitle, icon). (2) In SpiffeSpireFlowV8U: removed usePageStepper and floating stepper (registerSteps, clearSteps, completeStep, resetSteps); use local state `stepIndex`/`setStepIndex` for step 0–3; replaced custom purple Header with V9FlowHeader and V9FlowRestartButton; wrapped content in OuterWrapper with padding-top 96px so content clears the fixed header.
- **Files:** `src/services/flowHeaderService.tsx`, `src/v8u/flows/SpiffeSpireFlowV8U.tsx`
- **Regression check:** Open /flows/spiffe-spire-v9 — red PingOne-style header and Reset button below it; no floating stepper; step progression (Attest → SVID → Validate → Token Exchange) still works via in-page flow.

### Worker token: full analysis and single-modal plan (2026-03)

- **What:** Documented worker token retrieval, storage, and modal usage across the app. **Deliverable:** `docs/WORKER_TOKEN_ANALYSIS_AND_PLAN.md` — services inventory (unifiedWorkerTokenService, workerTokenManager, workerTokenRepository, workerTokenServiceV8), modal inventory (V9 vs V8 vs Request modals), storage flow (credentials: SQLite + cache; token: unified path → IndexedDB + SQLite vs manager path → localStorage only), hardcoded-endpoint check, and recommendations (single modal = WorkerTokenModalV9 via `open-worker-token-modal`; all token writes via unifiedWorkerTokenService so IndexedDB + SQLite; no direct PingOne token URL from client). Includes plan to check all files in `/src` with file list and verification commands.
- **Files:** `docs/WORKER_TOKEN_ANALYSIS_AND_PLAN.md`
- **Regression check:** When changing worker token behavior, follow the doc: single modal, single read/write path, storage service for IndexedDB + SQLite.

### PingOne Discovery: Discover Configuration button did nothing (2026-03)

- **What:** In the PingOne Discovery modal, clicking "Discover Configuration" appeared to do nothing. **Cause:** The discovery overlay used `z-index: 1000` while the sidebar/navbar use `z-index: 10050`, so the sidebar sat on top of the modal and intercepted clicks. **Fix:** Raised the DiscoveryPanel Overlay to `z-index: 10051` so the modal is above the chrome when open. Also set the button to `type="button"` and used `preventDefault`/`stopPropagation` in the click handler so the click is never lost to the overlay or a parent form.
- **Files:** `src/components/DiscoveryPanel.tsx`
- **Regression check:** Open any page that shows the PingOne Discovery modal (e.g. OIDC Discovery from credentials), enter Environment ID, click "Discover Configuration" — discovery runs, "Discovering..." then success/error appears; modal stays on top of sidebar.

### Token monitoring (v8u): use global worker token modal (2026-03)

- **What:** On `/v8u/token-monitoring`, "Get Worker Token" used the V8 helper with `forceShowModal: false`, so the modal often did not open (silent retrieval path). "Fix token" (banner) opened a local WorkerTokenModalV9 instance instead of the global one (no wait screen, inconsistent UX). **Fix:** Both actions now dispatch `open-worker-token-modal` so the App-level WorkerTokenModalV9 opens (with wait screen). Removed local WorkerTokenModalV9, `showWorkerTokenModal` state, and the V8 helper call from the page; added `openGlobalWorkerTokenModal(source)` helper. Silent-retrieval checkbox when token invalid now opens the global modal instead of calling the helper.
- **Files:** `src/v8u/pages/TokenStatusPageV8U.tsx`
- **Regression check:** Open /v8u/token-monitoring — click "Get Worker Token": wait screen then global WorkerTokenModalV9. Click "Fix" on the expiry banner: same modal. No local duplicate modal.

### Get Worker Token: wait screen when opening modal (2026-03)

- **What:** Clicking "Get worker token" (which dispatches `open-worker-token-modal`) opened the modal immediately with no loading feedback, so the wait screen never appeared. **Fix:** In App, when the event fires we set `workerTokenModalOpening` to true and render `StandardModalSpinner` with message "Opening worker token...". After a minimum delay of 500ms we set `workerTokenModalOpening` to false and `showWorkerTokenModal` to true so the modal opens. The wait screen is always visible for at least 500ms so the user sees feedback even if the modal would open instantly.
- **Files:** `src/App.tsx`
- **Regression check:** Click "Get Worker Token" from any page (e.g. Token Status, WorkerTokenStatusDisplayV8) — "Opening worker token..." spinner appears for at least ~500ms, then WorkerTokenModalV9 opens.

### Delete All Devices V8: restore username dropdown (2026-03)

- **What:** On `/v8/delete-all-devices` the username SearchableDropdown was only shown when both environmentId and a valid worker token were present; otherwise a disabled plain input was shown, so the dropdown appeared "lost" when token was invalid. **Fix:** Always show the SearchableDropdown when environmentId is set; pass `disabled={!tokenStatus.isValid}` and a placeholder indicating that a valid worker token is required to search. When environmentId is missing, keep the plain disabled input with updated placeholder.
- **Files:** `src/v8/pages/DeleteAllDevicesUtilityV8.tsx`
- **Regression check:** Open /v8/delete-all-devices with environment ID set — username control is the dropdown (enabled if token valid, disabled with hint if invalid). Without environment ID, plain input with "Enter environment ID first, then get worker token".

### Worker token V8: credentials.scopes.join is not a function (2026-03)

- **What:** WorkerTokenManager and WorkerTokenModalV8 could receive credentials where `scopes` is a string (e.g. from SQLite or unified storage). Calling `.join()` on a string threw. **Fix:** (1) In `workerTokenManager.ts`, added `normalizeScopesToScopeString(scopes)` and use it when building the token request body; only add `scope` param when non-empty. (2) In `WorkerTokenModalV8.tsx`, when loading credentials set scope input from string or array so the field is populated and "Please provide at least one scope" validation does not wrongly fire.
- **Files:** `src/services/workerTokenManager.ts`, `src/v8/components/WorkerTokenModalV8.tsx`
- **Regression check:** Load a page that uses WorkerTokenSectionV8 or WorkerTokenModalV8 with credentials that have scopes stored as a string (e.g. from SQLite); refresh token or open modal — no "scopes.join is not a function". Generate worker token with scopes loaded as string — no "at least one scope" error when scope input is populated.

### Flow Comparison (v8u): red PingOne header (2026-03)

- **What:** `/v8u/flow-comparison` now uses the same red PingOne-style header as other Mock Flows. Added `flow-comparison-v8u` to `FLOW_CONFIGS` (flowType: pingone, title, subtitle, icon). FlowComparisonPage renders `V9FlowHeader` at the top and wraps content in `OuterWrapper` with padding-top so content clears the fixed header.
- **Files:** `src/services/flowHeaderService.tsx`, `src/v8u/pages/FlowComparisonPage.tsx`
- **Regression check:** Open https://localhost:3000/v8u/flow-comparison — red header with "PINGONE" badge and "Flow Comparison Tool" visible; page content below header.

### Worker token modal: single modal restored (2026-03)

- **What:** WorkerTokenModalV9 was restored to the single-modal flow used for months. The educational sub-modal (WorkerTokenRequestModal) was removed from V9: "Generate Worker Token" now calls the backend proxy `POST /api/pingone/token` directly and shows the token in the same modal. No second modal. WorkerTokenRequestModal remains for legacy WorkerTokenModal and locked copies; only WorkerTokenModalV9 no longer uses it.
- **Files:** `src/components/WorkerTokenModalV9.tsx`
- **Regression check:** Open Worker Token modal, enter credentials, click "Generate Worker Token" — token appears in the same modal; no second modal.

### Worker token modal: CORS fix, flow header configs, variant prop (2026-03)

- **What:** (1) **CORS:** Worker token requests from the browser to the PingOne token endpoint (e.g. `https://auth.pingone.com/.../as/token`) were blocked by CORS. WorkerTokenModalV9 and WorkerTokenRequestModal now use the backend proxy `POST /api/pingone/token` for token requests. WorkerTokenModalV9 `executeTokenRequest` and the new `fetchTokenViaProxy` both call the proxy; WorkerTokenRequestModal accepts optional `onSendRequest` so the modal’s “Send Request” uses the proxy when provided. (2) **Flow headers:** Added `saml-sp-dynamic-acs` to `FLOW_CONFIGS` so `/flows/saml-sp-dynamic-acs-v1` no longer logs “No configuration found for flow ID/type: saml-sp-dynamic-acs”. (3) **styled-components:** WorkerTokenModalV9 Export/Import buttons used `variant="outline"`, which was forwarded to the DOM; changed to `$variant="secondary"` to remove the unknown-prop warning.
- **Files:** `src/components/WorkerTokenModalV9.tsx`, `src/components/WorkerTokenRequestModal.tsx`, `src/services/flowHeaderService.tsx`
- **Regression check:** On Token Status Monitoring (or any page that opens WorkerTokenModalV9), enter credentials and click “Send Request” in the educational modal — token request succeeds (no CORS). Open `/flows/saml-sp-dynamic-acs-v1` — header shows; no FlowHeaderService warn. Open worker token modal — no “unknown prop variant” in console.

### Worker token credentials: SQLite as source of truth (2026-03)

- **What:** Worker token credentials were being lost across restarts because they were only stored in browser storage (localStorage, IndexedDB). The backend `/api/tokens/store` and `/api/tokens/query` were stubs (no persistence). **Fix:** Worker token credentials are now stored in and loaded from backend SQLite via existing `credentialsSqliteApi` (key `__worker_token__`). Load order: (1) memory cache, (2) **SQLite** (source of truth), (3) IndexedDB, (4) localStorage, (5) legacy keys. Save: always persists to SQLite after IndexedDB/localStorage. `clearCredentials()` also deletes the row from SQLite; `clearToken()` only clears the access token and does not clear credentials. Real environment ID is stored in `loginHint` so the single SQLite row can hold one default worker credential set.
- **Files:** `src/services/unifiedWorkerTokenService.ts`
- **Regression check:** Save worker token credentials in the Worker Token modal, restart the app (or clear site data and reload); credentials should still load from SQLite. Clear credentials only via explicit “Clear credentials” (not “Clear token”); credentials should disappear from SQLite and not reappear on reload.

### DPoP flow: migration and rules tracked in issues (2026-03)

- **What:** DPoP flow at `/flows/dpop` is only partially migrated: it has V9FlowHeader (red) and V9FlowRestartButton but uses CollapsibleHeader (accordion) instead of the step-by-step pattern, lives in `flows/` not `flows/v9/`, and is not wired to the field-rules system. Documented as **issue #010** in `docs/issues/dpop-flow-migration-rules.md` and `docs/issues/ISSUE_REGISTRY.md`; status OPEN, fix deferred.
- **Files:** `docs/issues/dpop-flow-migration-rules.md`, `docs/issues/ISSUE_REGISTRY.md`
- **Regression check:** When refactoring DPoP or field-rules, refer to issue #010 and the doc for desired end state (optional full migration to StepByStepFlow + v9 folder + rules).

### DPoP flow: add header and reset button (2026-03)

- **What:** `/flows/dpop` had no visible header and no reset button. **Cause:** `FlowHeader` was called with `flowId="dpop-flow"`, but `dpop-flow` was not in `FLOW_CONFIGS`, so the header returned `null`. No reset control existed. **Fix:** (1) Added `dpop-flow` to `FLOW_CONFIGS` in `flowHeaderService.tsx` (pingone style, title, subtitle, icon). (2) In `DPoPFlow.tsx` switched to `V9FlowHeader` with `flowId="dpop-flow"` and `customConfig={{ flowType: 'pingone' }}`, added `V9FlowRestartButton` below the header, and implemented `handleReset` to clear key pair, proof, API result, and reset method/URI/access token to defaults.
- **Files:** `src/services/flowHeaderService.tsx`, `src/pages/flows/DPoPFlow.tsx`
- **Regression check:** Open `/flows/dpop` — red PingOne-style header and “Reset” button below it are visible. Click Reset — key pair, proof, and API result clear; method/URI/token reset to defaults.

### Groq API key: `apiKeyService` integration + server.js crash fixes (2026-03)

- **What:** Two related fixes to make Groq API key storage work end-to-end. (1) **`apiKeyService` integration:** Added `groq` to `API_KEY_CONFIGS` in `apiKeyService.ts` with regex pattern `/^gsk_[A-Za-z0-9_]+$/`. Updated `McpServerConfig.tsx` to import `apiKeyService` and use `apiKeyService.getApiKey('groq')` on load and `apiKeyService.storeApiKey('groq', key)` on save (instead of raw fetch). Updated `groqService.ts` `isGroqAvailable()` to sync the stored key to the backend if the backend doesn't have it yet. (2) **`server.js` crash fixes:** `const GROQ_KEY_FILE` was declared at line ~21049 but used at line ~2822 — ES module `const` is not hoisted, so every `POST /api/api-key/groq` threw `ReferenceError: GROQ_KEY_FILE is not defined`. Fixed by moving the declaration to the top of the file (near other path constants). Additionally, the same POST handler called `logger.info` and `logger.warn` but `logger` is not defined anywhere in `server.js`; replaced with `console.log` and `console.warn`.
- **Cause:** (1) `McpServerConfig.tsx` was using raw `fetch` instead of the shared `apiKeyService` that the rest of the app uses. (2) `const` in an ES module is block-scoped and not hoisted; declaring `GROQ_KEY_FILE` far below its first use caused a `ReferenceError` at request time. (3) `logger` was added to the handler by a previous edit without checking that a logger existed in `server.js`; `server.js` uses `console` directly throughout.
- **Fix:** (1) `apiKeyService.ts`: added `groq` config. `McpServerConfig.tsx`: import + use `apiKeyService`. `groqService.ts`: sync from storage to backend in `isGroqAvailable()`. (2) `server.js`: moved `GROQ_KEY_FILE` to top of file; replaced `logger.info`/`logger.warn` in the Groq POST handler with `console.log`/`console.warn`.
- **Files:** `src/services/apiKeyService.ts`, `src/pages/McpServerConfig.tsx`, `src/services/groqService.ts`, `server.js`
- **Regression check:** `POST /api/api-key/groq` with a `gsk_…` key returns `{"success":true}` and writes `~/.pingone-playground/credentials/groq-config.json`. After server restart, `GET /api/api-key/groq` returns the key. `POST /api/groq/chat` returns a real Groq response. No `ReferenceError` or `logger is not defined` in server logs.

### PAR/RAR flows: fix "Maximum update depth exceeded" (2026-03)

- **What:** `PARFlowV9` and `RARFlowV9` caused "Maximum update depth exceeded" because a `useEffect` that syncs section expansion with the stepper depended on `PAR_SECTION_KEYS` / `RAR_SECTION_KEYS`. Those arrays were declared inside the component, so a new reference was created every render; the effect ran every time, called `setCollapsedSections`, and re-rendered in a loop. **Fix:** (1) Moved `PAR_SECTION_KEYS` and `RAR_SECTION_KEYS` to module scope (stable reference). The sync effect now depends only on `[currentStep]`. (2) In the sync effect, only call `setCollapsedSections` when the active section is currently collapsed (`prev[key] === false ? prev : { ...prev, [key]: false }`); returning the same `prev` when already expanded avoids unnecessary state updates and prevents update loops.
- **Files:** `src/pages/flows/v9/PARFlowV9.tsx`, `src/pages/flows/v9/RARFlowV9.tsx`
- **Regression check:** Open `/flows/par-v9` and `/flows/rar-v9` — no "Maximum update depth exceeded" in console. Step through with Next/Previous; the active step's section expands and the page does not loop.

### Backend health / API: avoid ERR_CERT_AUTHORITY_INVALID in dev (2026-03)

- **What:** When `VITE_BACKEND_URL` was set to `https://api.pingdemo.com:3001`, the frontend requested that URL directly from the browser for `/api/health` and log API calls. The backend uses a self-signed cert, so the browser showed `net::ERR_CERT_AUTHORITY_INVALID`. **Fix:** In development (`import.meta.env.DEV`), `getBackendHealthUrl()` and `getLogsApiBase()` now always return the relative path (`/api/health`, `/api/logs`) so the Vite dev proxy handles the request; the proxy uses `secure: false` and never triggers browser cert validation. Production still uses `VITE_BACKEND_URL` when set.
- **Files:** `src/services/serverHealthService.ts`, `src/services/logFileService.ts`
- **Regression check:** With run.sh (frontend :3000, backend :3001, self-signed cert), open the app and trigger a backend health check or log list — no ERR_CERT_AUTHORITY_INVALID; requests go via the proxy. In production build, health/log URLs still respect `VITE_BACKEND_URL` if set.

### Astro (Ping Identity design system) migration plan (2026-03)

- **What:** Added a migration plan to move the app to Ping Identity’s Astro design system (`@pingux/astro`). **Prerequisite:** `@pingux/astro` depends on `@pingux/onyx-tokens`, which is not on the public npm registry; install requires Ping’s private registry or an internal mirror. **Plan:** Phase 1 — add Astro and wrap app in `AstroProvider` in `src/main.tsx`. Phase 2 — theming coexistence (styled-components + Astro). Phase 3 — migrate icons from `react-icons/fi` to Astro/MDI incrementally. Phase 4 — replace high-impact components (buttons, forms, modals, nav) with Astro components. Phase 5 — cleanup and deprecate unused icon/style deps. No code or dependency changes were committed so the app still runs without registry access; once `@pingux/astro` is installable, follow `docs/ASTRO_MIGRATION_PLAN.md`.
- **Files:** `docs/ASTRO_MIGRATION_PLAN.md`
- **Regression check:** After enabling Astro (Phase 1), run full app and regression checklist (Worker token, sidebar z-index, Mock flows, discovery logging). During icon/component migration, run the relevant Section 4 checks per area.

### Worker Token Modal, FlowCredentials, ClaimsRequestBuilder: runtime errors (2026-03)

- **What:** Three fixes for console/runtime errors. (1) **WorkerTokenModalV9:** `credentials.scopes.join is not a function` — scopes can be a string from storage (e.g. unifiedWorkerTokenService) or an array. Added `normalizeScopes(scopes)` that returns `string[]` (array → use as-is, string → split on spaces, else `[]`). All uses of `credentials.scopes` (load, save, generate token, export, import) now go through this helper. (2) **ClaimsRequestBuilder:** `FiInfo is not defined` — component used `<FiInfo />` without importing. Added `import { FiInfo } from '../icons';`. (3) **FlowCredentials:** `logger.ui is not a function` — in some environments the shared logger may not expose `.ui` or `.success`. Replaced all `logger.ui` and `logger.success` calls with guarded `logger.info` so FlowCredentials does not throw when logger is stubbed or missing those methods.
- **Files:** `src/components/WorkerTokenModalV9.tsx`, `src/components/ClaimsRequestBuilder.tsx`, `src/components/FlowCredentials.tsx`
- **Regression check:** Open Worker Token modal (e.g. from “Get Worker Token” on any flow) — enter credentials and click through to generate; no “scopes.join is not a function”. Open Advanced OAuth Parameters Demo (ClaimsRequestBuilder) — page renders without “FiInfo is not defined”. Use a flow with FlowCredentials (e.g. UserInfo, PingOne Logout); change a credential field — no “logger.ui is not a function”.

### Token button at top of pages: use Worker Token modal service (2026-03)

- **What:** The "Get Worker Token" / token button at the top of pages (and in modals) was not using the Worker Token modal service (WorkerTokenModalV9 / unifiedWorkerTokenService). **Fix:** (1) **App.tsx:** Global worker token modal (opened by `open-worker-token-modal` event) now uses `WorkerTokenModalV9` instead of `WorkerTokenModal`, so the unified service is the single source of truth. (2) **WorkerTokenStatusDisplayV8:** "Get Worker Token" in the config section now dispatches `open-worker-token-modal` so the global V9 modal opens (previously called `handleShowWorkerTokenModal` with a no-op setter, so no modal appeared). (3) **PingOneApplicationPickerModal** and **ConfigurationURIChecker:** Replaced `WorkerTokenModal` with `WorkerTokenModalV9`; use `onTokenGenerated` (and for ConfigurationURIChecker, sync from `unifiedWorkerTokenService` on close) so token state stays in sync with the service.
- **Files:** `src/App.tsx`, `src/v8/components/WorkerTokenStatusDisplayV8.tsx`, `src/components/PingOneApplicationPickerModal.tsx`, `src/components/ConfigurationURIChecker.tsx`
- **Regression check:** From any page that shows WorkerTokenStatusDisplayV8 (e.g. RAR V9, PAR V9, Worker Token V9 flow), click "Get Worker Token" in the status/config section — WorkerTokenModalV9 opens (unified service). From App, any dispatch of `open-worker-token-modal` opens WorkerTokenModalV9. PingOne Application Picker and Configuration URI Checker "Get Worker Token" buttons open WorkerTokenModalV9 and token/callbacks work after generation.

### Token Management: real data only (unified storage + worker token) (2026-03)

- **What:** `/token-management` was showing a persisted list (e.g. 8 tokens from `v8u.tokenMonitoring.tokens`) that could be mock/stale and did not include the real worker token. **Fix:** Token list is now built only from real sources. On init we no longer load from localStorage; we run an async sync that (1) loads tokens from unified token storage (IndexedDB), (2) merges in flow context / localStorage / legacy if present, (3) always syncs the worker token from `unifiedWorkerTokenService` so it appears when present. `syncTokensFromFlowContext` is now async and runs in order so the worker token is never overwritten by the unified-storage clear. Periodic refresh (every 2s) uses the same flow.
- **Files:** `src/v8u/services/tokenMonitoringService.ts`
- **Regression check:** Open `/token-management` — list shows only real tokens (from unified storage + worker token). With a valid worker token set, the worker token appears in the list. No stale/mock-only list from persistence.

### Mock Flows: Reset button on every flow (2026-03)

- **What:** Every Mock Flow page now has a **Reset** button that clears flow state and returns the user to the first step. Added `MOCK_RESET_BTN` to `src/v7/styles/mockFlowStyles.ts`. Reset handler: clear response/result state (tokens, codes, URLs, etc.), reset stepper to step 0 where applicable (RAR, PAR), scroll to top, show success/info message. **Flows updated:** V7MOAuthAuthCodeV9, V7MDeviceAuthorizationV9, V7MClientCredentialsV9, V7MImplicitFlowV9, V7MROPCV9, V7MOIDCHybridFlowV9, V7MCIBAFlowV9 (header row with FlowHeader + Reset); RARFlowV9, PARFlowV9 (resetSteps + clear state + Reset button); SAMLBearerAssertionFlowV9 (clear token/generated state + Reset). JWT Bearer and SPIFFE/SPIRE already had restart/reset.
- **Files:** `src/v7/styles/mockFlowStyles.ts`, `src/pages/flows/v9/V7MOAuthAuthCodeV9.tsx`, `src/pages/flows/v9/V7MDeviceAuthorizationV9.tsx`, `src/pages/flows/v9/V7MClientCredentialsV9.tsx`, `src/pages/flows/v9/V7MImplicitFlowV9.tsx`, `src/pages/flows/v9/V7MROPCV9.tsx`, `src/pages/flows/v9/V7MOIDCHybridFlowV9.tsx`, `src/pages/flows/v9/V7MCIBAFlowV9.tsx`, `src/pages/flows/v9/RARFlowV9.tsx`, `src/pages/flows/v9/PARFlowV9.tsx`, `src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx`
- **Regression check:** Open each Mock flow from the sidebar — each shows a "↺ Reset" (or "Reset" / "Reset Flow") button near the header. Click Reset: state clears, step goes to first, page scrolls to top, and a brief success/info message appears. No duplicate or missing Reset on any Mock flow.

### Mock flow services: rename V7M → V9Mock (files and symbols) (2026-03)

- **What:** All mock OAuth/OIDC services under `src/services/v9/mock/` were renamed from **V7M\*** to **V9Mock\*** for clarity and consistency with the V9 flow location. **Files renamed:** V7MAuthorizeService.ts → V9MockAuthorizeService.ts, V7MTokenService.ts → V9MockTokenService.ts, V7MUserInfoService.ts → V9MockUserInfoService.ts, V7MIntrospectionService.ts → V9MockIntrospectionService.ts, V7MDeviceAuthorizationService.ts → V9MockDeviceAuthorizationService.ts, V7MCIBAService.ts → V9MockCIBAService.ts, V7MStateStore.ts → V9MockStateStore.ts, V7MTokenGenerator.ts → V9MockTokenGenerator.ts, V7MMockApiLogger.ts → V9MockApiLogger.ts; core and ui files similarly (e.g. V7MPKCEGenerationService.ts → V9MockPKCEGenerationService.ts). **Types/functions renamed:** e.g. V7MAuthorizeRequest → V9MockAuthorizeRequest, V7MTokenSuccess → V9MockTokenSuccess, generateV7MTokens → generateV9MockTokens, V7MStateStore → V9MockStateStore, V9MockApiCalls (from V7MMockApiCalls), V9MockApiLogger (from V7MMockApiLogger). Session key updated to `v9mock:state`. All flow pages in `pages/flows/v9`, `v7/facade.ts`, `v7/index.ts`, and `services/v9/mock/index.ts` updated to use new paths and symbol names. Unit tests in `services/v9/mock/__tests__/` updated and pass.
- **Files:** `src/services/v9/mock/*.ts`, `src/services/v9/mock/core/*.ts`, `src/services/v9/mock/ui/*.tsx`, `src/services/v9/mock/__tests__/*.ts`, `src/services/v9/mock/index.ts`, `src/pages/flows/v9/V7M*.tsx` (7 flow pages), `src/v7/facade.ts`, `src/v7/index.ts`
- **Regression check:** Run `pnpm exec vitest run src/services/v9/mock/__tests__` — all tests pass. Open each Mock flow (Auth Code, Client Credentials, Device Auth, Implicit, ROPC, Hybrid, CIBA) and run through the flow — tokens and API simulation work. No imports from `V7MAuthorizeService`, `V7MTokenService`, etc. (only V9Mock\* from `services/v9/mock`).

### Mock flow services: migrate V7M to services/v9/mock (2026-03)

- **What:** V7M mock OAuth/OIDC backend services (previously under `src/services/v7m/`) are now under **`src/services/v9/mock/`** for consistency with V9 flows. Files and symbols were later renamed to V9Mock\* (see entry above). Added `services/v9/mock/index.ts` barrel. All flow pages in `pages/flows/v9` now import from `../../../services/v9/mock/...`. Updated `v7/index.ts` and `v7/facade.ts` to re-export from `../services/v9/mock/...`. Updated `v7m/routes.tsx` to import flow components from `../pages/flows/v9/` (named exports) and ROPC paths to `/flows/oauth-ropc-v9` and `/flows/oidc-ropc-v9`. Removed legacy `src/services/v7m/` folder.
- **Files:** `src/services/v9/mock/` (new), `src/v7/index.ts`, `src/v7/facade.ts`, `src/v7m/routes.tsx`, `src/pages/flows/v9/V7M*.tsx` (7 files), `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`
- **Regression check:** Open each Mock flow (Auth Code, Client Credentials, Device Auth, Implicit, ROPC, Hybrid, CIBA) — each loads and token/auth steps work. No imports from `services/v7m` remain.

### Mock Flows: migration to V9 subfolder and canonical routes (2026-03)

- **What:** Migration status for all Mock flows: (1) **Migration status** added to `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md` (§2.1b) with target location `src/pages/flows/v9/` and canonical routes `/flows/*-v9`. (2) **Sidebar:** ROPC link updated from `/v7/oauth/ropc` to `/flows/oauth-ropc-v9`; SPIFFE from `/v8u/spiffe-spire/attest` to `/flows/spiffe-spire-v9`. DragDropSidebar SPIFFE path updated to `/flows/spiffe-spire-v9`. (3) **SPIFFE/SPIRE:** New canonical routes `/flows/spiffe-spire-v9` and `/flows/spiffe-spire-v9/tokens`; legacy `/v8u/spiffe-spire*` redirects to them. Flow and token display components updated to navigate to new paths. (4) **V7M flow components** moved from `src/v7/pages/` to `src/pages/flows/v9/`: V7MOAuthAuthCodeV9, V7MDeviceAuthorizationV9, V7MClientCredentialsV9, V7MImplicitFlowV9, V7MROPCV9, V7MOIDCHybridFlowV9, V7MCIBAFlowV9. Imports in moved files updated (`../../` → `../../../`, `../` → `../../../v7/`). App.tsx now imports these from `./pages/flows/v9/...`. V7MSettingsV9 remains in `v7/pages` (served at `/v7/settings`). (5) Old V7M flow files removed from v7/pages.
- **Files:** `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`, `src/config/sidebarMenuConfig.ts`, `src/components/DragDropSidebar.tsx`, `src/App.tsx`, `src/v8u/flows/SpiffeSpireFlowV8U.tsx`, `src/v8u/pages/SpiffeSpireTokenDisplayV8U.tsx`, `src/pages/flows/v9/V7M*.tsx` (7 files), deleted `src/v7/pages/V7M*V9.tsx` (7 files).
- **Regression check:** Open each Mock flow from sidebar (Authorization Code, Hybrid, CIBA, Device Authorization, Client Credentials, Implicit, JWT Bearer, SAML Bearer, ROPC, RAR, PAR, SPIFFE/SPIRE) — each loads at `/flows/*-v9`. Legacy `/v7/oauth/ropc` and `/v8u/spiffe-spire*` redirect to canonical routes. V7 Settings still at `/v7/settings`.

### SPIFFE/SPIRE Flow V8U: use new stepper (FloatingStepperContext) (2026-03)

- **What:** (11) SPIFFE/SPIRE mock flow previously used a custom inline step indicator and URL-based navigation (/attest, /svid, /validate). **Refactor:** Flow now uses the shared `usePageStepper()` from `FloatingStepperContext` (same pattern as PAR/RAR). Registered 4 steps: Workload Attestation, SVID Issuance, SVID Validation, Token Exchange. Step state is driven by stepper `currentStep` (0-based); completion uses `completeStep(index)` and `setCurrentStep(index)`. Removed the custom `<StepIndicator>` block; removed `navigate()` on step advance (stepper is source of truth). Reset calls `resetSteps()` and `setCurrentStep(0)`. Added URL sync on mount so deep links to `/v8u/spiffe-spire/svid` or `/validate` set the correct step. Added `usePageScroll({ pageName: 'SPIFFE/SPIRE Flow', force: false })`.
- **Files:** `src/v8u/flows/SpiffeSpireFlowV8U.tsx`
- **Regression check:** Open `/v8u/spiffe-spire/attest` — floating stepper shows 4 steps; completing Attest → SVID, Validate → Token Exchange advances the stepper and shows correct content. No URL change on step advance (except optional navigate to /tokens after Token Exchange). Reset returns to step 0. Direct link to `/v8u/spiffe-spire/svid` or `/validate` shows the matching step. Do not reintroduce custom StepIndicator or route-based step state.

### Mock Flows: RAR/PAR same fixes; overview detail on all flows (2026-03)

- **What:** (10) RAR and PAR had the same issues as other flows (scroll jump, URL display). **RAR:** `usePageScroll` set to `force: false`; authorization URL now uses `ColoredUrlDisplay` instead of `CodeBlock`. **PAR:** request_uri and authorization URL now use `ColoredUrlDisplay` instead of `CodeBlock`. All V7M Mock flows now include an **About this flow** section (same detail level as RAR/PAR) via `V7MFlowOverview`: description, key point, standard (RFC), benefits list, educational note. Added `src/v7/components/V7MFlowOverview.tsx` and used it on Implicit, Client Credentials, Device Authorization, OAuth Auth Code, OIDC Hybrid, CIBA, ROPC.
- **Files:** `src/pages/flows/v9/RARFlowV9.tsx`, `src/pages/flows/v9/PARFlowV9.tsx`, `src/v7/components/V7MFlowOverview.tsx`, `src/v7/pages/V7MImplicitFlowV9.tsx`, `src/v7/pages/V7MClientCredentialsV9.tsx`, `src/v7/pages/V7MDeviceAuthorizationV9.tsx`, `src/v7/pages/V7MOAuthAuthCodeV9.tsx`, `src/v7/pages/V7MOIDCHybridFlowV9.tsx`, `src/v7/pages/V7MCIBAFlowV9.tsx`, `src/v7/pages/V7MROPCV9.tsx`, `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`
- **Regression check:** Open `/flows/rar-v9` and `/flows/par-v9` — no scroll jump; auth URL (and PAR request_uri) use ColoredUrlDisplay with Copy/Decode. Open each V7M flow (Implicit, Client Credentials, Device Auth, Auth Code, Hybrid, CIBA, ROPC) — each shows "About this flow" with description, key point, standard, benefits, educational note.

### Mock Flows: section headers light blue, ColoredUrlDisplay, Decode fix, PAR scroll (2026-03)

- **What:** (6) Section headers and collapse icons standardized to light blue (#dbeafe) in all Mock flows. (7) Implicit-v9 now uses ColoredUrlDisplay for Authorization URL and Callback URL so sizes/colors match other flows. (8) ColoredUrlDisplay is the URL color display service for Mock flows; Decode on POST request body now safe (try/catch for decodeURIComponent and getUrlParameters so invalid URLs do not throw). (9) PAR flow (/flows/par-v9) scrolling jump fixed by using usePageScroll with force: false so only one scroll runs on mount instead of four.
- **Files:** `src/v7/styles/mockFlowStyles.ts`, `src/v7/pages/V7MImplicitFlowV9.tsx`, `src/components/ColoredUrlDisplay.tsx`, `src/pages/flows/v9/PARFlowV9.tsx`, `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`
- **Regression check:** Open `/flows/implicit-v9` — Authorization and Callback URLs use ColoredUrlDisplay (colored, Explain URL, Decode). Open any Mock flow — section headers are light blue. Open `/flows/par-v9` — page does not jump on load. ROPC POST body Decode button toggles without error.

### Mock Flows: Show Less + Copy consistency (ColoredJsonDisplay)

- **ColoredJsonDisplay: Show Less + Copy button with label (2026-03)**
  - **What:** On Mock flows (e.g. Implicit V9), "Show Less" appeared to do nothing (collapsed max-height 300px often exceeded content) and the copy control next to it was icon-only (round button with no icon when MDI font did not load). **Fix:** Default `maxHeight` reduced from `300px` to `150px` so "Show Less" visibly truncates. `CopyButtonService` in ColoredJsonDisplay now uses `showLabel={true}` and `label="Copy"` so the button shows "Copy" text. Standard documented in `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md` (Phase 5, §2.3, §3.5, §7).
  - **Files:** `src/components/ColoredJsonDisplay.tsx`, `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`
  - **Regression check:** Open any Mock flow with JSON (e.g. `/flows/implicit-v9`, complete flow to UserInfo/Introspect); confirm "Show Less" shortens the JSON block; confirm Copy shows "Copy" text, not an empty circle.

### Implicit Flow V9: copy buttons and token display

- **Implicit Flow V9: copy buttons + UnifiedTokenDisplayService (2026-03)**
  - **What:** On `/flows/implicit-v9`, copy buttons did not give feedback and could fail silently; access token was shown in a plain textarea instead of the shared token display. **Fix:** Added async `copyToClipboard(text)` that awaits `navigator.clipboard.writeText`, shows `showGlobalSuccess('Copied to clipboard!')` on success and `showGlobalError('Copy failed')` on failure. Wired all Copy buttons (Authorization URL, Callback URL, and token section) to use it. Replaced access token and ID token textareas with `UnifiedTokenDisplayService.showTokens(...)` so tokens use the same decode/copy UX as other flows; kept "Inspect Access Token" / "Inspect ID Token" buttons to open JWT modals.
  - **Files:** `src/v7/pages/V7MImplicitFlowV9.tsx`
  - **Regression check:** Open `/flows/implicit-v9`, complete flow to get tokens; click each Copy button (Authorization URL, Callback URL) — toast "Copied to clipboard!" appears; tokens section shows UnifiedTokenDisplay with copy/decode; Inspect Access/ID Token still open modals.

### Mock Flows: standardization implementation (Phases 1 & 3)

- **Mock Flows standardization — shared styles, banner, credentials (2026-03)**
  - **What:** Implemented Phase 1 and Phase 3 of `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`. **Phase 1:** Added `src/v7/styles/mockFlowStyles.ts` (MOCK*FLOW_CONTAINER_STYLE, MOCK_FLOW_BANNER*\*, MOCK_SECTION_STYLE, getSectionHeaderStyle(variant), getSectionBodyStyle, MOCK_INPUT_STYLE, MOCK_PRIMARY_BTN, MOCK_SECONDARY_BTN, MOCK_PRIMARY_BTN_DISABLED, MOCK_COPY_BTN). Added `src/v7/components/V7MMockBanner.tsx` (description + optional deprecation with learnMoreUrl or onLearnMoreClick). All V7M pages (Client Credentials, Device Authorization, OAuth Auth Code, OIDC Hybrid, CIBA, Implicit, ROPC) now use shared container, V7MMockBanner, shared section/header/body styles, and shared button/input styles; removed duplicate local style constants. Deprecation flows (Hybrid, Implicit, ROPC) use V7MMockBanner deprecation prop with onLearnMoreClick for modal. Added `src/v7/components/V7MStepSection.tsx` for optional future use. **Phase 3:** UnifiedCredentialManagerV9 added to OIDC Hybrid and CIBA so credentials UX matches other Mock Flows (flowKey v7m-oidc-hybrid / v7m-ciba, app picker + import/export).
  - **Files:** `src/v7/styles/mockFlowStyles.ts`, `src/v7/components/V7MMockBanner.tsx`, `src/v7/components/V7MStepSection.tsx`, all `src/v7/pages/V7M*.tsx` (ClientCredentials, DeviceAuthorization, OAuthAuthCode, OIDCHybridFlow, CIBAFlow, ImplicitFlow, ROPC)
  - **Regression check:** Open each Mock Flow (Client Credentials, Device Authorization, OAuth Auth Code, OIDC Hybrid, CIBA, Implicit, ROPC); confirm same yellow Educational Mock banner, same section card look (border, header colors), same primary/secondary button styles; Hybrid and CIBA show credential manager (app picker) below header; complete one full flow per page; deprecated flows show “Learn more” in banner and open help modal.

### Mock Flows: standardization plan

- **Mock Flows standardization plan (2026-03)**
  - **What:** Added `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md` describing how to make all Mock Flows behave and look consistent: shared styles (container, banner, section, buttons), shared components (V7MMockBanner, V7MStepSection), reuse of MockApiCallDisplay/ColoredJsonDisplay/UnifiedCredentialManagerV9, and phased implementation. Plan identifies current inconsistencies (duplicated button/input styles, varying section headers, JWT/SAML different layout) and proposes one standard flow layout with only step content differing per flow.
  - **Files:** `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`
  - **Regression check:** When implementing phases, run Mock Flows regression (Section 4) after each phase; preserve do-not-break areas (Section 7).

### Mock Flows: mock API call displays for learning

- **All Mock Flows: show mock API calls (2026-03)**
  - **What:** Every flow in the Mock Flows group now shows inline MockApiCallDisplay (request URL, method, headers, body, response) so users can learn what the API calls look like. Device Authorization: device_authorization POST, token POST (device_code), UserInfo GET, Introspect POST. CIBA: backchannel auth POST, token POST (ciba grant), Introspect POST. Implicit: GET authorize + redirect, UserInfo GET, Introspect POST. ROPC: token POST (password), UserInfo GET, Introspect POST. Client Credentials: token URL updated to api.pingdemo.com + env ID; UserInfo and Introspect mock API added when those responses exist. SAML Bearer: token POST (saml2-bearer) mock API added. OIDC Auth Code and OIDC Hybrid already had mock API displays.
  - **Files:** `src/v7/pages/V7MDeviceAuthorizationV9.tsx`, `src/v7/pages/V7MCIBAFlowV9.tsx`, `src/v7/pages/V7MImplicitFlowV9.tsx`, `src/v7/pages/V7MROPCV9.tsx`, `src/v7/pages/V7MClientCredentialsV9.tsx`, `src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx`
  - **Regression check:** Open each Mock Flow (Device Authorization, CIBA, Implicit, ROPC, Client Credentials, SAML Bearer, OIDC Auth Code, OIDC Hybrid, JWT Bearer); confirm mock API request/response blocks appear and use api.pingdemo.com + real env ID where applicable.

### OIDC/OAuth Auth Code: white header text, api.pingdemo.com + real env ID

- **PingOneApiCallDisplay + OIDC Auth Code: white header text, demo URLs (2026-03)**
  - **What:** OAuth Token Endpoint (and all API call example) headers use explicit white text (`#ffffff` on Title, MethodBadge, and Header) so they stay readable on colored headers. All predefined examples and inline mock displays use `https://api.pingdemo.com` and real environment ID `b9817c16-9910-4415-b67e-4ac687da74d9`. Exported `DEMO_API_BASE` and `DEMO_ENVIRONMENT_ID` from PingOneApiCallDisplay; OIDC Auth Code flow inline MockApiCallDisplay URLs (token, userinfo, introspect) use them.
  - **Files:** `src/components/PingOneApiCallDisplay.tsx`, `src/v7/pages/V7MOAuthAuthCodeV9.tsx`
  - **Regression check:** Open `/flows/oidc-authorization-code-v9` — OAuth Token Endpoint and other example headers show white text; example URLs show api.pingdemo.com and the real env ID; inline token/userinfo/introspect blocks show the same base and env ID.

### OIDC/OAuth Authorization Code V9: inline API calls and condensed form

- **OIDC/OAuth Auth Code mock: inline request/response, narrower Build Authorization (2026-03)**
  - **What:** On `/flows/oidc-authorization-code-v9`, API calls are shown inline as the user hits each button: (1) After "Build & Issue Code", `MockApiCallDisplay` shows GET authorization request and 302 redirect response with code/state. (2) After "Exchange Code for Tokens", POST token request (headers + form body) and token response. (3) After "Call UserInfo", GET userinfo with Bearer token and response. (4) After "Introspect Token", POST introspect and response. Build Authorization Request section: form container `maxWidth: 720` and grid changed to 3 columns so fields are less wide.
  - **Files:** `src/v7/pages/V7MOAuthAuthCodeV9.tsx`
  - **Regression check:** Open `/flows/oidc-authorization-code-v9`, click "Build & Issue Code" — authorization GET and redirect response appear inline; click "Exchange Code for Tokens" — token POST and response appear; click "Call UserInfo" / "Introspect Token" — each shows its request/response. Build Authorization Request fields are condensed (three columns, max 720px width).

### JWT Bearer / Token Request: red header and white text on blue

- **Token request page: red header, white text on blue (2026-03)**
  - **What:** JWT Bearer flow had blue header and risk of black text on blue (step circles, buttons, MockApiCallDisplay). flowType for `jwt-bearer-token-v7` changed to `pingone` so the page uses the red header bar (PingOne style). All text on blue (step circles, Next/Prev buttons, MockApiCallDisplay header) now uses explicit `#ffffff`. MockApiCallDisplay Title and MethodBadge set `color: #ffffff` so they stay white on colored headers.
  - **Files:** `src/services/flowHeaderService.tsx`, `src/pages/flows/v9/JWTBearerTokenFlowV9.tsx`, `src/components/MockApiCallDisplay.tsx`
  - **Regression check:** Open `/flows/jwt-bearer-token-v9` — main header is red with white text; step circles and Token Request “Request Access Token” / Mock API block show white text on blue; no black-on-blue.

### Mock API request display for learning

- **JWT Bearer & Client Credentials: show mock API request (2026-03)**
  - **What:** Added `MockApiCallDisplay` so users can see the token request (method, URL, headers, body) before clicking "Request Access Token". JWT Bearer (step 2): shows POST with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` and `assertion=<JWT>` (RFC 7523). Client Credentials mock: shows POST with `grant_type=client_credentials`, `client_id`, `client_secret` (redacted), `scope` (RFC 6749 §4.4). JWT Bearer step 1 has a short learning note linking the generated JWT to the assertion parameter.
  - **Files:** `src/pages/flows/v9/JWTBearerTokenFlowV9.tsx`, `src/v7/pages/V7MClientCredentialsV9.tsx`
  - **Regression check:** On `/flows/jwt-bearer-token-v9` step 2, the collapsible "JWT Bearer Token Request (RFC 7523)" shows request/response; Request Access Token still works. On Client Credentials mock, "Client Credentials Token Request (RFC 6749)" shows above the form; Request Access Token still works.

### Mock Flows route migration (A-Migration standard)

- **Mock Flows: canonical /flows/\*-v9 paths (2026-03)**
  - **What:** Migrated all Mock Flows (per A-Migration guides) so canonical URLs are under `/flows/...-v9`. Components render at flow paths; legacy `/v7/oauth/...` and `/v7/oidc/...` paths redirect for backward compatibility. Covers: OAuth/OIDC Authorization Code, Device Authorization, Client Credentials, OAuth/OIDC Implicit, OIDC Hybrid, CIBA. Added `/flows/oidc-authorization-code-v9` and `/flows/oidc-implicit-v9`. ROPC mock remains at `/v7/oauth/ropc` and `/v7/oidc/ropc` (no conflicting flow path).
  - **Files:** `src/App.tsx`, `src/config/sidebarMenuConfig.ts`, `src/components/DragDropSidebar.tsx`, `src/components/FlowCategories.tsx`, `src/v7m/routes.tsx`
  - **Regression check:** Sidebar Mock Flows (OIDC: Authorization Code, Hybrid, CIBA; OAuth 2.0: Device Authorization, Client Credentials, Implicit) open `/flows/...-v9`; visiting any `/v7/oauth/...` or `/v7/oidc/...` path for those flows redirects to the canonical flow path; mock flow steps work unchanged.

### Session and token verification

- **Session/token verification: “We don’t set sessions; PingOne does” (2026-03)**
  - **What:** Added `docs/SESSION_AND_TOKEN_VERIFICATION.md` documenting all cookie/session/token usage. Conclusion: we do **not** set an application session (no express-session, no res.cookie for app session, no server-side token storage). cookieJar is for PingOne redirectless (pi.flow) only; SPA stores PingOne tokens in sessionStorage and localStorage.
  - **Files:** `docs/SESSION_AND_TOKEN_VERIFICATION.md`
  - **Regression check:** When changing auth/token or cookie behavior, re-read Section 4 (PingOne vs app session) and Section 5 (minimal change set for server-side tokens + SPA auth status only).

### PingOne MCP server

- **Phase 7 — Password, risk, token & flow tools (2026-03)**
  - **What:** Added 6 MCP tools: `pingone_password_state`, `pingone_password_send_recovery_code`, `pingone_risk_evaluation` (returns NOT_IMPLEMENTED; no real PingOne Protect API), `pingone_token_exchange`, `pingone_userinfo`, `pingone_check_username_password`. New services: pingonePasswordClient, pingoneRiskClient, pingoneTokenClient, pingoneFlowClient; new actions/phase7.ts; registered in index. No placeholders: only real API calls (risk tool returns NOT_IMPLEMENTED).
  - **Files:** `pingone-mcp-server/src/services/pingonePasswordClient.ts`, `pingone-mcp-server/src/services/pingoneRiskClient.ts`, `pingone-mcp-server/src/services/pingoneTokenClient.ts`, `pingone-mcp-server/src/services/pingoneFlowClient.ts`, `pingone-mcp-server/src/actions/phase7.ts`, `pingone-mcp-server/src/index.ts`, `MCP_SERVER_DEVELOPMENT_PLAN.md`, `docs/MCP_SERVER_PLAN_ASSESSMENT.md`
  - **Regression check:** Call password_state and send_recovery_code with userId + credentials; risk_evaluation returns NOT_IMPLEMENTED; token_exchange with environmentId + body; userinfo with accessToken + userInfoEndpoint or environmentId; check_username_password with flowUrl + username + password.

- **Phase 6 — OIDC & application config tools (2026-03)**
  - **What:** Added 3 MCP tools: `pingone_oidc_config` (fetch OIDC discovery for environment, no auth), `pingone_oidc_discovery` (fetch from arbitrary issuer URL, no auth), `pingone_get_application_resources` (get resource/scopes for an application, worker token or client credentials). New service `pingoneOidcClient.ts`; new action module `oidc.ts`; `getApplicationResources` in `pingoneManagementClient.ts`; tool in `worker.ts`.
  - **Files:** `pingone-mcp-server/src/services/pingoneOidcClient.ts`, `pingone-mcp-server/src/actions/oidc.ts`, `pingone-mcp-server/src/services/pingoneManagementClient.ts`, `pingone-mcp-server/src/actions/worker.ts`, `pingone-mcp-server/src/index.ts`, `MCP_SERVER_DEVELOPMENT_PLAN.md`, `docs/MCP_SERVER_PLAN_ASSESSMENT.md`
  - **Regression check:** Call `pingone_oidc_config` with environmentId (and optional region); call `pingone_oidc_discovery` with issuerUrl; call `pingone_get_application_resources` with appId and credentials. OIDC tools work without credentials.

- **Phase 5 — User & directory tools (2026-03)**
  - **What:** Added 5 MCP tools: `pingone_get_user_groups`, `pingone_get_user_roles`, `pingone_lookup_users`, `pingone_get_population`, `pingone_list_populations`. Client functions in `pingoneUserClient.ts` (getUserGroups, getUserRoles, lookupUsers, getPopulation, listPopulations); tool registrations in `actions/users.ts`. Lookup uses UUID→direct GET or SCIM filter on username/email.
  - **Files:** `pingone-mcp-server/src/services/pingoneUserClient.ts`, `pingone-mcp-server/src/actions/users.ts`, `MCP_SERVER_DEVELOPMENT_PLAN.md`, `docs/MCP_SERVER_PLAN_ASSESSMENT.md`
  - **Regression check:** With valid credentials, call each new tool (userId for groups/roles, identifier for lookup, populationId for get population, optional limit for list populations). Errors use `buildToolErrorResult`.

- **MCP plan and assessment docs finished (2026-03)**
  - **What:** Completed and aligned MCP_SERVER_PLAN_ASSESSMENT.md and MCP_SERVER_DEVELOPMENT_PLAN.md. Assessment: status line, current-state table (all implemented tools including worker token alias, errors, user/application/OAuth tools), remaining gaps as Phases 5–8 + AI Assistant + MCP + deferred; removed obsolete “gaps” text; Summary and Next updated. Plan: status and Related link to assessment; note that actual folder is `pingone-mcp-server/`.
  - **Files:** `docs/MCP_SERVER_PLAN_ASSESSMENT.md`, `MCP_SERVER_DEVELOPMENT_PLAN.md`
  - **Regression check:** Both docs open without errors; assessment “Current state” matches plan “Current implementation”; Next steps point to Phases 5–8 and AI Assistant + MCP.

- **Phase C — Plan doc + applications resource (2026-03)**
  - **What:** Updated MCP_SERVER_DEVELOPMENT_PLAN.md with a "Current implementation" section (implemented tools table, credentials, resources) and refreshed "Next steps". Added optional dynamic resource `pingone://applications`: when read, returns JSON list of PingOne applications using credentials from storage/env.
  - **Files:** `MCP_SERVER_DEVELOPMENT_PLAN.md`, `pingone-mcp-server/src/services/pingoneResources.ts`, `pingone-mcp-server/src/index.ts`, `docs/MCP_SERVER_PLAN_ASSESSMENT.md`
  - **Regression check:** In Cursor with PingOne MCP enabled, list resources and open `pingone://applications`; content should be applications JSON or an error if credentials missing/invalid.

- **Phase B — User & application tools (2026-03)**
  - **What:** Added MCP tools: `pingone_get_user` (get user by ID), `pingone_list_users` (list users with optional SCIM filter), and `pingone_get_application` (get single application by ID). User tools use worker token (or client credentials from storage/env) with `p1:read:user` scope; application get uses existing management client. Existing `pingone.applications.list` unchanged.
  - **Files:** `pingone-mcp-server/src/services/pingoneUserClient.ts`, `pingone-mcp-server/src/actions/users.ts`, `pingone-mcp-server/src/services/pingoneManagementClient.ts` (getApplication), `pingone-mcp-server/src/actions/worker.ts` (pingone_get_application), `pingone-mcp-server/src/index.ts` (registerUserTools), `docs/MCP_SERVER_PLAN_ASSESSMENT.md`
  - **Regression check:** With valid credentials in mcp-config.json or env, call `pingone_get_user` (userId + env), `pingone_list_users` (optional filter/limit), `pingone_get_application` (appId + env). Ensure worker token scope includes user read for user tools.

### AI Assistant

- **AI Assistant worker token refresh with user confirmation (2026-03)**
  - **What:** The assistant can obtain a new worker token when the current one expires. For security, the user must confirm before a new token is requested. A 🔑 button in the assistant header opens a confirmation dialog; on confirm, the app requests a new token via the backend proxy, stores it with `unifiedWorkerTokenService`, and adds a chat message: "New worker token obtained and saved to storage."
  - **Files:** `src/services/aiAssistantWorkerTokenService.ts` (getTokenStatus, refreshAndStoreToken), `src/components/AIAssistant.tsx` (confirm dialog, refresh button, chat message on success/error).
  - **Regression check:** Open AI Assistant, click 🔑 → confirm dialog appears. Cancel closes it. Click "Get new token" with valid credentials saved (Configuration or Client Generator) → chat shows "New worker token obtained...". With no credentials saved, chat shows an error. Token is stored and available to the rest of the app (unified storage).

- **AI Assistant discoverable from sidebar and navbar (2026-03)**
  - **What:** OAuth Assistant can be opened from the side menu (AI & Identity → “OAuth Assistant”) and from the top navbar (“Assistant” link). The floating AIAssistant component is rendered in App so the chat is available on every page; route `/ai-assistant` shows the demo/landing page.
  - **Files:** `src/App.tsx` (AIAssistant import + render, AIAssistantDemo route), `src/config/sidebarMenuConfig.ts` (OAuth Assistant in AI & Identity), `src/components/Navbar.tsx` (Assistant link + FiMessageCircle)
  - **Regression check:** Sidebar → AI & Identity → “OAuth Assistant” goes to `/ai-assistant`. Navbar “Assistant” goes to `/ai-assistant`. Floating 💬 button appears on all pages and opens the chat.

- **AI Assistant “Include web” (Brave Search) (2026-03)**
  - **What:** AI Assistant can optionally include live web search results. Backend route `GET /api/search-web?q=...` calls Brave Search API; frontend has a “Web” toggle; when enabled, results are merged into “Related Resources” as external links (🌐).
  - **Files:** `server.js` (/api/search-web), `src/components/AIAssistant.tsx` (includeWeb state, toggle, fetch and merge), `.env.example` (BRAVE_API_KEY comment)
  - **Regression check:** Open AI Assistant, enable “Web”, ask e.g. “OAuth 2.1 PKCE”. Reply should include in-app links plus up to 5 web results; web links open in new tab. With no BRAVE_API_KEY or invalid key, web results are empty and local results still work.

### Logging, log viewer & automation

- **Log streams at startup and Log Viewer visibility (2026-03)**
  - **What:** Startup script now lists all log streams (server.log, pingone-api.log, client.log, authz-redirects.log), bootstraps the three file-based streams so they exist from first run, and documents that all use `[timestamp] [localTime]` format. The log list API returns these four in a stable order first so the Log Viewer shows them consistently.
  - **Files:** `server.js` (LOG_STREAMS, writeBootstrapLogLine, /api/logs/list sort order)
  - **Regression check:** Start server; confirm startup logs mention all four streams and “format: [timestamp] [localTime]”. Open Log Viewer (floating or popout); select each of server.log, pingone-api.log, client.log, authz-redirects.log — all should be listed and viewable; entries should show date/time per line.

- **Post-commit hook runs update-dashboards (2026-03)**
  - **What:** After every commit, dashboards (e.g. cleanup history, session data) are refreshed by running `npm run update-dashboards`. Hook is version-controlled in `.husky/post-commit` so all clones get it after `npm install` (prepare runs husky).
  - **Files:** `.husky/post-commit`, `scripts/update-dashboards.mjs`, `package.json` (script: `update-dashboards`)
  - **Regression check:** Make a commit; verify no hook error; optionally open `/cleanup-history` (or dashboard that uses script output) and confirm data is up to date.

### Step header text color fix (2025-03-11)

- **What:** Step numbers in step headers were displaying black text on blue background, making them hard to read.
- **Cause:** The getStepNumber() component in flowUIService.tsx was missing the white color property, so it defaulted to black/dark text when used in blue step headers.
- **Fix:** Added `color: #ffffff;` to the getStepNumber() styled component to ensure white text on blue backgrounds.
- **Files:** `src/services/flowUIService.tsx` (getStepNumber method)
- **Regression check:** Open any flow with step headers (e.g., OAuth flows) → verify step numbers appear as white text on blue background headers.

### Modal z-index hierarchy (2025-03-11)

- **What:** Worker token modal and other modals using DraggableModal were being covered by dropdowns and notifications with higher z-index values (12001). The modal had z-index 999998/999999 but some components like BrandDropdownSelector (12001) and NotificationSystem (12000) were rendering on top.
- **Cause:** Z-index hierarchy didn't account for all high-z-index components in the application.
- **Fix:** Updated DraggableModal z-index values to 12002 (backdrop) and 12003 (content) to ensure all modals stay above dropdowns and notifications.
- **Files:** `src/components/DraggableModal.tsx` (ModalBackdrop, ModalContent z-index values)
- **Regression check:** Open worker token modal → verify it appears above all other UI elements including dropdowns and notifications. Test with multiple modals to ensure proper stacking.

- **Redirect URI catalogue: only Unified MFA and Unified OAuth; fix stacking**
  - **What:** The Configuration page “PingOne Redirect & Logout URIs” catalogue was showing every flow (mock, V8, V9, etc.). It now shows only the two URIs needed for PingOne app registration: **Unified OAuth (V8U)** and **Unified MFA**. Source URIs are taken from the app: `/unified-callback` and `/logout-callback` for V8U; `/v8/unified-mfa-callback` and `/mfa-unified-logout-callback` for Unified MFA. The catalogue card was also given `position: relative`, `zIndex: 10`, and `isolation: isolate` so it stacks above the Request Parameters panel/sidebar and is not covered.
  - **Files:** `src/utils/flowRedirectUriMapping.ts` (REDIRECT_URI_CATALOG_FLOW_TYPES, new `v8u-unified` entry), `src/services/callbackUriService.ts` (unifiedOAuthCallback, catalog filter, getCallbackTypesForFlow for v8u), `src/pages/Configuration.tsx` (subtitle/copy, Card z-index), `src/v8u/components/CredentialsFormV8U.tsx` (catalog link → `#redirect-uri-catalog-v8u-unified`)
  - **Regression check:** Open `/configuration`, expand “PingOne Redirect & Logout URIs”. Only two rows: “Unified OAuth/OIDC (V8U)” and “V8 Unified MFA Registration Flow”. Redirect URIs are `{origin}/unified-callback` and `{origin}/v8/unified-mfa-callback` respectively. Catalogue card is not covered by sidebar or other panels (scroll/layout); link from V8U credentials form “View all redirect URIs in Setup page” scrolls to the V8U row.

### AI & Identity group – consistent red headers (2026-03)

- **AI & Identity pages: red header with white lettering per migration guide**
  - **What:** All pages under sidebar group "AI & Identity" (and sub-group "AI - Ping") now use the migrated header pattern: **red header with white lettering** (PingOne style) via `FlowHeader` with `flowType: 'pingone'` or `PageLayoutService` with `theme: 'red'`.
  - **Files:** `src/services/flowHeaderService.tsx` (FLOW_CONFIGS: ai-glossary, ai-agent-overview, ping-ai-resources, ai-identity-architectures, oidc-for-ai, oauth-for-ai, ping-view-on-ai, ai-agent-auth-draft set to flowType: 'pingone'), `src/pages/AIAgentOverview.tsx`, `src/pages/PingAIResources.tsx`, `src/pages/docs/OIDCForAI.tsx`, `src/pages/docs/OAuthForAI.tsx`, `src/pages/docs/PingViewOnAI.tsx`, `src/pages/docs/AIAgentAuthDraft.tsx` (FlowHeader with red header; AIGlossary and AIIdentityArchitectures already use FlowHeader, now with pingone config).
  - **Regression check:** Open each route under AI & Identity: `/ai-agent-overview`, `/ai-glossary`, `/ping-ai-resources`, `/ai-identity-architectures`, `/docs/oidc-for-ai`, `/docs/oauth-for-ai`, `/docs/ping-view-on-ai`, `/docs/ai-agent-auth-draft`, `/docs/prompts/prompt-all`, `/docs/migration/migrate-vscode`. Each page must show a **red header bar with white text** at the top (no blue/purple/green headers).

### AI & Identity – Ping Icons (Astro Nano) (2026-03)

- **Ping Icons from assets.pingone.com/ux/astro-nano used across AI & Identity pages**
  - **What:** All AI & Identity (and Ping UI) pages now use the official Ping Icons from `https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css`. A shared `PingIcon` component renders `.mdi` and `.mdi-*` classes so icons match the Astro Nano set.
  - **Files:** `index.html` (link to Ping icons.css), `src/components/PingIcon.tsx` (new shared component), `src/pages/AIAgentOverview.tsx`, `src/pages/AIGlossary.tsx`, `src/pages/docs/OAuthAndOIDCForAI.PingUI.tsx` (use shared PingIcon), `src/pages/PingAIResources.tsx`, `src/pages/docs/OIDCForAI.tsx`, `src/pages/docs/PingViewOnAI.tsx` (PingIcon for section/collapsible headers).
  - **Regression check:** Open `/ai-agent-overview`, `/ai-glossary`, `/ping-ai-resources`, `/docs/oidc-for-ai`, `/docs/oauth-for-ai`, `/docs/ping-view-on-ai`. Section headers and icon areas should show Ping/MDI-style icons (from icons.css), not bootstrap-icons (bi-\*) or emoji-only.

### Developer & Tools – consistent red headers (2026-03)

- **Developer & Tools menu group: red header with white lettering per migration guide**
  - **What:** All pages under sidebar group "Developer & Tools" now use the migrated header pattern: **red header with white lettering** (PingOne style) via `FlowHeader` with dedicated `flowId` and `flowType: 'pingone'` in FLOW_CONFIGS.
  - **Files:** `src/services/flowHeaderService.tsx` (FLOW_CONFIGS: postman-collection-generator, postman-collection-generator-v9, oauth-code-generator-hub, application-generator, client-generator, service-test-runner, sdk-sample-app, sdk-examples, code-examples, ultimate-token-display-demo, davinci-todo, debug-logs-popout-v9, v7-settings; url-decoder set to flowType: 'pingone'), `src/pages/PostmanCollectionGenerator.tsx`, `src/pages/v9/PostmanCollectionGeneratorV9.tsx`, `src/pages/OAuthCodeGeneratorHub.tsx`, `src/pages/ServiceTestRunner.tsx`, `src/pages/SDKSampleApp.tsx`, `src/pages/sdk-examples/SDKExamplesHome.tsx`, `src/components/CodeExamplesDemo.tsx`, `src/pages/UltimateTokenDisplayDemo.tsx`, `src/sdk-examples/davinci-todo-app/DavinciTodoApp.tsx`, `src/pages/ApplicationGenerator.tsx`, `src/pages/ClientGenerator.tsx`, `src/pages/JWKSTroubleshooting.tsx`, `src/pages/URLDecoder.tsx`, `src/v7/pages/V7MSettingsV9.tsx`.
  - **Regression check:** Open each route under Developer & Tools: `/postman-collection-generator`, `/postman-collection-generator-v9`, `/oauth-code-generator-hub`, `/application-generator`, `/client-generator`, `/service-test-runner`, `/sdk-sample-app`, `/sdk-examples`, `/code-examples`, `/jwks-troubleshooting`, `/url-decoder`, `/ultimate-token-display-demo`, `/davinci-todo`, `/v7/settings`. Each page must show a **red header bar with white text** at the top.

### Worker token & environments

- **Worker token credentials: load/save from IndexedDB/SQLite across all apps (2026-02)**
  - **Rule:** Opening any flow or app that uses worker token credentials should load from **unified storage (IndexedDB/SQLite) first**, so credentials saved in the Worker Token modal or elsewhere appear in the form. Saving credentials from the Worker Token page (or any flow that persists worker creds) must also update IndexedDB/SQLite so they persist and load correctly on the next visit.
  - **Apps/services updated:**
    - **useWorkerTokenFlowController** (used by `/flows/worker-token-v9` and any flow using this hook): Already loads from `unifiedTokenStorage.getWorkerTokenCredentials()` on mount and saves via `unifiedTokenStorage.storeWorkerTokenCredentials()` — no change.
    - **ComprehensiveCredentialsService**: On mount, loads worker credentials from `unifiedWorkerTokenService.loadCredentials()` (IndexedDB/SQLite first); Config Checker uses `retrievedWorkerCredentials` state (populated from unified storage). Sync fallback remains `localStorage` in `checkWorkerToken`.
    - **useAutoEnvironmentId**: If canonical `loadEnvironmentId()` returns no valid env ID, tries `unifiedWorkerTokenService.loadCredentials()` and sets environment ID from worker credentials so env ID saved in Worker Token modal appears.
    - **PingOneAuditActivities** (`/audit-activities`): `executeApiCall` and `handleFetch` load region from `unifiedWorkerTokenService.loadCredentials()` first, then localStorage.
    - **MFAFlow** (`/flows/mfa`): Both MFA API steps load region from `unifiedWorkerTokenService.loadCredentials()` first, then localStorage.
    - **CompactAppPickerDemo**: On mount and on `workerTokenUpdated`, loads environment ID from `unifiedWorkerTokenService.loadCredentials()`; fallback to localStorage when unified storage has no env ID.
  - **Saving:** Worker Token modal and Worker Token flow save via `unifiedWorkerTokenService` / `unifiedTokenStorage.storeWorkerTokenCredentials()`, so persistence to IndexedDB/SQLite is already in place for those paths.
  - **Files:** `src/services/comprehensiveCredentialsService.tsx`, `src/hooks/useAutoEnvironmentId.ts`, `src/pages/PingOneAuditActivities.tsx`, `src/pages/flows/MFAFlow.tsx`, `src/pages/CompactAppPickerDemo.tsx`
  - **Regression check:** Save worker token credentials on one page (e.g. Worker Token modal or `/flows/worker-token-v9`); open another app that uses worker credentials (e.g. Unified OAuth credential form, Audit Activities, Compact App Picker, or any page using `useAutoEnvironmentId`). Credentials (and env ID / region where used) must appear without re-entering.

- **Environments page shows no environments despite valid worker token**
  - **Cause:** Token source mismatch: modal saves via `unifiedWorkerTokenService` (e.g. `localStorage` `unified_worker_token`), while `useGlobalWorkerToken` only used `workerTokenManager.getWorkerToken()`. Fetch could run before token was available or with a different token.
  - **Fix:** In `useGlobalWorkerToken`, prefer token from `unifiedWorkerTokenService` when valid (same source as modal); fallback to `workerTokenManager.getWorkerToken()`. On Environments page, only run fetch when `!loading && isValid && token`, and include `isValid` and `token` in effect deps so fetch re-runs when token appears.
  - **Files:** `src/hooks/useGlobalWorkerToken.ts`, `src/pages/EnvironmentManagementPageV8.tsx`
  - **Regression check:** With a valid worker token saved via the modal, open `/environments` — environments list must load. Refreshing or opening in new tab must still show environments.

### Worker token (general)

- **Worker token “not configured” when user had saved credentials**
  - **Fix:** `workerTokenRepository.loadCredentials()` falls back to `unified_worker_token` (and localStorage) when `unified_worker_token_credentials` is empty, so credentials saved by the modal are found.
  - **Files:** `src/services/workerTokenRepository.ts`
  - **Regression check:** Save worker token via modal on one flow; go to another page that needs worker token (e.g. Discover Apps, Environments) — token should be detected and used.

- **Worker token “Time remaining” showed “NaNm”**
  - **Fix:** `workerTokenStatusServiceV8U.formatWorkerTokenTimeRemaining` and `workerTokenStatusServiceV8.checkWorkerTokenStatusSync` normalize `expiresAt` to a number and handle NaN/empty; display shows “No expiration”, “Expired”, or “—”.
  - **Files:** `src/v8u/services/workerTokenStatusServiceV8U.ts`, `src/v8/services/workerTokenStatusServiceV8.ts`
  - **Regression check:** Worker token status panel shows a sensible time (e.g. `45m`) or a safe label, never “NaNm”.

- **Worker token: `RangeError: Invalid time value at Date.toISOString`**
  - **Cause:** When `expiresAt` from storage was invalid (NaN, unparseable string, or missing), code called `new Date(expiresAt).toISOString()` or compared dates without checking, causing RangeError in `useGlobalWorkerToken`, `checkWorkerTokenStatusSync`, and `WorkerTokenRepository.getToken`.
  - **Fix:** In `workerTokenRepository.ts`: when logging expiration, use a safe value (only call `.toISOString()` when `expiresAtMs` is valid; otherwise log `'none'`); for expiration check, compute `expiresAtNum = new Date(data.expiresAt).getTime()` and only treat as expired when `!Number.isNaN(expiresAtNum) && Date.now() > expiresAtNum`. In `workerTokenStatusServiceV8.ts`: when logging expired token, use `expiresAtIso = Number.isNaN(expiresAt) || expiresAt <= 0 ? String(expiresAt) : new Date(expiresAt).toISOString()` so `.toISOString()` is never called on invalid dates.
  - **Files:** `src/services/workerTokenRepository.ts`, `src/v8/services/workerTokenStatusServiceV8.ts`
  - **Regression check:** With a worker token that has invalid or missing `expiresAt` in storage, open a page that uses worker token status (e.g. Unified OAuth flow); no RangeError in console; status shows “Expired” or “—” instead of throwing.

### Sidebar & menu

- **Menu covered by floating overlay (e.g. log viewer) — regression**
  - **Cause:** Sidebar had `z-index: 100` and Navbar `z-index: 999`; `EnhancedFloatingLogViewer` uses `z-index: 9999`, so it rendered on top of the menu and covered it.
  - **Fix:** Raised chrome above floating panels: `Sidebar.tsx` sidebar container `z-index: 10050`, resize handle `10051`; `Navbar.tsx` nav container `z-index: 10050`. Floating log viewer remains 9999, so sidebar and navbar always stay on top.
  - **Files:** `src/components/Sidebar.tsx`, `src/components/Navbar.tsx`
  - **Regression check:** Open the app, open the floating debug log viewer (or any floating panel); sidebar and navbar must remain visible and clickable, not covered.

- **Drag-and-drop in side menu not working; could not move items across groups**
  - **Fix:** In `SidebarMenuPing`, find source item in subGroups via `findAndRemoveItem()`; add `onDragOver`/`onDrop` on group container and group header so dropping on a (possibly collapsed) group header adds the item to that group.
  - **Files:** `src/components/SidebarMenuPing.tsx`
  - **Regression check:** Enable drag mode; drag a menu item from one group into another (and onto a collapsed group header); order persists after refresh.

- **“1000+ hours History” moved to top group and renamed**
  - **Fix:** In `sidebarMenuConfig.ts`, “App update History” (`/cleanup-history`) moved from Admin & Platform to Dashboard; label set to “App update History”.
  - **Files:** `src/config/sidebarMenuConfig.ts`
  - **Regression check:** Dashboard group contains “App update History”; Admin & Platform does not.

### MFA feature flags

- **MFA feature flags page: always 100%, hide controls**
  - **Fix:** `MFA_FLAGS_ALWAYS_100 = true` in `mfaFeatureFlagsV8.ts`; `isEnabled()` always true, `getFlagState`/`getAllFlags()` return 100%. Admin page when `MFA_FLAGS_ALWAYS_100` shows only header + short message; toggles/bulk ops/grid hidden.
  - **Files:** `src/v8/services/mfaFeatureFlagsV8.ts`, `src/v8/pages/MFAFeatureFlagsAdminV8.tsx`
  - **Regression check:** `/v8/mfa-feature-flags` shows “All flags at 100%” and no controls; app behaves as if all flags are on.

### Mock flows – SAML Bearer Assertion V9

- **SAMLBearerAssertionFlowV9: `FiRefreshCw is not defined`**
  - **Cause:** Token request section used `<FiRefreshCw className="animate-spin" />` for loading state but the icon was not imported.
  - **Fix:** Added `import { FiRefreshCw } from '../../../icons';` to `SAMLBearerAssertionFlowV9.tsx`.
  - **Files:** `src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx`
  - **Regression check:** Open `/flows/saml-bearer-assertion-v9`, go to Token Request section; no ReferenceError; refresh/loading shows spinner icon.

### API Status page & DPoP / PAR / RAR (2026-03)

- **ApiStatusPage (/api-status) – grey Refresh button**
  - **Cause:** Styled components used `V9_COLORS` without template literal interpolation (e.g. `background: V9_COLORS.PRIMARY.BLUE`), so CSS did not receive the color and the button appeared grey.
  - **Fix:** Interpolated all `V9_COLORS` in `RefreshButton`, `StatusCard`, `CardTitle`, `StatLabel`, `StatValue` with `${}`. Refresh button uses blue when enabled, grey only when `disabled={loading}`.
  - **Files:** `src/pages/ApiStatusPage.tsx`
  - **Regression check:** Open `/api-status`; Refresh button is blue when idle, grey while “Refreshing...”.

- **DPoP flow – Test API Call 404, DPoP value highlight**
  - **Cause:** Request could hit `/dpop/protected-resource` (no `/api`) when proxy strips prefix; DPoP JWT line was hard to see.
  - **Fix:** Server registers handler for both `/api/dpop/protected-resource` and `/dpop/protected-resource`. DPoP flow adds `DPoPHighlightBox` for “DPoP header (send this with your request)” and “Headers — DPoP value (use in fetch)” so the JWT is prominent; helper text notes PingOne does not host the URL.
  - **Files:** `server.js`, `src/pages/flows/DPoPFlow.tsx`
  - **Regression check:** On `/flows/dpop`, create proof and click Test API Call — no 404; DPoP value appears in blue highlight boxes.

- **PAR V9 & RAR V9 – floating stepper**
  - **Fix:** Both flows now use `currentStep` and `setCurrentStep` from `usePageStepper()` so the global V9 stepper drives the page. Section expansion and scroll-into-view sync with stepper; inline step chips are buttons that call `setCurrentStep(index)`.
  - **Files:** `src/pages/flows/v9/PARFlowV9.tsx`, `src/pages/flows/v9/RARFlowV9.tsx`
  - **Regression check:** Open `/flows/par-v9` or `/flows/rar-v9`; floating stepper visible; Next/Previous and step chips change the active step and expand the right section.

- **MockApiCallDisplay – unterminated string literal**
  - **Fix:** Extra `)` in ChevronIcon styled component: `'rotate(0deg))` → `'rotate(0deg)'`.
  - **Files:** `src/components/MockApiCallDisplay.tsx`
  - **Regression check:** Build succeeds; no esbuild syntax error.

### Button styling – no grey unless disabled (global rule)

- **Requirement:** Buttons must never be grey when enabled; grey only when disabled. Fixing shared components fixes all consumers at once.

- **StandardizedCredentialExportImport (Export/Import Credentials) – grey buttons on RAR V9, Unified OAuth, etc.**
  - **Cause:** Styled buttons used literal strings `V9_COLORS.PRIMARY.GREEN` / `V9_COLORS.PRIMARY.BLUE` without importing or interpolating, so CSS was invalid and buttons appeared grey.
  - **Fix:** Import `V9_COLORS` from `@/services/v9/V9ColorStandards`; use `${V9_COLORS.PRIMARY.GREEN}` and `${V9_COLORS.PRIMARY.BLUE}` in styled-components. Disabled state set to `background: #9ca3af` and `&:hover:not(:disabled)` so hover only applies when enabled.
  - **Files:** `src/components/StandardizedCredentialExportImport.tsx`
  - **Used by:** RAR V9 (`/flows/rar-v9`), Unified OAuth, WorkerTokenModal, UnifiedDeviceRegistrationForm.
  - **Regression check:** Open any page that shows "Credential Management" with Export/Import (e.g. `/flows/rar-v9`); Export is green and Import is blue when enabled, grey only when disabled.

- **Grey buttons on mock flows (e.g. SAML Bearer Assertion V9, DPoP)**
  - **Fix:** (1) **SAMLBearerAssertionFlowV9:** Added `V9_COLORS` import; Button secondary/default changed from white+grey border to outline primary (blue border/text, white bg, hover light blue); disabled state explicitly grey. (2) **DPoPFlow:** Added `V9_COLORS` import; `CopyButton` changed from grey fill to outline primary (blue); disabled style grey. (3) **FlowUIService.getButton():** `secondary` and default variant changed from grey fill to outline primary (white bg, blue border/text); added global `&:disabled` override so any variant shows grey when disabled.
  - **Files:** `src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx`, `src/pages/flows/DPoPFlow.tsx`, `src/services/flowUIService.tsx`
  - **Regression check:** Open `/flows/saml-bearer-assertion-v9`, `/flows/dpop`, and other mock flows; action buttons are blue or outline blue when enabled, grey only when disabled.

- **WorkerTokenRequestModalV8 (“Generated Worker Token” modal) – grey Close/Cancel/Copy buttons**
  - **Cause:** Modal used grey backgrounds for Close, Cancel, Copy (endpoint), preflight Close, and grey text for Copy/visibility icons in the request params section.
  - **Fix:** All enabled action buttons use primary or outline-primary styling: Close/Cancel → white bg, blue border/text (`#2563eb`); Copy (endpoint) → outline blue when not “Copied”, green when copied; preflight Close → outline blue; Copy/visibility icons in request params → text color `#2563eb`. Grey (`#9ca3af`) kept only for the disabled “Execute Request” state.
  - **Files:** `src/v8/components/WorkerTokenRequestModalV8.tsx`
  - **Affected components:** Generated Worker Token modal (footer Close/Cancel, Token Endpoint Copy, preflight validation Close, client_id/client_secret/scope Copy and show/hide icons).
  - **Regression check:** Open any flow that shows the Worker Token request modal (e.g. Unified OAuth, Worker Token V9); generate a token so “Generated Worker Token” appears. Close, Copy, Token Management, Save Token must be blue or green when enabled; only disabled states (e.g. Execute while loading) may be grey.

### Logging service migration (V9)

- **V9LoggingService and migration from unifiedFlowLoggerServiceV8U**
  - **Context:** New V9 logging service provides structured logging for flows and unified UI; drop-in capable replacement for `unifiedFlowLoggerServiceV8U` with V9-agnostic context.
  - **Added:** `src/services/v9/V9LoggingService.ts` – same API as unified flow logger (debug, info, warn, error, success, startPerformance, getLogHistory, clearHistory, exportLogs, sanitized context). Exported from `src/services/v9/index.ts`.
  - **Migrated callers:** (1) `UnifiedFlowErrorBoundary.tsx` – import and all `logger.error`/`logger.warn` calls switched to `V9LoggingService`; error call now passes proper context object and Error as third argument. (2) `FlowNotAvailableModal.tsx` – import and all `logger.debug` calls switched to `V9LoggingService`; removed unused `_MODULE_TAG`.
  - **Files:** `src/services/v9/V9LoggingService.ts`, `src/services/v9/index.ts`, `src/v8u/components/UnifiedFlowErrorBoundary.tsx`, `src/v8u/components/FlowNotAvailableModal.tsx`
  - **Regression check:** Trigger a unified flow error (e.g. force an error in a step) and confirm error is logged without runtime errors; open “Flow not available” modal (e.g. pick Implicit on OAuth 2.1) and confirm no logger errors. New V9 flows should prefer `V9LoggingService`; remaining callers can be migrated gradually.

### Log viewer & discovery

- **OIDC Discovery modal: "logger.success is not a function" shown in UI**
  - **Cause:** Discovery success path called `logger.success()`; in some contexts the logger instance does not expose `success`, so the call threw and the error message appeared in the PingOne Discovery modal.
  - **Fix:** Replaced `logger.success` with `logger.info` in discovery success paths so discovery never depends on `logger.success`. Applied in `discoveryService.ts` (after successful discovery) and `DiscoveryPanel.tsx` (after configuration discovered).
  - **Files:** `src/services/discoveryService.ts`, `src/components/DiscoveryPanel.tsx`
  - **Regression check:** Open PingOne Discovery (e.g. Discover Applications), enter Environment ID and Region, run Discover; modal shows success and no "logger.success is not a function" message.

- **Log viewer popout: category filters (API Calls, Errors, Auth Flow, Debug) did nothing**
  - **Fix:** In `EnhancedFloatingLogViewer`, added `filterLogContentByCategory()` to filter lines by pattern; display uses filtered content; added “All” chip; default category `ALL`.
  - **Files:** `src/components/EnhancedFloatingLogViewer.tsx`
  - **Regression check:** Open log viewer, select “Errors” or “API Calls” etc.; only matching lines are shown.

- **DiscoveryService: `logger.discovery is not a function`**
  - **Fix:** All discovery log calls in `discoveryService.ts` use `logger.info()` instead of `logger.discovery()`.
  - **Files:** `src/services/discoveryService.ts`
  - **Regression check:** Use OIDC Discovery (e.g. Discover Applications or discovery panel); no console error about `logger.discovery`.

### Backend / server logging

- **API call log demarcation (for debugging)**
  - **Context:** When debugging backend proxy/API logs, it helps to have clear start/end markers around each request/response summary so API calls are easy to find in the log stream.
  - **Recommendation:** In `server.js`, around `logRequestResponseSummary` output, consider adding explicit banners (e.g. `>>> API CALL START <<<` and `>>> API CALL END <<<`) so log viewers and grep can easily isolate individual API call blocks. If already present, do not remove when changing server logging.

### Console / UI fixes (past)

- **AppDiscoveryModalV8U: validateDOMNesting &lt;button&gt; cannot appear as descendant of &lt;button&gt;** — Modal is now rendered with `createPortal(modalContent, document.body)` so it is never inside the form/tree where a parent could be a button. Backdrop remains `<div role="presentation">`.
- **Popout window: `logger is not defined`** — Replaced `logger.info` with `console.log` in injected script in `SuperSimpleApiDisplayV8.tsx`.
- **AppDiscoveryModalV8U: button inside button (validateDOMNesting)** — Backdrop is `<div role="presentation">`, not `<button>`; modal also portaled to body.

---

## 4. Regression Checklist (Do Not Break)

When changing the listed areas, run the corresponding checks to avoid regressions.

### Worker token & credentials

- [ ] **Token button / global modal:** Any "Get Worker Token" (or equivalent) button that opens a worker token modal must use the Worker Token modal service: either open `WorkerTokenModalV9` (which uses `unifiedWorkerTokenService`) or dispatch `open-worker-token-modal` so App shows `WorkerTokenModalV9`. Do not use the legacy `WorkerTokenModal` for new code. See Update log "Token button at top of pages: use Worker Token modal service".
- [ ] **WorkerTokenModalV9 scopes:** `credentials.scopes` may be a string (from storage) or an array. Any use of scopes (e.g. `.join(' ')`) must go through `normalizeScopes(scopes)` so it never calls `.join` on a non-array. See Update log "Worker Token Modal, FlowCredentials, ClaimsRequestBuilder: runtime errors".
- [ ] **Worker token credentials — SQLite source of truth:** Worker token credentials are stored in and loaded from backend SQLite (`/api/credentials/sqlite`, key `__worker_token__`) so they persist across restarts. Do not rely on localStorage as source of truth. Load order in `unifiedWorkerTokenService`: memory → SQLite → IndexedDB → localStorage → legacy. Saving must call `unifiedWorkerTokenService.saveCredentials()` which persists to SQLite. See Update log "Worker token credentials: SQLite as source of truth".
- [ ] **Token source:** Any change to `unifiedWorkerTokenService`, `workerTokenManager`, or `workerTokenRepository` storage keys: verify `/environments` and “Discover Apps” still see a valid token after saving via Worker Token modal.
- [ ] **useGlobalWorkerToken:** If you change how the hook gets the token, ensure it still prefers `unifiedWorkerTokenService` when that has a valid token (so it matches the modal).
- [ ] **Environments page:** Changing `EnvironmentManagementPageV8.tsx` or `environmentServiceV8.ts`: with valid worker token, `/environments` must load the list; effect must depend on `isValid` and `token` so fetch runs when token becomes available.
- [ ] **Worker token expiration (dates):** Changing `workerTokenRepository.ts` or `workerTokenStatusServiceV8.ts`: never call `new Date(...).toISOString()` or date comparison without validating (e.g. `Number.isNaN` on getTime()); invalid `expiresAt` must be handled without throwing RangeError.

### Sidebar

- [ ] **Sidebar/Navbar z-index:** Do not lower `Sidebar.tsx` or `Navbar.tsx` z-index below `EnhancedFloatingLogViewer` (9999). Sidebar must stay at 10050, Navbar at 10050, so the menu is never covered by floating panels.
- [ ] **SidebarMenuPing:** Changing drag/drop or group structure: drag an item across groups and onto a collapsed group header; confirm order saves and persists.
- [ ] **sidebarMenuConfig:** Changing group membership or labels: confirm “App update History” remains under Dashboard and menu still matches design. Mock Flows must use canonical paths: OIDC mock → `/flows/oidc-authorization-code-v9`, `/flows/oidc-hybrid-v9`, `/flows/ciba-v9`; OAuth 2.0 mock → `/flows/device-authorization-v9`, `/flows/client-credentials-v9`, `/flows/implicit-v9`; legacy `/v7/oauth/...` and `/v7/oidc/...` (except ROPC) redirect to these.

### MFA feature flags

- [ ] **mfaFeatureFlagsV8.ts:** If you change `MFA_FLAGS_ALWAYS_100` or how flags are read: confirm `/v8/mfa-feature-flags` and all MFA flows still behave as “all flags 100%” when the constant is true.

### Logging & discovery

- [ ] **discoveryService / DiscoveryPanel:** Do not use `logger.discovery` or `logger.success` in discovery paths; use `logger.info` so OIDC Discovery works in all contexts.
- [ ] **EnhancedFloatingLogViewer:** Category filters must filter displayed content by category (API Calls, Errors, Auth Flow, Debug, All).

### Modals & DOM

- [ ] **AppDiscoveryModalV8U:** Modal is portaled to `document.body` via `createPortal` so it is never a descendant of a button; backdrop remains `div` with `role="presentation"`. Do not remove the portal or wrap modal content in a button.
- [ ] **AppDiscoveryModalV8U (backdrop):** Backdrop must remain a non-button element (e.g. `div` with `role="presentation"`) so there is no button-inside-button.
- [ ] **DraggableModal z-index hierarchy:** When changing modal z-index values, ensure DraggableModal (12002/12003) stays above all other UI elements including BrandDropdownSelector (12001) and NotificationSystem (12000). All modals using DraggableModal must appear on top.

### Icons

- [ ] **Feather icons (Fi\*):** Any use of `FiRefreshCw`, `FiCheck`, etc. must have a corresponding import from `src/icons` (e.g. `import { FiRefreshCw } from '../../../icons';`). Never use an icon component without importing it; otherwise "X is not defined" at runtime.

### Button styling (no grey unless disabled)

- [ ] **Global rule:** Buttons must never be grey when enabled; grey only when disabled. When changing shared components (e.g. `StandardizedCredentialExportImport`, `FlowUIService.getButton`, `ConfigCheckerButtons`, `DiscoveryPanel`), use `V9_COLORS` with template interpolation (e.g. `${V9_COLORS.PRIMARY.BLUE}`) and reserve grey for `&:disabled` only.
- [ ] **StandardizedCredentialExportImport:** Export/Import buttons use `V9_COLORS` from `@/services/v9/V9ColorStandards` with interpolation; disabled state uses grey (`#9ca3af`). Changing this file: verify Export is green and Import is blue on e.g. `/flows/rar-v9`.
- [ ] **WorkerTokenRequestModalV8:** Close, Cancel, Copy, and preflight Close use outline primary (white bg, blue border/text); Copy/visibility icons use blue text. Do not reintroduce grey fill for enabled buttons; grey only for disabled state (e.g. Execute while loading). Verify in "Generated Worker Token" modal after generating a token.
- [ ] **ApiStatusPage:** RefreshButton and other styled components use `${V9_COLORS...}` interpolation; Refresh is blue when enabled, grey when disabled. Verify on `/api-status`.
- [ ] **UltimateTokenDisplay / UltimateTokenDisplayDemo:** `V9_COLORS` must be imported and used with template interpolation in styled components; ActionButton primary/success/warning use blue/green/amber, default (secondary) uses outline blue (not grey). Demo page Button uses blue gradient. Grey only for `:disabled`. Verify on `/ultimate-token-display-demo`.

### Collapsible section headers (unified flow)

- [ ] **SecurityScorecard, AdvancedOAuthFeatures, FlowGuidanceSystem:** When changing these components, do not re-add local `CollapsibleHeaderButton` / `CollapsibleTitle` / `CollapsibleToggleIcon` / `CollapsibleContent`; they use `UnifiedFlowCollapsibleSection`, `UnifiedFlowCollapsibleHeaderButton`, `UnifiedFlowCollapsibleTitle`, `UnifiedFlowCollapsibleToggleIcon`, and `UnifiedFlowCollapsibleContent` from `@/services/collapsibleHeaderService`. Verify Security Scorecard and Advanced OAuth Features sections expand/collapse with ⬇️ icon (right when collapsed, down when expanded).

### Step headers and UI components

- [ ] **FlowUIService step headers:** When changing step header styling, ensure getStepNumber() has `color: #ffffff` for proper visibility on blue backgrounds. Step numbers must be white text on blue step headers.
- [ ] **JWT Bearer / flow pages:** Text on blue (step circles, buttons, MockApiCallDisplay header) must use `color: #ffffff`. JWT Bearer uses red header (flowType `pingone` in flowHeaderService). Do not revert to blue header or `color: 'white'` (use `#ffffff`).
- [ ] **Mock Flows (V7M) shared styles:** When changing `src/v7/styles/mockFlowStyles.ts` or `V7MMockBanner`/`V7MStepSection`: all V7M pages (Client Credentials, Device Authorization, OAuth Auth Code, OIDC Hybrid, CIBA, Implicit, ROPC) must keep using shared container, banner, section/header/body styles and MOCK\_\* button/input constants. Do not reintroduce per-page duplicate style objects; disabled primary buttons must use MOCK_PRIMARY_BTN_DISABLED. Hybrid and CIBA must keep UnifiedCredentialManagerV9 below FlowHeader.
- [ ] **Flow stepper / section sync (PAR, RAR):** Any `useEffect` that syncs section expansion (or similar) with `currentStep` must not depend on an array/object defined inside the component (e.g. `SECTION_KEYS`), or the dependency changes every render and causes "Maximum update depth exceeded". Use a module-level constant for step/section keys, or depend only on `[currentStep]`. See Update log "PAR/RAR flows: fix Maximum update depth exceeded".

### Logging (V9 vs V8U)

- [ ] **V9LoggingService:** New flows and migrated callers use `@/services/v9/V9LoggingService` for structured logging. When touching `UnifiedFlowErrorBoundary` or `FlowNotAvailableModal`, do not revert to `unifiedFlowLoggerServiceV8U`; keep using `V9LoggingService`.

### Configuration page – redirect URI catalogue

- [ ] **Redirect URI catalogue:** Changing `flowRedirectUriMapping.ts`, `callbackUriService.ts`, or the Configuration “PingOne Redirect & Logout URIs” section: the catalogue must show only **two** rows (Unified OAuth/V8U and Unified MFA). Do not re-add mock, V8-only, or V9 flows to the catalogue. URIs must match app routes: `/unified-callback`, `/logout-callback` for V8U; `/v8/unified-mfa-callback`, `/mfa-unified-logout-callback` for MFA. Catalogue card must keep `zIndex: 10` (or higher than surrounding panels) so it is not covered. See Update log “Redirect URI catalogue: only Unified MFA and Unified OAuth; fix stacking”.

### Developer & Tools – red headers

- [ ] **Developer & Tools pages:** Changing `flowHeaderService.tsx` FLOW_CONFIGS or any page under the Developer & Tools sidebar group: each of these routes must show a **red header bar with white text** (PingOne style): `/postman-collection-generator`, `/postman-collection-generator-v9`, `/oauth-code-generator-hub`, `/application-generator`, `/client-generator`, `/service-test-runner`, `/sdk-sample-app`, `/sdk-examples`, `/code-examples`, `/jwks-troubleshooting`, `/url-decoder`, `/ultimate-token-display-demo`, `/davinci-todo`, `/v7/settings`. Do not remove FlowHeader or revert to custom gradient/blue headers. See Update log “Developer & Tools – consistent red headers”.

---

## 5. Quick Regression Checklist (pre-PR or release)

Run these when doing a broader change or before release:

1. **Worker token:** Save token via modal → open `/environments` → environments list loads.
2. **Sidebar:** Enable drag mode → move one item to another group → refresh → order persisted.
3. **MFA flags:** Open `/v8/mfa-feature-flags` → see “All at 100%” and no toggles.
4. **Discovery:** Trigger OIDC Discovery once → no `logger.discovery` or `logger.success` error; modal shows success.
5. **Log viewer:** Open log viewer → switch category filters → content filters as expected.
6. **Worker token (invalid expiry):** If testing with bad/missing `expiresAt` in storage → no RangeError; status shows “Expired” or “—” instead of crashing.
7. **Button styling:** On `/flows/rar-v9` (or any page with Credential Management), Export and Import buttons are green and blue when enabled, grey only when disabled.
8. **Redirect URI catalogue:** Open `/configuration` → “PingOne Redirect & Logout URIs”: only two rows (Unified OAuth/V8U, Unified MFA); catalogue card not covered by sidebar/panels.
9. **Developer & Tools headers:** Open at least two routes under Developer & Tools (e.g. `/postman-collection-generator`, `/url-decoder`) → each shows a red header bar with white text at the top.

---

## 6. Plan for Maintaining This Doc

### Who updates it

- **Developer making a fix:** Add an “Update log” entry and, if the fix is easy to regress, a “Regression checklist” item.
- **Reviewer:** Can ask “is this in the update log / regression plan?” for non-trivial fixes.

### When to update

- After fixing a bug that could come back (especially “we just fixed this” type).
- After refactoring worker token, sidebar, MFA flags, discovery, or log viewer.
- When adding a new “do not break” area (e.g. new shared hook or service).

### How to add an entry

1. **Update log:** Add a short heading (e.g. “Environments page / worker token”), then:
   - One line: what was wrong.
   - **Cause:** why it happened.
   - **Fix:** what was changed (and where).
   - **Files:** paths.
   - **Regression check:** 1–2 concrete steps to verify the fix still holds.
2. **Regression checklist:** Add a bullet under the right section (Worker token, Sidebar, etc.) with:
   - **Trigger:** “When you change X…”
   - **Check:** “verify Y”.

### Keeping regressions from coming back

- **CI (optional):** Add a small E2E or smoke test for “worker token + environments load” and “sidebar drag across groups” if the team wants automation.
- **Release notes:** When cutting a release, skim the update log and run the Quick regression checklist for the areas you touched.
- **On bug report:** If someone says “we fixed this before,” search this doc for the feature and re-run the listed regression check; then fix and add/update the entry if the root cause was different or the check was missing.

---

## 7. Do-Not-Break Areas (summary)

| Area                                 | Key files                                                                                                                                                                                                                                                                       | What not to break                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker token → Environments          | `useGlobalWorkerToken.ts`, `EnvironmentManagementPageV8.tsx`, `workerTokenRepository.ts`                                                                                                                                                                                        | Token from modal must be used on `/environments`; fetch only when token is valid and present.                                                              |
| Worker token storage                 | `workerTokenRepository.ts`, `unifiedWorkerTokenService.ts`                                                                                                                                                                                                                      | Credentials in `unified_worker_token` must be found by repository; token in same key used by modal.                                                        |
| Worker token expiration              | `workerTokenRepository.ts`, `workerTokenStatusServiceV8.ts`                                                                                                                                                                                                                     | Invalid or missing `expiresAt` must not cause RangeError; validate before calling `.toISOString()` or comparing dates.                                     |
| Sidebar drag-and-drop                | `SidebarMenuPing.tsx`                                                                                                                                                                                                                                                           | Cross-group move and drop on group header must work; order persisted.                                                                                      |
| MFA flags at 100%                    | `mfaFeatureFlagsV8.ts`, `MFAFeatureFlagsAdminV8.tsx`                                                                                                                                                                                                                            | When `MFA_FLAGS_ALWAYS_100` is true, all flags behave as 100%; admin UI shows message only.                                                                |
| Discovery / logger                   | `discoveryService.ts`                                                                                                                                                                                                                                                           | No use of `logger.discovery`; use `logger.info` (or existing methods).                                                                                     |
| Log viewer filters                   | `EnhancedFloatingLogViewer.tsx`                                                                                                                                                                                                                                                 | Category filters must filter displayed log content.                                                                                                        |
| Modal DOM                            | `AppDiscoveryModalV8U.tsx`, `DraggableModal.tsx`                                                                                                                                                                                                                                | No button wrapping another button (backdrop is div); DraggableModal z-index (12002/12003) must stay above all other UI elements.                           |
| Icons (Fi\*)                         | Any component using Feather icons                                                                                                                                                                                                                                               | Import from `src/icons`; never use `FiRefreshCw` or other Fi\* without import.                                                                             |
| Configuration redirect URI catalogue | `flowRedirectUriMapping.ts`, `callbackUriService.ts`, `Configuration.tsx`                                                                                                                                                                                                       | Catalogue shows only Unified MFA and Unified OAuth (V8U); URIs match app routes; card z-index keeps it above other content.                                |
| Developer & Tools headers            | `flowHeaderService.tsx`, PostmanCollectionGenerator, OAuthCodeGeneratorHub, ServiceTestRunner, SDKSampleApp, SDKExamplesHome, CodeExamplesDemo, UltimateTokenDisplayDemo, DavinciTodoApp, ApplicationGenerator, ClientGenerator, JWKSTroubleshooting, URLDecoder, V7MSettingsV9 | Developer & Tools sidebar pages must show red header (PingOne style) via FlowHeader with dedicated flowId; do not remove or revert to custom/blue headers. |
| Button styling                       | `StandardizedCredentialExportImport.tsx`, FlowUIService, ConfigCheckerButtons, DiscoveryPanel, **WorkerTokenRequestModalV8.tsx**, **ApiStatusPage.tsx**                                                                                                                         | Buttons never grey when enabled; use V9_COLORS with `${}` interpolation or outline primary; grey only for `:disabled`.                                     |
| Step headers & UI components         | `flowUIService.tsx`, `flowComponentService.tsx`, `v7StepperService.tsx`                                                                                                                                                                                                         | Step numbers must have white text on blue backgrounds; getStepNumber() must include `color: #ffffff`.                                                      |
| Logging (V9)                         | `V9LoggingService.ts`, `UnifiedFlowErrorBoundary.tsx`, `FlowNotAvailableModal.tsx`                                                                                                                                                                                              | Migrated callers use V9LoggingService; do not revert to unifiedFlowLoggerServiceV8U for these components.                                                  |

---

_Last updated: 2026-03-26. Add new entries and checklist items as fixes and refactors are done. Update this doc on every fix._
