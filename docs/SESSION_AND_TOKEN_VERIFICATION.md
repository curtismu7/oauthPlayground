# Session and Token Verification: "We Don't Set Sessions; PingOne Does"

**Purpose**: Verify where cookies/session/tokens are set or read (app vs PingOne) and whether the app maintains its own session.  
**Conclusion**: **No — we do not currently set an application session.** The server does not use express-session, does not set `Set-Cookie` for an app session, and does not store PingOne tokens server-side. The SPA receives PingOne tokens in API responses and stores them in **sessionStorage** and **localStorage** in the browser.

---

## 1) All places we set or read cookies/headers that function as an app session

### Server (root `server.js`)

| Location | What | Purpose |
|----------|------|--------|
| **Lines 1633–1650** | `cookieJar = new Map()`, `mergeCookieArrays()` | In-memory map keyed by **client-provided `sessionId`**. Stores **PingOne** Set-Cookie values (e.g. `interactionId`, `interactionToken`, `ST`) so the BFF can forward them to PingOne on resume/poll/check-username-password. **Not** an app session; no cookie set in browser. |
| **6981–6984** | `getSetCookieHeaders(response)` | Reads **PingOne** `Set-Cookie` from fetch response (Node 20+ / node-fetch). |
| **7257–7317** | Redirectless authorize response handling | Extracts PingOne session tokens from JSON or Set-Cookie; merges into `cookieJar` under `sessionId`. |
| **7448–7508** | Redirectless resume | Reads `cookieJar.get(sessionId)` and sends as `Cookie` to PingOne. |
| **8128–8175** | Check-username-password flow | Reads `cookieJar.get(sessionId)` and sends as `Cookie` to PingOne flow URL. |
| **8205–8259** | Check-username-password response | Captures PingOne Set-Cookie / interactionId; merges into `cookieJar.set(sid, merged)`. |

**No** `res.cookie()`, **no** `res.setHeader('Set-Cookie', ...)` in `server.js`. **No** `cookie-parser` or `express-session` in the root server.

### React app (SPA)

| File | Lines | What | Purpose |
|------|-------|------|--------|
| **`src/utils/storage.ts`** | 181–286 | `oauthStorage` (sessionStorage) | `setTokens` / `getTokens` → `sessionStorage` (key `pingone_playground_tokens`). Used for OAuth tokens and state (state, nonce, code_verifier). |
| **`src/utils/credentialManager.ts`** | 88–1465 | `localStorage` / `sessionStorage` | Config credentials, authz flow credentials, worker credentials, discovery prefs. **Not** PingOne access/id/refresh tokens from login. |
| **`src/App.tsx`** | 431–587 | `localStorage` | Sidebar width, open state, `enhanced-flow-authorization-code`, `skip_startup_credentials_modal`. |
| **`src/components/SecurityThreatTheater.tsx`** | 400, 410 | `sessionStorage.setItem('oauth_state', state)` / `getItem` | OAuth state for demo; not a server-backed session. |
| **`src/hooks/useAuthorizationCodeFlowController.ts`** | 1696–1699 | `localStorage.setItem('oauth_tokens', ...)` | After token exchange, stores full token response in `oauth_tokens` for Token Management / cross-tab. |
| **`src/utils/tokenStorage.ts`** | 29–46 | `storeOAuthTokens` → `secureTokenStorage` | Stores tokens in **sessionStorage** (via secureTokenStorage). |
| **`src/contexts/NewAuthContext.tsx`** | 1690, 1728–1733 | `oauthStorage.setTokens(tokens)`, `sessionStorage.removeItem('oauth_state')` | After callback, stores tokens in oauthStorage (sessionStorage) and clears OAuth state. |

**References to `req.session`**: Only in **documentation/sample code** inside `src/pages/OIDCSessionManagement.tsx` (e.g. 1439, 2646) as **string literals in code blocks** (front-channel logout examples). They are **not** executed by the app server; the root server has no express-session.

### Other packages

