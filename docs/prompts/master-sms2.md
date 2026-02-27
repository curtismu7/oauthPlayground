
# PingOne MFA – SMS Registration & Authentication (Master Reference v2)

This is **master-sms2.md** – a consolidated, corrected reference for **PingOne MFA over SMS**, combining:
- Verified endpoints from PingOne **Platform** and **Auth** docs
- Clear separation between:
  - **SSO token** (how we get a worker access token)
  - **Mgmt/MFA device** (user device registration & lifecycle)
  - **MFA device authentication** (login-time MFA challenges)
- Practical flow guidance suitable for use in Cursor/Windsurf prompts

> IMPORTANT: For any endpoint that is not explicitly shown here, **do not invent paths**. Instead, copy the exact URL, method, and JSON body from the official PingOne docs or Postman collection for your tenant (especially the `pingone/mfa/v1/api` pages and the “MFA Device Authentications” folder).

---

## 0. Categories and Terminology

To avoid confusion between PingOne SSO and PingOne MFA, treat all PingOne calls as belonging to one of these categories:

1. **SSO token**  
   - OAuth 2.0 / OIDC token endpoints on `auth.pingone.com`.  
   - Used to obtain access tokens for worker / M2M apps.

2. **Mgmt/MFA device**  
   - PingOne **Platform** endpoints on `api.pingone.com` under `/v1/environments/{envId}/...`.  
   - Used to manage MFA devices on users (create, activate, list, order, etc.) and MFA-related policies.

3. **MFA device authentication**  
   - PingOne MFA layer for **runtime** device authentication (OTP, FIDO, push, etc.).  
   - The docs and Postman collection use a `deviceAuthentications` resource for:
     - Initializing an MFA challenge
     - Reading status
     - Cancelling an in-progress MFA challenge
     - Validating OTP or other assertions

The **flows** in this document always follow this pattern:

- Use **SSO token** once to get an access token
- Use **Mgmt/MFA device** calls to register/manage SMS devices
- Use **MFA device authentication** calls to perform MFA at login time

---

## 1. SSO Token – Worker Access Token

**Category:** `SSO token`

All Platform / MFA calls require an access token. Use client credentials with your Worker app on `auth.pingone.com`:

```bash
POST https://auth.pingone.com/{ENV_ID}/as/token
```

Example (client credentials):

```bash
curl -X POST "https://auth.pingone.com/${ENV_ID}/as/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "grant_type=client_credentials"   -d "client_id=${CLIENT_ID}"   -d "client_secret=${CLIENT_SECRET}"   -d "scope=p1:read:user p1:update:user"
```

The response contains an `access_token` (Bearer). Use that token in the `Authorization` header for all of the endpoints below:

```http
Authorization: Bearer {ACCESS_TOKEN}
```

You can add more scopes as needed (for example, to manage devices and policies). Keep scope lists minimal and explicit.

---

## 2. MFA Device Management (SMS)

**Category:** `Mgmt/MFA device`

These endpoints live on the **Platform** base:

```text
https://api.pingone.com/v1/environments/{ENV_ID}/...
```

They are about **device objects** (registration and lifecycle), not runtime OTP verification.

### 2.1 List Devices for a User

Use this to check whether a user already has any MFA devices (SMS or otherwise).

```bash
GET https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices
```

Example:

```bash
curl -X GET   "https://api.pingone.com/v1/environments/${ENV_ID}/users/${USER_ID}/devices"   -H "Authorization: Bearer ${ACCESS_TOKEN}"   -H "Accept: application/json"
```

Typical use:

- After primary authentication, read devices for the user.
- If no suitable SMS device exists → branch into **registration**.
- If at least one active SMS device exists → branch into **authentication**.

---

### 2.2 Create an SMS MFA Device

Use the **Create MFA User Device** endpoint to associate an SMS device with a user.

```bash
POST https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices
```

Example SMS request (shape may vary slightly by tenant; always confirm with your docs/Postman collection):

```bash
curl -X POST   "https://api.pingone.com/v1/environments/${ENV_ID}/users/${USER_ID}/devices"   -H "Authorization: Bearer ${ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "type": "SMS",
    "phone": {
      "number": "+15551234567"
    },
    "nickname": "Primary SMS device"
  }'
```

Response (simplified):

```json
{
  "id": "DEVICE_ID",
  "type": "SMS",
  "status": "ACTIVATION_REQUIRED",
  "phone": { "number": "+15551234567" }
}
```

