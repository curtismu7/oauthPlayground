# Cursor AI Prompt – Fix SMS OTP Registration Wiring (V8)

## Goal

The **SMS OTP MFA V8 flow** needs the same kind of wiring fix we applied to FIDO2:

- The **SMS configuration page** (`SMSOTPConfigurationPageV8`) must hand off data cleanly to  
  the **SMS MFA flow** (`SMSFlowV8`), which in turn relies on the shared base flow (`MFAFlowBaseV8`).
- SMS device registration and OTP send/verify must use the **correct environment, user, policy, and phone/email**
  information every time.

The objective is to:
1. Make the “Configure → Register device → Send OTP → Validate” path **reliable**.
2. Keep the existing **UI, layout, and education** intact (no visual redesign).
3. Avoid breaking **other MFA flows** (FIDO2, Email, TOTP, etc.).

Key files:
- `SMSFlowV8.tsx` fileciteturn0file0  
- `SMSOTPConfigurationPageV8.tsx` fileciteturn0file1  
- `MFAFlowBaseV8.tsx` fileciteturn0file2  

You are refactoring behavior and wiring, not re‑them­ing the experience.

---

## Current Behavior – What the Code Actually Does

### 1. Config page only passes **policy**, not env/user/phone

On the config page, the “Proceed to registration” button navigates straight into the registration flow:

```ts
navigate('/v8/mfa/register/sms/device', {
  replace: false,
  state: {
    deviceAuthenticationPolicyId: selectedDeviceAuthPolicy.id,
    policyName: selectedDeviceAuthPolicy.name,
    configured: true, // Flag to indicate configuration is complete
  },
});
```
fileciteturn0file1

Important: the config page does **not** pass:

- `environmentId`
- `username`
- `phoneNumber`
- `email`

It only passes policy ID, policy name, and the `configured` flag.

### 2. SMS flow **skips step 0** when coming from config, but only partially updates credentials

In `SMSFlowV8WithDeviceSelection`, we derive `isConfigured` from `location.state`:

```ts
const location = useLocation();
const isConfigured = (location.state as { configured?: boolean })?.configured === true;
```
fileciteturn0file0

Step 0 is rendered via `renderStep0` and contains this logic:

```ts
const locationState = location.state as { 
  configured?: boolean; 
  deviceAuthenticationPolicyId?: string;
  policyName?: string;
} | null;

// Update credentials with policy ID from location.state if available (only once)
if (!credentialsUpdatedRef.current && locationState?.deviceAuthenticationPolicyId && 
  credentials.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId) {
  setCredentials({
    ...credentials,
    deviceAuthenticationPolicyId: locationState.deviceAuthenticationPolicyId,
  });
  credentialsUpdatedRef.current = true;
}

// If coming from config page, skip step 0 and go to step 1
if (isConfigured && nav.currentStep === 0) {
  setTimeout(() => {
    nav.goToStep(1);
  }, 0);
  return null;
}
```
fileciteturn0file0

So when we come from the config page:

- We **do** propagate `deviceAuthenticationPolicyId` into `credentials`.
- We also **skip the Configure step** entirely.

But we **never** use `location.state` to populate:

- `environmentId`
- `username`
- contact info (`phoneNumber` / `email`).

And we never check whether those are actually set before skipping Configure.

### 3. Base flow depends on stored credentials, not config state

`MFAFlowBaseV8` initializes credentials from `CredentialsServiceV8`:

```ts
const [credentials, setCredentials] = useState<MFACredentials>(() => {
  const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
    flowKey: FLOW_KEY,
    flowType: 'oidc',
    includeClientSecret: false,
    includeRedirectUri: false,
    includeLogoutUri: false,
    includeScopes: false,
  });

  return {
    environmentId: stored.environmentId || '',
    clientId: stored.clientId || '',
    username: stored.username || '',
    deviceType: (stored.deviceType as DeviceType) || deviceType,
    countryCode: stored.countryCode || '+1',
    phoneNumber: stored.phoneNumber || '',
    email: stored.email || '',
    deviceName: stored.deviceName || '',
    deviceAuthenticationPolicyId: stored.deviceAuthenticationPolicyId || '',
    registrationPolicyId: stored.registrationPolicyId || '',
  };
});
```
fileciteturn0file2

If the user hasn’t already configured `environmentId`/`username` in some other flow, they will be **blank** even when coming from the SMS config page, because that page never sets them.

