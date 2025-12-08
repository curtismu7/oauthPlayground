# PingOne MFA – TOTP (Authenticator App) Registration & Authentication (API‑accurate, QR‑code ready)

**Goal for Cursor/Windsurf:**  
Implement TOTP (authenticator app) registration and authentication flows using **only** documented PingOne MFA endpoints. Include:
- Correct API ordering
- Clear separation between **device management** vs **MFA device authentication** vs **SSO / tokens**
- A great UX with QR code + OTP modals
- No invented subpaths or operations

---

## 0. Endpoint families & tags

We only use endpoints that appear in the PingOne MFA / Platform docs and Postman collections.

- **Mgmt / MFA device (PingOne Platform):**
  - `{{apiPath}}/environments/{{envID}}/users/{{userID}}/mfaEnabled`
  - `{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices`
  - `{{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}`

- **MFA device authentication (PingOne MFA):**
  - `{{authPath}}/{{envID}}/deviceAuthentications`
  - `{{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}`

- **SSO / token (PingOne SSO / authorize / token):**
  - Not detailed here; this doc is strictly the **MFA TOTP** piece.

In PingOne MFA docs:
- `/devices` are the **MFA devices** API (TOTP, SMS, Email, FIDO2, etc.).
- `/deviceAuthentications` is the **MFA device authentication** API that drives OTP and device selection flows.
- TOTP devices have `secret` and `keyUri` properties, where `keyUri` is an `otpauth://totp/...` URI that you render as a QR code.

---

## 1. TOTP Registration (Authenticator App) – with QR code

### 1.0. Preconditions

1. **User exists** in PingOne (has `userID`).
2. User is **MFA-enabled** via the *Enable Users MFA* endpoint:

   - **Mgmt / MFA device**
   - **Endpoint**  
     `GET {{apiPath}}/environments/{{envID}}/users/{{userID}}/mfaEnabled`  
     `PUT {{apiPath}}/environments/{{envID}}/users/{{userID}}/mfaEnabled`
   - **Body (PUT example)**  
     ```jsonc
     {
       "mfaEnabled": true
     }
     ```

3. Environment has **PING_ONE_MFA** in BOM and TOTP enabled in relevant **MFA policy** (Device Authentication Policy > `totp.enabled = true`).

### 1.1. Create TOTP device (provisioning) – get `keyUri` for QR

- **Tag:** Mgmt / MFA device  
- **Endpoint:**  
  `POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices`  
- **Content-Type:** `application/json`

**Request body (example – TOTP device):**

```jsonc
{
  "type": "TOTP",
  "status": "ACTIVATION_REQUIRED",
  "nickname": "Authenticator App",
  "policy": {
    "id": "{{deviceAuthPolicyId}}",
    "type": "DEVICE_AUTHENTICATION_POLICY"
  }
}
```

**On success**, response includes at least:

```jsonc
{
  "id": "{{deviceID}}",
  "type": "TOTP",
  "status": "ACTIVATION_REQUIRED",
  "properties": {
    "secret": "BASE32SECRET...",
    "keyUri": "otpauth://totp/example:user@example.com?secret=BASE32SECRET..."
  }
}
```

Notes for Cursor:

- `status` must be `ACTIVATION_REQUIRED` so PingOne returns `secret` + `keyUri` for the TOTP device.
- `secret` and `keyUri` are **short‑lived** (docs say ~30 minutes). If they expire, you must **delete** the device and recreate it instead of trying to reuse old values.

### 1.2. UI – Render QR code + manual setup

In the UI, when you get the device creation response:

1. Grab `properties.keyUri` from the response.
2. Use a QR library (`qrcode`, `qrcode.react`, etc.) to render it as a QR image.
3. Also show a “manual setup” section with:
   - The issuer / account name (parsed from `keyUri`), and
   - The `secret` as a copyable string.

**UX requirements for the QR step:**

- Show QR prominently with:
  - Title: **“Scan this code with your authenticator app”**
  - Subtitle: **“Then enter the 6‑digit code to complete setup”**
- Provide **fallback**:
  - A “Can’t scan?” link that expands manual instructions (enter `account name`, `secret`, and choose 6‑digit / time‑based in the authenticator app).