Notes:

- `type`: `"SMS"` for SMS-based MFA. Other values (e.g., `EMAIL`, `WHATSAPP`, `TOTP`, `SECURITY_KEY`) use the same endpoint but different fields.
- `status`: Typically `"ACTIVATION_REQUIRED"` after creation for MFA devices that need OTP or similar to complete registration.

---

### 2.3 Activate MFA User Device (SMS)

After creating the device in `ACTIVATION_REQUIRED` state and sending an OTP to the user (driven by your MFA + notification policies), you must **activate** the device using the OTP the user supplies.

```bash
POST https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/activate
```

Example:

```bash
curl -X POST   "https://api.pingone.com/v1/environments/${ENV_ID}/users/${USER_ID}/devices/${DEVICE_ID}/operations/activate"   -H "Authorization: Bearer ${ACCESS_TOKEN}"   -H "Content-Type: application/json"   -d '{
    "otp": "123456"
  }'
```

Notes:

- `otp`: The one-time passcode sent to the user via SMS during the activation step.
- Same operation is used for other OTP-based device types; confirm the exact body for your device type in the docs/Postman collection.

On success, the device’s `status` becomes `"ACTIVE"`, and it can be used for MFA at login time.

---

### 2.4 Optional Management Operations (Resend, Order, etc.)

The Platform API also exposes additional device management operations, for example:

- **Resend pairing OTP** for a specific device  
- **Set device order** for a user’s devices (preferred/default device first)

These operations are documented in the PingOne Platform API under the MFA section. When using them in code or prompts:

- Always copy the **exact** URL and JSON body from the official docs or Postman.
- Tag them as `Mgmt/MFA device` in your own documentation so you don’t confuse them with login-time MFA challenges.

---


## 3. MFA Policies (Configuration & Selection)

**Category:** `Mgmt/MFA device` (policy configuration)

MFA **policies** are what actually define *how* PingOne MFA behaves:

- Which factors are allowed (SMS, Email, Mobile App, Security Key, etc.)
- Fallback order and behavior
- Timeouts, retry counts, “remember device” behavior
- Whether you’re authenticating an existing device vs a one-time device

Your app should **not** hard-code this logic. Instead, it should:

1. Read **MFA policies** from PingOne.
2. Let an admin (or advanced user) pick which MFA policy to use for:
   - Registration flows (if applicable)
   - Login-time MFA flows
3. Store the selected policy IDs in configuration, per environment / app / tenant.

### 3.1 Reading MFA Device Authentication Policies

PingOne exposes device authentication policies via the Platform API. The docs and Postman collection show:

```bash
GET https://api.pingone.com/v1/environments/{ENV_ID}/deviceAuthenticationPolicies
```

Usage:

- **Tag:** `Mgmt/MFA device`
- Use your Worker `ACCESS_TOKEN` from `as/token`.
- Response is a list of policies, each with:
  - `id`
  - `name`
  - `description`
  - Other policy metadata used by MFA flows

Your app should:

- Call this endpoint at startup (or on-demand) in an admin/settings UI.
- Cache the policy list for UI dropdowns.

> **AI Rule:** Do not invent other policy paths (create/update/delete). If you need those, fetch the exact `POST/PUT/PATCH/DELETE` URLs and bodies from the PingOne Platform API docs / Postman and add them explicitly with TODO comments.

### 3.2 Admin UI – “Select MFA Policy” Screen

To wire policies into your flows, build an admin-only screen that:

- Calls `GET /deviceAuthenticationPolicies`
- Shows:
  - Policy name
  - Description
  - Possibly flags like which factors are enabled
- Lets the admin choose:
  - A **default MFA policy** for login-time SMS MFA
  - Optionally, different policies by:
    - Application
    - Population
    - Environment (dev/test/prod)

Persist the selection in your **app config** (database, config file, or environment variables). For example:

- `PINGONE_MFA_DEVICE_AUTH_POLICY_ID` – used by the **MFA Device Authentication** service.
- Optionally, `PINGONE_MFA_REGISTRATION_POLICY_ID` if registration needs a distinct policy.

### 3.3 Hooking MFA Policy into Services

Once a policy is selected, your services should:

- **PingOneMfaDeviceService**  
  - Include policy IDs when creating or configuring devices if the docs specify that relationship.

