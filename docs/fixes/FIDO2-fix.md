# Cursor AI Prompt – Fix FIDO2 Registration Wiring (V8)

## Goal

FIDO2 registration is **not working** in the V8 MFA flows because the **FIDO2 configuration page and the FIDO2 registration flow are not properly wired together**.

You must:

1. Correctly **propagate the selected FIDO2 policy and Device Authentication policy** from the configuration page into the actual FIDO2 registration flow.
2. Ensure the **PingOne FIDO2 registration API call** is made with the **right policy IDs / parameters**.
3. Keep the existing **UI, layout, and educational flow intact**. This is a wiring/behavior fix, not a visual redesign.

The two key files are:

- `FIDO2ConfigurationPageV8.tsx`
- `FIDO2FlowV8.tsx`

Do **not** remove or significantly change other flows. This must be a **surgical, safe fix** that only improves correctness and reliability for FIDO2 registration.

---

## Current Problem – What’s Broken

### 1. Config page selects policies but the flow never uses them

In `FIDO2ConfigurationPageV8.tsx`, when the user finishes configuration and presses “Proceed to Device Registration”, you do something like:

```ts
navigate(`/v8/mfa/register/${devicePath}/device`, {
  replace: false,
  state: {
    fido2PolicyId: selectedFido2PolicyId,
    deviceAuthPolicyId: selectedDeviceAuthPolicy?.id,
    configured: true,
    deviceType: currentDeviceType,
  },
});
```

So the config page correctly sets in `location.state`:

- `fido2PolicyId`
- `deviceAuthPolicyId`
- `configured`
- `deviceType`

However, in `FIDO2FlowV8.tsx` (the registration flow), you **only read**:

- `configured`
- `deviceType`

You **ignore**:

- `fido2PolicyId`
- `deviceAuthPolicyId`

As a result, the actual FIDO2 registration controller is using **stale or default credentials**, not the ones the user just configured.

When you call the controller:

```ts
const deviceParams = controller.getDeviceRegistrationParams(registrationCredentials);
const deviceResult = await controller.registerDevice(registrationCredentials, deviceParams);
const fido2Result = await controller.registerFIDO2Device(registrationCredentials, deviceResult.deviceId);
```

The `registrationCredentials` do **not** contain the values coming from the config page (the selected FIDO2 policy and Device Auth policy), because they were never merged into `MFACredentials`.

This is the core bug.

---

## 2. Config page never updates shared credentials

The FIDO2 configuration page keeps everything in local state only:

```ts
const [selectedFido2PolicyId, setSelectedFido2PolicyId] = useState<string>('');
const [selectedDeviceAuthPolicy, setSelectedDeviceAuthPolicy] = useState<DeviceAuthenticationPolicy | null>(null);
```

It **does not** write to `CredentialsServiceV8` or any shared `MFACredentials` object.

The FIDO2 flow, on the other hand, relies heavily on `MFACredentials` / stored credentials for:

- `environmentId`
- `username`
- `deviceAuthenticationPolicyId`
- (and it *should* also have `fido2PolicyId`)

Because the config page never updates the shared credentials, the FIDO2 flow ends up running with partial or incorrect data.

---

## 3. `configured` is only used for UI, not for wiring

In `FIDO2FlowV8.tsx`, `configured` from `location.state` is only used to auto-open the registration form:

```ts
const isConfigured = (location.state as { configured?: boolean })?.configured === true;

useEffect(() => {
  if (isConfigured && !deviceSelection.showRegisterForm) {
    setDeviceSelection((prev) => ({
      ...prev,
      showRegisterForm: true,
      selectedExistingDevice: 'new',
    }));
  }
}, [isConfigured, deviceSelection.showRegisterForm]);
```

This affects **UI behavior only**. It never actually wires the selected policies into credentials or the controller.

So the user sees a registration screen, but the backend call is not using the configured policies. That’s why the registration appears to “not work” even though the UI looks correct.

---

## Required Fix – High-Level

### A. Plumb policies from `location.state` into `MFACredentials`

In `FIDO2FlowV8.tsx`, you must:

1. Extend the `location.state` type to include:
   - `fido2PolicyId?: string`
   - `deviceAuthPolicyId?: string`
   - `deviceType?: string`
   - `configured?: boolean`

2. On first render, if these values exist, **merge them into the stored credentials** via `CredentialsServiceV8`.

**Example pattern (adjust to the actual codebase):**

