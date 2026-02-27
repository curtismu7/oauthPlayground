# Cursor AI Prompt – Fix Email MFA Wiring (V8)

## Goal

Bring the **Email MFA V8 flows** up to the same standard as the fixed FIDO2 and SMS flows.

Specifically, you must:

1. Make sure the **Email OTP configuration page** and the **Email MFA registration flow** are correctly wired together.
2. Ensure the **Email MFA sign-on demo flow** reuses the same core behavior and is consistent with registration.
3. Guarantee that all Email-related PingOne MFA calls are using the **correct environment, user, policy, and email address** from a single source of truth.
4. Preserve the existing **UI, layout, and educational content**. This is a wiring/behavior fix, not a visual redesign.
5. Avoid regressions in other MFA flows (SMS, FIDO2, TOTP, etc.).

Key files involved:

- `EmailOTPConfigurationPageV8.tsx`
- `EmailFlowV8.tsx`
- `EmailMFASignOnFlowV8.tsx`
- `emailMfaSignOnFlowServiceV8.ts`
- `EmailFlowController.ts`

You are refactoring behavior and wiring, not changing theming or the fundamental step structure.

---

## Current Behavior – Configuration vs Flow

### 1. Email configuration page

On the configuration page (`EmailOTPConfigurationPageV8.tsx`), the flow:

- Loads **Device Authentication Policies** for the selected environment.
- Allows the user to pick a policy.
- When the user clicks “Proceed to registration”, it navigates to the Email registration flow like this (pattern):

```ts
navigate('/v8/mfa/register/email/device', {
  replace: false,
  state: {
    deviceAuthenticationPolicyId: selectedDeviceAuthPolicy.id,
    policyName: selectedDeviceAuthPolicy.name,
    configured: true, // Flag to indicate configuration is complete
  },
});
```

Important details:

- It **only** passes:
  - `deviceAuthenticationPolicyId`
  - `policyName`
  - `configured`
- It does **not** pass:
  - `environmentId`
  - `username`
  - `email`
- It does **not** directly update shared MFA credentials.

This is basically the same pattern as the pre-fix FIDO2 and SMS config pages: the configuration page is only partially wired into the actual flow.

### 2. Email flow uses `location.state` only for policy and skips step 0

In `EmailFlowV8.tsx`:

- You build `EmailFlowV8WithDeviceSelection`, which grabs `location` and computes:

  ```ts
  const location = useLocation();
  const isConfigured = (location.state as { configured?: boolean })?.configured === true;
  const credentialsUpdatedRef = React.useRef(false);
  ```

- Step 0 is created via `createRenderStep0(isConfigured, location, credentialsUpdatedRef, ...)`

Inside `createRenderStep0`, you:

- Read `location.state` as:

  ```ts
  const locationState = location.state as { 
    configured?: boolean; 
    deviceAuthenticationPolicyId?: string;
    policyName?: string;
  } | null;
  ```

- If `deviceAuthenticationPolicyId` is present and `credentialsUpdatedRef` is false, you **copy** the policy ID into `credentials.deviceAuthenticationPolicyId` once.
- Then, if `isConfigured` is true and `nav.currentStep === 0`, you **skip Step 0** entirely:

  ```ts
  if (isConfigured && nav.currentStep === 0) {
    setTimeout(() => {
      nav.goToStep(1);
    }, 0);
    return null;
  }
  ```

Result: when coming from the config page, Step 0 is skipped automatically, and only `deviceAuthenticationPolicyId` is updated in credentials.

### 3. Device selection / registration skip behavior

In `EmailFlowV8WithDeviceSelection` you also have logic that, during a “registration flow” (when `isConfigured` is true):

- Skips loading existing devices.
- Auto-opens the registration form.
- Jumps over the device-selection step and straight into registration/OTP steps.

This mirrors the SMS behavior and is correct *assuming* credentials are already valid.