- **`src/services/codeGeneration/templates/backend/nodeTemplates.ts`** (45–93): **Generated sample code** for user projects; uses `req.session` in the template. Not the running app.
- **`src/services/codeGeneration/templates/frontend/nextjsTemplates.ts`** (42, 91): **Generated sample code**; `res.setHeader('Set-Cookie', ...)` in template. Not the running app.

---

## 2) API routes involved in auth/token handling

### POST `/api/pingone/token`

| Item | Detail |
|------|--------|
| **Inputs** | `environment_id`, `region`, `body` (URL-encoded token params), `auth_method`, `headers` (optional, e.g. Basic for client_secret_basic). |
| **PingOne** | Calls **PingOne** `POST {authBase}/{environment_id}/as/token` with `body` and headers. No `/as/authorize`. |
| **Returns to browser** | Full PingOne token response: `access_token`, `refresh_token`, `id_token`, `expires_in`, etc., plus `server_timestamp`, `grant_type` via `res.json(responseData)`. |
| **Server-side storage** | **None.** No session, no DB, no file. |

**File**: `server.js` **4019–4132**.

---

### POST `/api/token-exchange`

| Item | Detail |
|------|--------|
| **Inputs** | `grant_type`, `client_id`, `client_secret`, `redirect_uri`, `code`, `code_verifier`, `refresh_token`, `scope`, `environment_id`, `token_endpoint`, `client_auth_method`; for device_code: `device_code`; for token-exchange: `subject_token`, `subject_token_type`, etc. |
| **PingOne** | Builds PingOne token URL from `environment_id` or uses `token_endpoint`; **POST** to PingOne **/as/token** with body (authorization_code, refresh_token, client_credentials, device_code, token-exchange). Does **not** call `/as/authorize`. |
| **Returns to browser** | Full PingOne response: `access_token`, `refresh_token`, `id_token`, `expires_in`, `token_type`, etc., plus `server_timestamp`, `grant_type` via `res.json(responseData)`. May add `requires_password_change` from id_token. |
| **Server-side storage** | **None.** |

**File**: `server.js` **3080–3537**.

---

### POST `/api/auth/passkey/options/authentication`

| Item | Detail |
|------|--------|
| **Inputs** | `environmentId`, `deviceAuthenticationPolicyId`. |
| **PingOne** | Does **not** call PingOne; generates WebAuthn challenge locally. |
| **Returns** | `publicKey` (challenge, rpId, timeout). No tokens, no Set-Cookie. |

**File**: `server.js` **19444–19490**.

---

### POST `/api/auth/passkey/verify-authentication`

| Item | Detail |
|------|--------|
| **Inputs** | `environmentId`, `deviceAuthenticationPolicyId`, WebAuthn `response`, `workerToken` (required). |
| **PingOne** | Uses worker token to call PingOne MFA APIs to verify assertion. |
| **Returns** | Verification result JSON. No app session cookie, no token storage on server. |

**File**: `server.js` **19504–** (and similar for options/registration, verify-registration).

---

### Redirectless / pi.flow (no separate “auth” route name)

- **POST `/api/pingone/redirectless/authorize`** (6993): Sends **PingOne** `/as/authorize` with `response_mode=pi.flow`, PKCE, etc. Returns PingOne response (interactionId / Set-Cookie, etc.) and stores cookies in **cookieJar** by **sessionId** (client-provided). Does **not** set a browser cookie.
- **POST `/api/pingone/redirectless/poll`** (7360): Resumes PingOne with `response_mode=pi.flow`; uses cookieJar for that sessionId.
- **POST `/api/pingone/redirectless/resume`** (7415): Same; returns JSON (e.g. code) for pi.flow.
- **POST `/api/pingone/flows/check-username-password`** (8092): Forwards credentials and cookieJar cookies to PingOne flow URL; captures Set-Cookie back into cookieJar. No app session.

---

## 3) SPA receipt and storage of PingOne tokens