### 1.3. User scans QR and gets OTP

User experience:
- User opens Google Authenticator / Authy / Microsoft Authenticator.
- Scans the QR.
- Sees a new entry with a rotating code (usually 6 digits every 30 seconds).

At this point, device is still `ACTIVATION_REQUIRED` on the PingOne side. You must **validate one OTP** to activate the device.

### 1.4. Activate MFA User Device (TOTP) – validate first OTP

- **Tag:** Mgmt / MFA device  
- **Endpoint:**  
  `POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}` (worker token with device scopes)
  - `Content-Type: application/vnd.pingidentity.device.activate+json`

- **Body (TOTP activation):**

  ```jsonc
  {
    "otp": "123456"   // code user reads from authenticator app
  }
  ```

On success:
- Response `200 OK`
- Device `status` changes from `ACTIVATION_REQUIRED` → `ACTIVE`.

Error behaviour (simplified):
- `INVALID_OTP` → show error in UI, let user try again (respect MFA policy’s `otp.failure.count`).
- `OTP_ATTEMPTS_LIMIT`/cool‑down → surface lockout message based on TOTP policy (`otp.failure.coolDown.*`).

### 1.5. Registration flow summary (for Cursor)

1. **Check/enable MFA for user**
   - `GET/PUT {{apiPath}}/environments/{{envID}}/users/{{userID}}/mfaEnabled`
2. **Create TOTP device in ACTIVATION_REQUIRED**
   - `POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices` with `type: "TOTP"`
3. **Render QR code and secret**
   - Use `properties.keyUri` to render QR.
   - Show manual `secret` as fallback.
4. **Prompt user for code (modal)**
   - Modal for the user to enter OTP from authenticator app.
5. **Activate device with OTP**
   - `POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}` with `Content-Type: application/vnd.pingidentity.device.activate+json` and `{ "otp": "123456" }`
6. **On success**, update UI to show device as **Active**.

---

## 2. TOTP Authentication Flow (OTP from authenticator app)

Here we assume:
- User already has **at least one ACTIVE TOTP device**.
- Device Authentication Policy for TOTP is configured (enabled, lockout thresholds, etc.).

PingOne MFA device authentication flow is driven by `/deviceAuthentications`:

- It returns a `status` that tells you the **next action**:
  - `DEVICE_SELECTION_REQUIRED` → you must call **Select Device for Authentication**.
  - `OTP_REQUIRED` → you must call **Validate OTP for Device**.
  - `ASSERTION_REQUIRED` → FIDO2 assertion (not used for TOTP).

### 2.1. Initialize Device Authentication (TOTP-capable session)

