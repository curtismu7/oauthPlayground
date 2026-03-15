# AI Assistant — Admin Login (Alternative to Worker Token)

**Date:** 2026-03-14  
**Status:** Implemented  
**Scope:** Add Admin (client credentials) as a second auth source for PingOne API calls in the AI Assistant; keep Worker Token as the existing option.

---

## 1. Goal

- **Keep** the current **Worker Token** flow (client credentials from Configuration / MCP Server Config). No removal, no breaking change.
- **Add** a new option: **Admin Login** — user provides **Admin app credentials** (environment ID, client ID, client secret) in the side panel; we call the PingOne token endpoint with **client credentials** grant to obtain an **access token** (Admin token), and use that token for the same PingOne Management API calls (list users, list apps, create user, etc.) that today use the worker token.
- **Side panel:** Show Admin credentials form (environment ID, client ID, client secret); “Get token” calls token endpoint with `grant_type=client_credentials`; after success show “Logged in as Admin” and use that token for MCP calls until the user signs out or the token expires.

---

## 2. Current Behavior (Brief)

| Component | Behavior |
|-----------|----------|
| **Credentials** | Worker token from Configuration (client_credentials): envId, clientId, clientSecret. Token obtained via backend (`/api/mcp/query` with “Get worker token” or from stored credentials). |
| **Side panel** | “PingOne Login” tab does **pi.flow** (Authorization Code, embedded) for **end-user** login (e.g. UserInfo). Not used for Management API. |
| **MCP calls** | `callMcpQuery(query, { workerToken, environmentId, region })` → `POST /api/mcp/query` with `workerToken` in body. Backend uses that token for Management API (list users, apps, groups, etc.). |
| **Backend** | Resolves token: `workerToken` from request body → else env → else in-memory cache. Uses it as `Authorization: Bearer <token>`. |

So today there is a single token path for Management API: worker token. We add a second path: admin token.

---

## 3. Proposed Behavior

### 3.1 Auth source: two options

- **Worker Token (existing)**  
  - Token from client_credentials (Configuration / MCP Server Config).  
  - No change to UI or API.

- **Admin Login (new)**  
  - User enters **Admin app credentials** in the side panel: environment ID, client ID, client secret (or reuses from Configuration).  
  - We call PingOne token endpoint with **client credentials** grant to get an **access token**.  
  - That token is stored in memory (or React state/context) and used as the Bearer token for all MCP/PingOne calls until sign out or expiry.

Backend can stay unchanged: it already accepts a token in the request and uses it for Management API. We only need to **send the admin token** when the user has chosen “Admin” and has a valid token (e.g. send it in the same `workerToken` field, or in a dedicated `accessToken` field that the backend uses when present).

### 3.2 Side panel UX

- **Keep** existing tabs: “PingOne Login” (pi.flow), “Documentation”, “Tools”.
- **Add** a clear **Admin Login** block (either a new tab or a second card in “PingOne Login”):
  - **Environment ID** (required, or “Use from Configuration”).
  - **Client ID** (required for admin app).
  - **Client Secret** (required for admin app; can be pre-filled from config or entered here).
  - **Get token** → call backend with `grant_type=client_credentials` to get access token; on success store token and show “Logged in as Admin”.
  - **Sign Out** → clear stored admin token; subsequent MCP calls fall back to worker token (if any) or prompt for credentials.
- Show which source is active, e.g. “Using: Worker token” vs “Using: Admin login”.

### 3.3 Obtaining the Admin token

**Option A — ROPC via backend (recommended)**  
- Add support for `grant_type: 'password'` on existing `/api/token-exchange` (or add a dedicated endpoint, e.g. `POST /api/mcp/admin-token`).  
- Request body: `grant_type`, `username`, `password`, `client_id`, `client_secret`, `environment_id`, optional `scope` (e.g. `p1:read:environments p1:read:applications p1:read:users ...`).  
- Backend calls PingOne token endpoint, returns `access_token` and `expires_in` to the client.  
- Keeps client secret and token endpoint server-side; avoids CORS.

**Option B — ROPC from frontend**  
- Only if PingOne token endpoint is CORS-enabled for the app origin; frontend would need client_id/client_secret in memory. Less secure; not recommended unless required.

**PingOne notes:**  
- ROPC must be enabled on the PingOne application used for admin.  
- That application must have the necessary Management API scopes (e.g. `p1:read:users`, `p1:read:applications`) so the issued access token is valid for the same APIs the worker token uses.

### 3.4 Using the Admin token for MCP calls

- When the user has an active **Admin** session (stored access token):
  - `callMcpQuery(query, { workerToken: adminAccessToken, environmentId, region })`  
  - or extend options: `callMcpQuery(query, { adminAccessToken, environmentId, region })` and backend uses `adminAccessToken` when present, else `workerToken`.
- When the user has no Admin token (or chose “Worker token”):
  - Keep current behavior: pass worker token from Configuration / cache as today.

