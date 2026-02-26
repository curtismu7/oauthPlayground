# Dashboard Updates — Tracking

Track dashboard changes: single source for server status, current API endpoints, quick access (Unified OAuth), and recent activity from real flows.

## Goals

- **Single server status**: Use API Status on dashboard; share health-check code so we don't have two places checking server status.
- **Current API endpoints**: Available API Endpoints section reflects actual backend routes.
- **Quick access**: All OAuth/OIDC entries point at Unified OAuth (`/v8u/unified`) and tell it which flow to start; PingOne links use current app paths (e.g. V7).
- **Recent activity**: Updated as we run flows (including actions like Delete All Devices). Mock/educational flows are not tracked.

---

## 1. API Testing section

- **Status**: Removed.
- **Rationale**: No separate "API Testing" block; flows are launched from Quick Access and menu.

---

## 2. System Status → API Status

- **Status**: Done.
- **Behavior**:
  - Dashboard no longer has its own "System Status" section that duplicates health checks.
  - Dashboard shows an "API Status" block that:
    - Uses shared server health logic via `serverHealthService` (same data as `/api-status` page).
    - Displays the same details as the API Status page: per-server status, port, version, environment, uptime, last checked; for backend also node version, memory, CPU, request stats. Data comes from `fetchDetailedHealth()`.
    - Includes a link to **API Status** (`/api-status`) for the full-page view.
  - Shared code: `serverHealthService` — `getBackendHealthUrl()`, `fetchDetailedHealth()`, `formatBytes()`, `formatUptime()`, types `HealthData` and `DetailedServerStatus`. Both Dashboard and ApiStatusPage use `fetchDetailedHealth()`.

---

## 3. Available API Endpoints

- **Status**: Kept in sync with backend.
- **Source**: Backend routes in `server.js` (and any mounted API routers).
- **List** (representative OAuth/OIDC/playground endpoints; update when adding/removing routes):

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Backend health check |
| GET | `/api/env-config` | Environment defaults |
| GET | `/api/version` | Backend version |
| POST | `/api/token-exchange` | Exchange authorization code for tokens |
| POST | `/api/client-credentials` | Client credentials grant |
| POST | `/api/introspect-token` | Token introspection |
| GET | `/api/userinfo` | UserInfo (OAuth) |
| POST | `/api/validate-token` | Validate access tokens |
| POST | `/api/device-authorization` | Device authorization flow |
| POST | `/api/par` | Pushed Authorization Request |
| GET | `/api/jwks` | PingOne JWKS |
| POST | `/api/user-jwks` | Generate JWKS from user key |
| POST | `/api/credentials/save` | Save credentials |
| GET | `/api/credentials/load` | Load credentials |
| GET | `/api/environments` | List environments |
| POST | `/api/pingone/worker-token` | Worker token |
| POST | `/api/pingone/token` | Token endpoint proxy |
| POST | `/api/pingone/oidc-discovery` | OIDC discovery |
| POST | `/api/mfa/challenge/initiate` | MFA challenge |
| POST | `/api/device/register` | FIDO2 device registration |

Add/remove rows as backend routes change; consider centralizing in a shared config (e.g. `dashboardApiEndpoints.ts`) used by the Dashboard UI.

---

## 4. Quick Access Flows

- **Status**: Current and pointing at correct apps.
- **OAuth 2.0 / OpenID Connect**:
  - All entries use **Unified OAuth** and tell it which flow to start:
    - Authorization Code: `/v8u/unified/oauth-authz`
    - Implicit: `/v8u/unified/implicit`
    - Device Authorization: `/v8u/unified/device-code`
    - Client Credentials: `/v8u/unified/client-credentials`
    - Hybrid: `/v8u/unified/hybrid`
  - OIDC Overview can stay as `/oidc-overview` (or current doc route).
- **PingOne Flows**:
  - Use current app paths (e.g. V7 where applicable):
    - Worker Token: `/flows/worker-token-v7`
    - PAR: `/flows/pingone-par-v7`
    - Redirectless: `/flows/redirectless-v7-real`

---

## 5. Recent Activity

- **Status**: Updated as we run flows; no mock flows.
- **Tracked**:
  - Unified OAuth/OIDC flow completions (success/failure) when callback returns to the app.
  - Token operations (e.g. token exchange, introspection) where already integrated.
  - Configuration changes (e.g. credential updates) where already integrated.
  - **Delete All Devices**: When user completes "Delete All Devices" (success and/or partial failure), record one activity entry (e.g. "Delete All Devices" with count or summary).
- **Not tracked**:
  - Mock / educational flows (e.g. under `/flows/` that are explicitly mock or demo-only).
- **Implementation**:
  - Use `trackActivity` / `trackOAuthFlow` from `activityTracker.ts`.
  - Unified flow: call `trackOAuthFlow(flowType, success)` from the callback handler when redirecting back to the flow (success) or when redirecting to dashboard with error (failure).
  - Delete All Devices: call `trackActivity` (or a small helper) after deletion completes (with success/failure and optional count).

