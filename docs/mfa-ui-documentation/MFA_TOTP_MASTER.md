# MFA TOTP Master Document

**Last Updated:** 2026-01-06 20:30:00  
**Version:** 1.2.0  
**Purpose:** Comprehensive reference for TOTP registration and authentication implementation  
**Usage:** Use this document to restore correct implementations when TOTP flows break or regress

---

## Table of Contents

1. [Overview](#overview)
2. [Related Documentation](#related-documentation)
3. [TOTP Registration Flow](#totp-registration-flow)
4. [TOTP Authentication Flow](#totp-authentication-flow)
5. [Critical JSON Request Bodies](#critical-json-request-bodies)
6. [Errors Fixed and Solutions](#errors-fixed-and-solutions)
7. [Implementation Files](#implementation-files)
8. [Testing and Verification](#testing-and-verification)

---

## Overview

This document provides a comprehensive reference for TOTP (Time-based One-Time Password) device registration and authentication flows in the MFA system. It includes:

- Correct JSON request body formats for all TOTP API calls
- Detailed error fixes and solutions
- Step-by-step implementation guidance
- QR code and secret handling
- Industry-standard compliance (Google Authenticator, Authy, Microsoft Authenticator)

**Key Principles:**
1. **Status Requirement:** TOTP devices must be created with `status: "ACTIVATION_REQUIRED"` to receive `secret` and `keyUri` in the response
2. **Policy Format:** Policy object must contain only `id` (not `type`) when an ID is provided. API expects either `id` or `type: "DEFAULT"`, not both
3. **Secret Expiration:** `secret` and `keyUri` expire after 30 minutes from device creation. If expired, device must be deleted and recreated
4. **QR Code Format:** `keyUri` is in standard `otpauth://totp/...` format (RFC 6238) and can be rendered directly as QR code
5. **Registration vs Authentication:** Registration and authentication flows are completely separate. Device selection is only shown during authentication, never during registration

---

## Related Documentation

- **API Reference:** [`docs/MFA_API_REFERENCE.md`](./MFA_API_REFERENCE.md) - Complete API endpoint documentation
- **TOTP Spec:** [`totp.md`](../totp.md) - Original TOTP implementation specification
- **State Preservation:** [`docs/MFA_STATE_PRESERVATION_UI_CONTRACT.md`](./MFA_STATE_PRESERVATION_UI_CONTRACT.md) - State preservation contract
- **PingOne API Docs:** [Create MFA User Device (TOTP)](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-totp)

---

## TOTP Registration Flow

### Flow Overview

1. **Configuration Page** → User configures TOTP settings (optional)
2. **Step 0** → User enters credentials (environment ID, username, policy)
3. **Step 1** → Device selection (SKIPPED for registration flow - only shown during authentication)
4. **Step 2** → User registers TOTP device (Modal - device name only)
5. **Step 3** → QR code display and activation (Modal - ALWAYS shown, activation OTP only if ACTIVATION_REQUIRED)
6. **Step 4** → Validate OTP (Modal - for authentication after device is activated)
7. **Success Page** → Registration complete

### Step-by-Step Implementation

#### Step 0: Configuration

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `TOTPConfigureStep`

**Purpose:** User enters required credentials for TOTP registration.

**Required Fields:**
- Environment ID
- Username
- Device Authentication Policy ID
- Worker Token (or User Token for user flow)

**Critical:** Registration flow type (Admin vs User) determines device status:
- **Admin Flow:** Device can be created with `ACTIVE` or `ACTIVATION_REQUIRED` status
- **User Flow:** Device is always created with `ACTIVATION_REQUIRED` status

**Navigation:** If coming from configuration page (`location.state.configured === true`), automatically skip Step 0 and navigate to Step 1 (which then immediately goes to Step 2 for registration).

---

#### Step 1: Device Selection

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep1WithSelection`

**Critical:** During registration flow, Step 1 is **completely skipped**. Device selection is only shown during authentication flows.

**Implementation:**
```typescript
// During registration flow (from config page), never show device selection
// Registration and authentication are completely separate - device selection is only for authentication
if (isConfiguredValue) {
  // For registration flow, skip device selection entirely
  // Navigation to Step 2 is handled in useEffect above
  return null;
}
```

**Error Fixed:** Previously, device selection was shown during registration, causing confusion. Now registration and authentication flows are completely separate.

---

#### Step 2: Register Device

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep2Register`

**Purpose:** User provides device name and registers TOTP device with PingOne.

**Process:**
1. User enters device name (optional - defaults to "TOTP Device - {username}")
2. Click "Register Device" button
3. System calls `MFAServiceV8.registerDevice()` with TOTP-specific parameters
4. PingOne creates device and returns `secret` and `keyUri` in `properties` object
5. Navigate to Step 3 (QR code display)

**Critical Code:**
```typescript
const handleRegisterDevice = async () => {
  setIsLoading(true);
  try {
    // Get registration parameters from controller
    const registrationParams = controller.getDeviceRegistrationParams(
      credentials,
      adminDeviceStatus // 'ACTIVE' or 'ACTIVATION_REQUIRED'
    );

    // Register device with PingOne
    const result = await MFAServiceV8.registerDevice({
      ...credentials,
      ...registrationParams,
      type: 'TOTP',
    } as SendOTPParams);

    // Extract secret and keyUri from response
    // Try multiple locations: result.secret, result.keyUri, result.properties.secret, etc.
    const secret = result.secret || 
                   (result as any).properties?.secret || 
                   (result as any).totpResult?.secret;
    const keyUri = result.keyUri || 
                   (result as any).properties?.keyUri || 
                   (result as any).totpResult?.qrCode;

    // Store in state and refs
    if (secret) {
      setTotpSecret(secret);
      setSecretReceivedAt(Date.now()); // Track expiration (30 minutes)
    }
    if (keyUri) {
      setQrCodeUrl(keyUri);
    }

    // Update mfaState
    setMfaState((prev) => ({
      ...prev,
      deviceId: result.deviceId,
      deviceStatus: result.status,
      totpSecret: secret,
      qrCodeUrl: keyUri,
      createdAt: result.createdAt, // For expiration check
    }));

    // Navigate to Step 3 (QR code)
    nav.markStepComplete();
    setShowModal(false); // Close Step 2 modal
    Promise.resolve().then(() => {
      setShowQrModal(true);
      nav.goToStep(3);
    });
  } catch (error) {
    // Handle errors...
  } finally {
    setIsLoading(false);
  }
};
```

**Critical Notes:**
- **Status Requirement:** Must use `status: "ACTIVATION_REQUIRED"` to get `secret` and `keyUri` in response
- **Policy Format:** Policy object must contain only `id` (not `type`) when ID is provided
- **Secret Expiration:** `secret` and `keyUri` expire after 30 minutes. Track `createdAt` timestamp
- **Multiple Sources:** Check `result.secret`, `result.keyUri`, `result.properties.secret`, `result.properties.keyUri` for data

**UI Contract:**
- Modal header: Green gradient background
- Max width: 550px
- Title: "Register TOTP Device"
- Subtitle: "Add a new authenticator app device"
- Body padding: `16px 20px`

---

#### Step 3: Scan QR Code & Activate

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep3QrCode`

**Purpose:** Display QR code for user to scan with authenticator app, and provide button to open separate activation modal if `ACTIVATION_REQUIRED`.

**Process:**
1. Display QR code generated from `keyUri` (using `QRCodeSVG` from `qrcode.react`)
2. Show manual entry fallback with copyable secret
3. If `ACTIVATION_REQUIRED`, show "Activate Device with OTP" button (opens separate activation modal)
4. User clicks button to open activation modal
5. In activation modal, user enters 6-digit code from authenticator app
6. System calls `MFAServiceV8.activateTOTPDevice()` to activate device
7. Both modals close and success page is shown

**Critical Code:**
```typescript
// Extract QR code data from multiple sources
const currentQrCodeUrl = 
  qrCodeUrl || 
  mfaState.qrCodeUrl || 
  mfaStateRef.current?.qrCodeUrl || 
  mfaStateRef.current?.keyUri || 
  '';

const currentTotpSecret = 
  totpSecret || 
  mfaState.totpSecret || 
  mfaStateRef.current?.totpSecret || 
  mfaStateRef.current?.secret || 
  '';

// Always show QR code if data is available, regardless of device status
const shouldShowQrCode = mfaState.deviceId && (currentQrCodeUrl || currentTotpSecret);
const isActivationRequired = mfaState.deviceStatus === 'ACTIVATION_REQUIRED';

// Activation handler (defined at component level, not in render callback)
// Uses refs to access latest props for activation modal
const activationPropsRef = React.useRef<{
  credentials: MFACredentials;
  mfaState: MFAState;
  setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void;
  nav: ReturnType<typeof useStepNavigationV8>;
  setIsLoading: (loading: boolean) => void;
} | null>(null);

const handleActivateDevice = useCallback(async () => {
  const props = activationPropsRef.current;
  if (!props) {
    console.error(`${MODULE_TAG} Activation props not available`);
    return;
  }
  
  if (!activationOtp || activationOtp.length !== otpLength) {
    setActivationError(`Please enter a valid ${otpLength}-digit code`);
    return;
  }

  if (!props.mfaState.deviceId) {
    setActivationError('Device ID is missing');
    return;
  }

  props.setIsLoading(true);
  setActivationError(null);

  try {
    const activationResult = await MFAServiceV8.activateTOTPDevice({
      environmentId: props.credentials.environmentId,
      username: props.credentials.username,
      deviceId: props.mfaState.deviceId,
      otp: activationOtp,
    });

    const updatedMfaState = {
      ...props.mfaState,
      deviceStatus: (activationResult.status as string) || 'ACTIVE',
    };
    props.setMfaState(updatedMfaState);

    // Clear activation OTP state
    setActivationOtp('');
    setActivationError(null);

    // Update mfaState ref so success page can access it
    mfaStateRef.current = {
      ...mfaStateRef.current,
      deviceStatus: updatedMfaState.deviceStatus,
    };

    // Clear activation OTP state
    setActivationOtp('');
    setActivationError(null);

    // Close activation modal FIRST
    setShowActivationModal(false);

    // CRITICAL: Prevent QR modal from reopening after successful activation
    userClosedQrModalRef.current = true;
    
    // Close QR modal if it's still open
    setShowQrModal(false);

    // For registration flow, navigate to Step 4 to show success page
    // Step 4 will render the success page when deviceStatus is ACTIVE
    props.nav.markStepComplete();
    props.nav.goToStep(4);
    
    toastV8.success('TOTP device activated successfully!');
    
    // Success page will render automatically when:
    // 1. deviceStatus is ACTIVE
    // 2. Both modals are closed (!showQrModal && !showActivationModal)
    // 3. We're on Step 3 or 4
    // The render logic at line 2097-2130 will show the success page
  } catch (error) {
    // On error: Stay on activation modal and show error message
    // Don't close modal, don't navigate away
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${MODULE_TAG} Failed to activate TOTP device:`, error);
    
    // Normalize error message for better UX
    const normalizedError = 
      errorMessage.toLowerCase().includes('invalid') ||
      errorMessage.toLowerCase().includes('incorrect') ||
      errorMessage.toLowerCase().includes('wrong') ||
      errorMessage.toLowerCase().includes('400') ||
      errorMessage.toLowerCase().includes('bad request')
        ? 'Invalid OTP code. Please try again.'
        : errorMessage;
    
    setActivationError(normalizedError);
    toastV8.error(`Activation failed: ${normalizedError}`);
    
    // Clear OTP input so user can try again
    setActivationOtp('');
  } finally {
    props.setIsLoading(false);
    setIsActivating(false);
  }
}, [activationOtp, otpLength]);
```

**QR Code Display:**
- Use `QRCodeSVG` component from `qrcode.react`
- Value: `keyUri` (otpauth://totp/... URI)
- Size: 256px
- Level: "M" (medium error correction)
- Include margin: true

**Manual Entry Section:**
- Expandable "Can't scan? Use manual setup" section
- Display secret key in monospace font
- Copy button with visual feedback (✓ Copied!)
- Step-by-step instructions for manual setup

**QR Code Modal UI Contract:**
- Modal header: Green gradient background
- Max width: 500px (reduced from 550px)
- Max height: 85vh
- Title: "Setup TOTP Device"
- Subtitle: "Scan the QR code with your authenticator app"
- Body padding: `16px 20px`
- QR code: 180px (reduced from 256px) with padding and border
- Manual entry: Collapsible details element (expanded by default)
- "Activate Device with OTP" button: Green button, centered, shown only if `ACTIVATION_REQUIRED`
- Button opens separate activation modal (`setShowActivationModal(true)`)
- Sticky footer with "Close" button
- Stuck device warning: Red warning box when `deviceStatus === 'ACTIVATION_REQUIRED'` AND `deviceId` exists

**Activation Modal UI Contract:**
- Separate modal (not embedded in QR modal)
- Modal header: Green gradient background (`linear-gradient(135deg, #10b981 0%, #059669 100%)`)
- Max width: 500px
- Max height: 85vh
- Title: "Activate TOTP Device"
- Subtitle: "Enter the 6-digit code from your authenticator app"
- Close button (X) in header top-right
- OTP input using `MFAOTPInput` component
- Error message display below OTP input (red background, red border)
- Info tip box (blue background) with instructions
- Sticky footer with "Cancel" and "Activate Device →" buttons
- "Activate Device →" button disabled until OTP length matches `otpLength`
- Scrollable body
- **On Successful Activation:**
  - Close activation modal
  - Close QR modal
  - Navigate to Step 4
  - Show success page (device status becomes ACTIVE)
  - Display success toast: "TOTP device activated successfully!"
- **On Activation Error:**
  - Stay on activation modal (do NOT close)
  - Display error message in red error box below OTP input
  - Clear OTP input so user can try again
  - Display error toast: "Activation failed: [error message]"
  - Error messages are normalized (e.g., "Invalid OTP code. Please try again.")

**Stuck Device Warning Implementation:**
```typescript
{/* Stuck Device Warning - Show when device is in ACTIVATION_REQUIRED status */}
{mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && mfaState.deviceId && (
  <div
    style={{
      marginTop: '20px',
      padding: '16px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
      <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
          Device Stuck in Activation Required
        </p>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#7f1d1d', lineHeight: '1.5' }}>
          This device is stuck in "ACTIVATION_REQUIRED" status and needs to be removed before you can start over. 
          Delete this device to return to the hub and register a new one.
        </p>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#991b1b', fontStyle: 'italic' }}>
          💡 <strong>Tip:</strong> If you need to delete multiple devices, use the "Delete All Devices" button below.
        </p>
      </div>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={async () => {
          // Delete device logic
          const confirmed = await uiNotificationServiceV8.confirm({
            title: 'Delete Device',
            message: 'Are you sure you want to delete this device? This will return you to the hub to start over.',
            confirmText: 'Delete Device',
            cancelText: 'Cancel',
            severity: 'danger',
          });
          if (!confirmed) return;
          
          setIsLoading(true);
          try {
            await MFAServiceV8.deleteDevice({
              environmentId: credentials.environmentId,
              username: credentials.username,
              deviceId: mfaState.deviceId,
            });
            toastV8.success('Device deleted successfully. You can now register a new device.');
            
            // Clear device state to allow new registration
            setMfaState((prev) => ({
              ...prev,
              deviceId: '',
              deviceStatus: '',
              totpSecret: '',
              qrCodeUrl: '',
              createdAt: undefined,
            }));
            
            // Reset auto-registration trigger so new device can be registered
            autoRegistrationTriggeredRef.current = false;
            
            // Clear QR code state variables
            setQrCodeUrl('');
            setTotpSecret('');
            
            // Reset modal close flag so QR modal can open again for new device
            userClosedQrModalRef.current = false;
            
            // Close QR modal and navigate to Step 2 to register a new device
            setShowQrModal(false);
            nav.goToStep(2);
          } catch (error) {
            toastV8.error(`Failed to delete device: ${error.message}`);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
        style={{
          flex: 1,
          minWidth: '140px',
          padding: '10px 16px',
          background: isLoading ? '#d1d5db' : '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? '🔄 Deleting...' : '🗑️ Delete Device'}
      </button>
      <button
        type="button"
        onClick={() => {
          navigate('/v8/delete-all-devices', {
            state: {
              environmentId: credentials.environmentId,
              username: credentials.username,
              deviceType: 'TOTP',
              deviceStatus: 'ACTIVATION_REQUIRED',
            },
          });
        }}
        style={{
          flex: 1,
          minWidth: '140px',
          padding: '10px 16px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        🗑️ Delete All Devices
      </button>
    </div>
  </div>
)}
```

**Critical Notes:**
- **Always Show QR Code:** QR code is displayed if data is available, regardless of device status
- **Expiration Check:** Secret/keyUri expire after 30 minutes. Check `createdAt` timestamp and show expired modal if needed
- **Auto-Open Modal:** Modal automatically opens when navigating to Step 3
- **Stuck Device Warning:** Automatically appears when device is in ACTIVATION_REQUIRED status, provides recovery options
- **Delete Device:** Uses `MFAServiceV8.deleteDevice()` with confirmation modal, clears state and navigates to Step 2 to register new device (continues flow, does NOT return to hub)
- **Delete All Devices:** Navigates to `/v8/delete-all-devices` with pre-filled state (environmentId, username, deviceType: 'TOTP', deviceStatus: 'ACTIVATION_REQUIRED')

---

#### Step 4: Validate OTP (Authentication)

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep4Validate`

**Purpose:** Validate OTP code from authenticator app during authentication flow (after device is already activated).

**Process:**
1. User enters 6-digit code from authenticator app
2. System calls `controller.validateOTP()` to validate with PingOne
3. On success, show success page or proceed with authentication

**UI Contract:**
- Modal header: Green gradient background
- Max width: 550px
- Title: "Validate OTP Code"
- Subtitle: "Enter the code from your authenticator app"
- Body padding: `16px 20px`

---

## TOTP Authentication Flow

### Flow Overview

1. **Device Selection** → User enters username, selects TOTP device (if multiple devices available)
2. **OTP Input** → User enters 6-digit code from authenticator app
3. **Validation** → System validates OTP with PingOne
4. **Success** → Authentication complete

### Step-by-Step Implementation

#### Step 1: Initialize Device Authentication

**Location:** `src/v8/services/mfaAuthenticationServiceV8.ts` → `initializeDeviceAuthentication()`

**Process:**
1. Call PingOne to initialize device authentication
2. Receive list of available devices
3. If `DEVICE_SELECTION_REQUIRED`, show device selector
4. If `OTP_REQUIRED`, proceed directly to OTP input

**Critical Code:**
```typescript
const authResult = await controller.initializeDeviceAuthentication(
  credentials,
  deviceId // Optional - omit to get list of devices
);

setMfaState((prev) => ({
  ...prev,
  deviceId: authResult.deviceId,
  authenticationId: authResult.authenticationId,
  deviceAuthId: authResult.authenticationId,
  nextStep: authResult.nextStep || '',
}));
```

---

#### Step 2: Select Device (if required)

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep1WithSelection`

**Process:**
1. Show list of available TOTP devices
2. User selects device
3. Call `MfaAuthenticationServiceV8.selectDeviceForAuthentication()`
4. Navigate to OTP validation

**Critical:** Only shown during authentication flow, never during registration.

---

#### Step 3: Validate OTP

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep4Validate`

**Process:**
1. User enters 6-digit code
2. Call `controller.validateOTP()` to validate with PingOne
3. On success, show success page

**Error Handling:**
- **LIMIT_EXCEEDED:** Show modal with cooldown information
- **INVALID_OTP:** Show error message, allow retry
- **Network errors:** Show user-friendly error message

---

## Critical JSON Request Bodies

### 1. Register TOTP Device

**Backend Endpoint:** `POST /api/pingone/mfa/register-device`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "username": "user@example.com",
  "type": "TOTP",
  "name": "TOTP Device - user@example.com",
  "nickname": "TOTP Device - user@example.com",
  "status": "ACTIVATION_REQUIRED",
  "policy": {
    "id": "policy-xxx"
  },
  "workerToken": "eyJhbGc...",
  "region": "us",
  "customDomain": "api.example.com"
}
```

**Request Body (Backend → PingOne):**
```json
{
  "type": "TOTP",
  "name": "TOTP Device - user@example.com",
  "nickname": "TOTP Device - user@example.com",
  "status": "ACTIVATION_REQUIRED",
  "policy": {
    "id": "policy-xxx"
  }
}
```

**Critical Notes:**
- `status` MUST be `"ACTIVATION_REQUIRED"` to receive `secret` and `keyUri` in response
- `policy` object must contain only `id` (not `type`) when ID is provided
- If no policy ID, can use `type: "DEFAULT"` (but TOTP flow always requires policy ID)

**Response:**
```json
{
  "id": "device-xxx",
  "type": "TOTP",
  "status": "ACTIVATION_REQUIRED",
  "properties": {
    "secret": "BASE32SECRET...",
    "keyUri": "otpauth://totp/example:user@example.com?secret=BASE32SECRET&issuer=example&algorithm=SHA1&digits=6&period=30"
  },
  "createdAt": "2025-01-05T12:00:00Z"
}
```

**Critical Notes:**
- `secret` and `keyUri` are in `properties` object
- `keyUri` is in standard `otpauth://totp/...` format (RFC 6238)
- `secret` and `keyUri` expire after 30 minutes from `createdAt` timestamp
- If expired, device must be deleted and recreated

---

### 2. Activate TOTP Device

**Backend Endpoint:** `POST /api/pingone/mfa/activate-totp-device`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}`

**Headers:**
```
Authorization: Bearer {workerToken}
Content-Type: application/vnd.pingidentity.device.activate+json
Accept: application/json
```

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "username": "user@example.com",
  "deviceId": "device-xxx",
  "otp": "123456",
  "workerToken": "eyJhbGc..."
}
```

**Request Body (Backend → PingOne):**
```json
{
  "otp": "123456"
}
```

**Response:**
```json
{
  "id": "device-xxx",
  "type": "TOTP",
  "status": "ACTIVE",
  "nickname": "TOTP Device - user@example.com"
}
```

**Critical Notes:**
- Content-Type header MUST be `application/vnd.pingidentity.device.activate+json`
- OTP must be exactly 6 digits
- Device status changes from `ACTIVATION_REQUIRED` → `ACTIVE` on success

---

### 3. Validate OTP (Authentication)

**Backend Endpoint:** `POST /api/pingone/mfa/validate-otp`  
**PingOne API:** `POST {authPath}/{environmentId}/deviceAuthentications/{deviceAuthId}`

**Headers:**
```
Authorization: Bearer {workerToken}
Content-Type: application/vnd.pingidentity.otp.check+json
Accept: application/json
```

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "deviceAuthId": "auth-xxx",
  "otp": "123456",
  "workerToken": "eyJhbGc..."
}
```

**Request Body (Backend → PingOne):**
```json
{
  "otp": "123456"
}
```

**Response:**
```json
{
  "id": "auth-xxx",
  "status": "COMPLETED",
  "nextStep": "COMPLETED"
}
```

**Critical Notes:**
- Content-Type header MUST be `application/vnd.pingidentity.otp.check+json`
- OTP must be exactly 6 digits
- On success, status becomes `COMPLETED`

---

## Errors Fixed and Solutions

### Error 1: Policy Validation Error

**Problem:**
- PingOne API returned: `"policy must contain either 'id' or 'type'. valid 'type'=[DEFAULT]"`
- We were sending `type: "DEVICE_AUTHENTICATION_POLICY"` along with `id`

**Solution:**
```typescript
// ❌ WRONG - Including type with id
params.policy = {
  id: credentials.deviceAuthenticationPolicyId,
  type: 'DEVICE_AUTHENTICATION_POLICY', // Causes validation error
};

// ✅ CORRECT - Only include id when provided
if (credentials.deviceAuthenticationPolicyId) {
  params.policy = {
    id: credentials.deviceAuthenticationPolicyId,
    // Do NOT include type when id is provided
  };
}
```

**Location:** 
- `src/v8/flows/controllers/TOTPFlowController.ts` → `getDeviceRegistrationParams()`
- `server.js` → `/api/pingone/mfa/register-device`

**Fixed:** Policy object now only includes `id` when provided. Type is only used if no ID is provided (`type: "DEFAULT"`).

---

### Error 2: Missing Secret and KeyUri in Response

**Problem:**
- `secret` and `keyUri` were not appearing in device registration response
- QR code could not be displayed

**Solution:**
```typescript
// ❌ WRONG - Using ACTIVE status
const params = {
  type: 'TOTP',
  status: 'ACTIVE', // Does not return secret/keyUri
};

// ✅ CORRECT - Always use ACTIVATION_REQUIRED
const params = {
  type: 'TOTP',
  status: 'ACTIVATION_REQUIRED', // Required to get secret/keyUri
};
```

**Location:** `src/v8/flows/controllers/TOTPFlowController.ts` → `getDeviceRegistrationParams()`

**Fixed:** TOTP devices are now always created with `ACTIVATION_REQUIRED` status to ensure `secret` and `keyUri` are returned.

**Additional Fix:** Check multiple locations in response for secret/keyUri:
- `result.secret` / `result.keyUri`
- `result.properties.secret` / `result.properties.keyUri`
- `result.totpResult.secret` / `result.totpResult.qrCode`

---

### Error 3: QR Code Not Displaying

**Problem:**
- QR code modal was not opening when navigating to Step 3
- Blank page appeared instead of QR code

**Solution:**
```typescript
// ✅ CORRECT - Auto-open QR modal when navigating to Step 3
React.useEffect(() => {
  if (currentStepRef.current === 3 && !showQrModal) {
    console.log(`${MODULE_TAG} Auto-opening Step 3 QR code modal.`);
    setShowQrModal(true);
  }
}, [showQrModal]);
```

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → Component level `useEffect`

**Fixed:** QR modal now automatically opens when navigating to Step 3.

---

### Error 4: Device Selection Shown During Registration

**Problem:**
- Device selection was appearing during registration flow
- User had to select a device even though they were registering a new one

**Solution:**
```typescript
// ✅ CORRECT - Skip device selection during registration
if (isConfiguredValue) {
  // For registration flow, skip device selection entirely
  // Registration and authentication are completely separate
  return null;
}
```

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep1WithSelection`

**Fixed:** Device selection is now completely skipped during registration flow. Registration and authentication flows are completely separate.

---

### Error 5: Secret/KeyUri Expiration Not Handled

**Problem:**
- Secret and keyUri expire after 30 minutes, but no expiration check was implemented
- Users could try to use expired QR codes

**Solution:**
```typescript
// ✅ CORRECT - Check expiration (30 minutes from createdAt)
const EXPIRATION_TIME_MS = 30 * 60 * 1000; // 30 minutes

React.useEffect(() => {
  const checkExpiration = () => {
    const currentMfaState = mfaStateRef.current;
    if (
      currentMfaState?.deviceId &&
      currentMfaState?.createdAt &&
      currentMfaState?.deviceStatus === 'ACTIVATION_REQUIRED'
    ) {
      const createdAt = new Date(currentMfaState.createdAt).getTime();
      const now = Date.now();
      const elapsed = now - createdAt;

      if (elapsed > EXPIRATION_TIME_MS) {
        setShowExpiredModal(true);
      }
    }
  };

  const interval = setInterval(checkExpiration, 60000); // Check every minute
  return () => clearInterval(interval);
}, [currentStepForExpiration, mfaStateForExpiration]);
```

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → Component level `useEffect`

**Fixed:** System now checks for secret/keyUri expiration and shows expired modal if 30 minutes have passed.

---

### Error 6: React setState During Render Warnings

**Problem:**
- React warnings: "Cannot update a component while rendering a different component"
- State updates were happening during render phase

**Solution:**
```typescript
// ❌ WRONG - setState during render
const renderStep3QrCode = (props) => {
  if (nav.currentStep === 3 && !showQrModal) {
    setShowQrModal(true); // State update during render
  }
  // ...
};

// ✅ CORRECT - Move to useEffect
React.useEffect(() => {
  if (currentStepRef.current === 3 && !showQrModal) {
    setShowQrModal(true);
  }
}, [showQrModal]);
```

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx`

**Fixed:** All state updates moved to `useEffect` hooks. Refs used to bridge render and effect phases.

---

### Error 7: LIMIT_EXCEEDED Error Not Handled

**Problem:**
- When device selection failed due to rate limiting, no user-friendly error was shown
- Error message was technical and not helpful

**Solution:**
```typescript
// ✅ CORRECT - Handle LIMIT_EXCEEDED error with modal
catch (error) {
  const errorWithCode = error as Error & { 
    errorCode?: string; 
    deliveryMethod?: string; 
    coolDownExpiresAt?: number 
  };
  
  if (errorWithCode.errorCode === 'LIMIT_EXCEEDED') {
    setLimitExceededError({
      message: errorMessage,
      deliveryMethod: errorWithCode.deliveryMethod,
      coolDownExpiresAt: errorWithCode.coolDownExpiresAt,
    });
  }
}
```

**Location:** 
- `src/v8/services/mfaAuthenticationServiceV8.ts` → `selectDeviceForAuthentication()`
- `src/v8/flows/types/TOTPFlowV8.tsx` → Error handling in `handleUseSelectedDevice()`

**Fixed:** LIMIT_EXCEEDED errors now show a user-friendly modal with cooldown information.

---

### Error 8: Blank Page on Step 2

**Problem:**
- Step 2 modal was not auto-opening, showing blank page
- User had to manually click to open modal

**Solution:**
```typescript
// ✅ CORRECT - Auto-open Step 2 modal
React.useEffect(() => {
  if (currentStepRef.current === 2 && !showModal) {
    console.log(`${MODULE_TAG} Auto-opening Step 2 registration modal.`);
    setShowModal(true);
  }
}, [showModal]);
```

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → Component level `useEffect`

**Fixed:** Step 2 modal now automatically opens when navigating to Step 2.

---

### Error 9: Modal Navigation Issues

**Problem:**
- Modals were not closing/opening correctly during navigation
- Step 2 modal stayed open when navigating to Step 3

**Solution:**
```typescript
// ✅ CORRECT - Close Step 2 modal before opening Step 3 modal
nav.markStepComplete();
setShowModal(false); // Close registration modal

Promise.resolve().then(() => {
  setShowQrModal(true); // Open QR modal
  nav.goToStep(3); // Navigate to Step 3
});
```

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `handleRegisterDevice()`

**Fixed:** Modal transitions now work correctly with proper state management.

---

## Implementation Files

### Frontend Files

**Flow Components:**
- `src/v8/flows/types/TOTPFlowV8.tsx` - Main TOTP registration and authentication flow
- `src/v8/flows/TOTPConfigurationPageV8.tsx` - TOTP configuration page
- `src/v8/flows/MFAAuthenticationMainPageV8.tsx` - TOTP authentication page

**UI Components:**
- `src/v8/components/TOTPExpiredModalV8.tsx` - Modal for expired secret/keyUri
- `src/v8/components/MFADeviceSelector.tsx` - Device selection component (authentication only)
- `src/v8/components/MFAOTPInput.tsx` - 6-digit OTP input component

**Services:**
- `src/v8/services/mfaServiceV8.ts` - TOTP device registration and activation
- `src/v8/services/mfaAuthenticationServiceV8.ts` - TOTP authentication and OTP validation
- `src/v8/flows/controllers/TOTPFlowController.ts` - TOTP flow controller

**Configuration:**
- `src/v8/services/mfaConfigurationServiceV8.ts` - TOTP configuration storage

### Backend Files

**API Endpoints:**
- `server.js` → `/api/pingone/mfa/register-device` - Device registration (handles TOTP)
- `server.js` → `/api/pingone/mfa/activate-totp-device` - TOTP device activation
- `server.js` → `/api/pingone/mfa/validate-otp` - OTP validation (authentication)
- `server.js` → `/api/pingone/mfa/select-device` - Device selection (authentication)

---

## Testing and Verification

### Manual Testing Checklist

**Registration Flow:**
- [ ] Configuration page loads and saves settings
- [ ] Step 0 validates inputs correctly
- [ ] Step 1 is skipped during registration (no device selection shown)
- [ ] Step 2 modal auto-opens and allows device registration
- [ ] Step 3 QR code displays correctly with `keyUri`
- [ ] Manual entry section shows secret with copy button
- [ ] Activation OTP input appears for `ACTIVATION_REQUIRED` devices
- [ ] Device activates successfully with correct OTP
- [ ] Success page displays correctly
- [ ] Secret/keyUri expiration check works (30 minutes)

**Authentication Flow:**
- [ ] Step 1 shows device selection (if multiple devices)
- [ ] Device selection works correctly
- [ ] OTP input modal appears
- [ ] OTP validation succeeds with correct code
- [ ] Error handling works for invalid OTP
- [ ] LIMIT_EXCEEDED error shows modal with cooldown

**Error Scenarios:**
- [ ] Invalid policy format shows clear error
- [ ] Missing secret/keyUri shows error message
- [ ] Expired secret/keyUri shows expired modal
- [ ] Invalid OTP shows error message
- [ ] Network errors handled gracefully
- [ ] LIMIT_EXCEEDED shows user-friendly modal

### API Testing

**Test Device Registration:**
```bash
curl -X POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices \
  -H "Authorization: Bearer {workerToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TOTP",
    "status": "ACTIVATION_REQUIRED",
    "name": "Test TOTP Device",
    "nickname": "Test TOTP Device",
    "policy": {
      "id": "{policyId}"
    }
  }'
```

**Verify:**
- Response includes `properties.secret` and `properties.keyUri`
- `keyUri` is in `otpauth://totp/...` format
- Device status is `ACTIVATION_REQUIRED`

**Test Device Activation:**
```bash
curl -X POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices/{deviceId} \
  -H "Authorization: Bearer {workerToken}" \
  -H "Content-Type: application/vnd.pingidentity.device.activate+json" \
  -d '{
    "otp": "123456"
  }'
```

**Verify:**
- Device status changes to `ACTIVE`
- Response includes device details

---

## Quick Reference: Correct Request Body Format

### Register TOTP Device (Most Critical)

**Frontend → Backend:**
```json
{
  "environmentId": "env-xxx",
  "username": "user@example.com",
  "type": "TOTP",
  "name": "TOTP Device - user@example.com",
  "nickname": "TOTP Device - user@example.com",
  "status": "ACTIVATION_REQUIRED",
  "policy": {
    "id": "policy-xxx"
  },
  "workerToken": "eyJhbGc...",
  "region": "us"
}
```

**Backend → PingOne:**
```json
{
  "type": "TOTP",
  "name": "TOTP Device - user@example.com",
  "nickname": "TOTP Device - user@example.com",
  "status": "ACTIVATION_REQUIRED",
  "policy": {
    "id": "policy-xxx"
  }
}
```

**Critical Notes:**
- `status` MUST be `"ACTIVATION_REQUIRED"` to get `secret` and `keyUri`
- `policy` object must contain only `id` (not `type`) when ID is provided
- Response includes `properties.secret` and `properties.keyUri`

---

## Version History

- **v1.2.0** (2026-01-06): Separated OTP activation into its own modal (not embedded in QR modal), updated activation handler to use refs, fixed success page display
- **v1.1.0** (2026-01-06): Added stuck device warning section with delete buttons implementation
- **v1.0.0** (2025-01-05): Initial comprehensive TOTP master document with all error fixes, correct JSON request bodies, and industry-standard compliance

---

## Notes

- **Status Requirement:** TOTP devices must be created with `status: "ACTIVATION_REQUIRED"` to receive `secret` and `keyUri` in response
- **Policy Format:** Policy object must contain only `id` (not `type`) when ID is provided. API expects either `id` or `type: "DEFAULT"`, not both
- **Activation Modal:** OTP activation is now in a separate modal (not embedded in QR modal). Button in QR modal opens activation modal.
- **Success Page:** Shows after activation when both QR modal and activation modal are closed and device status is ACTIVE
- **Secret Expiration:** `secret` and `keyUri` expire after 30 minutes from device creation. If expired, device must be deleted and recreated
- **QR Code Format:** `keyUri` is in standard `otpauth://totp/...` format (RFC 6238) and can be rendered directly as QR code
- **Registration vs Authentication:** Registration and authentication flows are completely separate. Device selection is only shown during authentication, never during registration
- **Industry Standards:** TOTP flow follows industry standards (Google Authenticator, Authy, Microsoft Authenticator) with QR code, manual entry fallback, and 6-digit codes
- **Multiple Data Sources:** Always check multiple locations in API response for `secret` and `keyUri`: `result.secret`, `result.keyUri`, `result.properties.secret`, `result.properties.keyUri`
- **Stuck Device Recovery:** When device is stuck in ACTIVATION_REQUIRED status, warning section appears with delete options to recover and start over

