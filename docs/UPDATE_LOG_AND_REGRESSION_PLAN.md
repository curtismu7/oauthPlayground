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

**IDE and agents:** A Cursor rule (`.cursor/rules/regression-plan-check.mdc`) runs when editing regression-sensitive files (sidebar, navbar, worker token, discovery, flow UI, etc.). It tells the agent to read this doc (Section 4 and 7) before changes and to add an Update log entry and run the relevant checks after every fix. That is the standard way for the IDE and agents to avoid reintroducing the errors listed here.

---

## 3. Update Log

_(Newest first. **Update this section on every fix.** Add date and one-line summary; link to files or PRs if useful.)_

### Logging, log viewer & automation

- **Log streams at startup and Log Viewer visibility (2026-03)**
  - **What:** Startup script now lists all log streams (server.log, pingone-api.log, client.log, authz-redirects.log), bootstraps the three file-based streams so they exist from first run, and documents that all use `[timestamp] [localTime]` format. The log list API returns these four in a stable order first so the Log Viewer shows them consistently.
  - **Files:** `server.js` (LOG_STREAMS, writeBootstrapLogLine, /api/logs/list sort order)
  - **Regression check:** Start server; confirm startup logs mention all four streams and “format: [timestamp] [localTime]”. Open Log Viewer (floating or popout); select each of server.log, pingone-api.log, client.log, authz-redirects.log — all should be listed and viewable; entries should show date/time per line.

- **Post-commit hook runs update-dashboards (2026-03)**
  - **What:** After every commit, dashboards (e.g. cleanup history, session data) are refreshed by running `npm run update-dashboards`. Hook is version-controlled in `.husky/post-commit` so all clones get it after `npm install` (prepare runs husky).
  - **Files:** `.husky/post-commit`, `scripts/update-dashboards.mjs`, `package.json` (script: `update-dashboards`)
  - **Regression check:** Make a commit; verify no hook error; optionally open `/cleanup-history` (or dashboard that uses script output) and confirm data is up to date.

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

- [ ] **Unified storage (IndexedDB/SQLite):** Any app that reads or displays worker token credentials (environmentId, clientId, clientSecret, region) must load from `unifiedWorkerTokenService.loadCredentials()` (or `unifiedTokenStorage.getWorkerTokenCredentials()`) first, then fall back to localStorage. Saving worker credentials must call `unifiedTokenStorage.storeWorkerTokenCredentials()` (or unifiedWorkerTokenService) so they persist. See Update log "Worker token credentials: load/save from IndexedDB/SQLite across all apps".
- [ ] **Token source:** Any change to `unifiedWorkerTokenService`, `workerTokenManager`, or `workerTokenRepository` storage keys: verify `/environments` and “Discover Apps” still see a valid token after saving via Worker Token modal.
- [ ] **useGlobalWorkerToken:** If you change how the hook gets the token, ensure it still prefers `unifiedWorkerTokenService` when that has a valid token (so it matches the modal).
- [ ] **Environments page:** Changing `EnvironmentManagementPageV8.tsx` or `environmentServiceV8.ts`: with valid worker token, `/environments` must load the list; effect must depend on `isValid` and `token` so fetch runs when token becomes available.
- [ ] **Worker token expiration (dates):** Changing `workerTokenRepository.ts` or `workerTokenStatusServiceV8.ts`: never call `new Date(...).toISOString()` or date comparison without validating (e.g. `Number.isNaN` on getTime()); invalid `expiresAt` must be handled without throwing RangeError.

### Sidebar

- [ ] **Sidebar/Navbar z-index:** Do not lower `Sidebar.tsx` or `Navbar.tsx` z-index below `EnhancedFloatingLogViewer` (9999). Sidebar must stay at 10050, Navbar at 10050, so the menu is never covered by floating panels.
- [ ] **SidebarMenuPing:** Changing drag/drop or group structure: drag an item across groups and onto a collapsed group header; confirm order saves and persists.
- [ ] **sidebarMenuConfig:** Changing group membership or labels: confirm “App update History” remains under Dashboard and menu still matches design.

### MFA feature flags

- [ ] **mfaFeatureFlagsV8.ts:** If you change `MFA_FLAGS_ALWAYS_100` or how flags are read: confirm `/v8/mfa-feature-flags` and all MFA flows still behave as “all flags 100%” when the constant is true.

### Logging & discovery

- [ ] **discoveryService / DiscoveryPanel:** Do not use `logger.discovery` or `logger.success` in discovery paths; use `logger.info` so OIDC Discovery works in all contexts.
- [ ] **EnhancedFloatingLogViewer:** Category filters must filter displayed content by category (API Calls, Errors, Auth Flow, Debug, All).

### Modals & DOM