---

## 6. Config section (custom domain)

- **Status**: Done.
- **Goal**: Show and **edit** the **custom domain** (e.g. **api.pingdemo.com**); store in **SQLite** (backend) and **IndexedDB** (client); app uses the new domain after save (redirect).
- **Behavior**:
  - Dashboard has a collapsible **Config** section (Ping red/white header).
  - **App URL (HTTPS):** Displays the current app URL from the custom domain (hostname + `:3000`).
  - **Editable domain**: Input for hostname only (e.g. api.pingdemo.com). **Save and use this domain** saves to backend (SQLite) and to IndexedDB, then redirects to `https://<domain>:3000/dashboard` so the app runs on the new domain.
  - **Storage**: Backend uses `settingsDB` (SQLite, key `custom_domain`). Frontend uses `customDomainService` (IndexedDB + API sync).
  - **Default**: `api.pingdemo.com` when nothing is stored. Effective domain: IndexedDB → API → env → default.
- **Implementation**:
  - **Backend**: `server.js` — GET/POST `/api/settings/custom-domain` (validate hostname, persist via `settingsDB`).
  - **Frontend**: `src/services/customDomainService.ts` — getCustomDomain(), saveCustomDomain(), getAppUrlForDomain(); IndexedDB + API.
  - **Dashboard**: Config section with input, Save button; on save, redirect to new URL.
  - **Types**: `vite-env.d.ts` declares `VITE_PUBLIC_APP_URL`.
- **Always HTTPS**: Display and redirect use HTTPS only.

---

## Key files

- `src/pages/Dashboard.tsx` — main dashboard page; collapsible sections, API Status, **Config (custom domain: edit, save to SQLite + IndexedDB, redirect)**.
- `src/services/customDomainService.ts` — get/save custom domain; IndexedDB + API (SQLite) sync; getAppUrlForDomain().
- `src/services/serverHealthService.ts` — shared health check used by Dashboard and ApiStatusPage.
- `src/styles/dashboard.css` — dashboard styles; text colours `#111827` / `#1f2937` (almost black); `.form-control` for Config input.
- `src/pages/ApiStatusPage.tsx` — full API status page linked from dashboard.
- `server.js` — GET/POST `/api/settings/custom-domain` (SQLite via `settingsDB`).
- `scripts/development/run.sh` — exports `VITE_PUBLIC_APP_URL`; `--change-domain` still available for run-time config.
- `src/vite-env.d.ts` — declares `VITE_PUBLIC_APP_URL`.

---

## Changelog

- **2025-02**: Initial doc; removed API Testing; System Status replaced by API Status using shared health check; API endpoints list updated; Quick Access aligned to Unified OAuth and current PingOne paths; Recent Activity updated to include unified flow and Delete All Devices, exclude mock flows.
- **2025-02**: Added §6 Config section (custom domain): new Dashboard section to show custom domain; default `https://api.pingdemo.com`, always HTTPS; documented current lack of app base URL config and recommended `VITE_PUBLIC_APP_URL`.
- **2025-02**: Applied **prompt-all.md** + **migrate_cursor.md** to Dashboard (change packet below).
- **2025-02**: **§6 Config section (custom domain)** implemented: Config collapsible section on Dashboard shows App URL (HTTPS) from `VITE_PUBLIC_APP_URL` or `window.location.origin`; run.sh exports `VITE_PUBLIC_APP_URL`; user changes domain via `./run.sh --change-domain`.
- **2025-02**: **Config: edit on Dashboard**: Custom domain can be changed in the Dashboard Config section. Stored in SQLite (backend `/api/settings/custom-domain`) and IndexedDB (`customDomainService`). After Save, app redirects to the new URL so the app uses the new custom domain.

---

## Change packet: prompt-all + migrate_cursor applied (2025-02)

**Inventory used:** This file (`dashboard-updates.md`), `migrate_cursor.md`, `prompt-all.md`.

**Affected consumers:** Dashboard route `/dashboard` only; no API or shared contract changes.

**Compatibility:** PATCH (internal/UI only).

**Plan:** Align Dashboard and `dashboard.css` with migrate_cursor consistency rules (borders `#e5e7eb`, radius `0.75rem`, body text already `#111827`/`#1f2937`).

**Code changes:**

- `src/styles/dashboard.css`: Card and section borders set to `1px solid #e5e7eb`; border-radius set to `0.75rem` for `.card`, `.flow-card`, `.api-endpoint-card`, `.test-coverage-box`.
- `src/pages/Dashboard.tsx`: Added file comment referencing migrate_cursor and dashboard-updates.md.

**Testing:** Visual check on `/dashboard`: sections collapsible (Ping red/white), text dark, cards consistent border/radius.

**Rollback:** Revert CSS border/radius and Dashboard.tsx comment.
