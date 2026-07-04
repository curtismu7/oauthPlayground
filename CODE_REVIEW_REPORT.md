# OAuth Playground — Full Code Review Report

**Date:** 2026-07-04
**Reviewer:** Claude Code (6 parallel review streams: backend, LMDB migration, security, frontend services, React UI, architecture)
**Scope:** `server.js`, `src/server/`, `src/services/`, `src/utils/`, `src/components/`, `src/contexts/`, `src/flows2/`, `src/v8u/`, repo hygiene. Every finding below was verified against the actual source at the cited line.

---

## TL;DR — the three things to do today

1. **The backend is currently broken and cannot start.** `server.js` fails `node --check` — a bad merge left the `/api/update-redirect-uri` route pasted inside an unclosed `httpsServer.on('listening', …)` callback, and `startServers()` is never called. `npm run start:backend` runs `node server.js` directly, so the server does not boot. **(CRITICAL-1)**

2. **Live production secrets are committed to git and must be rotated now.** `.env.production`, `.env.local.py`, `.oauth_cache`, `.vscode/settings.json`, hardcoded literals in `src/` (including the shipped frontend bundle), TLS private keys in `certs/`, a signing key in `resources/keys/private_key.pem`, a Vercel OIDC token, and a SQLite credentials DB (`data/enhanced_credentials.db`) are all tracked. Both PingOne client secrets appear in ~15+ files. **(CRITICAL-2)**

3. **The SQLite→LMDB migration silently broke settings persistence and user search.** `server.js` still dynamic-imports two deleted SQLite services, so it falls back to a no-op stub — every settings write is dropped while reporting success. And `saveUsers` overwrites the whole search index with only the current batch, so any sync >500 users loses all but the last batch from search. **(CRITICAL-3, HIGH)**

---

## Severity summary

| Severity | Count | Highlights |
|---|---|---|
| Critical | 5 | Server won't parse; committed secrets; settings persistence dead; no data migration; worker-token loss |
| High | 12 | SSRF proxies; unauth endpoints returning secrets; search-index corruption; state/CSRF not enforced; stale config cache |
| Medium | ~30 | Device-flow poll math; localStorage secret storage; fake XOR "encryption"; unmemoized contexts; range-scan perf |
| Low | ~20 | Path-traversal prefix checks; dead routes; index keys; timeout cleanups |

---

# 1. Critical

### CRITICAL-1 — `server.js` is syntactically invalid; the backend never starts
**File:** `server.js:26206-26293`
`node --check server.js` → `SyntaxError: Unexpected end of input` at line 26293 (verified).

The `/api/update-redirect-uri` handler was inserted **inside** the `httpsServer.on('listening', () => {` callback opened at 26206, and the file ends without closing that callback:
```js
httpsServer.on('listening', () => {
    const addr = httpsServer.address();
// Update redirect URI for an application in PingOne (using worker token)
app.post('/api/update-redirect-uri', async (req, res) => {
    ... // file ends here — callback never closed, brace never balanced
```
Compounding it: `startServers()` (defined at 26133) is **never invoked**, and the `if (httpServer)` / `if (httpsServer)` blocks at 26190/26201 run at module-load time when both are still `undefined`.

**Fix:** Restore the correct file tail — close the `listening` callback, register `/api/update-redirect-uri` at top level, and actually call `startServers()`. This is a merge artifact from the recent redirect-URI commits (`4742321e8`, `e3074d513`). **Add `node --check server.js` (or a real boot smoke-test) to CI so this class of break cannot merge again.**

---

### CRITICAL-2 — Live secrets and private keys committed to git
All values below are **live** and must be treated as compromised. Rotate first, then scrub history (BFG / git-filter-repo).

