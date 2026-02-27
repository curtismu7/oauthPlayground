# AI Task: Update WhatsApp MFA Integration Using PingOne MFA (Clone of SMS Flow)

You are working inside the repo:

`/Users/cmuir/P1Import-apps/oauth-playground`

This project already has **working SMS MFA flows** wired to **PingOne MFA** with a good UI and logging. Your job is to **implement and/or fix WhatsApp MFA** by treating it as a **near-clone of SMS**, using the **PingOne MFA “WhatsApp” device type** and **reusing the existing SMS UX patterns**.

You MUST NOT break any other flows.

Also use the existing prompt file for global rules / conventions:

`/Users/cmuir/P1Import-apps/oauth-playground/cursor-optimized.md`

Read and follow that file fully before making changes.

---

## 1. Overall Goal

- Add / fix support for **WhatsApp MFA** in the OAuth/MFA playground.
- WhatsApp should behave **just like SMS MFA**, but using:
  - `type: "WHATSAPP"` in PingOne MFA device APIs
  - The **PingOne WhatsApp MFA configuration** in the environment.
- Reuse the **same UI/UX pattern as SMS**:
  - Same screens, same steps, same logging style, same modals, same validation rules where they make sense.
- **Do not break any existing flows**:
  - SMS MFA
  - Email MFA
  - FIDO2
  - Any other MFA/SSO flows that already work.

---

## 2. Source of Truth: PingOne WhatsApp MFA

You must align to **PingOne docs** for WhatsApp MFA, especially:

- **Create MFA User Device (WhatsApp)**  
  `POST /v1/environments/{environmentId}/users/{userId}/devices` with `type = "WHATSAPP"`  
  https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-whatsapp

- WhatsApp MFA behavior & configuration in PingOne:  
  - WhatsApp as an MFA method  
  - WhatsApp Sender configuration in PingOne  
  - MFA policy with WhatsApp enabled

DO NOT invent request fields that are not in the PingOne docs. Only use fields that are actually documented.

---

## 3. Treat WhatsApp as “SMS Twin” in This App

Conceptually in this codebase:

> “WhatsApp MFA is an SMS-like factor using PingOne MFA; the only difference is device type and PingOne’s internal sender configuration.”

Your task:

1. **Find the existing SMS MFA integration**

   Search for:

   - `SMS` in MFA device code
   - `type: "SMS"` in PingOne MFA calls
   - UI components / flows that handle:
     - SMS device registration
     - SMS MFA authentication
     - SMS OTP entry, retries, error handling

2. **Clone SMS behavior for WhatsApp**

   For each place where SMS MFA is implemented:

   - Add equivalent logic for `type: "WHATSAPP"`.
   - Reuse the **same UI components** where possible, driven by a **factor type** parameter (e.g. `"SMS"` vs `"WHATSAPP"`).
   - Make sure the **state machine** or flow steps for WhatsApp match SMS:
     - Register device
     - Send OTP
     - Enter OTP
     - Handle success/fail/lock/limit
   - Keep all **SMS behavior intact**; do not refactor in a way that breaks SMS.

3. **UI parity**

   - Wherever the UI shows SMS as an MFA option:
     - Add WhatsApp side-by-side, **only if the environment/policy says it’s available**.
   - The WhatsApp UX should:
     - Use the same forms and layout as SMS (phone input, OTP input).
     - Use the same loading spinners, error banners, and success messages pattern.
     - Use the same logging and telemetry integration.

---

## 4. Backend: PingOne MFA Device APIs

### 4.1. Create WhatsApp MFA device

Locate the code that creates SMS MFA devices. It likely calls:

```http
POST /v1/environments/{environmentId}/users/{userId}/devices
```

with something like:

```json
{
  "type": "SMS",
  "phone": {
    "number": "...",
    "countryCode": "..."
  },
  "policy": {
    "id": "..."
  }
}
```

For WhatsApp, you should:

- Add a sibling path that uses:

  ```json
  {
    "type": "WHATSAPP",
    ... // same shape for phone/object fields as SMS, as defined by PingOne docs
  }
  ```

- Use the **same validation logic** for the phone number as SMS.
- Use the **same policy selection** (or a specific MFA policy ID if configured for WhatsApp).
- Handle the returned device in the same way as SMS:
  - Save `deviceId`
  - Respect `status` (e.g. `ACTIVATION_REQUIRED`, `ACTIVE`)
  - Surface errors to the UI.

### 4.2. OTP / device-auth flows

Anywhere the code initiates **SMS MFA authentication** using PingOne MFA:

