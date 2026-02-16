# AI Task: Add PingOne MFA Device Activation + Authentication (Including FIDO2) With Validation vs “Just Create” Options

You are working in my **PingOne MFA educational app**.  
Your job is to:

1. Add full support for **PingOne MFA device activation** (including FIDO2).
2. Add full support for **PingOne MFA device authentication** (all device-auth APIs).
3. Add UX that **asks the user** whether they want to:
   - run a **full validation flow**, or
   - **just create/activate** a new device (admin fast-path).
4. Reuse and extend existing patterns, without breaking any existing MFA flows.

---

## 1. Context & Constraints

- This app is an **education-first PingOne MFA demo**:
  - It shows **real PingOne MFA API calls** with request/response JSON.
  - It walks through **device registration, activation, and authentication** for multiple device types.
  - It already has an internal structure for **services**, **flows**, and **UI stepper/education components**.

- **Do NOT**:
  - Remove or regress existing MFA flows.
  - Invent fake PingOne endpoints or behavior that contradicts the MFA docs.
  - Use `alert/confirm/prompt` or other browser-native modals. Use the app’s Toaster/Modal components instead.

- **Do**:
  - Follow the app’s existing patterns for:
    - Token acquisition (worker token vs user token, etc.).
    - Environment ID / region / user selection.
    - Logging and JSON display.
  - Keep changes **incremental** and **localized**.

---

## 2. Endpoints to Support

Use only the **PingOne MFA v1 APIs** documented at:

- **Activate MFA user device**  
  `POST /mfa/v1/environments/{envId}/users/{userId}/devices/{deviceId}/activate`  
  Doc anchor:  
  `#post-activate-mfa-user-device`

- **FIDO2-specific device activation**  
  `POST /mfa/v1/environments/{envId}/users/{userId}/devices/{deviceId}/fido2/activate`  
  Doc anchor:  
  `#post-activate-mfa-user-device-fido2`

- **MFA device authentication APIs**  
  Section: `#mfa-device-authentications`  
  (This includes all endpoints needed to **initiate**, **continue**, and **complete** MFA authentications for supported device types.)

### Requirements

1. Implement the **generic device activation endpoint**.
2. Implement the **FIDO2 device activation endpoint**.
3. Implement support for **all relevant MFA device authentication APIs** in the “mfa-device-authentications” section:
   - Start/init authentication for a device.
   - Poll / check status (if applicable).
   - Finalize / verify the authentication (e.g., OTP, FIDO2, push, etc.).
4. Wire each of these into **clear, separate but consistent** UI flows.

Use the actual request/response shapes from the PingOne MFA docs that the repo already references; don’t make up arbitrary JSON.

---

## 3. “Validation vs Just Create” UX Requirement

We need a **clear choice** in the UI for how to treat new devices:

**Goal:**  
Ask the user (the human using this educational app) whether they want to:

1. **Full Validation Flow**  
   - Run the **full PingOne MFA activation/validation** sequence for a new device.
   - Example behavior:
     - Create/register the device (if that step exists in the current flow).
     - Call the **device activation endpoint**.
     - Perform any required **verification step** (e.g., code validation, challenge/response, FIDO2 ceremony).
     - Only mark the device as “active / usable” once validation fully succeeds.
   - Show all relevant JSON requests/responses and explain what’s happening.

2. **Admin Fast-Path: “Just Create/Activate Device”**  
   - For **admin / lab scenarios**, skip the user-facing challenge and simply:
     - Create/register the device (if needed).
     - Call the activation endpoint in a way that **results in an active usable device** without a full user validation ceremony.
   - This is for demos or pre-baked devices, where we want to quickly stand up a device for later authentication tests.
   - Still show the API calls and responses, but clearly label this as an **admin shortcut** (not recommended for production).

### Implementation details

- Add a **mode selector** in the relevant UI:
  - Could be:
    - A radio group (e.g., “Full validation” vs “Admin fast-path”), or
    - A toggle/dropdown.