| What | Location | Notes |
|---|---|---|
| PingOne worker + web-app client secrets | `.env.production`, `.env.local.py`, `.oauth_cache`, `.vscode/settings.json` | All tracked (`git ls-files` confirms) |
| Same secrets **hardcoded in shipped source** | `src/v8/config/testCredentials.ts:19`, `src/pages/Login.tsx:470`, `src/components/PingOneApplicationConfig.tsx:547`, `src/services/postmanCollectionGeneratorV8.ts` (multiple), `scripts/test-all-apis.js:30`, `README.md:183` | These compile into the frontend bundle — world-readable |
| TLS private keys | `certs/server.key`, `certs/api.pingdemo.com.key` | `-----BEGIN PRIVATE KEY-----`; `certs/` gitignored *after* commit, still tracked |
| Signing key | `resources/keys/private_key.pem` | Rotate/re-issue |
| Vercel OIDC token | `.vercel/.env.preview.local` | ~1.2 KB JWT |
| Credentials database | `data/enhanced_credentials.db` | SQLite; contains 1 row with `client_secret` column |
| Postman collections with live secrets | `docs/postman/pingone-complete-*-environment.json` | Env var values |

**Fix (in order):**
1. **Rotate now** in the PingOne tenant: both client secrets, the TLS certs/keys, the `resources/keys` signing key, and any Brave/Groq/GitHub tokens exposed via `/api/api-key`.
2. `git rm --cached` all of the above; add proper `.gitignore` entries (`.env*`, `.oauth_cache`, `.vscode/`, `.vercel/`, `certs/*.key`, `*.pem`, `data/*.db`).
3. Replace hardcoded literals in `src/` with env lookups / empty placeholders.
4. Purge git history and force-push (coordinate with collaborators).

---

### CRITICAL-3 — Settings persistence is silently dead after the LMDB migration
**Files:** `server.js:1025-1043` (dead import) + `src/server/lmdb/settingsStore.js` (orphaned — zero importers, verified via grep)

Commit `f37ffc8b6` deleted `settingsDatabaseService.js` and `userDatabaseService.js` but `server.js` still dynamic-imports them:
```js
let settingsDB = { async init() {}, async get() { return null; }, async set() {} };
...
const settingsMod = await import('./src/server/services/settingsDatabaseService.js'); // deleted file
settingsDB = settingsMod.settingsDB; // never reached — import throws, warn-and-degrade to the no-op stub
```
The import throws on every boot and falls back to the no-op stub, so every settings endpoint **reads null and drops writes while returning success**. Affected live endpoints: `/api/settings/custom-domain` (GET/POST at 1530/1565), `pingone_region` (1512/1662), environment-ID (1585/1607), debug-log-viewer file (1458/1468). The new `settingsStore.js` that was written to replace them is never wired in.