- **Where SPA gets tokens**: From **`/api/token-exchange`** and **`/api/pingone/token`** response bodies (full JSON with `access_token`, `id_token`, `refresh_token`, etc.).
- **Where SPA stores them**:
  - **sessionStorage** (primary):
    - **`src/utils/storage.ts`** 229–230: `oauthStorage.setTokens(tokens)` → `sessionStorageService.setItem('tokens', tokens)` → key `pingone_playground_tokens`.
    - **`src/utils/tokenStorage.ts`** 46: `storeOAuthTokens` → `secureTokenStorage.storeTokens` (sessionStorage).
  - **localStorage**:
    - **`src/hooks/useAuthorizationCodeFlowController.ts`** 1699: `localStorage.setItem('oauth_tokens', JSON.stringify(tokenData))` after token exchange.
  - **React state**: Multiple flows keep tokens in component state (e.g. `setTokens(tokenData)` in same file, NewAuthContext state).

**Exact locations**:
- **NewAuthContext** (callback): `src/contexts/NewAuthContext.tsx` ~1690 `oauthStorage.setTokens(tokens)` (sessionStorage).
- **Auth code flow**: `src/hooks/useAuthorizationCodeFlowController.ts` ~1692–1699: `setTokens(tokenData)`, `storeOAuthTokens(tokenData, ...)`, `localStorage.setItem('oauth_tokens', ...)`.
- **Token storage layer**: `src/utils/storage.ts` 229–230 (sessionStorage); `src/utils/tokenStorage.ts` 29–46 (secureTokenStorage → sessionStorage).

---

## 4) PingOne SSO session (pi.flow) vs app session

- **PingOne SSO session (pi.flow)**  
  - Used in redirectless flows: `/api/pingone/redirectless/authorize` sends `response_mode=pi.flow` to PingOne.  
  - PingOne returns session identifiers (e.g. interactionId, interactionToken, or Set-Cookie like ST).  
  - The BFF stores these in **cookieJar** keyed by **client-provided sessionId** and forwards them only to **PingOne** on resume/poll/check-username-password.  
  - The server **never** sets a cookie in the browser; it does not create an “app session” cookie.

- **App session**  
  - Would mean the server identifies the user with its own session (e.g. express-session, a session cookie, or server-stored token).  
  - **We do not have this**: no express-session, no `res.cookie()` for session, no server-side storage of access/refresh/id tokens.  
  - “Session” in this codebase is either (a) PingOne’s own session (pi.flow cookies/state forwarded to PingOne) or (b) client-side only (sessionStorage/localStorage and in-memory state).

So we rely on **PingOne SSO session** for redirectless (pi.flow) and on **client-side token storage** for auth code and other flows; we do **not** maintain a separate **app session** on the server.

---

## 4a) Worker token — dual-write and pull-from-backend

**Worker tokens** (used for MCP, API calls, environments page, etc.) are stored in both the client and the backend. This enables:

- **Current behavior**: Tokens stay in client storage (localStorage, IndexedDB) for fast sync access and offline use.
- **Pull-from-backend**: On load, `UnifiedWorkerTokenService` tries `GET /api/tokens/worker?environmentId=xxx` first; backend checks **SQLite** (sqlite-store.json, key `worker_token:${envId}`) then worker-tokens.json. If a valid token is returned, it is used and synced back to client storage.
- **Full token load order**: (1) GET backend — backend checks **SQLite** first, then worker-tokens.json; (2) localStorage; (3) IndexedDB.
- **Future secure mode**: If we later decide to move to backend-only tokens, the client can stop storing tokens in the browser and rely solely on the backend.

### API endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/tokens/worker` | Store token (body: `{ environmentId, accessToken, expiresAt }`). Called by `saveToken()` in addition to client storage. |
| GET | `/api/tokens/worker?environmentId=xxx` | Retrieve token. Returns `{ token: { accessToken, expiresAt } }` or `{ token: null }` if missing/expired. |
| DELETE | `/api/tokens/worker` | Clear token (body: `{ environmentId }`). |

### Storage locations

- **Backend**: (1) **SQLite** (`~/.pingone-playground/credentials/sqlite-store.json`, key `worker_token:${environmentId}`) — checked first on GET. (2) `worker-tokens.json` (file-based JSON, keyed by `environmentId`) — fallback. POST writes to both; DELETE clears both.
- **Client**: `localStorage` (`unified_worker_token`), `unifiedTokenStorage` (IndexedDB), memory cache.

