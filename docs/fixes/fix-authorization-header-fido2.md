# Fixing Invalid Authorization Header for PingOne MFA (FIDO2 + MFA APIs)

This document is a **Cursor-ready prompt** to fix an issue where PingOne responds with errors like:

> `Invalid key=value pair (missing equal-sign) in Authorization header (hashed with SHA-256 and encoded with Base64): '...'`

In our case, this means the **Authorization header being sent to PingOne does NOT contain a proper `Bearer <JWT>` access token**, and may look like a hash or some other value.

Your job is to:

1. **Audit** all PingOne MFA-related calls (especially FIDO2 activation).
2. **Ensure** they always send a valid **worker token** as `Authorization: Bearer <JWT>`.
3. **Remove / fix** any logic that hashes, encodes, or otherwise corrupts the Authorization header.
4. Do this **without breaking any other flows**.

Repo context (from the diagnostics zip):

- Backend: `server.js`
- FIDO2 & MFA services: `FIDO2FlowController.ts`, `mfaServiceV8.ts`
- Logs: `server-log-recent.txt`, `pingone-api-log-recent.txt`

---

## 1. Understand the correct behavior

Before making any changes, align to this rule:

> **Every call from the backend to PingOne MFA / Platform APIs must use a *raw* OAuth access token (JWT) in the Authorization header:**
>
> `Authorization: Bearer <worker_token_jwt>`

Where:

- `<worker_token_jwt>` is **exactly** the token obtained from the PingOne worker app:
  - 3 dot-separated segments (`header.payload.signature`)
  - Not hashed
  - Not base64-wrapped again
  - Not truncated
  - No line breaks or extra whitespace

You should **never** send:

- A SHA-256 hash of the token
- A base64’ed digest
- Any HMAC signature in place of the token

If PingOne says the header looks like “hashed with SHA-256 and encoded with Base64”, that means it’s seeing some random base64 string instead of a JWT.

---

## 2. Files to inspect and respect

Work in this directory (from the diagnostics zip):

- `fido2-diagnostic/FIDO2FlowController.ts`
- `fido2-diagnostic/mfaServiceV8.ts`
- `fido2-diagnostic/server.js`
- plus logs:
  - `fido2-diagnostic/server-log-recent.txt`
  - `fido2-diagnostic/pingone-api-log-recent.txt`

When updating the real repo, map these paths back to:

- `src/v8/flows/FIDO2FlowController.ts` (or similar)
- `src/v8/services/mfaServiceV8.ts`
- Backend `server.js` (Node/Express OAuth proxy / PingOne proxy)

**Do not** break any other flow (SMS, Email, existing MFA, OAuth, etc.).

---

## 3. How the worker token is supposed to flow

### 3.1 Frontend → Backend

From `mfaServiceV8.ts` we already have the right mental model:

- `MFAServiceV8.getToken(...)` returns either:
  - a **worker token** (default), or
  - a **user token** (if `tokenType: 'user'` is explicitly requested).
- `registerDevice` and other methods do:

```ts
const accessToken = await MFAServiceV8.getToken(...);
// accessToken should be a plain JWT string
```

Then they send the token to the backend via JSON:

```ts
const response = await fetch('/api/...', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    environmentId: params.environmentId,
    userId: user.id,
    deviceId: params.deviceId,
    workerToken: accessToken.trim(), // or userToken
  }),
});
```

**Keep this pattern.** The bug is almost certainly on the backend side when building the actual `Authorization` header for PingOne.

### 3.2 Backend → PingOne

On the backend (`server.js`):

- There is a centralized fetch wrapper for PingOne calls with logging (PingOne API logging, `pingone-api.log`).
- For certain routes (especially MFA and FIDO2 activation), the backend receives:
  - `environmentId`
  - `userId`
  - `deviceId`
  - `workerToken` (or sometimes expects the token in `Authorization` directly)

You must check:

1. When the backend constructs the request to PingOne:
   - It must do:

     ```js
     headers: {
       Authorization: `Bearer ${workerToken}`,
       'Content-Type': 'application/json',
       Accept: 'application/json',
     }
     ```

2. It must **not**:
   - Hash the token,
   - Wrap it in base64,
   - Use any “HMAC” or other derived value in the `Authorization` header.

---

## 4. Concrete steps for Cursor

### Step 1: Confirm where FIDO2 activation and MFA calls are made

In `server.js`:

- Search for any routes that:
  - Hit `https://api.pingone.com/.../activate/fido2`
  - Hit MFA endpoints like:
    - `/mfa/v1/environments/{env}/users/{userId}/devices/...`
    - `/deviceAuthentications`
    - `/challenges`
- Also search for:
  - `'/api/mfa/'`
  - `'/api/pingone/mfa'`
  - Anything mentioning `FIDO2` or `activate/fido2`

For each route you find, verify:

- How the backend gets the token:
  - From `req.body.workerToken`?
  - From `req.headers.authorization`?