- Add parallel support for `WHATSAPP`.
- Ensure:
  - Correct device is selected (WhatsApp device ID).
  - OTP is triggered by PingOne, not by calling WhatsApp/Meta directly.
  - OTP verification endpoint is the same type of MFA device authentication endpoint you use for SMS, just pointing at the WhatsApp device.

---

## 5. WhatsApp Credentials: *Only in PingOne*, Not This App

The project previously used variables like:

- `WTS_APP_ACCOUNT_BUSINESS_ID`
- `WTS_USER_ACCESS_TOKEN`
- `WTS_APP_ID`
- `WTS_APP_SECRET`

You MUST treat these as **WhatsApp Cloud API credentials** that belong **inside PingOne sender configuration**, not in this app’s runtime MFA logic.

Rules:

1. **Do not** send WhatsApp messages directly from this app to Meta/WhatsApp for MFA OTP.
2. It is acceptable to keep these values only if this app has an admin tool that helps configure PingOne sender settings, but:
   - They must come from `.env` / `settings.json` or secure config.
   - They must never be logged or exposed in the UI unmasked.
3. If there is any code path where the MFA flow calls **WhatsApp APIs directly** for OTP:
   - Remove or disable that path for MFA.
   - Replace it with the PingOne MFA WhatsApp path.

PingOne is the system that uses WhatsApp sender; this app just calls PingOne MFA.

---

## 6. Logging & Hardening (WhatsApp-specific)

Use the unified logging patterns from `cursor-optimized.md` plus a WhatsApp-specific module tag:

- Module tag: `[📲 WHATSAPP-MFA]`

Every meaningful step in the WhatsApp MFA lifecycle should log:

- When a WhatsApp device is created.
- When a WhatsApp OTP is requested.
- When OTP validation succeeds/fails.
- When PingOne returns an error (with HTTP status and error code).

Logging rules:

- Include date, time, module tag, severity, and compact message.
- Never log secrets (WhatsApp credentials, full phone numbers; mask phone if needed).
- Integrate with the **UI Logging Page** and console logging in the same way as SMS.

---

## 7. Do Not Break Other Flows

This is critical:

> **DO NOT break any existing flow (SMS, Email, FIDO2, AuthZ flows, etc.).**

Concrete rules:

1. Prefer **additive** changes:
   - Add new `case "WHATSAPP"` branches rather than altering existing `case "SMS"` logic.
   - If you factor out shared logic, ensure existing SMS path is fully covered by tests.

2. Run / preserve existing tests:
   - Any tests for SMS MFA must still pass.
   - If snapshot tests exist for MFA UI, update them carefully, only to include new WhatsApp option where expected.

3. Feature isolation:
   - If needed, you can guard WhatsApp-specific UX behind a flag like `enableWhatsAppMFA` that defaults to **off**, but when it’s on, everything must still work for SMS and other methods.

---

## 8. Testing & Verification Plan

Add or update tests and documentation so a developer can validate WhatsApp MFA quickly:

1. **Backend tests**
   - Create WhatsApp device:
     - With valid phone → success, `type = "WHATSAPP"`.
     - With missing/invalid phone → proper validation error.
   - OTP flow:
     - Ensure we call PingOne MFA endpoints, not WhatsApp APIs directly.
     - Check error handling on PingOne failures.

2. **UI/manual verification**
   - From the MFA UI:
     - WhatsApp appears as an option along with SMS (when environment says it’s available).
     - Registration flow for WhatsApp mirrors SMS.
     - Authentication via WhatsApp works end-to-end (PingOne sends the WhatsApp message; user enters OTP; MFA completes).
   - Confirm that no existing SMS, Email, or FIDO2 flows regress.

3. **Documentation comments**
   - In the main WhatsApp integration file(s), add a short header comment explaining:
     - WhatsApp is implemented as an SMS-like MFA factor via PingOne MFA with `type = "WHATSAPP"`.
     - All outbound WhatsApp messages are sent by PingOne using its configured sender.
     - Where to configure WhatsApp in PingOne and in `.env` / `settings.json`.

---

## 9. Final Deliverable

Produce:

- Updated backend code:
  - WhatsApp MFA device creation & OTP flows that mirror SMS.
- Updated frontend code:
  - WhatsApp option in MFA UI that behaves exactly like SMS UX with correct labeling.
- Logging & config:
  - `[📲 WHATSAPP-MFA]` logs.
  - No exposed secrets.
- Zero regressions:
  - All existing MFA and auth flows remain functional.
