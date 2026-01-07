# MFA FIDO2 UI Contract

## Related Documentation

- [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) - Detailed worker token configuration and modal behavior contracts
- [MFA FIDO2 UI Documentation](./MFA_FIDO2_UI_DOC.md) - FIDO2 UI structure and components

---

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.1.0  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document defines the UI contract for FIDO2 (WebAuthn) device registration and authentication flows. This contract ensures consistent behavior, error handling, and user experience across all FIDO2-related UI components.

---

## Scope

**Applies To:**
- ✅ FIDO2 Device Registration Flow (Admin)
- ✅ FIDO2 Device Registration Flow (User)
- ✅ FIDO2 Device Authentication Flow
- ✅ FIDO2 Configuration Page
- ✅ FIDO2 Error Handling

---

## UI Component Contracts

### 1. FIDO2 Configuration Page

**Component:** `FIDO2ConfigurationPageV8.tsx`  
**Route:** `/v8/mfa/configure/fido2`

#### Required UI Elements

1. **Worker Token Status Section**
   - Must display token status (Valid/Expired/Missing)
   - Must show "Get Worker Token" button if token is invalid
   - Must prevent proceeding if token is invalid
   - Must respect "Silent API Token Retrieval" and "Show Token After Generation" settings
   - See [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) for detailed worker token configuration contracts

2. **FIDO2 Configuration Settings**
   - Attestation dropdown (none/direct/indirect)
   - Authenticator Attachment dropdown (platform/cross-platform/any)
   - User Verification Requirement dropdown (required/preferred/discouraged)
   - Resident Key dropdown (required/preferred/discouraged)
   - Timeout number input (10000-300000 milliseconds)
   - Challenge Length number input (16-64 bytes)

3. **Relying Party (RP) Configuration**
   - RP ID text input
   - RP Name text input

4. **Action Buttons**
   - "Back to Hub" button (left)
   - "Proceed to Registration" button (right, primary)

#### State Management

- Configuration must be saved to `localStorage` via `MFAConfigurationServiceV8`
- Configuration must be loaded on page mount
- Changes must be persisted immediately

#### Validation Rules

- RP ID must be a valid domain or hostname
- RP Name must be non-empty
- Timeout must be between 10000 and 300000
- Challenge Length must be between 16 and 64

---

### 2. FIDO2 Registration Flow

**Component:** `FIDO2FlowV8.tsx`  
**Route:** `/v8/mfa/register/fido2`

#### Step 0: Configuration

**Contract:**
- Must display environment ID input
- Must display username input
- Must display device authentication policy selector
- Must display token type selector (Worker/User)
- Must validate all inputs before allowing progression
- Must show "Start Registration" button

**State:**
- Credentials stored in `credentials` state
- Token status checked via `WorkerTokenStatusServiceV8`
- Policies loaded from `MFAServiceV8.listDeviceAuthenticationPolicies()`

#### Step 1: Device Selection

**Contract:**
- Must check for existing FIDO2 devices before allowing registration
- Must show `FIDODeviceExistsModalV8` if FIDO2 device exists
- Must allow user to go back to device selection or hub
- Must show "Register FIDO2 Device" button if no existing device

**Pre-Registration Check:**
```typescript
const existingDevices = await controller.loadExistingDevices();
if (existingDevices.length > 0 && existingDevices.some(d => d.deviceType === 'FIDO2')) {
  setShowFIDODeviceExistsModal(true);
  return; // Prevent registration
}
```

#### Step 2: Device Registration

**Contract:**
- Must display device name input (defaults to "FIDO2")
- Must display RP ID and RP Name from configuration
- Must show progress indicator during WebAuthn operation
- Must handle WebAuthn API errors gracefully
- Must auto-advance to Step 3 after successful registration

**WebAuthn Flow Contract:**
1. Call `MFAServiceV8.registerFIDO2Device()` to create device in PingOne
2. Receive `publicKeyCredentialCreationOptions` (JSON string)
3. Parse JSON string to object
4. Convert byte arrays (`challenge`, `user.id`, `excludeCredentials[].id`) to `Uint8Array`
5. Call `navigator.credentials.create({ publicKey: options })`
6. Extract `PublicKeyCredential` response
7. Convert response to base64url format
8. Call `MFAServiceV8.activateFIDO2Device()` with attestation
9. Handle success/error and update UI