```ts
const location = useLocation();

const locationState = location.state as {
  deviceType?: string;
  fido2PolicyId?: string;
  deviceAuthPolicyId?: string;
  configured?: boolean;
} | null;

useEffect(() => {
  if (!locationState) return;

  const stored = CredentialsServiceV8.getStoredCredentials() || {};
  const updated = { ...stored };

  if (locationState.deviceAuthPolicyId && !stored.deviceAuthenticationPolicyId) {
    updated.deviceAuthenticationPolicyId = locationState.deviceAuthPolicyId;
  }

  if (locationState.fido2PolicyId && !("fido2PolicyId" in stored)) {
    // Add fido2PolicyId to MFACredentials if it doesn't exist yet.
    (updated as any).fido2PolicyId = locationState.fido2PolicyId;
  }

  if (JSON.stringify(updated) !== JSON.stringify(stored)) {
    CredentialsServiceV8.updateStoredCredentials(updated as MFACredentials);
  }
}, [locationState]);
```

> Important: If `MFACredentials` does not yet have a `fido2PolicyId` field, **add it** in a safe, backwards-compatible way. Do not break existing flows.

### B. Ensure the controller uses the FIDO2 policy

Review the FIDO2 controller / service used by `FIDO2FlowV8`. Make sure that:

- It **accepts** a `fido2PolicyId` in its params (probably as part of `MFACredentials` or as an explicit argument).
- It **sends** that `fido2PolicyId` to the relevant PingOne FIDO2 registration endpoint in the request body or query string, according to the official PingOne MFA / FIDO2 docs.

If the controller already supports `fido2PolicyId` but it’s never set, wire it to the updated credentials.

### C. Use the config-selected Device Auth policy as a default in Step 0

In the FIDO2 flow’s **Step 0** (where you render the Device Authentication Policy selector), you should:

- Use `credentials.deviceAuthenticationPolicyId` as the main source of truth.
- If that is not set yet, use `location.state.deviceAuthPolicyId` as a fallback.
- Show that selected policy as the default in the dropdown.

Pseudo-pattern:

```ts
const locationState = location.state as { deviceAuthPolicyId?: string } | null;

const effectivePolicyId =
  credentials.deviceAuthenticationPolicyId ||
  locationState?.deviceAuthPolicyId ||
  '';

// In JSX:
<select
  id="mfa-device-auth-policy"
  value={effectivePolicyId}
  onChange={(e) =>
    setCredentials({
      ...credentials,
      deviceAuthenticationPolicyId: e.target.value,
    })
  }
>
  {/* render options here */}
</select>
```

This keeps the UI aligned with what the user chose on the configuration page and what the backend will use.

---

## Guardrails and Constraints

When you implement this, follow these rules:

1. **Do not change the visible layout or wording** of the FIDO2 pages unless absolutely necessary. This is a wiring/behavior fix.
2. **Do not remove any existing functionality** in other MFA flows (TOTP, SMS, Email, etc.).
3. Any new fields added to `MFACredentials` (e.g., `fido2PolicyId`) must be:
   - Optional and backward compatible.
   - Safely defaulted where older flows do not set them.
4. Keep logging and error handling consistent with the existing V8 patterns.
5. If you add or change types, ensure **TypeScript still passes with strict settings**.
6. Keep the `configured` flag behavior (auto-opening the register form), but extend it so that **configuration also updates credentials**, not just UI state.

---

## Final Acceptance Criteria

FIDO2 registration is considered **fixed** and acceptable when:

1. User goes to **FIDO2 Configuration Page V8**, selects:
   - A FIDO2 policy
   - A Device Authentication policy
   - A device type (Security Key / Platform, etc.)
2. User clicks **“Proceed to Device Registration”**.
3. The app navigates to the FIDO2 registration flow (`/v8/mfa/register/.../device`):
   - The registration form auto-opens (current behavior).
   - The **selected policies are now correctly stored in `MFACredentials`.**
4. The FIDO2 registration call to PingOne:
   - Sends the **correct device authentication policy ID**.
   - Sends the **correct FIDO2 policy ID**.
5. Registration **succeeds** for valid configurations and produces useful, surfaced errors for invalid ones.
6. All other MFA flows (non-FIDO2) continue to function as before without regressions.

Use this prompt to refactor `FIDO2FlowV8.tsx`, `FIDO2ConfigurationPageV8.tsx`, and any directly related controller/credentials types so that FIDO2 registration is fully wired end-to-end and behaves correctly.