- **PingOneMfaAuthService**  
  - Use the selected **Device Authentication Policy ID** when initializing MFA:
    - e.g. `initializeDeviceAuthentication(userId, policyId, deviceId?)`

**AI rule for Cursor/Windsurf:**

- When generating code for initializing MFA, **pass a policy ID parameter**, do not hard-code an ID inside the service.
- Read the policy ID from configuration / database where the admin UI stored it.
- If the policy ID is missing, fail fast with a clear error (e.g., “MFA policy not configured – contact administrator”).

### 3.4 Optional – Allow Per-User or Per-Population Policies

If you want more advanced behavior later:

- Allow different MFA policies based on:
  - User population
  - User attributes (risk level, role, group membership)
- Implement a simple resolver like:

```ts
function resolveMfaPolicyIdForUser(user: UserProfile): string {
  // Minimal version: return the global default from config.
  // Advanced version: branch based on user properties or population.
}
```

Cursor should keep this resolver logic **separate** from:

- The raw PingOne API client
- The UI forms

so you can evolve policy selection rules without touching the low-level PingOne integration.

---


## 3. MFA Device Authentication (Login-Time SMS MFA)

**Category:** `MFA device authentication`

These APIs are about **authenticating with an already-registered device**, especially during login flows. The relevant resource is named **`deviceAuthentications`**.

### 3.1 Device Authentication Resource (Conceptual)

The PingOne MFA docs and Postman collection describe a `deviceAuthentications` resource used for:

- **Initializing** a device authentication event (start MFA challenge)
- **Reading** the status (pending, OTP required, succeeded, failed, etc.)
- **Cancelling** an in-progress device authentication
- **Validating** OTP or other assertions (FIDO/WebAuthn, push, etc.)

Examples from docs and support articles show URL templates such as:

```text
{{authPath}}/{{ENV_ID}}/deviceAuthentications
{{authPath}}/{{ENV_ID}}/deviceAuthentications/{{DEVICE_AUTH_ID}}
```

Where:

- `authPath` is the base API URL for PingOne MFA (consult your PingOne MFA v1 docs).
- `DEVICE_AUTH_ID` is the ID returned when you initialize a device authentication.

> **CRITICAL RULE FOR IMPLEMENTATION**  
> Only use **concrete** paths and JSON bodies that you see in the official PingOne MFA v1 docs or the “MFA Device Authentications” Postman collection. This document intentionally does **not** invent subpaths (for example `/otp`, `/passcode`, `/assertion`, `/cancel`) – instead, it tells you *when* to call those operations in the flow, and you must copy the exact URLs from your docs.

### 3.2 Typical SMS MFA Authentication Flow

A simple login-time SMS MFA flow, combining everything above:

1. **Primary authentication (outside MFA scope)**  
   - User authenticates via PingOne SSO (OIDC/SAML, pi.flow, etc.).  
   - Your app ends up with a PingOne user ID (`USER_ID`).

2. **Decide if MFA is required**  
   - Use policies and/or user attributes to decide whether this login requires MFA.

3. **Initialize Device Authentication (MFA)**  
   - Call the **“Initialize Device Authentication”** operation described in the PingOne MFA docs (on the `deviceAuthentications` resource), passing:
     - `userId` (the PingOne user)
     - Device Authentication Policy ID (how MFA should behave)
     - Optionally, the specific SMS device ID and/or other parameters

   - The response contains a `deviceAuthenticationId` and a `status`.  
   - For SMS, the status often indicates that an OTP is required and an SMS has been sent (per policy).

4. **Prompt user for OTP**  
   - Show UI: “We sent a code to your phone ending in ••••567. Enter the code to continue.”  
   - Collect the OTP from the user.

5. **Validate OTP**  
   - Call the **“Validate OTP for Device / Device Passcode”** operation in the MFA Device Authentications section of the docs.  
   - Supply at least:
     - `deviceAuthenticationId`
     - `otp` (the code the user typed)

   - On success, the device authentication’s status moves to one of the *success* states (for example, `VERIFIED` / `COMPLETED`, depending on MFA type).

6. **Complete login**  
   - When the device authentication status indicates success, treat MFA as satisfied.  
   - Establish your app session and allow access.

### 3.3 Cancelling Device Authentication

The PingOne MFA docs you linked include a **“Cancel Device Authentication”** operation. This is used to stop an in-progress MFA challenge (for example, if the user backs out or chooses a different device).

The docs specify:

- It operates on the **`deviceAuthentications`** resource.
- It takes at least:
  - `deviceAuthenticationId`
  - `reason` (e.g., `SIGNOUT`, `CHANGE_DEVICE`, `ADD_DEVICE`, or a default value)

> **Implementation rule:**  
> Do **not** guess the cancel URL. Copy it from the `pingone/mfa/v1/api/#post-cancel-device-authentication` page or the corresponding Postman request. Tag it as `MFA device authentication` in your code/comments.

---

## 4. Putting It Together – Registration vs Authentication

### 4.1 SMS Registration Flow (Using Mgmt/MFA Device)

**Category mix:** `SSO token` → `Mgmt/MFA device`

1. Get worker token (SSO token):  
   - `POST https://auth.pingone.com/{ENV_ID}/as/token`

2. Check existing devices:  
   - `GET https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices`

3. If no suitable SMS device:  
   - `POST https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices` (`type = "SMS"`)  
   - Device is created in `ACTIVATION_REQUIRED` state.

4. User receives OTP via SMS (driven by policies & notification configuration).

5. User enters OTP into your UI.

6. Activate device:  
   - `POST https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/activate` with `otp`.

7. On success, device is `ACTIVE` and ready for login-time MFA.

### 4.2 Login-Time SMS MFA (Using MFA Device Authentication)

**Category mix:** `SSO token` → `MFA device authentication`

1. User completes primary auth (via SSO).  
2. Your app resolves `USER_ID` from the ID token / SSO context.  
3. Optionally check devices again if needed (Mgmt/MFA device).  
4. Initialize device authentication (MFA):
   - Use PingOne MFA “Initialize Device Authentication” on `deviceAuthentications`.  
5. PingOne sends SMS OTP based on policy.  
6. User enters OTP.  
7. Validate OTP:
   - Use “Validate OTP for Device / Device Passcode” on `deviceAuthentications`.  
8. On success, treat MFA as satisfied and complete login.  
9. If user cancels or times out, use “Cancel Device Authentication” on `deviceAuthentications` with appropriate reason.

---

## 5. Guidelines for Cursor / Windsurf Prompts

When you use this doc as a prompt for AI assistants building or refactoring your code:

1. **Never invent endpoints.**  
   - Only use:
     - `https://auth.pingone.com/{ENV_ID}/as/token` (SSO token)
     - `https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices[... ]` (Mgmt/MFA device)
     - The `deviceAuthentications` endpoints exactly as shown in PingOne MFA docs (MFA device authentication).

2. **Always separate concerns by category:**
   - Use **SSO token** only to get access tokens.
   - Use **Mgmt/MFA device** only for registration and admin lifecycle tasks.
   - Use **MFA device authentication** only for login-time MFA (OTP/FIDO/push/etc.).

3. **Make Device Authentication paths a TODO when unknown:**
   - If your code template needs a path that isn’t in this doc, mark it with a clear comment:  
     `// TODO: Fill in exact PingOne MFA v1 URL and body from pingone/mfa/v1/api docs`

4. **Build a clean MFA service layer:**
   - One service module that wraps:
     - SSO token retrieval
     - Device management calls
     - Device authentication calls
   - The UI / flow logic should call this service, not hard-code URLs.

This master-sms2.md should now be a safe, doc-aligned foundation: high-level flows, real base endpoints, and explicit instructions on where *you* or Cursor must fetch exact MFA paths from the official Ping docs instead of guessing.


---

## 6. Required User Forms / Screens to Support These Flows

To actually make these flows usable in the app, you need a small set of **well-defined forms**. These should be treated as first-class views/steps in your MFA UX, not as ad-hoc prompts.

### 6.1 Registration Forms (Mgmt/MFA Device)

These screens support the **device registration** flow in sections 2 and 4.1.

#### 6.1.1 “Add SMS Device” Form

**Purpose:** Collect a phone number and start SMS device registration.

Should include:

- Input for **phone number** (E.164 format or local format with country selector)
- Optional fields:
  - Nickname / label for device (e.g., “Personal phone”)
- Button: **“Send code”** / **“Register SMS device”**
- Error display area (e.g., phone invalid, API error from `POST /users/{USER_ID}/devices`)

**Backend action:**  
On submit, call:

- `POST https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices`  
  with `type = "SMS"` and the phone number.

#### 6.1.2 “Confirm SMS Device (Enter OTP)” Form

**Purpose:** Let the user enter the OTP received via SMS to complete device activation.