- Based on the selected mode:
  - **Full validation mode**:
    - Use the documented multi-step activation/verification flow from PingOne MFA for that device type.
  - **Admin fast-path mode**:
    - Use the minimal API sequence permitted by PingOne to end with an active device, with no user challenge.
    - If the docs do not allow skipping validation cleanly, treat this mode as:
      - “Create + start validation + auto-complete using canned values appropriate for the demo,”
      - But label that clearly in UI and comments as **demo-only** behavior.

- The user-facing description should explicitly say:
  - Whether the path is production-realistic (full validation) or demo/admin-only (fast-path).

---

## 4. MFA Device Authentication Support (All APIs)

In addition to activation, we need **authentication flows** to be fully supported using the **mfa-device-authentications** endpoints.

### Requirements

1. For each supported MFA device type in the app (e.g., OTP, SMS, email, mobile push, FIDO2, etc.), ensure we have:

   - A way to **select a device** for authentication (or the app can auto-select a single device if there’s only one).
   - An API call to **start/initiate authentication** for that device.
   - Handling for:
     - Any **intermediate** or **polling** endpoints (if required by PingOne’s MFA flow).
     - Any **completion/verification** endpoints (e.g., sending back OTP, asserting FIDO2 result, confirming push, etc.).
   - A clear final **success vs failure** outcome in the UI, plus JSON.

2. UI/flow pattern:

   - Show a stepper or simple sequence:
     1. Choose user / device.
     2. Initiate MFA authentication.
     3. Complete/verify MFA authentication.
   - At each step, display:
     - The **API endpoint and HTTP method**.
     - The **request JSON or form body**.
     - The **response JSON** (or error).
   - Add short educational text explaining:
     - What is being authenticated (device vs user),
     - How PingOne is linking device state to user identity.

3. Because this is educational, do **not hide** the internals:
   - Show IDs (userId, deviceId) and relevant parts of the payload.
   - Redact secrets if any (e.g., tokens, secrets).

4. Ensure this authentication section works for:
   - Devices that were created/activated via the **full validation path**.
   - Devices that were created via the **admin fast-path**.

---

## 5. Reuse Existing App Structure & Guardrails

### 5.1 Services & configuration

- Reuse existing:
  - **MFA API service layer** (where HTTP client calls and base URL/envId logic live).
  - **Token handling** (worker token vs user token); do not change the app’s global token strategy.
  - **Error handling and Toaster/Modal patterns**.

- Add new functions into the relevant MFA service modules, e.g.:
  - `activateUserDevice(...)`
  - `activateUserDeviceFido2(...)`
  - `startDeviceAuthentication(...)`
  - `completeDeviceAuthentication(...)`
- Keep function signatures clear and typed (TypeScript), using interfaces for:
  - Request body shapes.
  - Response types.

### 5.2 Logging & education

- Use the app’s unified logging pattern (module tags, timestamps, etc.).
- For each major step, log:
  - The endpoint being called.
  - The user/device involved (IDs only, no secrets).
  - Success/failure and any error codes.
- Ensure logs are non-blocking and never crash the UI.

### 5.3 Don’t break existing flows

- Do not modify existing MFA flows except where needed to **plug in** the new activation/authentication behavior.
- If you must adjust shared code:
  - Keep changes backwards-compatible.
  - Add comments explaining why the change was needed.
  - Prefer adding new options/paths instead of altering old behavior.

---

## 6. Output Expectations (What to Show Me)

When you’ve made changes, summarize them in your response:

1. **Endpoints implemented**
   - List each new function in the MFA service layer and which PingOne endpoint it wraps.
2. **UI changes**
   - Which screens/components now support:
     - Device activation (generic & FIDO2),
     - Mode selection (full validation vs admin fast-path),
     - Device authentication flows.
3. **Flow description**
   - For one example device type (e.g., FIDO2 or OTP), walk through:
     - Activation in both modes,
     - Authentication using the “mfa-device-authentications” APIs.
4. **Notes / limitations**
   - Any assumptions you made from the PingOne docs.
   - Any device types or edge cases that still need manual follow-up.

Keep code changes self-contained, TypeScript-safe, and aligned with the existing PingOne MFA education UX.
