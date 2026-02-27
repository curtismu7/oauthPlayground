# Cursor Task – Implement Correct PingOne TOTP Device Flow (Create, Show QR, Activate)

## Goal

Implement the **TOTP MFA flow** for PingOne so it behaves correctly and matches how the PingOne APIs work.

You must:

- Create a TOTP device for a user via PingOne.
- Read the **secret** and **keyUri** from the device response.
- Show both:
  - The **raw secret** value, and
  - A **QR code** generated from `keyUri` (otpauth URI).
- Let the user configure their authenticator app (Google Authenticator, etc.) using either the secret or QR.
- Then prompt the user for the 6‑digit TOTP code from their app.
- Use that 6‑digit code to **activate** the device via the PingOne device activation API.

Do all this **without redesigning the UI**: add fields, modals, or components into the existing V8 stepper/flow framework.

This applies to a TOTP‑specific flow like:

- `TOTPFlowV8.tsx` (or equivalent)
- `TOTPConfigurationPageV8.tsx` (if present)
- Shared components in `MFAFlowBaseV8.tsx` and any `TOTPFlowController` / service files

---

## 1. TOTP Device Creation – What PingOne Returns

**Endpoint:**

```text
{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices
```

**Typical TOTP device body (example):**

```json
{
  "type": "TOTP",
  "status": "ACTIVATION_REQUIRED",
  "nickname": "My authenticator app",
  "policy": {
    "id": "{{deviceAuthenticationPolicyID}}"
  }
}
```

(You may also include other fields if required by PingOne’s TOTP schema, but this is the core shape.)

**Key behavior:**
- We send `"type": "TOTP"`.
- We typically use `"status": "ACTIVATION_REQUIRED"` because the user must prove they configured their authenticator app by entering a TOTP code.
- `nickname` is optional in API, but our UI should **always ask for and store a nickname**.
- `policy.id` is optional, but our UI should **always allow the user to select a Device Authentication Policy** from a dropdown and send its `id`.

**Response:**

The TOTP device creation response contains (important parts):

```json
{
  "id": "{{deviceID}}",
  "status": "ACTIVATION_REQUIRED",
  "secret": "2ZHHQO4EP3TF3C7OIU6G2WI2XLQDU6UR",
  "keyUri": "otpauth://totp/cmuir@pingone.com?secret=2ZHHQO4EP3TF3C7OIU6G2WI2XLQDU6UR",
  "_links": {
    "device.activate": {
      "href": "https://.../environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}"
    }
  }
}
```

You must capture at least:

- `deviceID`
- `secret`
- `keyUri`
- `device.activate` link (if present)

---

## 2. Showing Secret + QR Code to the User

Once the TOTP device is created:

1. **Store in state**:
   - `secret`
   - `keyUri`
   - `deviceId`
   - `deviceActivateUri` (if provided; typically from `_links["device.activate"].href`)

2. In the UI, present a screen/step/modal that shows both:
   - The **secret** as text (copyable).
   - A **QR code generated from `keyUri`**.

   Implementation notes:
   - Use an existing QR library or a lightweight QR generator component already allowed in this project (e.g., `qrcode.react` or similar, depending on current ecosystem).
   - The QR should encode `keyUri` exactly as received.
   - Show a short instruction like:
     - “Scan this QR code with your authenticator app (e.g. Google Authenticator), or manually enter the secret below.”

3. The user configures their authenticator app:
   - Either by scanning the QR code, or
   - By manually entering the `secret` string.

4. After the app is configured, the TOTP app will produce a **6‑digit code**.

You must NOT send `secret` or `keyUri` back to PingOne during activation; they are used only by the user’s authenticator app.

---

## 3. TOTP Activation – Using the 6‑Digit Code

Once the user has configured their TOTP app and sees a 6‑digit code, the UI should:

1. Show an **OTP input field** (6 digits) in the same step or the next step.
2. On submit, call the PingOne device activation API.

### Activation endpoint

The user’s rule: use

```text
{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}
```

Where:

- `envID` is the current environment ID.
- `userID` is the PingOne user ID.
- `deviceID` is the ID returned by TOTP device creation.