Should include:

- Masked display of target phone (e.g., `•••-•••-34567`)
- OTP input (single field or segmented 6-digit input)
- Buttons:
  - **“Verify code”** (primary)
  - **“Resend code”** (secondary; maps to resend operation, if enabled)
- Error messages / validation:
  - Wrong code
  - Code expired
  - Too many attempts

**Backend actions:**

- On “Verify code”:
  - `POST https://api.pingone.com/v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/activate` with the OTP.
- On “Resend code” (if supported in your config):
  - Use the documented **resend** operation for devices from the Platform API (exact path from docs/Postman).

#### 6.1.3 “Manage MFA Devices” Form (Optional but Recommended)

**Purpose:** Let users review and manage their registered devices.

Should include:

- List of all MFA devices for the user:
  - Device type (SMS, email, etc.)
  - Masked phone/email
  - Status (`ACTIVE`, `ACTIVATION_REQUIRED`, etc.)
- Actions:
  - Set preferred device / order (maps to device ordering operation)
  - Remove / deactivate device (if allowed)
  - Start re-activation flow if status is `ACTIVATION_REQUIRED`

**Backend action:**

- Fetch devices with `GET /users/{USER_ID}/devices` and render results.
- Map user actions to the appropriate Platform MFA device calls (order, delete, etc.).

---

### 6.2 Authentication Forms (MFA Device Authentication)

These screens support the **login-time MFA** flow in section 4.2 and the `deviceAuthentications` operations.

#### 6.2.1 “MFA Challenge – Choose Method” Form (Optional)

**Purpose:** If the user has multiple MFA devices or methods, let them choose which one to use.

Should include:

- List of available devices/methods:
  - SMS to `•••-•••-34567`
  - Email to `u•••@example.com`
  - Security key / Passkey
  - Mobile app, etc.
- Button per method or a “Continue” after selection.

**Backend actions:**

- Use `GET /users/{USER_ID}/devices` to show devices.
- Once the user chooses SMS, initialize MFA via **“Initialize Device Authentication”** for SMS in the MFA docs.
- If the PingOne MFA docs require an explicit device selection call, map the selection form submit to that “Device Selection” operation.

#### 6.2.2 “MFA Challenge – Enter SMS Code” Form

**Purpose:** Core login-time OTP form for SMS-based MFA.

Should include:

- Text: “We sent a code to your phone ending in ••••567”
- OTP input (single or segmented)
- Buttons:
  - **“Verify code”**
  - **“Resend code”** (if your policy supports resending during auth)
  - **“Use a different method”** or **“Cancel”**

- Status and error handling:
  - Show when an OTP has been sent / resent.
  - Display errors like “Incorrect code”, “Code expired”, “Too many attempts”.

**Backend actions:**

- On page load / initial challenge:
  - Call **“Initialize Device Authentication”** for the user + SMS policy and get `deviceAuthenticationId`.
- On “Verify code”:
  - Call the MFA **Device Authentication OTP validation** operation with:
    - `deviceAuthenticationId`
    - `otp` (code from the form)
- On “Resend code”:
  - Use the appropriate MFA Device Authentication operation (documented in PingOne MFA) to re-trigger SMS for that `deviceAuthenticationId`, if supported.
- On “Cancel”:
  - Call the **“Cancel Device Authentication”** operation with `deviceAuthenticationId` and an appropriate reason (e.g., `SIGNOUT` or `CHANGE_DEVICE`).

#### 6.2.3 “MFA Challenge – In Progress / Waiting” State

For non-OTP methods (push, FIDO, passkey), but also useful for SMS if you want to show a spinner:

- Show status like:
  - “Waiting for confirmation…” or
  - “Check your phone for a code”
- Optionally poll the `deviceAuthentications` resource to update status and auto-advance when the challenge is completed.

Backend:

- Periodically read the device authentication status using the documented “Read Device Authentication” operation on `deviceAuthentications` until the status moves to success or failure.

---

### 6.3 UX Design Notes

- **Be explicit about what’s happening.** Users should always know:
  - Which phone/email the code is going to (masked)
  - What step they are on (registration vs login)
  - What to do if something goes wrong (expired code, wrong code, no SMS)
- **Separate registration vs authentication in the UI.**
  - Registration is a “settings / first-time setup” experience.
  - Authentication is a “security gate” after primary login.