- [ ] **AppDiscoveryModalV8U:** Modal is portaled to `document.body` via `createPortal` so it is never a descendant of a button; backdrop remains `div` with `role="presentation"`. Do not remove the portal or wrap modal content in a button.
- [ ] **AppDiscoveryModalV8U (backdrop):** Backdrop must remain a non-button element (e.g. `div` with `role="presentation"`) so there is no button-inside-button.

### Icons

- [ ] **Feather icons (Fi\*):** Any use of `FiRefreshCw`, `FiCheck`, etc. must have a corresponding import from `src/icons` (e.g. `import { FiRefreshCw } from '../../../icons';`). Never use an icon component without importing it; otherwise "X is not defined" at runtime.

### Button styling (no grey unless disabled)

- [ ] **Global rule:** Buttons must never be grey when enabled; grey only when disabled. When changing shared components (e.g. `StandardizedCredentialExportImport`, `FlowUIService.getButton`, `ConfigCheckerButtons`, `DiscoveryPanel`), use `V9_COLORS` with template interpolation (e.g. `${V9_COLORS.PRIMARY.BLUE}`) and reserve grey for `&:disabled` only.
- [ ] **StandardizedCredentialExportImport:** Export/Import buttons use `V9_COLORS` from `@/services/v9/V9ColorStandards` with interpolation; disabled state uses grey (`#9ca3af`). Changing this file: verify Export is green and Import is blue on e.g. `/flows/rar-v9`.
- [ ] **WorkerTokenRequestModalV8:** Close, Cancel, Copy, and preflight Close use outline primary (white bg, blue border/text); Copy/visibility icons use blue text. Do not reintroduce grey fill for enabled buttons; grey only for disabled state (e.g. Execute while loading). Verify in “Generated Worker Token” modal after generating a token.
- [ ] **ApiStatusPage:** RefreshButton and other styled components use `${V9_COLORS...}` interpolation; Refresh is blue when enabled, grey when disabled. Verify on `/api-status`.

### Logging (V9 vs V8U)

- [ ] **V9LoggingService:** New flows and migrated callers use `@/services/v9/V9LoggingService` for structured logging. When touching `UnifiedFlowErrorBoundary` or `FlowNotAvailableModal`, do not revert to `unifiedFlowLoggerServiceV8U`; keep using `V9LoggingService`.

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

| Area                        | Key files                                                                                                                                               | What not to break                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Worker token → Environments | `useGlobalWorkerToken.ts`, `EnvironmentManagementPageV8.tsx`, `workerTokenRepository.ts`                                                                | Token from modal must be used on `/environments`; fetch only when token is valid and present.                          |
| Worker token storage        | `workerTokenRepository.ts`, `unifiedWorkerTokenService.ts`                                                                                              | Credentials in `unified_worker_token` must be found by repository; token in same key used by modal.                    |
| Worker token expiration     | `workerTokenRepository.ts`, `workerTokenStatusServiceV8.ts`                                                                                             | Invalid or missing `expiresAt` must not cause RangeError; validate before calling `.toISOString()` or comparing dates. |
| Sidebar drag-and-drop       | `SidebarMenuPing.tsx`                                                                                                                                   | Cross-group move and drop on group header must work; order persisted.                                                  |
| MFA flags at 100%           | `mfaFeatureFlagsV8.ts`, `MFAFeatureFlagsAdminV8.tsx`                                                                                                    | When `MFA_FLAGS_ALWAYS_100` is true, all flags behave as 100%; admin UI shows message only.                            |
| Discovery / logger          | `discoveryService.ts`                                                                                                                                   | No use of `logger.discovery`; use `logger.info` (or existing methods).                                                 |
| Log viewer filters          | `EnhancedFloatingLogViewer.tsx`                                                                                                                         | Category filters must filter displayed log content.                                                                    |
| Modal DOM                   | `AppDiscoveryModalV8U.tsx`                                                                                                                              | No button wrapping another button (backdrop is div).                                                                   |
| Icons (Fi\*)                | Any component using Feather icons                                                                                                                       | Import from `src/icons`; never use `FiRefreshCw` or other Fi\* without import.                                         |
| Button styling              | `StandardizedCredentialExportImport.tsx`, FlowUIService, ConfigCheckerButtons, DiscoveryPanel, **WorkerTokenRequestModalV8.tsx**, **ApiStatusPage.tsx** | Buttons never grey when enabled; use V9_COLORS with `${}` interpolation or outline primary; grey only for `:disabled`. |
| Logging (V9)                | `V9LoggingService.ts`, `UnifiedFlowErrorBoundary.tsx`, `FlowNotAvailableModal.tsx`                                                                      | Migrated callers use V9LoggingService; do not revert to unifiedFlowLoggerServiceV8U for these components.              |

---

_Last updated: 2026-03-26. Add new entries and checklist items as fixes and refactors are done. Update this doc on every fix._