### 4. SMS device registration & OTP rely on these credentials

Step 2 (register) and later steps (send OTP, validate OTP) use the controller and `credentials` to:

- Register a device (SMS or Email) with PingOne.
- Send OTP for `ACTIVATION_REQUIRED` devices.
- Validate the OTP.

That means registration and OTP behavior silently depend on:

- `credentials.environmentId`
- `credentials.username`
- `credentials.phoneNumber` / `credentials.email`
- `credentials.deviceAuthenticationPolicyId`

When Configure is skipped and those values are missing or stale, the SMS flow breaks in subtle ways (no devices, failed registration, OTP not sent, etc.).

---

## Core Problems

1. **Config page → flow handoff is incomplete**  
   - Only policy ID and `configured` are passed.  
   - No environment, username, or contact info are carried forward.

2. **Step 0 is skipped unconditionally when `configured === true`**  
   - Even if required values (`environmentId`, `username`, contact info) are missing, we still skip Configure.

3. **Base flow assumes stored credentials are valid**  
   - But SMS config never updates those credentials directly.  
   - The user can end up in a “pre‑configured” path with no real configuration applied.

The result: “SMS registration is not working” when started from the SMS config page, especially in fresh or demo environments.

---

## Required Fix – High‑Level

### A. Treat SMS config page as the **source of truth** for policy *and* environment/user when used as an entry point

You have two safe patterns to combine:

1. **When coming from SMSOTPConfigurationPageV8**, allow it to pass more data via `location.state`, e.g.:  
   - `environmentId`
   - `username`
   - (optionally) `phoneNumber`

2. In `SMSFlowV8`, **merge those values into `credentials` exactly once** on first render, similar to how you currently merge `deviceAuthenticationPolicyId`.

### B. Don’t skip Configure if essentials are missing

When `isConfigured === true`, we should **only skip step 0** if:

- `credentials.environmentId` is non‑empty after the merge, and
- `credentials.username` is non‑empty, and
- we have a valid `deviceAuthenticationPolicyId`.

If any of those are missing after applying `location.state`, the flow should **stay on Step 0** so the user can fill in the missing info.

### C. Keep Email/SMS dual‑mode behavior intact

`SMSFlowV8` already supports a dual deviceType (`SMS` vs `EMAIL`) registration path in Step 2:

- Validate phone number for SMS.
- Validate email format for Email.
- Use `deviceName` exactly as entered by the user.

Fixes should **not** break that behavior. Instead, they should guarantee that when we get to Step 2 and beyond, the **environment, username, and policy are always valid**.

---

## Concrete Implementation Plan

### 1. Extend what SMSOTPConfigurationPageV8 can send (non‑breaking)

Optionally enhance the config page to **optionally** include environment/username in the `navigate` call when those are known.

For example (pseudo‑pattern, adjust to real UI):

```ts
navigate('/v8/mfa/register/sms/device', {
  replace: false,
  state: {
    deviceAuthenticationPolicyId: selectedDeviceAuthPolicy.id,
    policyName: selectedDeviceAuthPolicy.name,
    configured: true,
    environmentId, // OPTIONAL: only if present and valid
    username,      // OPTIONAL: only if present and valid
  },
});
```

Make these optional so existing calls remain valid. fileciteturn0file1

### 2. In SMSFlowV8, merge `location.state` into credentials in a **single place**

In `renderStep0` (inside `SMSFlowV8WithDeviceSelection`), expand the `locationState` type and merge logic:

```ts
const locationState = location.state as { 
  configured?: boolean; 
  deviceAuthenticationPolicyId?: string;
  policyName?: string;
  environmentId?: string;
  username?: string;
} | null;
```

Then, before the “skip Step 0” block, extend the merge to include env/user:

```ts
if (!credentialsUpdatedRef.current && locationState) {
  const updated = { ...credentials };

  if (locationState.deviceAuthenticationPolicyId && 
      updated.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId) {
    updated.deviceAuthenticationPolicyId = locationState.deviceAuthenticationPolicyId;
  }

  if (locationState.environmentId && !updated.environmentId) {
    updated.environmentId = locationState.environmentId;
  }

  if (locationState.username && !updated.username) {
    updated.username = locationState.username;
  }

  if (JSON.stringify(updated) !== JSON.stringify(credentials)) {
    setCredentials(updated);
  }

  credentialsUpdatedRef.current = true;
}
```

