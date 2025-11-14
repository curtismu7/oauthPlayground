# AI Prompt — Build “Password Reset” Demo Page (PingOne User Passwords) — **HelioMart**

![HelioMart Logo](heliomart-logo.svg)

**Goal:** Create a brand-new top-level page in the app menu: **Security → Password Reset** for the fictitious retailer **HelioMart** (generic branding, no references to HEB). This page demonstrates **all PingOne password operations** end-to-end, with realistic UI, sample users, and live API calls where possible. It must follow our shared UI conventions (clean, accessible, responsive), use neutral colors, and integrate our unified logging.

> Use PingOne **Platform** API — *User Passwords* operations. Implement with **TypeScript + React** (frontend) and our existing Node server adapters where needed. Keep all secrets out of the client.

---

## 0) Branding & Theming (Generic)
- App shell: slate/navy neutrals (#0F172A, #111827, #1F2937), surface cards (#0B1220/#111827), accent **sunrise** gradient (amber → orange) only for highlights.
- Replace any HEB-specific assets with **HelioMart** logo (provided in repo as `heliomart-logo.svg`) and generic product/user images.
- Typography: Inter/System default; rounded corners (1rem), soft shadows.
- Do **not** use any real merchant names, icons, or trademarks.

---

## 1) Menu & Routing
- Add route: `/security/password-reset` under **Security** group → **Password Reset**.
- Page header: `Password Reset (PingOne)` with environment badge and token status indicator.
- Respect OIDC Discovery service: if `environmentId` has been set globally, render as read-only in header.

---

## 2) Scenarios to Demonstrate (Four Tabs)
Create a tabbed UI with **Overview**, **Self‑Service Recover**, **Admin Force Reset**, **Change Password**.

### A) Overview
- Short explainer of flows and when to use each.
- Callouts:
  - **Recover** (forgotten password): recovery code → new password.
  - **Force change on next sign‑on** (help desk/admin).
  - **Change password** (known current password).

### B) Self‑Service Recover
**Flow:**
1. Identify user by username/email → lookup to get `userId`.
2. Trigger **send recovery code** (email/SMS per tenant config).
3. Enter `recoveryCode` + `newPassword` → **POST** recover operation.
4. Success screen with “Sign in now” CTA.

**UI:**
- Real app-style interface (no stepper) - single form with user lookup, recovery code input, and new password fields.
- Strong password helper + policy hints; mask + eye toggle.
- All API calls displayed in table at bottom (like HEB app).

### C) Admin Force Reset
**Flow:**
- Input/search user → confirm **Force change on next sign‑on** → submit.
- Show banner: “User will be required to change password on next sign‑on.”

**UI:**
- Confirmation modal summarizing user & effect.
- Result banner with transaction id / timestamp.

### D) Change Password (Known Current Password)
**Flow:**
- Authenticated user enters `oldPassword`, `newPassword`, `confirm` → submit.
- Success toast + optional session rotation note.

---

## 3) PingOne Platform API Wiring

Base: `https://api.pingone.com/v1/environments/{{environmentId}}/users/{{userId}}/password`

**Headers (all):**
- `Authorization: Bearer <worker_or_admin_token>` (use Worker token generator)
- `Content-Type: <operation-specific media type>`
- `Accept: application/json`

**Recover (forgot password):**
- Method: `POST`
- `Content-Type: application/vnd.pingidentity.password.recover+json`
- Body example (adjust to latest schema):
```json
{
  "recoveryCode": "123456",
  "newPassword": "Str0ng!Passw0rd"
}
```

**Force Change on Next Sign‑On (help desk/admin):**
- Method: `POST`
- `Content-Type: application/vnd.pingidentity.password.forceChange+json`
- Body:
```json
{ "forceChange": true }
```

**Change Password (known current password):**
- Method: `POST`
- `Content-Type: application/vnd.pingidentity.password.change+json`
- Body:
```json
{
  "oldPassword": "OldPassw0rd!",
  "newPassword": "N3wPassw0rd!?"
}
```

> Define a **typed enum** for the content-types and select per action. Centralize request builders; never hardcode scattered strings.

---

## 4) Documentation Links

Each tab should include a documentation link to the relevant PingOne API documentation:

- **Self-Service Recover Tab:**
  - Link: `https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-environments-environmentid-users-userid-password`
  - Description: "PingOne API: Password Recovery (Content-Type: application/vnd.pingidentity.password.recover+json)"

- **Admin Force Reset Tab:**
  - Link: `https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-environments-environmentid-users-userid-password`
  - Description: "PingOne API: Force Password Change (Content-Type: application/vnd.pingidentity.password.forceChange+json)"

- **Change Password Tab:**
  - Link: `https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-environments-environmentid-users-userid-password`
  - Description: "PingOne API: Change Password (Content-Type: application/vnd.pingidentity.password.change+json)"

- **Overview Tab:**
  - Include documentation links for all three operations

All documentation links should:
- Open in a new tab (`target="_blank"`)
- Include `rel="noopener noreferrer"` for security
- Display with an icon (book icon) and external link indicator
- Be styled consistently with the HelioMart theme

---

## 5) Code Readability & Function Naming

**Function Naming Conventions:**
- Use descriptive, real function names that clearly indicate their purpose
- Prefix handler functions with `handle` (e.g., `handleRecoverLookup`, `handleSendRecoveryCode`)
- Prefix service functions with their operation type (e.g., `sendRecoveryCode`, `recoverPassword`, `forcePasswordChange`, `changePassword`)
- Use camelCase for all function names
- Avoid abbreviations unless they are widely understood (e.g., `userId` is acceptable, but prefer `userIdentifier` if clarity is needed)

**Service Functions:**
- `sendRecoveryCode(request: SendRecoveryCodeRequest): Promise<SendRecoveryCodeResponse>`
- `recoverPassword(environmentId, userId, workerToken, recoveryCode, newPassword): Promise<PasswordOperationResponse>`
- `forcePasswordChange(environmentId, userId, workerToken): Promise<PasswordOperationResponse>`
- `changePassword(environmentId, userId, accessToken, oldPassword, newPassword): Promise<PasswordOperationResponse>`

**Handler Functions:**
- `handleRecoverLookup()` - Lookup user for password recovery
- `handleSendRecoveryCode()` - Send recovery code to user
- `handleRecoverPassword()` - Complete password recovery with code and new password
- `handleForceResetLookup()` - Lookup user for force reset
- `handleForcePasswordReset()` - Force password change on next sign-on
- `handleChangePassword()` - Change password with old and new password

**Code Organization:**
- Group related functions together
- Use TypeScript interfaces for all request/response types
- Add JSDoc comments for complex functions
- Keep functions focused on a single responsibility

---

## 6) UX Details (Generic "Real Screens" Fidelity)
- Card layout with clear copy and helper text.
- Status bar at top: `Environment`, token freshness, last API call result.
- Toasts for success; inline field errors for 4xx with precise messaging.
- **Sample users**: seed 3 mock users (names, emails, avatars) + search.
- Copyable cURL after each success (secrets redacted).

---

## 7) Logging, Security & Hardening
- Unified logging tag: `[🔐 PASSWORD]` with timestamp + module; **never log** passwords or recovery codes.
- Mask tokens; eye toggle for reveal.
- Client-side rate-limits; disable buttons during in-flight calls.
- Robust error map for `400/401/403/404/409/422/429/5xx` with retry/backoff for `429/5xx`.
- Unit tests for request builders and schema validation.
- Content Security Policy and no inline secrets.
- Feature flag: `feature.passwordResetDemo=true`.

---

## 8) Developer Controls
- **Sandbox mode** toggle to stub responses for demos without a live tenant.
- `.env` for base URL/audience; document required worker scopes in README.
- Telemetry: tab usage counts; success/failure rates.

---

## 9) Acceptance Criteria
- New menu item routes correctly and renders four tabs.
- All three operations wired to Platform API with correct content-types and bodies.
- No secrets or passwords in logs; accessibility (labels, focus, keyboard) validated.
- Works with real `environmentId` + worker token; sandbox fallback available.

---

## 10) Example cURL (Recover)
```bash
curl -X POST   "https://api.pingone.com/v1/environments/$ENV_ID/users/$USER_ID/password"   -H "Authorization: Bearer $WORKER_TOKEN"   -H "Content-Type: application/vnd.pingidentity.password.recover+json"   -d '{
    "recoveryCode": "123456",
    "newPassword": "Str0ng!Passw0rd"
  }'
```

---

### Deliverables
- React/TS page at `/security/password-reset` with four tabs and full wiring.
- `heliomart-logo.svg` used in header.
- README section documenting endpoints, media types, scopes, and env vars.
- Jest tests for request builders and error mapping.

---

## 11) Required Tokens & Configuration Modal

Before running the demo or accessing the password reset features, the app should ensure required credentials are configured.  
Add a **Token Configuration Modal** that appears at startup (or via a “🔐 Configure Tokens” link on the login form).

### Required Tokens
| Token Type | Description | Purpose | Storage |
|-------------|-------------|----------|----------|
| **Worker Token** | Issued via PingOne App/Worker configuration with admin scopes (`p1:read:users`, `p1:write:users`, `p1:read:passwords`, `p1:write:passwords`). | Used for admin‑level operations like *Force Reset* and *Recover*. | Stored temporarily in app memory (never persisted to localStorage). |
| **Authorization Token (End‑User)** | Obtained via standard OAuth2 Authorization Code Flow with PKCE (for demo users). | Used for *Change Password* scenarios where user knows their current password. | Stored in browser session only (not persisted). |

### Modal Behavior
- At startup, if tokens are missing or invalid, prompt user with modal to enter:
  - Environment ID
  - Worker Token (masked input with “eye” icon)
  - Optional: User Authorization Token (if testing self-service change)
- Buttons:
  - **Save & Continue** → validate tokens via `/environments` API
  - **Cancel** → app remains locked until valid tokens supplied
- Show small “Configure Tokens” link under the login form for later re-entry.

### Implementation Details
- Use our unified logging tag `[🗝️ TOKEN-CONFIG]`.
- Mask secrets in UI and logs.
- Add hardening: fail‑safe validation, retry, and visual feedback (e.g., green check after successful validation).
- Persist valid tokens only in memory to avoid exposure between sessions.

---