So: **two sources**, **one backend contract** (Bearer token in request). No need to change how the backend calls PingOne; only how the frontend obtains and sends the token.

---

## 4. Implementation Plan

### Phase 1: Backend — Admin token (client credentials)

1. **Use existing `/api/token-exchange` or add `/api/mcp/admin-token`**  
   - Accept `grant_type: 'client_credentials'` with `client_id`, `client_secret`, `environment_id`, and optional `scope`.  
   - Validate required fields; call PingOne token endpoint; return `{ access_token, expires_in, token_type }`.  
   - Document that the Admin app must have client credentials grant and Management API scopes enabled.

2. **Optional:** If using a dedicated endpoint, e.g. `POST /api/mcp/admin-token`, keep it minimal (client credentials only, for AI Assistant admin token) so token-exchange stays generic.

### Phase 2: Frontend — Side panel Admin login UI

1. **AIAssistantSidePanel**  
   - Add an **“Admin login”** section (new tab or second card under “PingOne Login”):  
     - Environment ID, Client ID, Client Secret (or “Use from Configuration” checkbox).  
     - Get token → call backend with client credentials, store `access_token` and `expires_in`.  
     - Sign Out → clear token.  
   - Show status: “Not signed in” | “Logged in as Admin (expires in X min)”.

2. **State / context**  
   - Hold admin token (and expiry) in React state or a small context (e.g. `AIAssistantAuthContext`) so that:  
     - Side panel can set/clear it.  
     - Main AI Assistant can read “use worker token” vs “use admin token” and pass the right one to `callMcpQuery`.

### Phase 3: Frontend — Use Admin token in MCP calls

1. **AIAssistant.tsx (or equivalent)**  
   - When building options for `callMcpQuery`:  
     - If “Admin” is selected and we have a valid (non-expired) admin token → pass it (e.g. as `workerToken` or `adminAccessToken`).  
     - Else → use existing worker token from `getTokenStatus` / Configuration.  
   - Optional: add a small header or dropdown to switch “Use Worker token” vs “Use Admin login” and show which is active.

2. **mcpQueryService**  
   - Extend `McpQueryOptions` if needed, e.g. `adminAccessToken?: string`.  
   - In `callMcpQuery`, send either `workerToken` or `adminAccessToken` in the request body; backend uses whichever is provided (and prefers admin token if both sent, or define a single field and let frontend set it from either source).

### Phase 4: Docs and regression

1. **Docs**  
   - Update AI Assistant user-facing doc (and any MCP/Configuration docs) to describe:  
     - Worker token (unchanged).  
     - Admin login: Admin app credentials in side panel, client credentials grant, same PingOne API calls, sign out clears token.  
   - In `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`: add an entry for “AI Assistant Admin Login” (Phase 1–4), and a short regression check: Worker token still works; Admin login obtains token and list users/apps works with that token.

2. **Regression**  
   - Worker token flow: “Get worker token” and “List users” (or “List applications”) still work with no Admin login.  
   - Admin flow: sign in in side panel → “List users” uses admin token; sign out → next call uses worker token or returns credentials required.

---

## 5. File Checklist (Summary)

| Area | File(s) | Change |
|------|--------|--------|
| Backend token | `server.js` | Use existing client_credentials on `/api/token-exchange` or add `POST /api/mcp/admin-token` (client credentials → PingOne, return access_token). |
| Side panel | `src/components/AIAssistantSidePanel.tsx` | Add Admin login form (environment ID, client ID, client secret), Get token / Sign Out, status. |
| Auth state | New context or state in `AIAssistant.tsx` / side panel | Store admin token + expiry; expose “useAdminToken” and token value. |
| MCP client | `src/services/mcpQueryService.ts` | Optional: `adminAccessToken` in options; send in body. |
| AI Assistant | `src/components/AIAssistant.tsx` | When calling MCP: if admin token set and valid, pass it; else worker token. Optionally show “Worker token” vs “Admin” in header. |
| Backend MCP | `server.js` (`/api/mcp/query`) | Prefer token from request: e.g. `adminAccessToken || workerToken` if you add a separate field; or keep single `workerToken` and let frontend send admin token in that field. |
| Docs | `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`, AI Assistant / MCP docs | Document Admin login; add regression checklist. |

---

## 6. Security and Constraints

- **Client secret:** Send only to backend over HTTPS; do not log or persist in the client.  
- **Token storage:** In-memory (or sessionStorage) only; no long-term storage of admin token.  
- **Scopes:** Admin app must have the same Management API scopes as the worker app so the same MCP tools work.  
- **PingOne:** Client credentials grant must be enabled for the application used for Admin login.

---

## 7. Out of Scope (No Change)

- Existing **Worker Token** flow and Configuration UI.
- **PingOne Login** tab (pi.flow for end-user login / UserInfo).
- MCP tool list or backend tool implementations; only the **source** of the Bearer token for those calls changes when the user chooses Admin login.
