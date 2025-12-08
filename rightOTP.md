# Cursor Task – Implement Correct OTP Send, Activate, Resend, and Device Status Handling for PingOne MFA Devices
#
# Updated to reflect PingOne behavior:
# - If status = "ACTIVE", device is active immediately.
# - If status = "ACTIVATION_REQUIRED", PingOne returns a device.activate URI.
# - If device.activate is missing, that double-confirms the device is ACTIVE (no next step).
#
# This update clarifies how PingOne APIs behave and ensures the UI + controller follow the correct branching logic.

## Goal

Align the app’s **Email and SMS MFA flows** with the **correct PingOne MFA device APIs** for:

- Device creation
- OTP-triggering when `"status": "ACTIVATION_REQUIRED"`
- OTP activation using the **device.activate URI returned by PingOne**
- **Resend OTP** for an existing device
- Correct inference of ACTIVE devices (based on `status === "ACTIVE"` and/or missing activation link)

This applies to both **EMAIL** and **SMS** device types.

---

## 1. Device Creation in PingOne – Behavior Summary

### Endpoint

```
{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices
```

### JSON bodies

EMAIL device example:

```json
{
  "type": "EMAIL",
  "email": "cmuir@pingone.com",
  "status": "ACTIVATION_REQUIRED",
  "nickname": "My email",
  "policy": {
    "id": "{{deviceAuthenticationPolicyID}}"
  }
}
```

SMS device example (same pattern, user gives phone number):

```json
{
  "type": "SMS",
  "phone": "+12125551234",
  "status": "ACTIVATION_REQUIRED",
  "nickname": "My SMS",
  "policy": {
    "id": "{{deviceAuthenticationPolicyID}}"
  }
}
```

### Rule summary

- `type` determines transport (EMAIL or SMS).
- User must provide **email** or **phone** based on type.
- UI must always ask for:
  - Nickname
  - Policy dropdown
  - Status selection (`ACTIVE` vs `ACTIVATION_REQUIRED`)

---

## 2. Understanding PingOne Status Behavior (IMPORTANT)

### If `"status": "ACTIVE"` was sent:

- PingOne **creates the device as ACTIVE immediately**.
- The response usually **does NOT contain a `device.activate` link**, because there is no next step.
- This is expected and correct.
- Your app must:
  - Treat the device as ACTIVE immediately.
  - Show success.
  - Not show an OTP step.

### If `"status": "ACTIVATION_REQUIRED"` was sent:

- PingOne sends an OTP to the Email/SMS channel.
- PingOne returns a **`device.activate` URI** in the response (usually in `_links`).
- This URI must be used to perform OTP activation.

### Double-check logic

PingOne already tells us the status:

- If we sent `"ACTIVE"` → device is ACTIVE.
- If we sent `"ACTIVATION_REQUIRED"` → device requires OTP.

But **as a second sanity check**, the API structure also helps:

- If **device.activate URI exists** → an activation step exists.
- If **device.activate URI is missing** → device is ACTIVE.

These two always align because PingOne’s API is consistent.

Your flow must check both:
1. What status we sent.
2. Whether PingOne returned a device.activate link.

The absence of a device.activate link is your confirmation that the device is ready and ACTIVE.

---

## 3. OTP Activation Using device.activate

When `"status": "ACTIVATION_REQUIRED"`:

1. Device creation returns an activation link:
   ```
   response._links["device.activate"].href
   ```
2. Store this URI in state (`deviceActivateUri`).
3. Show OTP input UI.
4. When user submits the OTP, call:

### Endpoint

Use the **exact** activation URI returned by PingOne. Do not construct your own.

### Headers

```
Content-Type: application/vnd.pingidentity.device.activate+json
```

### Body

```json
{ "otp": "<userEnteredCode>" }
```

Success → Device is now ACTIVE.

Failure → Show error, allow retry or resend.

---

## 4. Resend OTP

Resend is tied to the same device. Do **not** create a new device.

Use PingOne’s documented resend behavior, which uses the same device endpoint:

```
{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}
```

Wire this to the “Resend OTP” button.

---

## 5. Updated Flow Logic (Email & SMS)

### Step 1 — Ask user:

- Email or phone
- Nickname
- Policy (dropdown)
- **Status selection:**
  - ACTIVE
  - ACTIVATION_REQUIRED

### Step 2 — Device creation

- Build JSON body
- POST to `/devices`
- Save:
  - deviceId
  - deviceActivateUri (if provided)

### Step 3 — Branch:

#### A. If user selected `"ACTIVE"`  
OR  
#### B. If PingOne returned **no `device.activate` URI**

→ **Device is ACTIVE. Show success. No OTP required.**

#### C. If `device.activate` URI is present (ACTIVATION_REQUIRED)

→ Show OTP modal / step:
   - OTP input
   - Verify OTP (calls `device.activate` URI)
   - Resend OTP

---

## 6. Acceptance Criteria

You are done when:

- Device creation follows correct PingOne JSON structure.
- Status selector is implemented in UI.
- `device.activate` URI is used for OTP verification.
- If `device.activate` is missing, device is treated as ACTIVE.
- Resend works for Email and SMS.
- No regressions in other MFA flows.
- TypeScript compiles cleanly.

Use this updated `rightOTP.md` file in Cursor to fully wire Email + SMS MFA with correct PingOne activation behavior and correct ACTIVE-detection logic.