**Fix:** Point `settingsDB` at the new store:
```js
const s = await import('./src/server/lmdb/settingsStore.js');
settingsDB = { init: async () => {}, get: async (k) => s.get(k), set: async (k, v) => s.set(k, v) };
```
Remove the dead `userDatabaseService.js` import too. (Old service stored JSON strings — keep the callers' `JSON.parse`-with-fallback in mind.)

---

### CRITICAL-4 — No SQLite→LMDB data migration; existing user data abandoned on upgrade
**File:** `server.js:3981` (`migrateJsonFilesToLmdb()` migrates only legacy JSON files, not the old `.db` files)

The migration deleted the SQLite services and created empty LMDB stores. Nothing reads the old `users.db` / `settings.db` / `backups.db`, so all previously persisted **user-entered settings** (custom domain, region, environment ID), synced users, and backups are lost on deploy.

**Fix:** One-time import guarded by a `meta` flag (the pattern already exists — `credentialStore.metaGet('schema_version')`), reading the old files with a pure-JS reader (`sql.js`) or a one-off script. At minimum, document the reset so users know to re-enter settings.

---

### CRITICAL-5 — Worker token silently vanishes after first read (type bug)
**File:** `src/services/unifiedTokenStorageService.ts:3189-3212`
```ts
const tokens = await this.getTokens({ type: 'worker_token', id: 'worker_token' });
if (tokens.length > 0) {   // getTokens returns TokenStorageResult { success, data?: T[] } — .length is always undefined
    const token = tokens[0];
```
`getTokens` returns `TokenStorageResult<T>` (`{ success, data?: T[] }`, defined at line 72), so `tokens.length` is always `undefined` and the IndexedDB/SQLite branch is dead. The code falls to the localStorage fallback, which **migrates then deletes** the localStorage copy (line 3229). Net effect: the second `loadWorkerToken()` returns `null` — the worker token is gone. `getWorkerTokenCredentials` (line 1097) does it correctly with `result.data?.length`, proving the intended pattern.

**Fix:** `const result = await this.getTokens(...); if (result.success && result.data?.length) { const token = result.data[0]; ... }`
**Systemic:** Vite does not type-check on build; `tsc --noEmit` in CI would have caught this and CRITICAL-3's sibling and HIGH `.document` bug outright.

---

# 2. High

### H-1 — SSRF: proxy endpoints fetch arbitrary client-supplied URLs
**File:** `server.js:4175, 5462, 9149, 9203`
`/api/token-exchange`, `/api/introspect-token`, `/api/pingone/oidc-discovery`, and `/api/pingone/userinfo` each `fetch()` a fully user-controlled URL server-side with no scheme/host allowlist, forwarding attacker-chosen tokens and returning the body. `http://169.254.169.254/…` (cloud metadata) and internal hosts are reachable.
**Fix:** Require `https:` and validate the host against a `*.pingone.{com,eu,ca,asia}` (or configured) allowlist; reject private/link-local IPs. Centralize in one `pingoneFetch()` helper.

### H-2 — Unauthenticated endpoints return stored secrets in plaintext
**File:** `server.js:3071` (`/api/api-key/:service` → Brave/Groq/**GitHub PAT**), `3855` (`/api/tokens/worker` → live worker access token keyed only by a non-secret environment ID), `3615`/`3746` (`/api/credentials/load`, `/api/credentials/sqlite/load`), `22796` (`/api/mcp/server/credentials` echoes `clientSecret`).
None have auth. Localhost blast radius today, but these leak live keys to anonymous callers the moment the app is deployed (Vercel/custom domain configs are present).
**Fix:** Require auth (or bind to loopback); never return raw keys — expose only a `configured: true/false` flag and proxy downstream calls server-side.

### H-3 — Unauthenticated process control & destructive data endpoints
**File:** `server.js:22732-22794` (`/api/mcp/server/build|start|stop` → `execSync('npm run build')`, `spawn(node …)`, `process.kill(pid)`); `src/server/routes/userApiRoutes.js:123` (`DELETE /api/users/clear/:environmentId`, has a literal `// TODO: Add authentication`), `bulk-insert` with `clearFirst`; `backupApiRoutes.js:119` (`clear-environment`).
All irreversible, all unauthenticated, while `server.js`'s own store-admin routes already gate on `STORE_ADMIN_SECRET`.
**Fix:** Apply the same `storeAdminBlocked`-style guard; fail-closed in production when the secret is unset.

### H-4 — User search index corrupted on incremental sync / bulk insert >500
**File:** `src/server/lmdb/userStore.js:24-48`; route `src/server/routes/userApiRoutes.js:249`
`saveUsers` builds `searchIndexUsers = []` fresh and does `searchIndexDb.putSync(\`${env}|search\`, searchIndexUsers)` — replacing the entire index with only the current call's users. The route loops batches of 500 and passes an `isLastBatch` third arg that `saveUsers(environmentId, users)` **ignores**. So after any sync of >500 users (or any incremental sync), `searchUsers` only finds the last batch while `getUserCount` still reports everyone.
**Fix:** Merge (read existing, upsert by `user.id`, write back), or drop the separate index and have `searchUsers` filter a prefix range over the `users` DB (same records, one source of truth).

### H-5 — State (CSRF) parameter read but never enforced in the main callbacks
**File:** `src/pages/Callback.tsx:143-154`, `src/components/callbacks/AuthzCallback.tsx` (no `state` comparison anywhere)
Both read `sessionStorage`'s stored state and log it, but never compare it to the returned `state` param. For an app that teaches OAuth security, the primary callbacks skip the CSRF check. (The v8u `CallbackHandlerV8U` and flows2 `AuthCallback` do check — inconsistent.)
**Fix:** Hard-fail when `urlParams.state !== storedState`.

### H-6 — Stale config cache breaks credential updates app-wide
**File:** `src/contexts/NewAuthContext.tsx:165-190, 513-542`
`let cachedConfiguration` is set on first load and **never cleared** (verified: no re-assignment to `null` anywhere). `loadConfiguration()` short-circuits on it, but four change-listeners plus `refreshConfig` all call `loadConfiguration()` — so after first load, changing credentials in the UI never updates the auth context's `config` until a full page reload.
**Fix:** Set `cachedConfiguration = null` at the top of `handleConfigChange`/`refreshConfig`, or add a `force` param.

### H-7 — Device flow default poll interval is 5,000,000 ms (~83 minutes)
**File:** `src/services/deviceFlowService.ts:61, 116, 207`
`DEFAULT_POLL_INTERVAL = 5000 // "5 seconds"` (actually ms), then `interval: deviceResponse.interval || DEFAULT_POLL_INTERVAL` (RFC 8628 `interval` is **seconds**), then `pollInterval = state.interval * 1000`. When the server omits `interval`, `5000 × 1000` = 5,000,000 ms; the device code expires long before the second poll. Also no `slow_down` handling.
**Fix:** `DEFAULT_POLL_INTERVAL = 5` (seconds); add `slow_down` (+5 s) handling.

### H-8 — `clientSecret` lost on credential round-trip
**File:** `src/utils/credentialManager.ts:145-155, 736-738, 865-875`
`loadConfigCredentials`/`loadPermanentCredentials` omit `clientSecret` from the returned object; `saveConfigCredentials` merges `{...existing, ...credentials}` over that lossy load, so a later partial save writes the record back **without** the secret. Client-credentials flows can never retrieve a stored secret.
**Fix:** Include `clientSecret` in the loaders (or stop persisting it there).

### H-9 — Discovery cache never valid (`.document` typo → rediscovery every call)
**File:** `src/utils/credentialManager.ts:1329` — `discoveredEndpoints: discoveryResult.document`, but `discover()` returns `{ success, data }` (used correctly at line 1304). Always `undefined`, so `isDiscoveryValid()` always fails and discovery re-runs every check.
**Fix:** `discoveryResult.data`.

### H-10 — Save debounce silently discards saves while reporting success
**File:** `src/services/unifiedWorkerTokenService.ts:239-248` — two saves within 1 s (modal save + autosave effect) → second dropped, `ok(undefined)` returned. **H-11** (`saveCredentials` at 257-283) overwrites the cache with `token: ''`, so toggling key-rotation policy logs the token out client-side.
**Fix:** Coalesce (save latest after the window) instead of dropping; preserve the existing token when only credentials change.

### H-12 — Homegrown XOR "encryption" with a hardcoded key
**File:** `src/utils/secureTokenStorage.ts:12-46` — `SimpleEncryption` XORs against `'pingone_oauth_secure_key_2024'` (ships in the bundle) then `btoa()`, and `catch { return text; }` stores plaintext on any error. Labeled "encrypted sessionStorage" — false security.
**Fix:** Delete the class or replace with Web Crypto AES-GCM + a per-session key; understand it still can't defend against same-origin XSS.

---

# 3. Medium (grouped)

**Backend**
- **Full request body (client_secret, code, password, code_verifier) logged** at `server.js:4059, 4544` — the same handler carefully redacts for `logPingOneApiCall` but not these `console.log`s.
- **Outbound `fetch` calls lack timeouts** — 193 fetches, only 16 `AbortController`s; core token exchange (4398) and introspection (5462) can hang forever (now against *arbitrary* hosts per H-1).
- **Unbounded in-memory maps** — `cookieJar` (1894) and `_introspectionTokenStore` (24850) are never evicted; a TTL sweeper already exists for `pingOneCallStore` (294) to copy.
- **No `unhandledRejection`/`uncaughtException` handlers, no rate limiting, no helmet** (grep: zero of each).
- **CORS** exposes stray `X-Foo`/`X-Bar` headers (920-936); store-admin gate only enforces when `STORE_ADMIN_SECRET` is set — fail-open otherwise.

**LMDB layer**
- **Sync-status tracking lost** (`userStore.js:253-375`) — `sync_in_progress`/`last_sync_status: 'failed'` never written, so `/api/users/sync-status` always reports not-syncing and never shows failures.
- **Every prefix query is a full-DB scan** (`userStore.js:124,149,207,235`, `backupStore.js:74,105,128`) — `getRange()` unbounded + JS `startsWith` instead of `getRange({ start: prefix, end: prefix + '￿' })`. `saveUsers` also calls a full-scan `getUserCount` per batch → bulk insert is O(batches × total).
- **Backup identity & list-API regressions** (`backupStore.js:31,70,80`, `backupApiRoutes.js:96`) — `dataType` now part of the key (dup records), `list` returns `[]` when `dataType` omitted and now leaks full `data` blobs.
- **Composite keys unvalidated** — `|`-delimited client-supplied `environmentId|dataType|key` allows cross-scope collisions; validate or use lmdb native array keys.
- **`apiKeyServiceServer.js:9`** imports a nonexistent `../../services/unifiedTokenStorageService.js` (only a `.ts` client file exists) — throws on import; currently unused.

**Frontend**
- **Refresh tokens & secrets in plaintext localStorage** — `tokenLifecycle.ts:67,305`, `unifiedTokenStorageService.ts:399`, `unifiedWorkerTokenService.ts:283` (`clientSecret`); durable + XSS-exposed, while CSP allows `unsafe-inline`/`unsafe-eval`.
- **Full credential objects logged** — `credentialManager.ts:88-91,100`; `trackedFetch.ts:78-206` captures `Authorization: Basic …` headers and ships them to `/api/pingone/log-call`. The main `logger.ts` has no masking; `secureLogging.ts`'s `sanitizeSensitiveData` exists but callers bypass it.
- **`getTokenUsageAnalytics` throws on empty state** — `tokenLifecycle.ts:201` (`reduce` with no initial value).
- **Non-crypto `jti`** in `client_secret_jwt`/`private_key_jwt` — `clientAuthentication.ts:163` uses `Math.random()`; use `crypto.randomUUID()`. (PKCE itself is correct — `crypto.getRandomValues`, proper S256.)
- **`sanitizePath` open-redirect** — `secureJson.ts:141` accepts `//evil.com`.
- **Unconditional `response.json()` on error bodies** — `oauth.ts:496`; HTML/text error → `SyntaxError` masks the real HTTP failure.
- **IndexedDB init unhandled rejection + not memoized** — `unifiedTokenStorageService.ts:297-355`.

**React**
- **App-wide 2 s polling loop** — `enhancedStateManagement.ts:444-521` (mounted at `App.tsx:2113`) dispatches metric updates that pollute undo history (user "undo" undoes metric ticks), writes localStorage every 2 s, and re-renders all consumers via an unmemoized context value.
- **Unmemoized context values / impure setState updaters** — `PageStyleContext.tsx:221`, `FloatingStepperContext.tsx:99-146` (setState inside another updater), `UISettingsContext.tsx:128-215` (localStorage + DOM writes + `CustomEvent` inside the updater; reset not persisted; OAuth flow config spread into UI settings).
- **PKCE fallback fabricates a `code_verifier`** — `NewAuthContext.tsx:1127` generates a fresh verifier when none is stored, guaranteeing an opaque `invalid_grant` instead of failing fast.
- **`CallbackHandlerV8U` effect non-idempotent** — `CallbackHandlerV8U.tsx:126-821` consumes single-use state with no `processedRef` guard (unlike `AuthzCallback`); a second run bounces legit callbacks to `?error=csrf_risk`.
- **Duplicate route hides a real page** — `App.tsx:846` (`"Coming Soon"` placeholder) shadows `App.tsx:1026` (real `UnifiedCredentialsMockupV8`); React Router picks the first.
- **Dead v5-syntax route** — `App.tsx:1811` uses `path="/:customCallback(p1-callback)"` (react-router v5 regex) on v6; never matches.

---

# 4. Low (representative)

- **Path-traversal guard uses prefix without separator** — `server.js:1214,1290` (`startsWith(resolvedLogsDir)` matches `logs-evil`); compare against `resolvedLogsDir + path.sep`.
- **Dead/shadowed routes** — `server.js:11901,11814,11857` (`/:userId-mock` shadowed by `/:userId`); log miscategorization at `1156-1163` (`category='mcp'` immediately overwritten by `'mfa'`).
- **Device-flow token poll posts multipart `FormData`** instead of `application/x-www-form-urlencoded` (`deviceFlowService.ts:154`) — RFC 6749 violation.
- **`AppLazy.tsx` (569 lines) is dead and won't compile** — uses `useAuth` without importing it; empty-deps route effects; `setTimeout` with no cleanup. Delete.
- **`AuthzCallback` delayed navigate not cleared** — `AuthzCallback.tsx:770` (`setTimeout(navigate, 1500)` never cleaned up).
- **flows2 handlers without try/catch** — `authorizationCode.flow.tsx:256` (`handleUserInfo`/`handleIntrospect` → unhandled rejection, no UI error).
- **Global `console.warn` monkey-patch** and **no `React.StrictMode`** — `main.tsx:35-71`; StrictMode absence currently masks the impure-updater bugs above.
- **`closeEnv` never called on shutdown** — `openEnv.js:47`; add a `SIGINT`/`SIGTERM` hook.
- **JWKS URL built as `/as/as/jwks`** for standard PingOne issuers — `oauth.ts:514` (but `validateIdToken` has no callers — the whole function is dead; live validation is in `src/v8/services/*` + `utils/jwks.ts`).

---

# 5. "Better ways to do it" — architecture & hygiene

**Measured baseline:** 5,012 tracked files; `src/` = 1,063 source files (851 reachable from the router, ~212 dead-floor); `docs/` = 1,970 files / 27 MB; `server.js` = 26,292 lines / 242 unique routes.

### Repo hygiene (impact: high, effort: low)
- **168 root-level status `.md` reports** (`SECURITY_GATE_*` ×19, `LINTING_*` ×18, `LINTER_*` ×8, `CLEANLINESS_*` ×8, …) — this has happened before: `docs/root-notes/` (741) and `docs/archive/` (506) are prior sweeps of the same debris. This report adds one more; it should live in `docs/` and the rest should be archived out or a CI check should block new root `.md` files.
- **Tracked junk:** 34 `.DS_Store` files, files literally named `0` and `typescript`, `.oauth_cache`, 15 root `.png` screenshots, 10 one-off fix scripts (`_fix_*.py`, `fix_*.py`, `manual_linter.cjs`), and build/tool output (`coverage/`, `type-check-output.txt`, `biome_full_report.json`, `linter_errors_manual.json`, `lint-reports/`).

### Embedded sub-projects that should be separate repos/workspaces (impact: high, effort: medium)
- `se-ai-demo-banking-digital-assistant-main/` — **512 files, 11 MB**, an unrelated multi-service demo unzipped straight into the repo.
- **7 standalone MCP-server projects** at root (each with its own `package.json`), plus `A-Migration/` (170 files), `AIAssistant/`, `AI Ping/`, `biome-new-app/`, `company-portal-mocks/`, `project/`. No npm/pnpm workspaces configured — they're just squatting. Evicting these removes ~800 files / ~16 MB from the working set.

### Toolchain (impact: medium, effort: low)
- **Jest is fully dead** — `jest`, `babel-jest`, `jest.config.mjs`, `babel.config.js` present, **zero scripts invoke it**. Remove it. Runtime is vitest + playwright + puppeteer.
- **Duplicate lockfiles** — `package-lock.json` (current) and `pnpm-lock.yaml` (3 months stale). Delete the pnpm one.
- **Both Biome and ESLint** installed (Biome primary) — pick one.
- **`@types/better-sqlite3`** left over after the LMDB migration removed `better-sqlite3`.
- **137 npm scripts** — prune to ~30; `lock:*` (14), `vault:*` (7), `migrate:*` (6) look like one-time ops that belong in `scripts/` docs.
- **Five deployment targets at once** — 3 Dockerfiles + 2 compose files + `nginx.conf`, `k8s/`, `netlify.toml`, `.vercel/`, and 6 root shell scripts; no doc says which is canonical.
- **`tsc --noEmit` is not in CI** — Vite skips type-checking on build, so type bugs like CRITICAL-5 and H-9 ship. **Highest-leverage single fix: add `tsc --noEmit` to CI.**

### Duplicate/overlapping services to consolidate (impact: high long-term)
The frontend has grown many parallel implementations of the same job — this is where bugs CRITICAL-5, H-8, H-10, H-11 breed:
- **Discovery ×5+:** `oidcDiscoveryService` (keep), `discoveryService`, `bulletproofDiscoveryService`, `comprehensiveDiscoveryService`, `utils/oidcDiscovery`, `discoveryPersistenceService`.
- **Credential storage ×7+:** `utils/credentialManager`, `credentialStorageManager`, `flowCredentialService`, `comprehensiveCredentialsService`, `flowCredentialIsolationService`, `V9CredentialStorageService`, plus near-identically-named `credentialExportImportService` **and** `credentialsImportExportService`.
- **Token storage ×4:** `tokenStorage`+`secureTokenStorage`, `unifiedTokenStorageService`, `unifiedWorkerTokenService`, `tokenLifecycle`. The worker token alone lives under ≥4 keys — the direct cause of the split-brain in CRITICAL-5.
- **Fetch wrappers ×3:** `trackedFetch`, `pingOneFetch`, `apiClient` — separate retry/tracking/header conventions, none composed.
- **Loggers:** `utils/logger.ts` + parallel `utils/logger.js` + `loggingService` + `logFileService`.
- **Five coexisting UI generations** (`v7`, `v8`, `v8u`, `flows2`, `pages`) all mounted at once in one 2,214-line `App.tsx` — every change is made against 5 parallel UIs.

### `server.js` decomposition (impact: high, effort: high)
242 routes in one 26k-line file — a route accidentally nested in a server callback is exactly what caused CRITICAL-1. Continue the started `src/server/` extraction: pull the region→TLD map and duplicated token-request/auth-method logic (repeated across `/api/token-exchange`, `/api/client-credentials`, `/api/pingone/worker-token`, `/api/pingone/token`) into `lib/pingone.js`, and split routes into `routes/*.js` routers.

---

# 6. Recommended remediation order

1. **Fix CRITICAL-1** (close the callback, call `startServers()`) — nothing else can be tested until the server boots. Add `node --check` + a boot smoke-test to CI.
2. **Rotate & scrub all committed secrets (CRITICAL-2).**
3. **Wire settings to the LMDB store (CRITICAL-3)** and decide on data migration (CRITICAL-4).
4. **Add `tsc --noEmit` to CI**, then fix CRITICAL-5, H-8, H-9 (all type bugs it surfaces).
5. **Fix H-4** (search-index merge) — corrupts data on every large sync.
6. **Add auth/allowlists to H-1/H-2/H-3** before any deployment.
7. **Enforce state/CSRF in the main callbacks (H-5)** — table stakes for an OAuth teaching app.
8. **Fix H-6, H-7, H-10/H-11** (config cache, device poll, save debounce/wipe).
9. Work through Medium/Low; begin service-consolidation and repo-hygiene cleanup in parallel.

---

## What's healthy (verified, for balance)
- Server-side LMDB field encryption (`src/server/lmdb/crypto.js`) is **correct**: AES-256-GCM, random per-field IV, auth tag, env-key with gitignored `0o600` file fallback, unit-tested, tamper-degrades-to-null.
- The `cf1b8d28d` `deleteSync`→`removeSync` fix was correct; LMDB `*Sync` APIs are used consistently (no missing awaits); remove-during-iteration is safe under MVCC.
- PKCE generation uses `crypto.getRandomValues` with correct S256 base64url encoding.
- `NewAuthContext`'s main value is properly memoized; `AuthzCallback` has robust StrictMode-safe double-processing guards; the `flows2` layer (memoized engine, timeout cleanups, CSRF check) is the cleanest in the codebase; `NotificationSystem`/`AIAssistant` clean up their listeners correctly.