- **Tag:** MFA device authentication  
- **Endpoint:**  
  `POST {{authPath}}/{{envID}}/deviceAuthentications`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}` (worker with MFA auth scopes)
  - `Content-Type: application/json`

- **Body (basic username‑bound init):**

  ```jsonc
  {
    "user": {
      "id": "{{userID}}"
    }
  }
  ```

**Response (simplified example):**

```jsonc
{
  "id": "{{deviceAuthID}}",
  "status": "OTP_REQUIRED" | "DEVICE_SELECTION_REQUIRED",
  "_embedded": {
    "devices": [
      {
        "id": "dev-1",
        "type": "TOTP",
        "status": "ACTIVE",
        "isDefault": true
      },
      {
        "id": "dev-2",
        "type": "SMS",
        "status": "ACTIVE"
      }
    ]
  }
}
```

- If `status === "OTP_REQUIRED"` → you already have a chosen device (according to MFA policy and device order).
- If `status === "DEVICE_SELECTION_REQUIRED"` → you must ask the user which device to use, then call **Select Device for Authentication**.

### 2.2. Device selection step (if policy requires it)

If `status === "DEVICE_SELECTION_REQUIRED"`:

1. Show a list of eligible devices from `_embedded.devices`.
2. Let the user pick **Authenticator App (TOTP)** device.
3. Call **Select Device for Authentication**:

   - **Tag:** MFA device authentication  
   - **Endpoint:**  
     `POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}`
   - **Headers:**
     - `Content-Type: application/vnd.pingidentity.device.select+json`

   - **Body:**

     ```jsonc
     {
       "device": {
         "id": "{{deviceID_of_TOTP}}"
       }
     }
     ```

**Response:**

- For a TOTP device, status should now be `OTP_REQUIRED`.
- You can now safely show the “enter code from authenticator app” UI.

### 2.3. OTP capture – UI pattern

For `status === "OTP_REQUIRED"`:

- Show a **modal** (not a full page) that:

  - Clearly names the device: “Authenticator App (TOTP)” + nickname.
  - Has a 6‑digit code input with auto‑advance between fields.
  - Has a “Use a different method” link to go back to device picker (optional).

- When the user submits the OTP, call **Validate OTP for Device**.

### 2.4. Validate OTP for Device

- **Tag:** MFA device authentication  
- **Endpoint:**  
  `POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}`
- **Headers:**
  - `Authorization: Bearer {{accessToken}}`
  - `Content-Type: application/vnd.pingidentity.otp.check+json`

- **Body:**

  ```jsonc
  {
    "otp": "123456"
  }
  ```

Behaviour:

- On success, the MFA action completes (device authentication flow succeeds). Depending on how you’re using MFA, that might:
  - Mark the user as MFA‑verified for an SSO flow (Flow Manager / `flowId` path), **or**
  - Complete a stand‑alone MFA check in a custom app.
- On failure, check error details and map to friendly UI messages:
  - Invalid OTP → “That code doesn’t look right. Please try again.”
  - Too many failures (per TOTP policy) → show lockout duration from policy.

### 2.5. Authentication flow summary (for Cursor)

1. **Initialize MFA device authentication**
   - `POST {{authPath}}/{{envID}}/deviceAuthentications` with `user.id`.
2. **If `DEVICE_SELECTION_REQUIRED`**:
   - Show list of devices from `_embedded.devices`.
   - `POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}`  
     `Content-Type: application/vnd.pingidentity.device.select+json`  
     Body `{ "device": { "id": "{{deviceID_of_TOTP}}" } }`
3. **At `OTP_REQUIRED`**:
   - Show OTP modal (“Enter code from your authenticator app”).  
4. **Validate OTP**:
   - `POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}`  
     `Content-Type: application/vnd.pingidentity.otp.check+json`  
     Body `{ "otp": "123456" }`
5. **On success**, proceed with whatever SSO / resource access logic the app is using.

---

## 3. UX guidelines specific to TOTP (Authenticator App)

Cursor should treat these as UX requirements, not suggestions:

1. **Registration – QR page**
   - Single clean page/card:
     - Left: instructions and QR.
     - Right: manual code, “Having trouble?” FAQ, and a preview of what the authenticator app looks like.
   - Show a **countdown** if you want to surface the 30‑minute `secret/keyUri` expiry window.

2. **Registration – OTP modal**
   - After scanning QR, show OTP modal (dialog) instead of a new page.
   - Clearly say “Enter the 6‑digit code from your authenticator app”.
   - Allow resending / regenerating device (by deleting and re‑creating TOTP device) if expired.

3. **Authentication – OTP modal**
   - Always use a **small modal** over the existing page.
   - Include device nickname and type (“Authenticator app on iPhone” if you have that metadata).

4. **Error states**
   - Invalid OTP: generic “That code doesn’t look right. Double‑check and try again.”
   - Lockout: “Too many incorrect attempts. Try again in X minutes.” where X is driven by the TOTP policy (`otp.failure.coolDown.*`).

---

## 4. How this fits into the bigger flow

- **Device registration** is purely **Mgmt / MFA device** (`/devices`, `/mfaEnabled`).
- **Authentication** is purely **MFA device authentication** (`/deviceAuthentications` + actions via Content‑Type).
- **SSO / tokens** (authorization code, etc.) live in PingOne SSO (`/as/authorize`, `/as/token`) and aren’t duplicated here.

Cursor should keep those concerns sharply separated in code:
- Device creation + activation = “MFA Device Management” service.
- OTP validation = “MFA Device Authentication” service.
- Tokens / login = “SSO / OAuth” service.

Use this doc as the **TOTP reference** next to `fido2.md` so each device type is implemented with the correct PingOne endpoints and a consistent UX.