If PingOne also provides a `device.activate` link in `_links`, treat that as the canonical URL when present (hypermedia‑first) and **fall back** to the templated `{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}` when a direct link is not present.

### Headers

```http
Content-Type: application/vnd.pingidentity.device.activate+json
```

### Body

```json
{
  "otp": "123456"
}
```

Where `otp` is the 6‑digit code the user entered from their authenticator app.

**On success:**
- Mark the TOTP device as ACTIVE in the UI.
- Show a success message indicating that the TOTP device is now registered.
- Optionally refresh the list of MFA devices.

**On failure:**
- Show a clear error (invalid code, expired, etc.).
- Allow the user to retry entering a code.

There is **no “resend OTP”** for TOTP like Email/SMS, because the OTP comes from the user’s authenticator app, not from PingOne.

---

## 4. UX Flow Requirements for TOTP

Integrate this into your V8 MFA flow framework (e.g., stepper pattern) with minimal UI disruption.

Suggested steps:

1. **Configuration step**
   - Collect:
     - `nickname` (required for UX)
     - Device Authentication Policy (via dropdown), send `policy.id` in request.
   - Optionally let user confirm the user/email context shown in the otpauth URI label (e.g., `cmuir@pingone.com`).

2. **Device creation step**
   - Build TOTP device JSON body with:
     - `"type": "TOTP"`
     - `"status": "ACTIVATION_REQUIRED"`
     - `nickname`
     - `policy.id`
   - Call `POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices`.
   - Save `deviceId`, `secret`, `keyUri`, and `deviceActivateUri` (from `_links["device.activate"].href` if present).

3. **Show secret + QR step**
   - Render:
     - QR code from `keyUri`
     - The `secret` string (copyable)
     - Instructions:
       - “Scan this QR code or enter the secret into your authenticator app.”
   - Provide a button: “I’ve added this to my authenticator app” to move forward.

4. **Enter TOTP code step**
   - Input for the 6‑digit code from the authenticator app.
   - “Verify” button that calls activation endpoint (`deviceActivateUri` if present, else templated device URL) with `{ "otp": "<user input>" }`.
   - On success: show success and mark device as ACTIVE.
   - On failure: show error and allow retry.

All these should reuse the current app’s **toast / validation / navigation** patterns (no new UI frameworks).

---

## 5. Constraints and Guardrails

- **Do not redesign** the entire MFA UI. Integrate into existing steppers and layout.
- Keep **TypeScript** strict‑mode clean; update types as needed (e.g., device response types to include `secret`, `keyUri`, and `_links`).
- Never log or expose the TOTP `secret` in debug logs in a way that would be unsafe outside of an educational/demo context. In this app, we *can* show it in the UI because the purpose is educational, but logging should be minimal and clearly tagged.
- Do not break other MFA flows (Email, SMS, FIDO2, Verify, etc.). Changes should be scoped to TOTP‑specific files and shared utilities they legitimately depend on.

---

## 6. Acceptance Criteria

You are done when all of the following are true:

1. TOTP device creation:
   - Uses `type = "TOTP"` and `"status": "ACTIVATION_REQUIRED"`.
   - Sends `nickname` and `policy.id` as chosen by the user.
   - Correctly reads `deviceId`, `secret`, `keyUri`, and (if present) `device.activate` link from the response.

2. UI shows:
   - The TOTP **secret** clearly.
   - A **QR code** generated from `keyUri`.
   - Instructions for scanning/entering into a TOTP app.

3. Activation:
   - Prompts the user for a 6‑digit code from their authenticator app.
   - Calls the **device activation endpoint** (either the `device.activate` link or `{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}`) with:
     ```json
     { "otp": "<userEnteredCode>" }
     ```
   - On success, marks the device as ACTIVE and shows success.
   - On failure, shows a clear error and allows retry.

4. No new regressions in other MFA flows.
5. TypeScript builds cleanly with no new errors.

Use this file (`rightTOTP.md`) as the Cursor prompt to fully implement the TOTP device flow in your PingOne MFA V8 app: create device → show secret + QR → user configures authenticator → user enters TOTP → app activates device.
