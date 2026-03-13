# Agent Prompt: PingOne redirectless Auth Code (pi.flow) with BFF Session Mode

## Context and current state (verified)
- Root package runs the only HTTP(S) server (`server.js`). It serves `dist/` and implements a React Router fallback excluding `/api/*` and `/.well-known`.
- `server.js` forwards requests to PingOne `/as/token` via:
  - `POST /api/token-exchange`
  - `POST /api/pingone/token`
  and returns the **full PingOne token response** to the browser.
- The SPA stores tokens in **sessionStorage** and **localStorage** (`oauthStorage`, `secureTokenStorage`, and `oauth_tokens`).
- `server.js` uses an in-memory `cookieJar = new Map()` keyed by a **client-provided `sessionId`** to store/forward **PingOne Set-Cookie** values for redirectless `pi.flow` resume/poll/check-username-password. This is **not** an application session.

## Goal
Implement a new **BFF Session Mode** that:
- Supports **Authorization Code + PKCE** with **`response_mode=pi.flow`** (redirectless)
- Stores **short-lived PingOne access tokens server-side only**
- Returns only **authenticated status + user summary** to the SPA (no PingOne tokens in client)
- Allows user selection of token endpoint client auth method:
  - `client_secret_basic` (HTTP Basic)
  - `client_secret_post`
- Keeps existing “playground mode” behavior (return tokens to SPA) behind a feature flag, so current flows don’t break.

## Non-negotiables / security constraints
- **Never** log or return: `client_secret`, `Authorization` header, `code`, `code_verifier`, `access_token`, `refresh_token`, `id_token`.
- **Do not** accept a client-supplied session identifier for the application session (avoid session fixation). Generate server-side.
- Keep existing redirectless `pi.flow` endpoints working; they can continue using `cookieJar` for PingOne cookies.

---

# Work to perform (Cursor or VSCode)

## SERVER: root `server.js`

### 1) Add an application session mechanism
Implement a minimal server-side session store:
- Cookie name: `mf_session`
- Cookie value: random `sessionId` generated server-side (UUID)
- Server-side store: `Map<sessionId, SessionRecord>` where:

```ts
SessionRecord = {
  createdAt: number,
  expiresAt: number,
  userSummary?: { sub?: string; email?: string; name?: string },
  pingOne?: {
    access_token: string,
    expires_at: number,
    id_token?: string,
    // refresh_token intentionally omitted in this design
  }
}
```

Cookie settings (prod):
- `HttpOnly: true`
- `Secure: true`
- `SameSite: 'lax'`
- `Path: '/'`

If behind a reverse proxy/ingress, ensure:
- `app.set('trust proxy', 1)`

### 2) Add `GET /api/session`
- Reads `mf_session` cookie
- If missing/invalid/expired: `{ authenticated: false }` and `401`
- If valid: `{ authenticated: true, userSummary, sessionExpiresAt, pingOneAccessTokenExpiresAt }`

### 3) Add `POST /api/auth/pingone/exchange`
This is the canonical endpoint for **authorization-code exchange** in session mode.

Input JSON:
```json
{ "code": "...", "codeVerifier": "...", "state": "...", "environment_id": "...", "region": "..." }
```

Behavior:
1. Validate `state` against a server-issued state store if available. If none exists today, add a minimal state issuance/verification:
   - Create `POST /api/auth/pingone/state` to mint and store state+nonce+createdAt keyed by state; or
   - Store state in an in-memory map with TTL.
2. Build token endpoint URL:
   - `https://auth.pingone.com/<environment_id>/as/token` (or region-specific base if your existing code supports it)
3. Exchange code at PingOne `/as/token` using configured token endpoint auth method:
   - `client_secret_basic` => `Authorization: Basic base64(client_id:client_secret)`
   - `client_secret_post`  => include `client_id` and `client_secret` in `application/x-www-form-urlencoded` body
   - Always include `grant_type=authorization_code`, `code`, `code_verifier`
4. On success:
   - Create or reuse server-side session record keyed by `mf_session`
   - Store PingOne access token + expiry server-side only
   - Derive `userSummary`:
     - Preferred: call PingOne `/as/userinfo` using the access token if you already have a helper
     - Alternative: decode `id_token` payload for a non-authoritative summary (never log it)
   - Respond with minimal JSON:

```json
{
  "authenticated": true,
  "userSummary": { "sub": "...", "email": "...", "name": "..." },
  "sessionExpiresAt": 1710000000000,
  "pingOneAccessTokenExpiresAt": 1710000000000
}
```

5. Ensure the response body does **not** include tokens.