This ensures we **normalize** config‑page state into `MFACredentials` exactly once. fileciteturn0file0

### 3. Only skip Step 0 when all pre‑requisites are satisfied

Change the skip logic from:

```ts
if (isConfigured && nav.currentStep === 0) {
  setTimeout(() => {
    nav.goToStep(1);
  }, 0);
  return null;
}
```

to something like:

```ts
const hasMinimumConfig =
  !!credentials.environmentId?.trim() &&
  !!credentials.username?.trim() &&
  !!credentials.deviceAuthenticationPolicyId?.trim();

if (isConfigured && nav.currentStep === 0 && hasMinimumConfig) {
  setTimeout(() => {
    nav.goToStep(1);
  }, 0);
  return null;
}

// If configured flag is true but we are missing env/user/policy,
// stay on Step 0 so user can complete configuration.
```

This prevents “empty configuration” runs when coming from the SMS config page. fileciteturn0file2

### 4. Ensure downstream controller calls only execute with valid credentials

Downstream, `SMSDeviceSelectionStep` and registration/OTP steps should already be using `credentials.environmentId` and `credentials.username` when calling the controller.

Add light‑touch guardrails where needed, for example:

- Before loading devices (`controller.loadExistingDevices`), bail out if env/user or worker token are missing, and show a validation error.
- Before registering a device, ensure all required fields are present:

  - `environmentId`
  - `username`
  - `deviceAuthenticationPolicyId`
  - `phoneNumber` or `email` depending on `deviceType`

Use `nav.setValidationErrors([...])` and the existing toast patterns, **not** new ad‑hoc UX.

You don’t need to redesign – just **short‑circuit bad states** early with useful messages.

---

## Guardrails and Constraints

While implementing this fix:

1. **Do not change visual styling** (CSS, colors, layout) beyond tiny label tweaks if absolutely necessary.
2. **Do not remove or weaken** the dual SMS/Email device support in `SMSFlowV8`.
3. **Do not regress FIDO2 or other MFA flows** – all changes must be scoped to:
   - `SMSFlowV8.tsx`
   - `SMSOTPConfigurationPageV8.tsx`
   - Small, shared pieces in `MFAFlowBaseV8.tsx` (only if absolutely required).
4. Keep TypeScript strict mode happy:
   - Types for extended `location.state` must be correct and optional.
   - `MFACredentials` remains backward‑compatible if you add any fields.
5. Preserve and reuse existing toast + validation patterns, instead of inventing new ones.

---

## Final Acceptance Criteria

The SMS OTP flow is considered **fixed** when all of the following hold:

1. Starting from **SMSOTPConfigurationPageV8**:
   - User selects a **Device Authentication Policy**.
   - If the config page has env/username fields, they are used; otherwise the flow safely falls back to Step 0.
   - Clicking “Proceed to registration” takes the user into `SMSFlowV8` with `configured === true`.

2. In **SMSFlowV8**:
   - When coming from config and required fields (env, username, policy) are available, Step 0 is **skipped** and we start at device selection/registration.
   - When coming from config but fields are missing, Step 0 is **not skipped**, and the user is guided to fill in missing data.
   - `credentials.environmentId`, `credentials.username`, and `credentials.deviceAuthenticationPolicyId` are always valid by the time we register a device or send an OTP.

3. Device registration:
   - Device registration succeeds for valid inputs using the **correct environment, user, and policy**.
   - Device status (`ACTIVE` vs `ACTIVATION_REQUIRED`) behaves as designed (admin vs user flow).

4. OTP behavior:
   - OTP is sent to the configured phone/email reliably.
   - OTP verification works end‑to‑end.
   - Errors like invalid code, expired code, or missing configuration are surfaced cleanly via existing validation/ toast patterns.

5. Regression safety:
   - Other MFA flows (FIDO2, Email, TOTP, etc.) continue to work exactly as before.
   - No new runtime errors in `MFAFlowBaseV8` or shared services.

Use this prompt to guide a **surgical refactor** of:

- `SMSFlowV8.tsx`
- `SMSOTPConfigurationPageV8.tsx`
- (optionally) minimal helpers in `MFAFlowBaseV8.tsx`

so that SMS OTP registration behaves as reliably as the fixed FIDO2 flow, while keeping the UX familiar and educational.