### 4. Shared credentials come from `MFAFlowBaseV8`

`EmailFlowV8` is built on top of `MFAFlowBaseV8`, which initializes credentials from `CredentialsServiceV8` (e.g. `environmentId`, `username`, `email`, `deviceAuthenticationPolicyId`, `registrationPolicyId`, etc.).

If the user hasn’t set `environmentId` / `username` / `email` in some earlier flow or base screen, those values will be **empty**, even if they came directly from the Email configuration page.

Since the config page never writes those values into shared credentials, the Email registration flow can start from a state where:

- `deviceAuthenticationPolicyId` is set (from `location.state`)
- `environmentId` is blank or stale
- `username` is blank or stale
- `email` (destination for OTP) is blank or stale

Downstream controller/service calls for Email MFA (register device, send OTP, validate OTP) then fail or behave inconsistently.

---

## Core Problems

1. **Configuration page → flow handoff is incomplete**  
   Only policy is passed via `location.state`. Environment, username, and email are not synchronized into the registration flow’s credentials.

2. **Step 0 is skipped purely based on `configured`**, not on whether credentials are actually usable.  
   This can drop the user into a mid-flow step without environment/user/email being valid.

3. **Sign-on flow may diverge from the registration flow**  
   The sign-on demo (`EmailMFASignOnFlowV8` + `emailMfaSignOnFlowServiceV8`) may be using its own logic, not fully aligned with the registration flow + controller pattern in `EmailFlowV8`/`EmailFlowController.ts`. That increases the chance of drift and inconsistent behavior.

---

## Required Fix – High-Level Plan

You must bring Email wiring up to the same quality as the FIDO2 and SMS fixes, across both **registration** and **sign-on** flows.

### A. Enhance `EmailOTPConfigurationPageV8` → `EmailFlowV8` handoff

Keep the existing API, but allow `EmailOTPConfigurationPageV8` to optionally pass more information in `location.state` when it is available and valid:

- `environmentId`
- `username`
- `email`

For example (pseudo-code, you must adapt to how those fields are collected today):

```ts
navigate('/v8/mfa/register/email/device', {
  replace: false,
  state: {
    deviceAuthenticationPolicyId: selectedDeviceAuthPolicy.id,
    policyName: selectedDeviceAuthPolicy.name,
    configured: true,
    environmentId, // optional, only if non-empty
    username,      // optional, only if non-empty
    email,         // optional, only if non-empty
  },
});
```

These should all be **optional** so that existing flows do not break if they are not provided.

### B. Normalize `location.state` into `MFACredentials` in `EmailFlowV8`

In `createRenderStep0`, extend `locationState` and merge logic so that we not only update the policy, but also environment/user/email, once, before any skipping.

Pattern (adapt naming to the real file):

```ts
const locationState = location.state as { 
  configured?: boolean; 
  deviceAuthenticationPolicyId?: string;
  policyName?: string;
  environmentId?: string;
  username?: string;
  email?: string;
} | null;

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

  if (locationState.email && !updated.email) {
    updated.email = locationState.email;
  }

  if (JSON.stringify(updated) !== JSON.stringify(credentials)) {
    setCredentials(updated);
  }

  credentialsUpdatedRef.current = true;
}
```

This is the Email equivalent of the FIDO2/SMS normalization: **one place** that turns config-page state into fully-populated credentials.

### C. Only skip Step 0 when the essentials are present

Right now, Step 0 is skipped unconditionally when `configured === true`. Change this so that skipping only happens when the minimal prerequisites are satisfied, for example:

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

