
# AI Prompt: Implement Standard PingOne MFA with Registered Devices (Phase 1 – “Now”)

You are implementing **PingOne MFA** for an app that already uses **PingOne SSO**.  
In this phase, we want the **standard, PingOne-managed MFA device model**, where:

- Phone numbers / emails / MFA devices are stored as **MFA devices in PingOne**.
- We use **registered MFA device IDs** (`selectedDevice.id`) when we perform MFA at login.
- We do **not** use the “one-time” device pattern yet (`selectedDevice.oneTime` is Phase 2).

Follow this spec exactly and do not invent endpoints or flows.

---

## 1. High-Level Goals (Phase 1)

1. Use **PingOne Platform** to manage MFA devices for users:
   - List devices
   - Create SMS/email/etc. devices
   - Activate them with OTP

2. At login, use **MFA Device Authentication** with a **registered device ID**:
   - Initialize Device Authentication (this sends the OTP)
   - Validate OTP via the proper “otp check” operation for that `deviceAuthenticationId`

3. Keep everything aligned with the existing PingOne structure from `master-sms2.md`:
   - Clear separation of:
     - `SSO token` (as/token)
     - `Mgmt/MFA device` (Platform device endpoints)
     - `MFA device authentication` (deviceAuthentications endpoints)

---

## 2. API Primitives You Must Use

### 2.1 SSO Token (Worker / M2M)

**Category:** `SSO token`

Use OAuth2 client_credentials to obtain a worker token for PingOne API:

```bash
POST https://auth.pingone.com/{ENV_ID}/as/token
```

- Scopes must include the **PingOne API** device + user scopes as defined in `mfascopes.md`:
  - `p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device p1:delete:device`
- Wrap this in a `PingOneTokenClient` (as already described in other docs).

### 2.2 Device Management (Registration)

**Category:** `Mgmt/MFA device`

Use the PingOne Platform API to manage devices under:

```text
https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices
```

You MUST implement the following calls:

1. **List devices for user**

   ```bash
   GET /v1/environments/{ENV_ID}/users/{USER_ID}/devices
   ```

2. **Create MFA device (e.g. SMS)**

   ```bash
   POST /v1/environments/{ENV_ID}/users/{USER_ID}/devices
   ```

   - For SMS:
     - `type = "SMS"`
     - Provide phone number field as per PingOne docs/Postman for your tenant.

3. **Activate device with OTP**

   ```bash
   POST /v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/activate
   ```

   - Body must include the `otp` the user enters.

> AI RULE: For each of these calls, use **exact URL and JSON shape** from PingOne Platform docs / Postman.  
> If something is unclear (e.g., exact JSON body), insert a `// TODO` referencing the docs, do not guess field names.

### 2.3 Device Authentication (Login-Time MFA)

**Category:** `MFA device authentication`

This phase uses **registered device IDs**:

```json
"selectedDevice": {
  "id": "{{mfaDeviceId}}"
}
```

Do **not** use `selectedDevice.oneTime` here.

Implement calls against the `deviceAuthentications` resource as per PingOne MFA docs / Postman.

You MUST implement:

1. **Initialize Device Authentication (registered device)**

   - Endpoint: `POST {{authPath}}/{{ENV_ID}}/deviceAuthentications`
   - Body includes at minimum:
     - `user.id`
     - `selectedDevice.id` (ID of the registered MFA device in PingOne)
     - Optional: device authentication `policy.id` if required for your config

   - This call:
     - Creates the deviceAuthentication
     - Triggers the OTP to be sent via the configured Notification policy
     - Returns:
       - `id` (deviceAuthenticationId)
       - `status` (e.g., `OTP_REQUIRED`)
       - `_links` (may include `otp.check`)

2. **Read Device Authentication Status**

   - Endpoint: documented `GET` for `deviceAuthentications/{id}`
   - Use it if you want to poll for status, or to debug.

3. **Validate OTP (Device Authentication OTP Check)**

   - Endpoint: use the documented `otp.check` operation for that `deviceAuthenticationId`.
   - Body includes the OTP the user typed (field name from docs/Postman, e.g. `otp` / `passcode`).

> AI RULE: Do not invent `/otp`, `/passcode`, or `/verify` URLs.  
> Instead:
> - Follow the `otp.check` link in `_links` from the initialize response OR  
> - Copy the exact URL and body from the PingOne MFA v1 docs and Postman “Validate OTP” request.

---

## 3. Registration Flow (Phase 1 – Standard Device Model)

Implement the following flow for **first-time registration or when no active MFA device exists**:

1. **After primary auth**, derive `USER_ID` from ID token / SSO context.
2. Call `GET /users/{USER_ID}/devices`:
   - If there is an `ACTIVE` SMS/email/etc. device → skip to authentication flow.
   - Else → continue registration.
3. Show “Add SMS Device” form:
   - Collect phone number and optional nickname.
4. Call `POST /users/{USER_ID}/devices` with `type = "SMS"` and the phone.
5. PingOne creates the device (likely `ACTIVATION_REQUIRED`) and sends an activation OTP.
6. Show “Confirm SMS Device (Enter OTP)” form:
   - User enters the OTP.
7. Call `POST /users/{USER_ID}/devices/{DEVICE_ID}/operations/activate` with OTP.
8. On success, device becomes `ACTIVE`.

Keep all logic for these operations inside `PingOneMfaDeviceService` (or equivalent) so the UI stays simple.

---

## 4. Login-Time MFA Flow (Phase 1 – Standard Device Model)

At login time (after primary SSO):

1. **Decide if MFA is required** (via policy/user flags).
2. If needed, determine which device to use:
   - Either auto-pick the preferred SMS device
   - Or show a selection UI (list devices from `GET /users/{USER_ID}/devices`).
3. When you have a chosen device ID (`mfaDeviceId`), call **Initialize Device Authentication**:

   ```json
   {
     "user": { "id": "{{USER_ID}}" },
     "selectedDevice": { "id": "{{mfaDeviceId}}" },
     "policy": { "id": "{{deviceAuthPolicyId}}" } // if required
   }
   ```

4. PingOne sends the OTP and returns `deviceAuthenticationId` with `status` like `OTP_REQUIRED`.
5. Show “Enter SMS Code” form:
   - User enters OTP.
6. Call the MFA **OTP check** operation for that `deviceAuthenticationId`.
7. On success, treat MFA as satisfied and complete the login.

---

## 5. Implementation Rules for AI (Cursor/Windsurf)

When generating or updating code for Phase 1:

1. **Do NOT use `selectedDevice.oneTime`** in this phase.  
   - Only `selectedDevice.id` with a real PingOne MFA device ID.

2. **Respect the existing service boundaries:**
   - `PingOneTokenClient` → SSO token
   - `PingOneMfaDeviceService` → Platform MFA device endpoints
   - `PingOneMfaAuthService` → MFA Device Authentication endpoints

3. **Do NOT invent endpoints.**
   - If path/body not in `master-sms2.md`, mark with:
     - `// TODO: Fill in exact PingOne MFA v1 URL and request body from pingone/mfa/v1/api docs`

4. **Do NOT break existing flows.**
   - Keep the registration vs authentication distinction.
   - Keep forms and steps explicit.

This file is ONLY for the **standard PingOne-managed MFA device model** (Phase 1).  
Do not implement the one-time device pattern here – that is Phase 2 and has its own spec.
