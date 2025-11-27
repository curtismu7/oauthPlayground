
# AI Prompt: Ensure Worker Token Has Correct PingOne MFA Device Scopes (mfascopes.md)

You are updating an existing PingOne SSO + PingOne MFA integration.  
The goal of this task is to **correct and harden the the scopes used by the Worker (M2M) token** so that it can reliably manage MFA devices for PingOne SSO **without over-scoping**.

Follow all instructions below exactly.

---

## 1. Context

We have:

- A PingOne **Environment** (`ENV_ID`)
- A Worker / M2M application with:
  - `CLIENT_ID`
  - `CLIENT_SECRET`
  - Resource: **PingOne API**
- A `client_credentials` flow that calls:

  ```bash
  POST https://auth.pingone.com/{ENV_ID}/as/token
  ```

This worker token is used by our backend to:

- Read users and their MFA state
- Create, list, activate, and delete **MFA devices** (e.g., SMS, Email, TOTP)
- Optionally flip MFA-related flags on the user (for example, `mfaEnabled`)

You must ensure that the **right PingOne API scopes** are requested and wired from config → token request → code.

---

## 2. REQUIRED PingOne API Scopes for MFA Device Management

Update our worker to request at least the following scopes for **PingOne API**:

### 2.1 User-level scopes

These are needed to read and (optionally) update user objects:

- `p1:read:user`  
- `p1:update:user`  

### 2.2 Device-level scopes

These enable full lifecycle management of MFA devices:

- `p1:create:device`   — create devices (SMS, Email, TOTP, FIDO, etc.)  
- `p1:read:device`     — list and read devices for a user  
- `p1:update:device`   — update devices (activation, nickname, status)  
- `p1:delete:device`   — delete devices  

### 2.3 Optional but Often Useful

Depending on our flows, we may also need:

- `p1:create:pairingKey` — for QR / mobile pairing flows  
- `p1:read:pairingKey`   — if we read pairing keys or related metadata  
- `p1:update:userMfaEnabled` — if we explicitly toggle a user’s MFA-enabled flag from the worker  

Do **not** add scopes beyond these without a clear reason. If you propose additional scopes, add a comment explaining why.

---

## 3. What You Must Do in the Codebase

### 3.1 Centralize Scopes in Config

1. Create or update a single config module (for example: `config/pingOne.ts` or similar) to define the **PingOne API scopes** as a constant array or space-delimited string.

   Example:

   ```ts
   export const PINGONE_WORKER_SCOPES = [
     "p1:read:user",
     "p1:update:user",
     "p1:create:device",
     "p1:read:device",
     "p1:update:device",
     "p1:delete:device",
     // Optional extras:
     // "p1:create:pairingKey",
     // "p1:read:pairingKey",
     // "p1:update:userMfaEnabled",
   ];
   ```

2. If we already store scopes in environment variables, make sure:
   - They are **either** fully specified there,
   - Or we merge env-provided scopes with a **minimal required list** for MFA device support.

   It is acceptable to build the final scope string like:

   ```ts
   const baseScopes = PINGONE_WORKER_SCOPES;
   const extraScopes = (process.env.PINGONE_EXTRA_SCOPES ?? "").split(" ").filter(Boolean);
   const scopes = [...new Set([...baseScopes, ...extraScopes])].join(" ");
   ```

### 3.2 Update Token Request Logic

Find the code that performs:

```bash
POST https://auth.pingone.com/{ENV_ID}/as/token
```

and make sure:

- It uses `grant_type=client_credentials`.
- It sends the **correct scope string** derived from the config above.

Example (TypeScript/Node pseudo-code):

```ts
const scopes = PINGONE_WORKER_SCOPES.join(" ");

const body = new URLSearchParams();
body.set("grant_type", "client_credentials");
body.set("client_id", PINGONE_CLIENT_ID);
body.set("client_secret", PINGONE_CLIENT_SECRET);
body.set("scope", scopes);

const res = await fetch(`https://auth.pingone.com/${ENV_ID}/as/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: body.toString(),
});
```

Do not hard-code the scope string in multiple places. It must come from a single shared definition.

### 3.3 Verify All MFA Device Calls Use This Worker Token

Confirm that services which call:

- `GET /v1/environments/{ENV_ID}/users/{USER_ID}/devices`
- `POST /v1/environments/{ENV_ID}/users/{USER_ID}/devices`
- `POST /v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/activate`
- Any other device-related Platform endpoints

all use the **same Worker token** that is issued with the scopes above.

If any MFA device call uses a different token or no token at all, fix that by:

- Routing all PingOne API calls through a single `PingOneTokenClient` module.
- Ensuring `PingOneTokenClient` requests the correct scope string.

---

## 4. Error Handling, Logging, and Diagnostics

Update or add error handling to make scope issues easy to detect:

1. **On token request failure:**
   - Log:
     - HTTP status
     - Response body (minus secrets)
     - The scope string that was requested
   - Provide a clear error like:
     - `"PingOne worker token request failed. Check client credentials and PingOne API scopes."`

2. **On 403 / insufficient scope errors from PingOne API:**
   - Log:
     - Endpoint URL
     - HTTP method
     - Status code
     - Response body snippet
   - Include a hint like:
     - `"This endpoint requires device or user scopes such as p1:read:device, p1:update:device, p1:create:device, p1:read:user, p1:update:user. Verify PingOne API scope configuration for the worker app."`

3. **Do not log secrets or OTP codes.**
   - Mask:
     - `client_secret`
     - access tokens
     - MFA OTP codes
     - phone numbers (mask partially if logged for debugging)

---

## 5. Guardrails for AI (Cursor / Windsurf)

When editing or generating code for these scopes:

1. **Do NOT remove required scopes** for MFA devices:
   - `p1:read:user`
   - `p1:update:user`
   - `p1:create:device`
   - `p1:read:device`
   - `p1:update:device`
   - `p1:delete:device`

2. **Do NOT silently expand scopes** to over-privileged sets (e.g., `p1:admin`-style scopes) unless there is a documented reason and a comment.

3. **Keep scope handling centralized.**
   - If you find multiple hard-coded scope strings, consolidate them into one configuration source.
   - Add comments indicating that these scopes are required for MFA device management.

4. **If you are unsure about a scope name or necessity:**
   - Do not invent it.
   - Add a `TODO` comment like:
     - `// TODO: Confirm whether we need p1:update:userMfaEnabled for this flow based on PingOne documentation.`

---

## 6. Summary of Required Changes

- Add/verify `PINGONE_WORKER_SCOPES` (or equivalent) containing:
  - `p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device p1:delete:device`
- Update the `as/token` request to always use this scope set.
- Ensure all MFA device Platform calls use this worker token.
- Add logging and diagnostics around token and 403 errors.
- Leave TODO comments instead of guessing if more scopes are needed.

Once you complete this, the worker token will have the correct least-privilege rights to manage MFA devices for PingOne SSO, and future scope changes will be controlled and visible.
