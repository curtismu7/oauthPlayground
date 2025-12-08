# Cursor Task – Token Type Selection + Status Enforcement for PingOne MFA Devices (SMS, Email, TOTP)

## VERY IMPORTANT – GLOBAL RULES

Before doing anything else:

1. Open and read this file:

   `/Users/cmuir/P1Import-apps/oauth-playground/cursor-optimized.md`

2. Follow **all** conventions, guardrails, naming rules, and coding patterns defined there:
   - File structure and imports
   - Logging and error-handling patterns
   - TypeScript strictness
   - UI/UX consistency and stepper patterns
   - “Do not break other flows” rules

All work you do in this task must **comply** with `cursor-optimized.md` first, then apply the requirements below.

---

## Goal

We need to wire in correct PingOne behavior around **who** is making the device request, and how that affects the **device status** (`ACTIVATION_REQUIRED` vs `ACTIVE`), across:

- **SMS** MFA devices  
- **Email** MFA devices  
- **TOTP/OTP** MFA devices  

PingOne rule:

> If the actor making the request is the **same user** for whom the device is created, the `status` can only be `ACTIVATION_REQUIRED` (and defaults to that if not provided).  
> In that case, the user must activate the device before using it for authentication the first time.  
> If the request uses a **worker/admin token**, then `status` may be either `ACTIVATION_REQUIRED` or `ACTIVE`.

Translate this into app behavior:

- If we’re using a **user token** (access token from implicit or authorization code flow for that user)  
  → device **must** use `status = "ACTIVATION_REQUIRED"`.

- If we’re using a **worker token**  
  → device may use either `"ACTIVATION_REQUIRED"` or `"ACTIVE"` based on user choice in the UI.

We must:

1. Let the user choose which **token type** to use.
2. If they choose **user token**, guide them through configuring and obtaining an implicit (or auth code) token.
3. If they choose **worker token**, use the existing worker token path.
4. For **SMS, Email, and TOTP** device creation, set `status` correctly based on token type and user choice.
5. Do all this without breaking existing MFA flows, and in alignment with `cursor-optimized.md`.

---

## High-Level Requirements

### 1. Add Token Type Selection to MFA Device Flows

In the shared MFA configuration / credentials UI (where it makes sense globally for V8 flows), add:

- A control that lets the user pick **how the PingOne device API is called**:
  - **Option A – Use user token**
    - Explanation: “Use a user access token (Implicit / Authorization Code). Device status must be `ACTIVATION_REQUIRED`.”
  - **Option B – Use worker token**
    - Explanation: “Use a worker/admin token. Device status can be `ACTIVATION_REQUIRED` or `ACTIVE`.”

Implement this as a **single source of truth** for token context, e.g.:

```ts
type ActorType = "user" | "worker";

interface TokenContext {
  actorType: ActorType;
  // references to actual tokens or token sources can be added here
}
```

Store this context in the same place you store other MFA credentials/config for the V8 flows (per `cursor-optimized.md` conventions).

### 2. User Token Path – Configure and Obtain Implicit/Auth Code Token

When the user chooses **“Use user token”**:

1. Show/configure the correct fields for **Implicit or Authorization Code** flow:
   - Client ID
   - Redirect URI
   - Scopes (including the needed PingOne MFA & user scopes)
   - Response type (e.g., `token`, `id_token token`, or auth code + PKCE, depending on your existing authz flows)
   - Any other fields required by your existing `ImplicitV8` / `AuthZV8` flows.

2. Use your existing OAuth/OIDC flow implementation to:
   - Launch the browser/iframe flow, or re-use your built-in OAuth playground behavior.
   - Retrieve an **access token that represents the user**.
   - Persist that token in the same token storage used by other flows (per `cursor-optimized.md`).

3. Mark `tokenContext.actorType = "user"` and associate the user token so device creation uses it.

4. **Status rule for user token**:
   - For **SMS, Email, TOTP** device creation, you must **force**:
     ```ts
     body.status = "ACTIVATION_REQUIRED";
     ```
   - UI:
     - Do **not** allow `ACTIVE` to be selected in this mode, or at minimum do not send `ACTIVE` to PingOne even if selected.
     - Best practice: hide/disable the `ACTIVE` choice when `actorType = "user"` and show text explaining why.

### 3. Worker Token Path – Existing Admin/Worker Token

When the user chooses **“Use worker token”**:

1. Use the existing worker token mechanism defined in `cursor-optimized.md`:
   - App generator / worker token fetch and storage
   - Token usage patterns for PingOne admin calls

2. Mark `tokenContext.actorType = "worker"` and ensure MFA device creation flows use this worker token.

