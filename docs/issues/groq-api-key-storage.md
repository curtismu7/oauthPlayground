# Groq API Key Storage – apiKeyService Integration + server.js Crashes - FIXED

## Summary
`POST /api/api-key/groq` always returned `{"success":false,"message":"Error storing API key"}`, completely blocking the Groq AI chat feature. Root causes were a `const` hoisting problem in `server.js` and use of an undefined `logger` variable; additionally, `McpServerConfig.tsx` was using raw `fetch` instead of the shared `apiKeyService`.

## Severity
**MEDIUM — Feature Broken / Runtime Errors**

## Affected Components
- `server.js` — `POST /api/api-key/:service` handler and `GROQ_KEY_FILE` constant
- `src/services/apiKeyService.ts` — `API_KEY_CONFIGS` registry
- `src/pages/McpServerConfig.tsx` — Groq key load/save logic
- `src/services/groqService.ts` — `isGroqAvailable()` sync logic

## Symptoms
1. Clicking "Save Groq Key" in MCP Server Config showed an error toast.
2. `POST /api/api-key/groq` returned `{"success":false,"message":"Error storing API key: GROQ_KEY_FILE is not defined"}` (after error detail was added) or `{"success":false,"message":"Error storing API key"}`.
3. `POST /api/api-key/groq` also threw `logger is not defined` in the server console.
4. Groq AI chat did not work because the key was never stored on the backend.

## Root Cause Analysis

### (1) `GROQ_KEY_FILE` const not hoisted (server.js)
```js
// server.js — used at line ~2822:
fs.writeFileSync(GROQ_KEY_FILE, ...);   // ReferenceError at runtime

// Previously declared at line ~21049 — way below first use:
const GROQ_KEY_FILE = path.join(os.homedir(), '.pingone-playground', 'credentials', 'groq-config.json');
```
ES modules (type `"module"`) do not hoist `const`/`let`. The variable was in a temporal dead zone when the POST handler ran.

### (2) `logger is not defined` (server.js)
```js
// Added in a previous editing session — logger doesn't exist in server.js:
logger.info(`[API-KEY-STORAGE] Storing API key for ${service}: ...`);
logger.info('[API-KEY-STORAGE] Groq key persisted to', GROQ_KEY_FILE);
logger.warn('[API-KEY-STORAGE] Could not persist Groq key to disk:', writeErr.message);
```
`server.js` uses `console` directly; there is no `logger` binding anywhere in the file.

### (3) McpServerConfig used raw fetch instead of apiKeyService
`McpServerConfig.tsx` was calling `fetch('/api/api-key/groq')` and `fetch('/api/api-key/groq', {method:'POST',...})` directly instead of using the shared `apiKeyService` that backs all key storage with `unifiedTokenStorageService`.

## Fix Implementation

### server.js
1. Moved `GROQ_KEY_FILE` declaration to the top of the file (line ~32, near other path constants):
   ```js
   const GROQ_KEY_FILE = path.join(os.homedir(), '.pingone-playground', 'credentials', 'groq-config.json');
   ```
2. Removed the duplicate declaration at the original location (replaced with a comment).
3. Replaced `logger.info`/`logger.warn` calls in the Groq POST handler branch with `console.log`/`console.warn`.

### src/services/apiKeyService.ts
Added `groq` entry to `API_KEY_CONFIGS`:
```ts
groq: {
  service: 'groq',
  name: 'Groq API Key',
  description: 'API key for Groq LLM (Llama 3.3 70B) used by the AI Assistant',
  required: false,
  validation: { type: 'regex', pattern: /^gsk_[A-Za-z0-9_]+$/ },
  maskChar: '*',
},
```

### src/pages/McpServerConfig.tsx
- Import `apiKeyService` from `'../services/apiKeyService'`.
- `fetchCreds`: use `apiKeyService.getApiKey('groq')` instead of raw fetch.
- `saveGroqKey`: use `apiKeyService.storeApiKey('groq', groqKey.trim())` instead of raw fetch.

### src/services/groqService.ts
- Import `apiKeyService`.
- `isGroqAvailable()`: if backend has no key, try `apiKeyService.getApiKey('groq')` from browser storage and sync to backend via `apiKeyService.storeApiKey(...)`.

## Testing Requirements
- `POST /api/api-key/groq` with a valid `gsk_…` key returns `{"success":true}`.
- `~/.pingone-playground/credentials/groq-config.json` is written.
- After server restart, `GET /api/api-key/groq` returns the stored key.
- `POST /api/groq/chat` returns a real Groq LLM response.
- No `ReferenceError` or `logger is not defined` in server console during the above.

## Prevention
- **server.js constants:** Always declare path/file constants at the top of `server.js`. Never add a `const` that is used in request handlers at the bottom of the file.
- **logger in server.js:** `server.js` does not have a `logger` binding — use `console.log`/`console.warn`/`console.error` only.
- **API key storage:** Use `apiKeyService.storeApiKey(service, key)` and `apiKeyService.getApiKey(service)` in frontend code; do not call `/api/api-key/:service` directly.