- How it sets the Authorization header to PingOne.

### Step 2: Fix Authorization header usage

For each PingOne call identified above:

1. Extract the raw token:

   ```js
   const rawWorkerToken = body.workerToken || body.accessToken || undefined;
   ```

   or, if using headers:

   ```js
   const authHeader = req.headers.authorization;
   const rawToken = authHeader?.startsWith('Bearer ')
     ? authHeader.replace(/^Bearer\s+/i, '').trim()
     : authHeader?.trim();
   ```

2. Validate the token in the backend route (good UX):

   ```js
   if (!rawWorkerToken) {
     return res.status(400).json({
       error: 'Missing worker token',
       message: 'Please provide a valid PingOne worker token.',
     });
   }

   const parts = rawWorkerToken.split('.');
   if (parts.length !== 3 || parts.some(p => p.length === 0)) {
     return res.status(400).json({
       error: 'Invalid worker token format',
       message: 'Worker token must be a valid JWT (3 dot-separated parts).',
     });
   }
   ```

3. When calling PingOne, **always** set:

   ```js
   const pingOneResponse = await fetch(pingOneUrl, {
     method: 'POST', // or GET, etc.
     headers: {
       Authorization: `Bearer ${rawWorkerToken}`,
       'Content-Type': 'application/json',
       Accept: 'application/json',
     },
     body: JSON.stringify(pingOneBody),
   });
   ```

4. Remove or avoid any code that does something like:

   ```js
   // ❌ WRONG – examples of what we do NOT want
   headers.Authorization = someHashedValue;
   headers.Authorization = Buffer.from(rawWorkerToken, 'utf8').toString('base64');
   headers.Authorization = createHash('sha256').update(rawWorkerToken).digest('base64');
   ```

If you find ANY use of `createHash`, `sha256`, `digest('base64')`, or similar that touches `Authorization`, **remove or isolate it** away from PingOne MFA calls.

### Step 3: Leverage logging already in place

`server.js` already logs authorization diagnostics for FIDO2 activation, including:

- `authorizationHeader`
- `authorizationLength`
- `authorizationPreview`
- `authorizationStartsWithBearer`
- `authorizationIsHash` (approximate check: length 44, base64-like characters)

Use this to confirm:

- Before the fix, `authorizationIsHash` is often `true` for the failing calls.
- After the fix, for PingOne calls, you should see:
  - `authorizationStartsWithBearer: true`
  - `authorizationIsHash: false` (because JWTs are not fixed-length 44-char base64 strings).

Do **not** change the logging to hide this; it’s extremely useful for debugging.

---

## 5. Confirm behavior with PingOne logs

After fixing the `Authorization` header:

1. Trigger the failing MFA/FIDO2 flows again from the UI.
2. Check:

   - `server-log-recent.txt` for backend logs
   - `pingone-api-log-recent.txt` for PingOne API logs

You should see:

- PingOne URLs being called with proper `Authorization: Bearer ...` headers (only masked in logs, not actually modified in runtime).
- HTTP 200/201/204 responses instead of 401 / “Invalid key=value pair…” errors.

If PingOne still complains about a malformed Authorization header:

- Double-check for **global fetch wrappers** in `server.js` that may overwrite headers.
- Search for any code that normalizes or overrides `requestHeaders.Authorization` or `finalHeaders.Authorization`.
- Ensure the last code path before `originalGlobalFetch` is invoked still has `Authorization: Bearer <JWT>`.

---

## 6. Guardrails: don’t break other flows

While refactoring:

- **Do not** change how:
  - OAuth token endpoint calls are authenticated (e.g., `Authorization: Basic <client_credentials>`).
  - Other PingOne calls that rely on client credentials or different auth methods.
- Limit changes to:
  - MFA / FIDO2-related PingOne calls,
  - General-purpose PingOne wrapper only where it touches `Authorization` for **PingOne API calls that expect a Bearer token**.

If you introduce any helper (e.g., `buildPingOneAuthHeaders(token)`):

- Make it generic and safe.
- Use it only where PingOne expects Bearer auth.

---

## 7. Deliverables

At the end of this fix, the codebase should have:

1. **Clean worker token usage**:
   - Frontend obtains worker token (or user token) correctly.
   - Backend receives the raw JWT.
   - PingOne receives `Authorization: Bearer <raw_jwt>`.

2. **No hashed authorization headers** for PingOne MFA / FIDO2 calls.

3. **Robust logging**:
   - Logs clearly show when Authorization headers are missing, malformed, or not Bearer.
   - Diagnostic flags like `authorizationIsHash` help detect regressions.

4. **No regressions**:
   - All existing SMS, Email, FIDO2, and MFA flows continue to function.
   - OAuth/token flows still behave using Basic auth where appropriate.

Use this document as your guide in Cursor to search, refactor, and verify the Authorization header behavior around PingOne MFA and FIDO2 activation.