Tokens are **dual-write** on save and **pull-from-backend-first** on load. Backend save/load failures are non-fatal; the client continues to use local storage.

---

## 4b) AI Assistant Token Exchange (planned)

A dedicated **"Token exchange"** command in the AI Assistant will allow users to obtain a token with broader scope via:

1. Username/password popup → Authorization Code flow with PingOne (`response_mode=pi.flow`)
2. Token Exchange (RFC 8693) with `POST /api/token-exchange` (`grant_type=urn:ietf:params:oauth:grant-type:token-exchange`) to obtain a new token with additional scopes (e.g. Management API)

Tokens will be stored client-side (unifiedWorkerTokenService or dedicated user-token storage). See `docs/MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md` for the full design.

---

## 5) Minimal change set to support the desired model

Desired behavior:

- Auth Code + PKCE.
- `response_mode=pi.flow` (redirectless) supported.
- Short-lived PingOne access tokens stored **server-side only**.
- Optional token endpoint auth: **client_secret_basic** vs **client_secret_post**.
- SPA receives only **authenticated status / user summary** (no PingOne tokens in the client).

### Recommended minimal changes

1. **Server-side session store (BFF)**  
   - Introduce a server-side session store (e.g. express-session with a simple store, or a signed/encrypted session cookie with a server-side token cache).  
   - **Key**: Session ID in a cookie (e.g. `sid`) or a signed cookie that references server-side data; **do not** send PingOne tokens to the client.

2. **`/api/token-exchange` (and optionally `/api/pingone/token` for code exchange)**  
   - Keep calling PingOne `/as/token` (Auth Code + PKCE; support `client_auth_method`: client_secret_basic / client_secret_post).  
   - On success: **store** access_token (and optionally refresh_token, id_token) in the **server-side session** only; **do not** return them in the response body.  
   - Return to the client a **small payload**: e.g. `{ authenticated: true, user: { sub, name, email } }` or similar (user summary from id_token or userinfo).  
   - **File**: `server.js` token-exchange handler (~3080–3537); add session read/write and replace `res.json(responseData)` with the minimal JSON above.

3. **User summary from PingOne**  
   - After token response, call PingOne userinfo (or decode id_token) on the server to get user summary; attach to session and/or include in the response to the SPA.  
   - SPA then only ever sees “authenticated” + user summary, not raw tokens.

4. **SPA**  
   - Stop storing PingOne tokens in sessionStorage/localStorage for the “logged-in” experience.  
   - For the new flow: after callback, call a **BFF endpoint** that performs code exchange (or read session); BFF returns only `{ authenticated, user }`.  
   - SPA stores only that status (and optionally a session cookie is sent automatically by the browser).  
   - **Files**: e.g. `src/contexts/NewAuthContext.tsx`, `src/hooks/useAuthorizationCodeFlowController.ts`, `src/utils/storage.ts`, `src/utils/tokenStorage.ts` — remove or branch so that when using “BFF session” mode, no token response is written to storage; only auth status/user summary.

5. **pi.flow (redirectless)**  
   - Keep current behavior: cookieJar keyed by sessionId for PingOne cookies only; no change needed for “PingOne does session.”  
   - If desired, after redirectless completion (e.g. code exchange on BFF), same pattern: store tokens only server-side and return only authenticated + user summary to the client.

6. **Optional: dedicated “login” endpoint**  
   - e.g. `POST /api/auth/callback` (or extend existing) that accepts code + code_verifier + state, runs token exchange and userinfo on the server, creates/updates server session, returns `{ authenticated, user }` only. SPA uses this instead of calling `/api/token-exchange` and then storing the full token response.

---

## Yes/No conclusion

**Do we currently set an application session?**  
**No.** The server does not set an application session. It does not use express-session, does not set any `Set-Cookie` for app session, and does not store PingOne tokens server-side. The cookieJar is only for PingOne redirectless (pi.flow) state forwarded to PingOne. The SPA receives PingOne tokens in API responses and stores them in **sessionStorage** and **localStorage** in the browser.
