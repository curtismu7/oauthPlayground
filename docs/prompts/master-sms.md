
# PingOne MFA – SMS Registration & Authentication (Master Reference)

This document is a **master reference for SMS-based PingOne MFA flows** that you can give to Cursor / Windsurf.
It focuses on **two major flows**:

1. **Registration (enrollment) of an SMS MFA device**
2. **Authentication (runtime MFA) using Device Authentication with SMS OTP**

All examples assume:

- You have a **PingOne Environment ID** (`ENV_ID`)
- You have a **Worker / Machine-to-Machine app** with `CLIENT_ID` and `CLIENT_SECRET`
- You are using **client credentials** to obtain an access token
- You know the **PingOne user ID** (`USER_ID`) and **MFA policy ID** (`MFA_POLICY_ID`)
- You know the **Device Authentication Policy ID** (`DEVICE_AUTH_POLICY_ID`) for login-time MFA

> ⚠️ Always verify scopes and exact field names in your PingOne Platform API / Postman collection for your tenant.
> This document is designed to be *prescriptive* and *close to the docs*, but your environment or versions may differ.

---

## 0. Get a Worker Access Token

All subsequent calls require a PingOne access token (Worker / M2M app). Use client credentials flow:

```bash
curl -X POST   "https://auth.pingone.com/{ENV_ID}/as/token"   -H "Content-Type: application/x-www-form-urlencoded"   -u "{CLIENT_ID}:{CLIENT_SECRET}"   -d "grant_type=client_credentials&scope=p1:read:users p1:update:users"
```

Response (simplified):

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Use this `access_token` in all API calls below:

```http
Authorization: Bearer {ACCESS_TOKEN}
```

---

## 1. SMS Device Registration Flow

### 1.1 Sequence Overview

**Goal:** User has no SMS MFA device yet; we create and activate one.

High-level steps:

1. **Check existing devices** for the user.
2. If none, **create an SMS device** in `ACTIVATION_REQUIRED` state.
3. PingOne sends an OTP via SMS according to **MFA policies + notification policies**.
4. User enters OTP in your app.
5. Your app calls **Activate MFA User Device** with the OTP.
6. Device moves to **ACTIVE** state and can now be used for login-time MFA.

You typically run this flow immediately after primary authentication (e.g., OIDC Authorization Code flow) when you detect that the user has no active MFA devices.

---

### 1.2 Read Existing Devices for the User (Optional but Recommended)

```bash
curl -X GET   "https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Accept: application/json"
```

You’ll get a `_embedded.devices` list. If there are **no active SMS devices** (or no devices at all), branch into the registration flow.

---

### 1.3 Create an SMS MFA Device

Use the **Create MFA User Device** endpoint to define the user’s SMS device.

```bash
curl -X POST   "https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "type": "SMS",
    "phone": "+15551234567",
    "nickname": "Primary phone",
    "policy": {
      "id": "MFA_POLICY_ID"
    },
    "status": "ACTIVATION_REQUIRED",
    "notification": {
      "title": "Pair your SMS device",
      "body": "Use the code we just sent to complete MFA registration."
    }
  }'
```

Important fields:

- `type`: `"SMS"` for SMS-based MFA.
- `phone`: E.164 formatted phone number for the user.
- `policy.id`: The MFA policy that defines how SMS OTP should behave.
- `status`: `"ACTIVATION_REQUIRED"` indicates we still need to verify an OTP.
- `notification`: Optional customization for pairing / activation messages.

The response will look roughly like:

```json
{
  "id": "DEVICE_ID",
  "type": "SMS",
  "status": "ACTIVATION_REQUIRED",
  "phone": "+15551234567",
  "policy": { "id": "MFA_POLICY_ID" },
  "_links": { ... }
}
```

At this point, PingOne will have triggered an initial OTP SMS (based on your policy / notification configuration).

---

### 1.4 Activate the SMS Device with OTP

Once the user receives the OTP via SMS, they type it into your UI.

Your backend then calls **Activate MFA User Device**:

```bash
curl -X POST   "https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/activate"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "otp": "123456"
  }'
```

Notes:

- `otp`: The one-time passcode sent via SMS to the user.
- This endpoint is also used for other device types (TOTP, OATH tokens, FIDO), but for SMS we primarily send `otp`.

Response (simplified):

```json
{
  "id": "DEVICE_ID",
  "type": "SMS",
  "status": "ACTIVE",
  "phone": "+15551234567"
}
```

When `status` is `"ACTIVE"`, registration is complete.

---

### 1.5 Optional: Resend Pairing OTP

If the user does not receive the SMS OTP or it expires, you can call the **Resend** operation:

```bash
curl -X POST   "https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/resend"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Content-Type: application/json"
```

This will trigger a new OTP message according to your MFA and notification policies.

---

### 1.6 Optional: Set Device Order / Default Device

If a user has multiple devices, you can control the order they are considered in MFA challenges (and which is default) via **Set Device Order**:

```bash
curl -X POST   "https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices/operations/order"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "order": [
      { "id": "PRIMARY_SMS_DEVICE_ID" },
      { "id": "OTHER_DEVICE_ID" }
    ]
  }'
```

Your UI can expose this as a “preferred MFA method” selector.

---

## 2. SMS Device Authentication (Login-Time MFA)

Once SMS devices are registered and active, you use **MFA Device Authentications** to perform MFA during login.

At a high level:

1. User completes **primary authentication** (username/password, Web SSO, etc.).
2. Your app starts a **Device Authentication** event bound to the user and a **Device Authentication Policy**.
3. PingOne sends an OTP SMS (or uses your selected device/method).
4. The user enters the OTP in your app.
5. Your app calls **Device Passcode** with the OTP and the `deviceAuthenticationId`.
6. If the device authentication status is success, MFA is satisfied.

---

### 2.1 Create Device Authentication (Start MFA)

This uses the **auth** host:

```bash
curl -X POST   "https://auth.pingone.com/{ENV_ID}/deviceAuthentications"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "user": { "id": "'"${USER_ID}"'" },
    "policy": { "id": "'"${DEVICE_AUTH_POLICY_ID}"'" },
    "device": { "id": "'"${DEVICE_ID}"'" }
  }'
```

Key fields:

- `user.id`: The PingOne user ID you authenticated.
- `policy.id`: The **device authentication policy** that describes MFA behavior (methods allowed, fallback, remember device, etc.).
- `device.id` (optional): The specific SMS device to use. If omitted, policy logic and device selection rules decide.

Response (simplified):

```json
{
  "id": "DEVICE_AUTHENTICATION_ID",
  "status": "OTP_REQUIRED",
  "user": { "id": "USER_ID" },
  "device": { "id": "DEVICE_ID", "type": "SMS" },
  "_links": { ... }
}
```

For SMS, you typically expect `status` to be something like `OTP_REQUIRED` after creation, which tells your app to prompt for an OTP code.

---

### 2.2 Device Selection (If User Has Multiple Devices)

If you do **not** send `device.id` in the Create Device Authentication request, PingOne may expect you to select a device.

Use the **Device Selection** operation to choose the SMS device:

```bash
curl -X POST   "https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/selection"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "device": { "id": "'"${DEVICE_ID}"'" }
  }'
```

The response will be an updated `deviceAuthentication` object, typically with `status` moved into an OTP-required state and the SMS OTP sent according to policy.

---

### 2.3 Verify SMS OTP – Device Passcode

Once the user receives the SMS OTP and enters it in your UI, verify it using **Device Passcode**.

```bash
curl -X POST   "https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/passcode"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "otp": "'"${OTP_FROM_USER}"'",
    "deviceAuthenticationId": "'"${DEVICE_AUTHENTICATION_ID}"'"
  }'
```

Important:

- `otp`: The SMS OTP the user typed in.
- `deviceAuthenticationId`: The ID returned by Create Device Authentication.

Response (simplified):

```json
{
  "id": "DEVICE_AUTHENTICATION_ID",
  "status": "VERIFIED",
  "user": { "id": "USER_ID" },
  "device": { "id": "DEVICE_ID", "type": "SMS" }
}
```

Once status is a success state (`VERIFIED`, `COMPLETED`, etc.—check docs for your method), you treat MFA as satisfied and allow the session to continue.

---

### 2.4 Polling or Status Check (Optional)

In more complex scenarios (e.g., mixed MFA methods), you might poll the device authentication resource to check status:

```bash
curl -X GET   "https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}"   -H "Authorization: Bearer {ACCESS_TOKEN}"   -H "Accept: application/json"
```

You can use this if you build a generic “MFA challenge in progress” page that updates status periodically.

---

## 3. Putting It Together in a Login Flow

### 3.1 Combined Flow: Primary Auth + SMS MFA

**After primary auth (e.g., OIDC Authorization Code):**

1. App receives tokens (or ID token) from PingOne.
2. Backend extracts `USER_ID` from the ID token `sub` claim.
3. Backend checks if user has active SMS devices:
   - `GET /v1/environments/{ENV_ID}/users/{USER_ID}/devices`
   - If no active devices → **run registration flow** (Section 1).
4. If active SMS device exists → **run authentication flow** (Section 2):
   - `POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications`
   - Prompt user for OTP if `status == OTP_REQUIRED`.
   - Verify via `POST .../passcode`.
   - On success → establish application session and allow access.

### 3.2 UX Guidelines

- Show **clear states**:
  - “We’re sending you an SMS code”
  - “Enter the 6-digit code we sent to +1•••-•••-34567”
  - “Resend code” (mapped to `/operations/resend`).
- Provide **error handling**:
  - OTP expired → show “Code expired, resend?”
  - Wrong OTP → show “Wrong code, try again” and maybe limit attempts.
- Consider **remember device** patterns using PingOne’s device policies, so users don’t get SMS every single login.

---

## 4. Implementation Notes for Cursor / Windsurf

When you feed this to an AI coding assistant:

- Keep a single **PingOne API client module** that wraps:
  - `GET /users/{userId}/devices`
  - `POST /users/{userId}/devices`
  - `POST /users/{userId}/devices/{deviceId}/operations/activate`
  - `POST /users/{userId}/devices/{deviceId}/operations/resend`
  - `POST /users/{userId}/devices/operations/order`
  - `POST https://auth.pingone.com/{envId}/deviceAuthentications`
  - `POST .../deviceAuthentications/{id}/selection`
  - `POST .../deviceAuthentications/{id}/passcode`
  - `GET .../deviceAuthentications/{id}`
- Build a clear **stepper / state machine** in the UI that:
  - Knows when it’s in registration vs authentication mode
  - Knows when it’s waiting for OTP vs verifying OTP vs done
- Make **policies (MFA + Device Authentication)** configurable:
  - Pass them as ENV variables or config objects
  - Don’t hard-code IDs if you can avoid it

This keeps your MFA implementation predictable, testable, and aligned with PingOne’s official model.