// If configured is true but we are missing env/user/policy, 
// stay on step 0 so the user can complete configuration.
```

This prevents “phantom configuration” where we jump ahead with empty environment or user.

### D. Ensure registration steps and controller use normalized credentials

Review the Email registration logic in `EmailFlowV8` and `EmailFlowController.ts`:

- Ensure that **all API calls** (device registration, OTP send, OTP validation) are using:
  - `credentials.environmentId`
  - `credentials.username`
  - `credentials.email`
  - `credentials.deviceAuthenticationPolicyId`
  - `credentials.registrationPolicyId` (if applicable)

If any calls are using separate local state or hard-coded values instead of `credentials`, refactor them to use the normalized credentials.

Where appropriate, short-circuit with clear validation errors if essentials are missing before making API calls, using the same validation/toast patterns you use in FIDO2/SMS flows.

### E. Align the sign-on flow with the registration flow

For `EmailMFASignOnFlowV8.tsx` and `emailMfaSignOnFlowServiceV8.ts`:

- Ensure they reuse the same core primitives as `EmailFlowV8` and `EmailFlowController.ts` where possible.
  - For example, if there is a shared method for “register email device + send OTP”, invoke that instead of duplicating logic.
- Ensure they rely on the **same MFACredentials shape** (environment/user/email/policy), or an explicitly compatible set of fields.
- Validate that the sign-on flow uses the **device registered in the registration flow**, where that’s the intended scenario (or clearly documents/demo-creates its own device in a deterministic way).

The goal is: **Email registration and Email sign-on flows behave like two views on the same model**, not two separate worlds.

---

## Guardrails and Constraints

During implementation:

1. **Do not change visible layout, styling, or text** unless absolutely necessary for clarity.
2. **Do not break** or weaken:
   - SMS MFA
   - FIDO2 MFA
   - Other MFA flows using `MFAFlowBaseV8`.
3. Keep `MFACredentials` backward compatible:
   - Any additions (if needed) must be optional and safely defaulted.
4. Keep TypeScript strict mode compilation clean:
   - Explicit types for `location.state` and extra fields.
5. Use existing logging and toast/validation patterns:
   - If you add logs, tag them clearly (e.g. `[📧 EMAIL-FLOW-V8]`) consistent with existing code.
6. Prefer **small, surgical edits** over large-scale rewrites.

---

## Final Acceptance Criteria

The Email MFA flows are considered **fixed and acceptable** when:

1. Starting from **EmailOTPConfigurationPageV8**:
   - User selects a **Device Authentication Policy**.
   - If environment/username/email fields are present on the config page, they are correctly passed to the flow.
   - Clicking “Proceed to registration” transitions into `EmailFlowV8` with `configured === true`.

2. In **EmailFlowV8**:
   - On first render, `location.state` is merged into `MFACredentials` (policy + env + username + email) exactly once.
   - Step 0 is only skipped when `environmentId`, `username`, and `deviceAuthenticationPolicyId` are all valid.
   - If these are missing, the user remains on Step 0 and can fill them in.

3. Email device registration and OTP behavior:
   - Device registration uses the **correct environment, user, policy, and email**.
   - OTP is sent to the email specified in credentials.
   - OTP verification works for valid codes and shows proper errors for invalid/expired codes.

4. Email MFA sign-on flow:
   - `EmailMFASignOnFlowV8` and `emailMfaSignOnFlowServiceV8` reuse the core Email MFA primitives (controller/service) where appropriate.
   - The sign-on demo is consistent with the registration flow: same expectations about environment, user, and email.
   - The flow can successfully complete: create app/policy/user, register device, perform auth, complete MFA, exchange code for tokens.

5. Regression safety:
   - No other MFA flows regress (FIDO2, SMS, TOTP, etc.).
   - Shared components and `MFAFlowBaseV8` continue to function correctly.

Use this prompt as the task description for refactoring:

- `EmailOTPConfigurationPageV8.tsx`
- `EmailFlowV8.tsx`
- `EmailMFASignOnFlowV8.tsx`
- `emailMfaSignOnFlowServiceV8.ts`
- `EmailFlowController.ts`

so that Email MFA registration and sign-on are fully wired, policy-aware, and aligned with the hardened FIDO2/SMS patterns in V8.