**Progress Indicator Contract:**
- Must show during WebAuthn operation
- Must have blue background (`#eff6ff`)
- Must have pulsing animation on lock icon
- Must display message: "Waiting for WebAuthn Authentication..."
- Must hide after WebAuthn completes

**Error Handling Contract:**
- Must catch WebAuthn API errors
- Must provide user-friendly error messages
- Must not show stack traces to users
- Must allow user to retry registration

**Auto-Advance Contract:**
- Must automatically advance to Step 3 after successful registration
- Must show success toast notification
- Must mark Step 2 as complete

#### Step 3: Device Activation

**Contract:**
- Must display success message
- Must display device details
- Must show "Continue" button
- Must auto-advance to success page

#### Step 4: Success Page

**Contract:**
- Must display success icon and message
- Must display device information summary
- Must show "View Documentation" button
- Must show "Back to Hub" button

---

### 3. FIDO2 Authentication Flow

**Component:** `MFAAuthenticationMainPageV8.tsx`  
**Route:** `/v8/mfa/authenticate`

#### Device Selection

**Contract:**
- Must display username input
- Must display environment ID input
- Must display device authentication policy selector
- Must load and display available FIDO2 devices
- Must allow user to select specific device or use device list

**Device List Contract:**
- Must show all available FIDO2 devices
- Must display device nickname
- Must show "Select Device" button for each device
- Must handle device selection and proceed to authentication

#### FIDO2 Assertion

**Contract:**
- Must show progress indicator during WebAuthn
- Must display "Authenticate with FIDO2" button
- Must handle WebAuthn API errors gracefully
- Must show error messages if authentication fails

**WebAuthn Flow Contract:**
1. Call `MfaAuthenticationServiceV8.initializeDeviceAuthentication()` to start authentication
2. Receive `publicKeyCredentialRequestOptions` from PingOne
3. Parse and convert byte arrays to `Uint8Array`
4. Call `navigator.credentials.get({ publicKey: options })`
5. Extract `PublicKeyCredential` response
6. Convert response to base64url format
7. Call `MfaAuthenticationServiceV8.checkFIDO2Assertion()` with assertion
8. Handle success/error and update UI

**Progress Indicator Contract:**
- Same as registration flow (blue background, pulsing animation)
- Must show during WebAuthn operation
- Must hide after WebAuthn completes

**Error Handling Contract:**
- Must catch WebAuthn API errors
- Must provide user-friendly error messages
- Must not show stack traces to users
- Must allow user to retry authentication

---

### 4. FIDO2 Error Modals

#### FIDO Device Exists Modal

**Component:** `FIDODeviceExistsModalV8.tsx`

**Contract:**
- Must be shown when user attempts to register FIDO2 device but one already exists
- Must explain that only one FIDO2 device is allowed per user
- Must provide "Back to Device Selection" button
- Must provide "Back to MFA Hub" button
- Must close modal and return to Step 1 when "Back to Device Selection" is clicked
- Must navigate to MFA Hub when "Back to MFA Hub" is clicked

**Trigger:**
```typescript
const existingDevices = await controller.loadExistingDevices();
if (existingDevices.length > 0 && existingDevices.some(d => d.deviceType === 'FIDO2')) {
  setShowFIDODeviceExistsModal(true);
}
```

---

## Error Handling Contracts

### WebAuthn API Errors

**Contract:**
- Must catch `NotAllowedError` (user cancelled)
- Must catch `InvalidStateError` (device already registered)
- Must catch `NotSupportedError` (WebAuthn not supported)
- Must catch `SecurityError` (origin/RP ID mismatch)
- Must provide user-friendly error messages for each error type

**Error Message Mapping:**
```typescript
if (error.name === 'NotAllowedError') {
  return 'Registration cancelled. Please try again.';
}
if (error.name === 'InvalidStateError') {
  return 'This device may already be registered.';
}
if (error.name === 'NotSupportedError') {
  return 'WebAuthn is not supported in this browser.';
}
if (error.name === 'SecurityError') {
  return 'Security error: Origin or Relying Party ID mismatch.';
}
return 'Registration failed. Please try again.';
```

### PingOne API Errors

**Contract:**
- Must handle 400 Bad Request (malformed request)
- Must handle 401 Unauthorized (invalid token)
- Must handle 403 Forbidden (insufficient permissions)
- Must handle 404 Not Found (device/policy not found)
- Must provide user-friendly error messages