- **Don’t cross categories in code.**
  - Registration forms call **Mgmt/MFA device** endpoints only.
  - Authentication forms call **MFA device authentication** endpoints only.
  - Both share the same SSO token acquisition, but never mix flows.

These notes should guide Cursor / Windsurf to generate actual React forms / stepper flows that align with the underlying PingOne MFA APIs described earlier in this document.

---

## 7. Implementation Checklist for Cursor / Windsurf

This section is here specifically to tell AI coding assistants **what to generate** and **how not to break things**.

### 7.1 Core Files / Modules to Generate

When implementing or refactoring SMS MFA, Cursor SHOULD create (or update) modules along these lines:

1. **PingOneTokenClient (SSO token)**  
   - A small client responsible ONLY for:
     - Calling `POST https://auth.pingone.com/{ENV_ID}/as/token`
     - Caching / refreshing the access token
   - Expose a function like `getPingOneAccessToken(): Promise<string>`.

2. **PingOneMfaDeviceService (Mgmt/MFA device)**  
   - Wraps all **Platform MFA device** calls:
     - `GET /v1/environments/{ENV_ID}/users/{USER_ID}/devices`
     - `POST /v1/environments/{ENV_ID}/users/{USER_ID}/devices`
     - `POST /v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}/operations/activate`
     - Optional: device order, resend, delete, etc. (from docs)
   - Functions should be clearly named, e.g.:
     - `listUserDevices(userId)`
     - `createSmsDevice(userId, phoneNumber, nickname?)`
     - `activateDeviceWithOtp(userId, deviceId, otp)`

3. **PingOneMfaAuthService (MFA device authentication)**  
   - Wraps all **MFA Device Authentication** calls:
     - Initialize Device Authentication
     - Read Device Authentication status
     - Validate OTP / Device Passcode
     - Cancel Device Authentication
   - **IMPORTANT:**  
     - AI must insert **TODO markers** where exact endpoint paths or bodies are unknown, e.g.:  
       `// TODO: Fill in exact PingOne MFA v1 URL and request body from official docs (deviceAuthentications).`

4. **UI Components / Pages**  
   - Implement the forms described in section 6:
     - `AddSmsDeviceForm`
     - `ConfirmSmsDeviceOtpForm`
     - `MfaChooseMethodForm`
     - `MfaEnterSmsCodeForm`
     - Optional `ManageMfaDevicesPage`
   - Each form talks only to the appropriate service:
     - Registration forms → `PingOneMfaDeviceService`
     - Login MFA forms → `PingOneMfaAuthService`

### 7.2 Configuration and Environment

Cursor SHOULD:

- Use environment variables or a central config for:
  - `PINGONE_ENV_ID`
  - `PINGONE_CLIENT_ID`
  - `PINGONE_CLIENT_SECRET`
  - Any relevant policy IDs (MFA policy, Device Authentication policy)
- Avoid hard-coding IDs and secrets inside code.
- Provide a single place (e.g., `config/pingOne.ts`) where these values are read and exported.

### 7.3 Non‑Negotiable Rules for AI Assistants

When generating or changing code for this MFA flow, AI MUST:

1. **Not invent endpoints.**
   - For any `deviceAuthentications` or MFA-specific operation where the exact URL or body is unknown, insert:
     - `// TODO: Fill in exact PingOne MFA v1 URL and request body from pingone/mfa/v1/api docs`
   - Do not guess path segments like `/otp`, `/passcode`, `/assertion`, `/cancel`.

2. **Respect the category boundaries.**
   - `PingOneTokenClient` → only SSO token (`/as/token`).
   - `PingOneMfaDeviceService` → only Platform device endpoints.
   - `PingOneMfaAuthService` → only MFA Device Authentication endpoints.

3. **Not remove existing working functionality.**
   - When refactoring, preserve:
     - Existing UI steps
     - Existing flows that already work
   - If something must be changed, add comments explaining why and how it impacts flows.

4. **Add basic error handling and logging.**
   - For each network call:
     - Check HTTP status and handle non-2xx.
     - Log enough context to debug failures (without logging secrets or OTPs).

5. **Keep flows explicit.**
   - Registration vs Authentication should be represented as distinct states in the UI / router / stepper.
   - Do not hide MFA behavior behind “magic” helper calls that mix registration and authentication.

With this checklist, Cursor has clear instructions: what files to build, which services to create, what UI pieces are required, and the guardrails to follow when wiring everything to the PingOne MFA APIs described above.