### 4) Modify existing token endpoints without breaking playground
Existing endpoints must remain compatible, but add a mode flag.

- `POST /api/token-exchange`
- `POST /api/pingone/token`

Add a switch:
- Query param: `?mode=session|playground` OR header `X-Auth-Mode: session|playground`
- Default remains `playground` to preserve current behavior.

Rules:
- If `mode=session` and `grant_type=authorization_code`, do not return tokens. Instead:
  - Process like `/api/auth/pingone/exchange`
  - Store tokens server-side + set `mf_session`
  - Return minimal authenticated status JSON.
- For other grant types in `mode=session`:
  - Either reject with `400 unsupported_in_session_mode` OR allow only if still not returning tokens. Prefer rejecting initially to reduce risk.

### 5) Logging redaction
Add a small helper so server logs never include sensitive values:
- Redact: `Authorization`, `client_secret`, `code`, `code_verifier`, `access_token`, `refresh_token`, `id_token`.

---

## CLIENT: root React app

### 6) Add a feature toggle: “Use BFF Session Mode”
- Store toggle in `localStorage` (safe), e.g. key: `use_bff_session_mode=true|false`
- When enabled:
  - SPA should stop persisting PingOne tokens to storage
  - SPA should call server endpoints that establish session

### 7) Authorization code completion path
When session mode is enabled:
- On auth completion (after `pi.flow` yields `code`), call:
  - `POST /api/auth/pingone/exchange` with `{ code, codeVerifier, state, environment_id, region }`
- Then call (or rely on response):
  - `GET /api/session` to update UI state
- Update `NewAuthContext` and `useAuthorizationCodeFlowController` so:
  - In session mode, do **not** call `oauthStorage.setTokens`, `storeOAuthTokens`, or `localStorage.setItem('oauth_tokens', ...)`.
  - Only store `{ authenticated, userSummary }` in React state.

When session mode is disabled:
- Keep existing behavior (tokens in storage) unchanged.

### 8) Ensure browser sends cookies
Use `fetch('/api/...', { credentials: 'include' })` for session endpoints.

---

# Implementation notes

## Short-lived PingOne access tokens
- PingOne access token lifetime is configured on the PingOne side. In this app, treat tokens as short-lived and re-auth via `pi.flow` when expired.
- In session mode, when MasterFlow detects token expiry, return `401 reauth_required` and let the SPA re-run the redirectless flow.

## Redirect URI
- For redirectless `pi.flow`, do not require a redirect URI in config unless you add a separate redirect-based fallback.

---

# Deliverables
1. Code changes in root `server.js` implementing session mode and new endpoints.
2. SPA changes adding session mode toggle and modifying login completion behavior.
3. A short test plan (see below) confirming:
   - Playground mode still returns tokens
   - Session mode never returns tokens and sets `mf_session` cookie

---

# Test plan (acceptance)

## A. Build + run
1. Build SPA:
   - `npm run build` (produces `dist/`)
2. Run server (HTTPS):
   - `npm run start:backend` (or whatever script starts `server.js`)

## B. Playground mode regression
1. Perform a standard token exchange via existing UI using existing flows.
2. Confirm `/api/token-exchange` returns `access_token` in response body (unchanged) when no session mode flag is set.
3. Confirm SPA still stores tokens in `sessionStorage/localStorage` in playground mode.

## C. Session mode behavior
1. Enable “Use BFF Session Mode” in the UI.
2. Run redirectless `pi.flow` login to obtain an auth code.
3. SPA calls `POST /api/auth/pingone/exchange`.

Expected:
- Response body contains **no tokens** (no `access_token`, `refresh_token`, `id_token`).
- Response sets `Set-Cookie: mf_session=...; HttpOnly; Secure; SameSite=Lax; Path=/`.
- `GET /api/session` returns `{ authenticated: true, userSummary: ... }`.

## D. No-token-leak checks
1. Inspect Network tab for `/api/auth/pingone/exchange` and `/api/session` responses:
   - No token fields present.
2. Inspect Application Storage:
   - No token keys written by session mode code paths (`pingone_playground_tokens`, `oauth_tokens`) for the login performed.
3. Grep server logs:
   - Ensure no secrets/codes/verifiers/tokens were printed.

## E. Expiry / reauth behavior (smoke)
1. Simulate token expiry by reducing stored expiry in the session record (dev) or waiting.
2. Call an endpoint that requires valid PingOne AT.

Expected:
- Server responds `401 reauth_required`.
- SPA triggers a new redirectless `pi.flow` login and re-establishes server-side tokens.