3. **Status rule for worker token**:
   - Allow the user to select between:
     - `ACTIVATION_REQUIRED`
     - `ACTIVE`
   - Store this choice in the device creation configuration (per flow).
   - When building the device creation JSON body for SMS, Email, and TOTP:
     ```ts
     function resolveDeviceStatus(
       actorType: ActorType,
       requestedStatus?: "ACTIVE" | "ACTIVATION_REQUIRED"
     ): "ACTIVE" | "ACTIVATION_REQUIRED" {
       if (actorType === "user") {
         return "ACTIVATION_REQUIRED";
       }
       // worker
       if (requestedStatus === "ACTIVE" || requestedStatus === "ACTIVATION_REQUIRED") {
         return requestedStatus;
       }
       return "ACTIVATION_REQUIRED";
     }
     ```
   - Always call `resolveDeviceStatus(tokenContext.actorType, uiSelectedStatus)` right before building the body for the PingOne device `POST`.

---

## 4. Apply Status Logic to SMS, Email, and TOTP Device Creation

For **all three** device types, the **status** field must be set via the helper above.

### 4.1 SMS

SMS device JSON (conceptual):

```json
{
  "type": "SMS",
  "phone": "<user phone>",
  "status": "<ACTIVATION_REQUIRED or ACTIVE>",
  "nickname": "<nickname>",
  "policy": { "id": "{{deviceAuthenticationPolicyID}}" }
}
```

- Before sending:
  - Compute `status` using `resolveDeviceStatus(actorType, uiSelectedStatus)`.
  - For **user token**: always `"ACTIVATION_REQUIRED"`.
  - For **worker token**: whatever the user selected (`ACTIVE` or `ACTIVATION_REQUIRED`), default `ACTIVATION_REQUIRED` if nothing selected.

### 4.2 Email

Email device JSON:

```json
{
  "type": "EMAIL",
  "email": "<user email>",
  "status": "<ACTIVATION_REQUIRED or ACTIVE>",
  "nickname": "<nickname>",
  "policy": { "id": "{{deviceAuthenticationPolicyID}}" }
}
```

Same rules: `status` comes from `resolveDeviceStatus`.

### 4.3 TOTP / OTP

TOTP device JSON:

```json
{
  "type": "TOTP",
  "status": "<ACTIVATION_REQUIRED or ACTIVE>",
  "nickname": "<nickname>",
  "policy": { "id": "{{deviceAuthenticationPolicyID}}" }
}
```

- For **user token**: always `"ACTIVATION_REQUIRED"` (user must prove they configured the authenticator app).
- For **worker token**: allow `"ACTIVE"` or `"ACTIVATION_REQUIRED"`, but still default to `"ACTIVATION_REQUIRED"` if user hasn’t chosen.

Even if in practice we almost always use `ACTIVATION_REQUIRED` for TOTP, the implementation must technically support `ACTIVE` when using a worker token, to match PingOne capabilities.

---

## 5. UX Behavior Summary

- **Step 0: Token Mode Selection**
  - Radio/select:
    - “Use user access token (Implicit/Auth Code)”
    - “Use worker/admin token”
  - This is global to the MFA demo context.

- **If “user access token” selected:**
  - Show configuration for Implicit / Auth Code flow.
  - Run the flow and store the token.
  - Hide or disable any `ACTIVE` status option in SMS/Email/TOTP UIs.
  - Show note:
    > “When using a user token, PingOne requires device status `ACTIVATION_REQUIRED`. You must activate the device before first use.”

- **If “worker/admin token” selected:**
  - Use existing worker token handling.
  - Show `status` selector in device configuration for SMS, Email, TOTP:
    - `ACTIVATION_REQUIRED`
    - `ACTIVE`
  - Show brief explanation:
    > `ACTIVATION_REQUIRED` – user must complete activation (OTP/TOTP/WebAuthn) before first use.  
    > `ACTIVE` – device is usable immediately.

---

## 6. Constraints and Guardrails

- All logic for token type and status resolution must be **centralized**, not copy-pasted into each flow:
  - A single `TokenContext` and `resolveDeviceStatus` helper shared by SMS, Email, TOTP flows.
- Must follow all rules in `/Users/cmuir/P1Import-apps/oauth-playground/cursor-optimized.md`.
- Do not break existing MFA flows (including FIDO2 and sign-on demos).
- TypeScript must compile cleanly with strict mode.
- Keep UI changes minimal and consistent with existing styles and stepper patterns.

---

## 7. Acceptance Criteria

You are done when:

1. The app has a clear **token mode selector** (user token vs worker token) wired into a shared `TokenContext`.
2. In **user token** mode:
   - SMS, Email, and TOTP device creation always send `status = "ACTIVATION_REQUIRED"`.
   - UI does not allow an `ACTIVE` status to be sent to PingOne for these flows.
3. In **worker token** mode:
   - SMS, Email, and TOTP device creation respect the user’s selected status (`ACTIVE` or `ACTIVATION_REQUIRED`).
   - `resolveDeviceStatus` is the single place where the final status is computed.
4. All device creation requests for SMS, Email, and TOTP are compliant with the PingOne rule:

   > If the actor making the request is the same user, `status` can only be `ACTIVATION_REQUIRED`.  
   > Worker/admin tokens may use `ACTIVATION_REQUIRED` or `ACTIVE`.

5. No regressions in existing MFA flows, and everything still follows `cursor-optimized.md` patterns.
