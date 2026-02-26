# Dashboard Updates — Tracking

Track dashboard changes: single source for server status, current API endpoints, quick access (Unified OAuth), and recent activity from real flows.

## Goals

- **Single server status**: Use API Status on dashboard; share health-check code so we don’t have two places checking server status.
- **Current API endpoints**: Available API Endpoints section reflects actual backend routes.
- **Quick access**: All OAuth/OIDC entries point at Unified OAuth (`/v8u/unified`) and tell it which flow to start; PingOne links use current app paths (e.g. V7).
- **Recent activity**: Updated as we run flows (including actions like Delete All Devices). Mock/educational flows are not tracked.

---

## 1. API Testing section

- **Status**: Removed.
- **Rationale**: No separate “API Testing” block; flows are launched from Quick Access and menu.

---

## 2. System Status → API Status

- **Status**: Done.
- **Behavior**:
  - Dashboard no longer has its own “System Status” section that duplicates health checks.
  - Dashboard shows an “API Status” block that:
    - Uses shared server health logic (see `serverHealthService` or shared hook).
    - Displays frontend/backend status (same data source as `/api-status` page).
    - Includes a link to **API Status** (`/api-status`) for full details (health payload, refresh, etc.).
  - Shared code: `getBackendHealthUrl()`, and a single “check server health” function used by both Dashboard and ApiStatusPage.

---

## 3. Available API Endpoints

- **Status**: Kept in sync with backend.
- **Source**: Backend routes in `server.js` (and any mounted API routers).
- **List** (representative OAuth/OIDC/playground endpoints; update when adding/removing routes):

| Method | Path | Description |
|--------|------|-------------|
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
  - **Delete All Devices**: When user completes “Delete All Devices” (success and/or partial failure), record one activity entry (e.g. “Delete All Devices” with count or summary).
- **Not tracked**:
  - Mock / educational flows (e.g. under `/flows/` that are explicitly mock or demo-only).
- **Implementation**:
  - Use `trackActivity` / `trackOAuthFlow` from `activityTracker.ts`.
  - Unified flow: call `trackOAuthFlow(flowType, success)` from the callback handler when redirecting back to the flow (success) or when redirecting to dashboard with error (failure).
  - Delete All Devices: call `trackActivity` (or a small helper) after deletion completes (with success/failure and optional count).

---

## 6. Config section (custom domain)

- **Status**: To do.
- **Goal**: Add a new **Config** section on the Dashboard that shows the **custom domain** (public app URL) the app is using or is configured for.
- **Requirements**:
  - **Default**: `https://api.pingdemo.com` when no override is set.
  - **Always HTTPS**: Display and use only HTTPS; do not show or accept `http://` for the app base URL.
  - **Dashboard**: Collapsible section (e.g. “Config” or “App URL”) that displays the current custom domain / app base URL (read-only or with a note that it comes from env).
- **Current app support**:
  - The app does **not** currently have a single “custom domain” or “app base URL” config. Redirect URIs and callbacks use **`window.location.origin`** at runtime (see e.g. `comprehensiveCredentialsService`, callback URLs). There is no `VITE_APP_BASE_URL` or similar in `.env` / `.env.example`.
  - **Backend** base URL is configured via **`VITE_BACKEND_URL`** (e.g. `https://api.pingdemo.com:3001`); that is for the API server, not the frontend’s public URL.
- **Implementation options**:
  1. **Add `VITE_PUBLIC_APP_URL`** (or `VITE_APP_BASE_URL`): default `https://api.pingdemo.com` in code or in `.env.example`. Dashboard reads this and displays it in the Config section. Normalize to HTTPS (strip `http://`, force `https://`). Optionally use this when building redirect URIs for deployed envs instead of `window.location.origin`.
  2. **Display only (no new env)**: Config section shows `window.location.origin` (actual runtime origin). Default “api.pingdemo.com” would only appear when the app is actually served from that host; no override.
- **Recommendation**: Add **`VITE_PUBLIC_APP_URL`** with default **`https://api.pingdemo.com`** so that the dashboard can always show a sensible default and deployments can override. Enforce HTTPS in UI and in any code that uses this value.

---

## Changelog

- **2025-02**: Initial doc; removed API Testing; System Status replaced by API Status using shared health check; API endpoints list updated; Quick Access aligned to Unified OAuth and current PingOne paths; Recent Activity updated to include unified flow and Delete All Devices, exclude mock flows.
- **2025-02**: Added §6 Config section (custom domain): new Dashboard section to show custom domain; default `https://api.pingdemo.com`, always HTTPS; documented current lack of app base URL config and recommended `VITE_PUBLIC_APP_URL`.