**Error Message Mapping:**
```typescript
if (error.status === 400) {
  return 'Invalid request. Please check your configuration.';
}
if (error.status === 401) {
  return 'Authentication failed. Please check your worker token.';
}
if (error.status === 403) {
  return 'Insufficient permissions. Please check your token scopes.';
}
if (error.status === 404) {
  return 'Device or policy not found. Please check your configuration.';
}
return 'An error occurred. Please try again.';
```

---

## State Management Contracts

### Configuration State

**Storage:**
- Must use `MFAConfigurationServiceV8.saveConfiguration()`
- Must use `MFAConfigurationServiceV8.loadConfiguration()`
- Must persist to `localStorage` with key `v8:mfa_configuration`

**Structure:**
```typescript
{
  fido2: {
    attestation: 'none' | 'direct' | 'indirect',
    authenticatorAttachment: 'platform' | 'cross-platform' | null,
    userVerificationRequirement: 'required' | 'preferred' | 'discouraged',
    residentKey: 'required' | 'preferred' | 'discouraged',
    timeout: number, // 10000-300000
    challengeLength: number, // 16-64
    rpId: string,
    rpName: string,
  }
}
```

### Flow State

**Storage:**
- Must use `CredentialsServiceV8.saveCredentials()` for credentials
- Must use `useStepNavigationV8` hook for step navigation
- Must preserve state during navigation

**Structure:**
```typescript
{
  environmentId: string,
  username: string,
  deviceAuthenticationPolicyId: string,
  tokenType: 'worker' | 'user',
  userToken?: string,
  deviceName?: string,
  fido2Config?: FIDO2Configuration,
}
```

---

## API Integration Contracts

### Device Registration

**Service:** `MFAServiceV8.registerFIDO2Device()`

**Request Contract:**
- Must include `environmentId`
- Must include `userId` or `username`
- Must include `deviceAuthenticationPolicyId`
- Must include `rp` object with `id` and `name`
- Must include `workerToken` or `userToken`
- Must include `region` and `customDomain` if applicable

**Response Contract:**
- Must return `publicKeyCredentialCreationOptions` as JSON string
- Must return device `id` and `status`
- Must handle errors gracefully

### Device Activation

**Service:** `MFAServiceV8.activateFIDO2Device()`

**Request Contract:**
- Must include `deviceId`
- Must include `attestation` object (WebAuthn response)
- Must include `origin` (application origin)
- Must include `workerToken` or `userToken`
- Must include `region` and `customDomain` if applicable

**Response Contract:**
- Must return activated device with `status: 'ACTIVE'`
- Must handle errors gracefully

### Device Authentication

**Service:** `MfaAuthenticationServiceV8.initializeDeviceAuthentication()`

**Request Contract:**
- Must include `environmentId`
- Must include `username` or `userId`
- Must include `deviceAuthenticationPolicyId`
- Must include `deviceId` (optional - for specific device)
- Must include `workerToken`
- Must include `region` and `customDomain` if applicable

**Response Contract:**
- Must return `publicKeyCredentialRequestOptions` if FIDO2 device
- Must return `deviceAuthId` for assertion check
- Must handle errors gracefully

### Assertion Check

**Service:** `MfaAuthenticationServiceV8.checkFIDO2Assertion()`

**Request Contract:**
- Must include `deviceAuthId`
- Must include `assertion` object (WebAuthn response)
- Must include `origin` (application origin)
- Must include `compatibility: 'FULL'`
- Must include `workerToken`
- Must include `region` and `customDomain` if applicable

**Response Contract:**
- Must return authentication status
- Must return `access_token` if successful
- Must handle errors gracefully

---

## Testing Contracts

### Unit Tests

**Required Tests:**
- Configuration page loads and saves settings
- Device registration flow progresses through steps
- WebAuthn API integration works correctly
- Error handling displays user-friendly messages
- State management persists correctly

### Integration Tests

**Required Tests:**
- End-to-end registration flow
- End-to-end authentication flow
- Error scenarios (invalid token, device exists, etc.)
- State preservation during navigation

### Manual Testing Checklist

- [ ] Configuration page saves settings correctly
- [ ] Registration flow completes successfully
- [ ] Authentication flow completes successfully
- [ ] Error modals display correctly
- [ ] Progress indicators show during WebAuthn
- [ ] Auto-advance works after registration
- [ ] State persists during navigation

