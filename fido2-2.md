# PingOne MFA – FIDO2 Activation and `ACTIVATION_CREATED` Status

This document clarifies how **PingOne MFA** handles **FIDO2 device activation**, and what role (if any) the `ACTIVATION_CREATED` status plays.

---

## 1. FIDO2 Has Its Own Activation Endpoint

PingOne exposes a dedicated endpoint:

> `POST /environments/{environmentId}/users/{userId}/devices/{deviceId}/activate/fido2`  
> (name/shape per PingOne MFA docs: “Activate MFA User Device (FIDO2)”)

This endpoint means:

- FIDO2 devices **do participate in an activation step** in PingOne MFA.
- The activation is **not OTP-based**.  
- Instead, activation is driven by the **WebAuthn registration ceremony**:
  - The browser runs `navigator.credentials.create(...)`.
  - The authenticator produces WebAuthn data (e.g., `attestationObject`, `clientDataJSON`).
  - Your backend sends that WebAuthn payload to PingOne via the **FIDO2 activate** endpoint.

If PingOne validates the WebAuthn payload successfully, it marks the device **active**.

---

## 2. Do You Need Status `ACTIVATION_CREATED` for FIDO2?

Short, practical answer:

> You **do not** need to manually set `ACTIVATION_CREATED` for FIDO2, and you **don’t need to target that status** explicitly in your app.

The FIDO2 lifecycle in PingOne MFA typically looks like this:

1. **Create FIDO2 device**
   - You create an MFA device with `type = "FIDO2"` for a user.
   - PingOne places it in some internal pre-activation status (often something akin to `ACTIVATION_REQUIRED`).
   - Your app does **not** manually set `ACTIVATION_CREATED`.

2. **Perform WebAuthn registration in the browser**
   - Call `navigator.credentials.create()` from the frontend, using options/challenge obtained from PingOne.
   - Browser ↔ authenticator completes the WebAuthn ceremony.
   - You get back the WebAuthn registration result (attestation data).

3. **Call the FIDO2 activate endpoint**
   - Backend calls the PingOne FIDO2 activation API with:
     - `environmentId`, `userId`, `deviceId`
     - WebAuthn data from the browser.
   - PingOne:
     - Verifies the WebAuthn payload.
     - Transitions the device into `ACTIVE` if validation succeeds.

If the status `ACTIVATION_CREATED` exists for FIDO2 at all, it is best thought of as an **internal, transitional state**, not something you:

- set yourself, or
- rely on as a stable, externally-managed status in your code.

For your app’s logic and diagrams, the interesting states are:

- **Pre-activation**: device exists, not yet usable.
- **Post-activation**: device is `ACTIVE` and can be used for WebAuthn authentication.

---

## 3. Mental Model: OTP vs FIDO2

It is helpful to distinguish **OTP-based factors** from **FIDO2**:

### OTP-Based Factors (Email / SMS / Voice / TOTP / App)

- Use **pairing codes** (OTP) for activation.
- Common statuses:
  - `ACTIVATION_REQUIRED`
  - `ACTIVE`
  - `LOCKED`, `BLOCKED`, etc.
- Activation endpoints:
  - “Activate MFA User Device”
  - “Resend Pairing Code”

### FIDO2 / WebAuthn Factors

- Use **WebAuthn ceremonies**, not OTP, for activation.
- Activation endpoint:
  - “Activate MFA User Device (FIDO2)” which consumes WebAuthn registration data.
- Device becomes `ACTIVE` after successful WebAuthn validation.
- You do **not** send or validate pairing codes for FIDO2.

---

## 4. Implementation Summary for Your App

When you build out FIDO2 education flows in your PingOne MFA playground:

1. **Create FIDO2 device** for the user via the MFA API.
2. **Get WebAuthn options** (challenge, RP ID, etc.) from PingOne / your backend.
3. **Run WebAuthn registration** in the browser with `navigator.credentials.create()`.
4. **Send WebAuthn result** to your backend.
5. **Backend calls FIDO2 activation endpoint** with that WebAuthn result.
6. PingOne marks the device **`ACTIVE`** and it becomes usable for FIDO2 authentication flows.

At no point do you need to manually manipulate or aim for a status of `ACTIVATION_CREATED` for FIDO2. Focus instead on:

- Pre-activation → FIDO2 activation API → `ACTIVE`.

This keeps your diagrams and Cursor prompts aligned with how PingOne actually wants you to drive FIDO2 registration.
