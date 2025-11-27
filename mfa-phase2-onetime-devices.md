
# AI Prompt: Implement PingOne MFA One-Time Device Auth (Phase 2 – “Later”)

This file describes **Phase 2** of the PingOne MFA integration.

In this phase, we add support for **One-time Device Authentication** using `selectedDevice.oneTime`, intended for organizations that **do not want to store phone numbers / emails as MFA devices in PingOne**.

Instead, they:

- Keep contact details (email/phone) in their own database.
- Call `deviceAuthentications` with `oneTime` email/phone.
- Let PingOne MFA + Notification Policies send OTPs, but do not persist the device in PingOne.

You must implement this **in addition to**, not instead of, the standard Phase 1 behavior.

---

## 1. High-Level Goals (Phase 2)

1. Add a new option in the MFA flow to use **one-time devices**:
   - `selectedDevice.oneTime.type = "EMAIL"` or `"SMS"`
   - `selectedDevice.oneTime.email` / `selectedDevice.oneTime.phone`

2. Ensure we can:
   - Trigger OTP using `deviceAuthentications` with `oneTime` data
   - Validate OTP via the same deviceAuthentication `otp.check` mechanism
   - Keep Phase 1 (registered devices) fully working

3. Keep the behavior **configurable**:
   - Admins can choose:
     - “Use registered PingOne devices” (Phase 1)
     - “Use one-time devices from our DB” (Phase 2)
     - Or allow both and pick per user / per app.

---

## 2. API Primitives for One-Time Device Auth

We reuse the same **SSO token** and **MFA device authentication** resource, but change the **shape of `selectedDevice`**.

### 2.1 Initialize Device Authentication – One-Time Email

Per PingOne MFA docs / Postman “Device Authentication (One-time Email)”:  
(this is the pattern, you must copy exact fields from docs)  

```http
POST {{authPath}}/{{ENV_ID}}/deviceAuthentications
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "user": {
    "id": "{{USER_ID}}"
  },
  "selectedDevice": {
    "oneTime": {
      "type": "EMAIL",
      "email": "user@example.com"
    }
  }
}
```

- This call:
  - Creates a deviceAuthentication
  - Uses the configured MFA Device Authentication policy + Notification policy
  - Sends an OTP email *without* requiring a stored MFA device in PingOne

### 2.2 Initialize Device Authentication – One-Time SMS

Same idea, different type and field:

```http
POST {{authPath}}/{{ENV_ID}}/deviceAuthentications
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "user": {
    "id": "{{USER_ID}}"
  },
  "selectedDevice": {
    "oneTime": {
      "type": "SMS",
      "phone": "+15551234567"
    }
  }
}
```

- Phone number comes from **our** user profile database, not from PingOne’s MFA devices.
- PingOne just uses it transiently for the OTP send.

### 2.3 OTP Check & Status

After initialization:

- The response contains a `deviceAuthenticationId` and usually:
  - `status: OTP_REQUIRED`
  - `_links.otp.check` to validate the OTP

You MUST:

1. Prompt the user for the OTP in the same way as in Phase 1.
2. Call the **same Validate OTP / otp.check** operation for that `deviceAuthenticationId`, using the correct URL and JSON body from PingOne MFA docs / Postman.

> AI RULE: Do not invent the otp-check URL or body.  
> Copy it from:
> - PingOne MFA v1 docs (`pingone/mfa/v1/api/#post-...`)
> - The “Validate OTP” Postman request for Device Authentication.

---

## 3. Configuration: When to Use One-Time Devices vs Registered Devices

You must introduce a **switching mechanism** between Phase 1 (registered devices) and Phase 2 (one-time devices).

### 3.1 Strategy Function

Create a small function like:

```ts
type MfaDeviceStrategy = "registeredDevice" | "oneTimeDevice";

function resolveMfaDeviceStrategyForUser(user: UserProfile): MfaDeviceStrategy {
  // Minimal (Phase 2 starter): return "registeredDevice" by default.
  // Later, admin configuration or flags can opt users/groups into "oneTimeDevice".
  return "registeredDevice"; // TODO: wire real config
}
```

Later you can enhance this to:

- Use environment flags
- Use per-app or per-tenant config
- Use attributes on the user

### 3.2 Rules

- Do **not** remove registered-device support.
- Do **not** silently switch everyone to one-time devices.
- Only use `oneTime` where explicitly configured or requested.

---

## 4. Changes to the MFA Auth Service

Extend `PingOneMfaAuthService` (from Phase 1) with methods or options that can handle both modes.

### 4.1 Existing Phase 1 Behavior

Keep:

```ts
initializeSmsDeviceAuthentication({
  userId,
  policyId,
  deviceId, // registered PingOne device
});
```

This internally uses `selectedDevice.id`.

### 4.2 New Phase 2 Behavior (one-time)

Add support for:

```ts
initializeOneTimeDeviceAuthentication({
  userId,
  policyId,
  type,        // "EMAIL" | "SMS"
  email?,      // for EMAIL
  phone?,      // for SMS
});
```

Internally, this must:

- Call `POST {{authPath}}/{{ENV_ID}}/deviceAuthentications`
- Use `selectedDevice.oneTime` with the right shape:
  - For email: `oneTime.type = "EMAIL"`, `oneTime.email = ...`
  - For SMS: `oneTime.type = "SMS"`, `oneTime.phone = ...`

All OTP **validation** logic can reuse the same `validateOtp(deviceAuthenticationId, otp)` method from Phase 1.

---

## 5. UI Changes for One-Time Mode

You must adjust or extend the existing MFA UI to support one-time configuration without breaking the registered device flow.

### 5.1 One-Time Email/SMS Challenge Screen

When the strategy is `oneTimeDevice`:

- Instead of asking “which registered device to use?”, you:
  - Pull the email/phone from **our** user profile
  - Display masked values:
    - “We will send a code to user@example.com”
    - “We will send a code to +1•••-•••-1234”
- When the user clicks “Send code” / “Continue”, call **Initialize Device Authentication (one-time)**.
- Then show the familiar “Enter OTP” screen.

### 5.2 Admin-Level Controls

Add admin configuration options (later):

- Checkboxes or dropdown:
  - “Use registered PingOne MFA devices (recommended)”
  - “Allow one-time devices from our DB”
  - “Use one-time devices only”

The code must read this config and feed into `resolveMfaDeviceStrategyForUser`.

---

## 6. Security & Hardening

When using one-time devices:

1. **Do not log full email/phone values**:
   - Mask them in logs.
2. **Rate-limit**:
   - Limit the number of OTP sends per user per time window.
   - Limit OTP validation attempts.
3. **Audit**:
   - Log when one-time MFA is used vs registered device MFA.
   - Consider routing risky flows to one or the other.

---

## 7. Guardrails for AI (Cursor/Windsurf)

When implementing Phase 2:

1. **Do not remove or alter Phase 1 behavior.**
   - Phase 1 (registered devices using `selectedDevice.id`) must continue to work.
   - Phase 2 should be additive and behind a strategy/config.

2. **Do not mix concerns in one method.**
   - Keep separate code paths or clearly branched logic for:
     - Registered device auth
     - One-time device auth

3. **No invented endpoints.**
   - Always copy `deviceAuthentications` and `otp.check` URLs + bodies from PingOne MFA docs/Postman.

4. **Explicit comments.**
   - Add comments describing which code path is Phase 1 vs Phase 2.
   - When unsure, add `// TODO: Confirm against PingOne MFA v1 docs` instead of guessing.

This file is ONLY for **Phase 2** one-time-device behavior.  
Ensure Phase 1 (standard registered devices) is fully implemented first using the other spec file, then layer this on top.