---

## Lockdown and Regression Protection

### FIDO2 UI Contract Lockdown

**Purpose:** Protect FIDO2 UI contracts and behavior from accidental modification or regression.

**Locked Contract Files:**
- `src/v8/flows/types/FIDO2FlowV8.tsx` - Registration flow contract implementation
- `src/v8/flows/types/FIDO2ConfigurationPageV8.tsx` - Configuration page contract
- `src/v8/flows/MFAAuthenticationMainPageV8.tsx` - Authentication flow contract
- `src/v8/components/FIDODeviceExistsModalV8.tsx` - Error modal contract

**Contract Verification:**
The lockdown system ensures UI contracts are maintained:
- Error handling contracts (user-friendly messages)
- State management contracts (persistence, navigation)
- WebAuthn integration contracts (prompt handling, cancellation)
- Modal display contracts (existing device, errors)

**Verification:**
```bash
npm run verify:fido2-lockdown
```

**Restoring Contracts from Regression:**
If FIDO2 UI contracts break:
1. Run `npm run verify:fido2-lockdown` to see what changed
2. Choose option 1 in the restart script to restore from snapshots
3. Review contract violations in restored files

**See Also:**
- `docs/MFA_FIDO2_MASTER.md` - Complete lockdown documentation
- `docs/MFA_FIDO2_UI_DOC.md` - UI structure documentation

---

## Success Page Contract

### Success Page UI Contract

**Component:** `MFASuccessPageV8` / `UnifiedMFASuccessPageV8`  
**Location:** Step 3 of FIDO2 registration flow

#### Required UI Elements

1. **Documentation Button**
   - **MUST be visible** on success page for all FIDO2 registration flows
   - **MUST NOT** be visible for authentication flows
   - **MUST** navigate to `/v8/mfa/register/fido2/docs` when clicked
   - **MUST** pass flow data via `location.state`:
     - `registrationFlowType`
     - `adminDeviceStatus`
     - `tokenType`
     - `environmentId`
     - `userId`
     - `deviceId`
     - `policyId`
   - **MUST** have orange/yellow color (`#f59e0b`) with book icon
   - **MUST** appear in both top and bottom button sections
   - **MUST** be conditionally rendered based on `deviceType === 'FIDO2'` and `flowType === 'registration'`

2. **Back to Hub Button**
   - **MUST** have green color (`#10b981`) with home icon
   - **MUST** have subtle box shadow for better visibility
   - **MUST** appear in both top and bottom button sections
   - **MUST** navigate to `/v8/mfa-hub` when clicked

3. **Dynamic Padding**
   - **MUST** have dynamic bottom padding based on API display visibility
   - **MUST** use `500px` bottom padding when API display is visible
   - **MUST** use `24px` bottom padding when API display is hidden
   - **MUST** ensure `minHeight: '100vh'` for scrollability
   - **MUST** subscribe to `apiDisplayServiceV8` for real-time visibility updates
     - `deviceStatus`
     - `username`
     - `deviceName`

2. **Button Styling**
   - Orange/yellow background (`#f59e0b`)
   - White text
   - Book icon (📚)
   - Text: "View Documentation"

3. **Implementation Contract**
   - `deviceType` **MUST** be set to `'FIDO2'` when building success page data
   - `flowType` **MUST** be set to `'registration'` for registration flows
   - Documentation button visibility: `flowType === 'registration' && deviceType === 'FIDO2'`

#### Documentation Page Contract

**Route:** `/v8/mfa/register/fido2/docs`  
**Component:** `FIDO2RegistrationDocsPageV8`

**MUST:**
- Display all FIDO2 API calls in correct order
- Show request/response examples
- Support both Admin and User flows
- Show activation calls for `ACTIVATION_REQUIRED` devices
- Include "Back to Hub" button at top and bottom
- Display PingOne API URLs in orange color

---

## Related Documentation

- `docs/MFA_FIDO2_UI_DOC.md` - UI Documentation for FIDO2 flows
- `docs/MFA_FIDO2_MASTER.md` - Comprehensive FIDO2 master document
- `docs/MFA_API_REFERENCE.md` - API reference for FIDO2 endpoints
- `docs/MFA_STATE_PRESERVATION_UI_CONTRACT.md` - State preservation contract

---

## Version History

- **v1.0.0** (2025-01-XX): Initial FIDO2 UI Contract

