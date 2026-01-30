# SMS Registration Flow - UI Contract

## Overview

This document defines the UI contract for SMS device registration in the Unified MFA Flow. It covers all three flow types: Admin, Admin with Activation Required, and User Login Flow.

## Flow Types Summary

| Flow Type | Device Status | Requires OTP | Token Used | Use Case |
|-----------|--------------|--------------|------------|----------|
| **Admin** | `ACTIVE` | No | Worker Token | Admin pre-registers device for user (immediately usable) |
| **Admin Activation Required** | `ACTIVATION_REQUIRED` | Yes | Worker Token | Admin registers device, user verifies with OTP |
| **User** | `ACTIVATION_REQUIRED` | Yes | Worker Token* | User self-registers after OAuth authentication |

> *Note: ALL API calls use Worker Token. User Token is only for OAuth authentication flow, not API calls.

---

## Step-by-Step Flow

### Step 0: Device Registration Form

**Component:** `UnifiedDeviceRegistrationForm`

#### Pre-loaded from Storage (NOT shown on form)
The following values are retrieved from localStorage/sessionStorage and are **not** displayed as input fields:
- `environmentId` - from `mfa_environmentId` in storage
- `username` - from `mfa_username` in storage
- `workerToken` - from `mfa_workerToken` in storage

#### UI Elements
```
+------------------------------------------------------------------+
|  Register MFA Device                          [API Comparison]   |
|  Select a device type and enter the required information         |
+------------------------------------------------------------------+
|                                                                  |
|  REGISTRATION FLOW TYPE                                          |
|  +------------------------------------------------------------+  |
|  | ( ) Admin Flow (Direct Registration)                       |  |
|  |     Register device directly as admin. Device is           |  |
|  |     immediately active and ready to use.                   |  |
|  +------------------------------------------------------------+  |
|  | ( ) Admin Flow with Activation Required                    |  |
|  |     Register device as admin, but require user activation  |  |
|  |     (OTP verification) before it's active.                 |  |
|  +------------------------------------------------------------+  |
|  | ( ) User Flow (PingOne Authentication)                     |  |
|  |     User registers their own device. Redirects to PingOne  |  |
|  |     for authentication before registration.                |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  DEVICE TYPE TABS                                                |
|  [SMS*] [Email] [Authenticator] [Mobile Push] [WhatsApp] [FIDO2] |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  SMS OTP: Receive verification codes via SMS text message  |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  REQUIRED INFORMATION                                            |
|  +------------------------------------------------------------+  |
|  |  Phone Number *                                            |  |
|  |  [+1 v] [____(512) 520-1234____]                          |  |
|  |  Country code and phone number combined                    |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  OPTIONAL INFORMATION                                            |
|  +------------------------------------------------------------+  |
|  |  Device Name                                               |  |
|  |  [____My Phone____]                                        |  |
|  |  Maximum 50 characters                                     |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|                              [Cancel]  [Register SMS OTP ->]     |
+------------------------------------------------------------------+
```

#### Required Fields (from deviceFlowConfigs)
- `phoneNumber` (string) - Phone number without country code
- `countryCode` (string) - Country code with + prefix (e.g., "+1")

#### Optional Fields
- `deviceName` (string) - Max 50 characters
- `nickname` (string) - Max 100 characters

#### Validation Rules
- Phone: Valid phone number format
- Country code: Regex `/^\+\d{1,3}$/`
- Device name: Max 50 characters

#### On Submit Behavior by Flow Type

**Admin Flow:**
1. Call `MFAServiceV8.registerDevice()` with `status: "ACTIVE"`
2. Device is immediately usable
3. Skip activation step, go directly to Success

**Admin Activation Required Flow:**
1. Call `MFAServiceV8.registerDevice()` with `status: "ACTIVATION_REQUIRED"`
2. PingOne automatically sends OTP to phone
3. Proceed to Activation step

**User Flow:**
1. If not authenticated, redirect to PingOne OAuth
2. After OAuth, call `MFAServiceV8.registerDevice()` with `status: "ACTIVATION_REQUIRED"`
3. PingOne automatically sends OTP to phone
4. Proceed to Activation step

---

### Step 1: Activation (OTP Verification)

**Component:** `UnifiedActivationStep`

**Applicable:** Admin Activation Required & User Flow only (skipped for Admin Flow)

#### UI Elements
```
+------------------------------------------------------------------+
|  Activate SMS OTP Device                                         |
|  Complete the activation process.                                |
+------------------------------------------------------------------+
|                                                                  |
|  Verify Your Device                                              |
|  Enter the 6-digit code sent to your SMS OTP.                    |
|                                                                  |
|  One-Time Password                                               |
|  +------------------------------------------------------------+  |
|  |  [_0_][_0_][_0_][_0_][_0_][_0_]                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  [Resend Code]  (available after 60 second cooldown)            |
|                                                                  |
|  Validation attempts: 0                                          |
|                                                                  |
|                          [<- Previous]  [Verify Code]            |
+------------------------------------------------------------------+
```

#### OTP Input Rules
- 6 digits only (numeric)
- Auto-focus first field
- Auto-advance on complete entry
- Allow paste of 6-digit code

#### Resend OTP
- 60-second cooldown between resends
- Calls `MFAServiceV8.sendOTP()` (deprecated) or `MfaAuthenticationServiceV8.initializeDeviceAuthentication()`
- Resets OTP input on resend

#### Validation Flow
1. User enters 6-digit OTP
2. Call `MFAServiceV8.validateOTP()` with:
   - `deviceAuthId` (from registration response)
   - `otp` (user entered)
   - `otpCheckUrl` (if available from _links)
3. On success: Mark step complete, proceed to Success
4. On failure: Show error, clear input, increment attempt counter

---

### Step 2: Success

**Component:** `UnifiedSuccessStep`

#### UI Elements
```
+------------------------------------------------------------------+
|  Success!                                                        |
+------------------------------------------------------------------+
|                                                                  |
|                          [checkmark icon]                        |
|                                                                  |
|  SMS OTP Device Registered Successfully                          |
|                                                                  |
|  Device Details:                                                 |
|  - Device ID: abc123-def456-...                                 |
|  - Type: SMS                                                     |
|  - Phone: +1.5125201234                                         |
|  - Status: ACTIVE                                                |
|                                                                  |
|  Next Steps:                                                     |
|  - Your device is ready to use for authentication               |
|  - You can register additional devices from the MFA Hub         |
|                                                                  |
|                              [Register Another Device]           |
|                              [Return to MFA Hub]                 |
+------------------------------------------------------------------+
```

---

## API Contracts

### 1. Register Device API

**Endpoint:** `POST /api/pingone/mfa/register-device`

**Request:**
```json
{
  "environmentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "userId": "user-id-from-lookup",
  "type": "SMS",
  "phone": "+1.5125201234",
  "nickname": "My SMS Device",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",
  "workerToken": "eyJhbGc...",
  "tokenType": "worker",
  "notification": {
    "message": "",
    "variant": ""
  }
}
```

**Response (Success):**
```json
{
  "id": "device-id-abc123",
  "type": "SMS",
  "phone": "+1.5125201234",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",
  "nickname": "My SMS Device",
  "createdAt": "2026-01-30T12:34:56Z",
  "_links": {
    "activate": {
      "href": "/v1/environments/{envId}/users/{userId}/devices/{deviceId}"
    }
  }
}
```

**Phone Format:** `+{countryCode}.{phoneNumber}` (e.g., "+1.5125201234")

### 2. Validate OTP API

**Endpoint:** `POST /api/pingone/mfa/validate-otp-for-device` or `_links.otp.check.href`

**Request:**
```json
{
  "environmentId": "env-id",
  "authenticationId": "device-auth-id",
  "otp": "123456",
  "workerToken": "eyJhbGc..."
}
```

**Response (Success):**
```json
{
  "status": "COMPLETED",
  "message": "OTP validated successfully"
}
```

**Response (Failure):**
```json
{
  "status": "FAILED",
  "error": "Invalid OTP code"
}
```

### 3. Activate Device API (Alternative to validateOTP)

**Endpoint:** `POST /api/pingone/mfa/activate-device`

**Request:**
```json
{
  "environmentId": "env-id",
  "userId": "user-id",
  "deviceId": "device-id",
  "otp": "123456",
  "workerToken": "eyJhbGc..."
}
```

**PingOne API Call (by backend):**
```
POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}
Content-Type: application/vnd.pingidentity.device.activate+json

{
  "otp": "123456"
}
```

### 4. Resend OTP API (Initialize Device Authentication)

**Endpoint:** `POST /api/pingone/mfa/initialize-device-authentication`

**Request:**
```json
{
  "environmentId": "env-id",
  "userId": "user-id",
  "deviceId": "device-id",
  "workerToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "id": "auth-session-id",
  "status": "OTP_REQUIRED",
  "_links": {
    "otp.check": {
      "href": "https://api.pingone.com/v1/.../otp"
    }
  }
}
```

---

## Flow State Management

### MFA State Object
```typescript
interface MFAState {
  deviceId: string;           // From registration response
  deviceStatus: string;       // "ACTIVE" | "ACTIVATION_REQUIRED"
  otpCode: string;           // User-entered OTP
  otpCheckUrl?: string;      // From _links.otp.check.href
  deviceActivateUri?: string; // From _links.activate.href
  verificationResult: null | {
    valid: boolean;
    message?: string;
  };
  activatedAt?: string;      // ISO timestamp when activated
}
```

### Credentials Object
```typescript
interface MFACredentials {
  environmentId: string;   // From localStorage: mfa_environmentId
  clientId: string;        // From localStorage: mfa_clientId
  username: string;        // From localStorage: mfa_username
  workerToken: string;     // From localStorage: mfa_workerToken
  deviceType?: DeviceConfigKey;
  phoneNumber?: string;
  countryCode?: string;
  userToken?: string;      // Only for OAuth flow, NOT for API calls
}
```

#### Storage Keys
| Key | Description | Set By |
|-----|-------------|--------|
| `mfa_environmentId` | PingOne Environment ID | MFA Hub / Settings |
| `mfa_clientId` | PingOne Client ID | MFA Hub / Settings |
| `mfa_username` | Target user's username | User Lookup step |
| `mfa_workerToken` | Worker token for API auth | Token generation |
| `mfa_saved_phoneNumber` | Pre-filled phone number | Previous registration |
| `mfa_saved_countryCode` | Pre-filled country code | Previous registration |
| `mfa_saved_email` | Pre-filled email | Previous registration |

---

## Error Handling

### Registration Errors
| Error | User Message | Action |
|-------|--------------|--------|
| Invalid phone format | "Please enter a valid phone number" | Show inline error, focus field |
| User not found | "User not found. Please check the username." | Show toast error |
| Token expired | "Session expired. Please refresh your token." | Show token warning banner |
| Duplicate device | "This phone number is already registered" | Show toast error |

### Activation Errors
| Error | User Message | Action |
|-------|--------------|--------|
| Invalid OTP | "Invalid code. Please try again." | Clear input, show error |
| OTP expired | "Code expired. Request a new one." | Enable resend button |
| Max attempts | "Too many attempts. Please wait." | Disable input, show countdown |

---

## Differences Between Current and Expected Behavior

### Issues Fixed (2026-01-30):

1. **Device Registration shows form twice** - DeviceTypeSelectionScreen and renderStep0 both show UnifiedDeviceRegistrationForm
   - **FIXED:** Added `initialDeviceType` prop to pre-select device type

2. **OTP Validation uses wrong method** - `validateOTP` expects `deviceAuthId` but we only have `deviceId` from registration
   - **FIXED:** Now uses `activateDevice()` for registration activation flow
   - **validateOTP** is for authentication flows (when user already has an active device)
   - **activateDevice** is for activating newly registered devices

3. **Resend OTP Flow** - Uses deprecated `sendOTP()` method
   - **FIXED:** Now uses `resendPairingCode()` which is the correct method for ACTIVATION_REQUIRED devices

4. **Admin Flow doesn't skip activation** - Always showed activation step even for ACTIVE devices
   - **FIXED:** Now skips to success step when device status is ACTIVE

### Current Implementation (After Fixes):

1. **Activation Step uses `activateDevice()`:**
```typescript
const result = await MFAServiceV8.activateDevice({
  environmentId: credentials.environmentId,
  username: credentials.username,
  deviceId: mfaState.deviceId,
  otp,
});
```

2. **Admin Flow (ACTIVE status) skips to success:**
```typescript
if (result.status === 'ACTIVE') {
  props.nav.markStepComplete();
  props.nav.goToStep(2); // Skip to success step
} else if (result.status === 'ACTIVATION_REQUIRED') {
  props.nav.goToNext(); // Go to activation step
}
```

3. **Resend uses `resendPairingCode()`:**
```typescript
await MFAServiceV8.resendPairingCode({
  environmentId: credentials.environmentId,
  username: credentials.username,
  deviceId: mfaState.deviceId,
});
```

### Completed Work (2026-01-30):

1. **User Flow OAuth Integration:** ✅ IMPLEMENTED
   - Uses `UserLoginModalV8` for OAuth authentication
   - When user selects "User Flow" and clicks submit, modal opens for PingOne login
   - After successful OAuth, continues with device registration using user token

2. **API Call Tracking:** ✅ IMPLEMENTED
   - All MFA API calls (`registerDevice`, `activateDevice`, `resendPairingCode`) are tracked
   - `SuperSimpleApiDisplayV8` component displays tracked calls with `flowFilter="mfa"`

3. **Phone Number Formatting:** ✅ IMPLEMENTED
   - Form sends separate `phoneNumber` and `countryCode` fields
   - Must be formatted into single `phone` field for API

4. **Credentials Sync:** ✅ IMPLEMENTED
   - Configuration screen saves to both localStorage AND CredentialsServiceV8
   - MFAFlowBase reads from CredentialsServiceV8

5. **Field Mapping:** ✅ IMPLEMENTED
   - Form field `deviceName` → API fields `nickname` and `name`
   - Form fields `phoneNumber` + `countryCode` → API field `phone`

---

## Working Implementation Patterns

> **IMPORTANT:** These patterns are proven to work for SMS and should be used as templates for Email, WhatsApp, TOTP, and other device types.

### Pattern 1: Credentials Sync (DeviceTypeSelectionScreen)

The configuration screen must save credentials to BOTH localStorage AND CredentialsServiceV8:

```typescript
// Sync environment ID to global service and CredentialsServiceV8 when it changes
useEffect(() => {
  if (environmentId) {
    globalEnvironmentService.setEnvironmentId(environmentId);
    localStorage.setItem('mfa_environmentId', environmentId);
    // Also save to CredentialsServiceV8 for MFAFlowBase to read
    const currentCreds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
      flowKey: 'mfa-flow-v8',
      flowType: 'oidc',
      includeClientSecret: false,
      includeRedirectUri: false,
      includeLogoutUri: false,
      includeScopes: false,
    });
    CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
      ...currentCreds,
      environmentId,
    });
  }
}, [environmentId]);

// Save username to localStorage and CredentialsServiceV8 when it changes
useEffect(() => {
  if (username) {
    localStorage.setItem('mfa_unified_username', username);
    localStorage.setItem('mfa_username', username);
    // Also save to CredentialsServiceV8 for MFAFlowBase to read
    const currentCreds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
      flowKey: 'mfa-flow-v8',
      flowType: 'oidc',
      includeClientSecret: false,
      includeRedirectUri: false,
      includeLogoutUri: false,
      includeScopes: false,
    });
    CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
      ...currentCreds,
      username,
    });
  }
}, [username]);
```

### Pattern 2: Field Mapping (performRegistrationWithToken)

Form fields must be mapped to API field names before calling registerDevice:

```typescript
// Map form field names to API field names
// Form uses 'deviceName' but API expects 'nickname' or 'name'
const mappedFields: Record<string, string> = { ...fields };
if (mappedFields.deviceName) {
  mappedFields.nickname = mappedFields.deviceName;
  mappedFields.name = mappedFields.deviceName;
  delete mappedFields.deviceName;
}

// Format phone number for SMS/WhatsApp devices
// Form sends: { phoneNumber: '9725231586', countryCode: '+1' }
// API expects: { phone: '+1.9725231586' }
if (mappedFields.phoneNumber && mappedFields.countryCode) {
  const countryCode = mappedFields.countryCode.replace('+', ''); // Remove + for formatting
  const phoneNumber = mappedFields.phoneNumber.replace(/\D/g, ''); // Remove non-digits
  mappedFields.phone = `+${countryCode}.${phoneNumber}`;
  console.log('[UNIFIED-FLOW] Formatted phone:', mappedFields.phone);
  delete mappedFields.phoneNumber;
  delete mappedFields.countryCode;
}

// Include device-specific fields (phone, email, etc.)
const deviceParams = {
  ...baseParams,
  ...mappedFields,
};
```

### Pattern 3: User Flow OAuth (performRegistration)

For User Flow, check if OAuth is needed before registration:

```typescript
const performRegistration = useCallback(
  async (
    props: MFAFlowBaseRenderProps,
    selectedDeviceType: DeviceConfigKey,
    fields: Record<string, string>,
    flowType: string
  ) => {
    // For User Flow, check if we need OAuth authentication first
    if (flowType === 'user' && !userToken) {
      console.log('[UNIFIED-FLOW] User flow selected but no token - showing OAuth modal');

      // Store pending registration data
      setPendingRegistration({
        deviceType: selectedDeviceType,
        fields,
        flowType,
        props,
      });

      // Show the user login modal
      setShowUserLoginModal(true);
      toastV8.info('User Flow requires PingOne authentication. Please log in to continue.');
      return;
    }

    // Proceed with registration (using existing token for user flow)
    await performRegistrationWithToken(props, selectedDeviceType, fields, flowType, userToken || undefined);
  },
  [userToken, performRegistrationWithToken]
);
```

### Pattern 4: Device Status by Flow Type

```typescript
// CRITICAL: Flow-specific device status
// - Admin flow: ACTIVE (no OTP sent, device ready immediately)
// - Admin ACTIVATION_REQUIRED: ACTIVATION_REQUIRED (sends OTP for admin to activate)
// - User flow: ACTIVATION_REQUIRED (sends OTP for user to activate)
let deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED';
if (flowType === 'admin') {
  deviceStatus = 'ACTIVE';
} else if (flowType === 'admin_activation_required') {
  deviceStatus = 'ACTIVATION_REQUIRED';
} else {
  deviceStatus = 'ACTIVATION_REQUIRED'; // user flow
}
```

### Pattern 5: Registration Parameters

```typescript
const baseParams = {
  environmentId: props.credentials.environmentId,
  username: props.credentials.username,
  type: selectedDeviceType,  // 'SMS', 'EMAIL', 'TOTP', 'WHATSAPP', 'MOBILE', 'FIDO2'
  tokenType: flowType === 'user' ? 'user' : 'worker',
  userToken: flowType === 'user' ? token : undefined,
  status: deviceStatus,  // 'ACTIVE' or 'ACTIVATION_REQUIRED'
};
```

### Pattern 6: Device Config Structure

```typescript
// In deviceFlowConfigs.ts
const SMS_CONFIG: DeviceFlowConfig = {
  deviceType: 'SMS',
  displayName: 'SMS OTP',
  icon: '📱',
  description: 'Enhanced SMS OTP with database persistence...',
  educationalContent: `...markdown content...`,
  requiredFields: ['phoneNumber', 'countryCode'],  // Form field names
  optionalFields: ['deviceName', 'nickname'],      // Optional form fields
  validationRules: {
    phoneNumber: validatePhoneNumber,
    countryCode: validateCountryCode,
    deviceName: validateDeviceName,
    nickname: validateNickname,
  },
  apiEndpoints: {
    register: '/environments/{environmentId}/devices',
    activate: '/environments/{environmentId}/devices/{deviceId}/activate',
  },
  requiresOTP: true,
  defaultDeviceStatus: 'ACTIVATION_REQUIRED',
};
```

---

## Adapting for Other Device Types

### Email OTP
- Form fields: `email`, `deviceName`, `nickname`
- No phone formatting needed
- Field mapping: `deviceName` → `nickname`/`name`

### WhatsApp OTP
- Same as SMS: `phoneNumber`, `countryCode`, `deviceName`, `nickname`
- Same phone formatting: `+{countryCode}.{phoneNumber}`
- Field mapping: `deviceName` → `nickname`/`name`

### TOTP (Authenticator App)
- Form fields: `deviceName`, `nickname` (minimal - pairing done via QR code)
- No phone/email field
- Special handling: Returns `secret` and QR code data in registration response

### Mobile Push
- Form fields: `deviceName`, `nickname`
- Special handling: Returns pairing key/code for mobile app

### FIDO2 (Security Key)
- Form fields: `deviceName`, `nickname`
- Special handling: WebAuthn credential creation in browser

---

## Implementation Checklist

### Core Functionality
- [x] Fix activation step to use `activateDevice()` for registration flow
- [x] Add skip logic for Admin Flow (ACTIVE status)
- [x] Implement OAuth redirect for User Flow (via `UserLoginModalV8`)
- [x] Update resend OTP to use `resendPairingCode()` (non-deprecated method)
- [x] Add proper error handling for each API call
- [x] Add loading states during API calls
- [x] Add success/error toast notifications
- [x] Track API calls in SuperSimpleApiDisplayV8 (already implemented in `mfaServiceV8.ts`)

### Field Mapping & Formatting (CRITICAL)
- [x] Phone number formatting: `phoneNumber` + `countryCode` → `phone` (format: `+{code}.{number}`)
- [x] Device name mapping: `deviceName` → `nickname` and `name`
- [x] Credentials sync: Save to both localStorage AND CredentialsServiceV8
- [x] Nickname field in deviceFlowConfigs optionalFields array

### UI/UX
- [x] Container overflow handling (padding + overflow: hidden)
- [x] Pre-fill form fields from localStorage (phoneNumber, countryCode, email)
- [x] Dynamic form rendering via DynamicFormRenderer component

---

## Related Files

### Core Flow Files
| File | Purpose |
|------|---------|
| `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx` | Main flow component - contains performRegistration, performRegistrationWithToken, credentials sync |
| `src/v8/flows/unified/components/UnifiedDeviceRegistrationForm.tsx` | Registration form UI - flow type selection, device tabs, submit handler |
| `src/v8/flows/unified/components/DynamicFormRenderer.tsx` | Renders form fields dynamically based on deviceFlowConfigs |
| `src/v8/flows/unified/components/UnifiedActivationStep.tsx` | OTP activation step - 6-digit code entry, resend logic |
| `src/v8/flows/unified/components/UnifiedSuccessStep.tsx` | Success page - device details, next steps |

### Configuration Files
| File | Purpose |
|------|---------|
| `src/v8/config/deviceFlowConfigs.ts` | Device-specific configs - requiredFields, optionalFields, validationRules, apiEndpoints |
| `src/v8/config/deviceFlowConfigTypes.ts` | TypeScript types for device configs |

### Service Files
| File | Purpose |
|------|---------|
| `src/v8/services/mfaServiceV8.ts` | API service - registerDevice, activateDevice, resendPairingCode, lookupUserByUsername |
| `src/v8/services/credentialsServiceV8.ts` | Credentials storage - loadCredentials, saveCredentials |
| `src/v8/services/globalEnvironmentService.ts` | Global environment ID management |
| `src/v8/services/mfaTokenManagerV8.ts` | Worker token management |

### Component Files
| File | Purpose |
|------|---------|
| `src/v8/components/UserLoginModalV8.tsx` | OAuth authentication modal for User Flow |
| `src/v8/components/SuperSimpleApiDisplayV8.tsx` | API call tracking display |
| `src/v8/components/CountryCodePickerV8.tsx` | Country code dropdown for phone fields |
| `src/v8/components/EmailInputV8.tsx` | Email input with validation |

---

## Quick Reference: Key Code Locations

### Phone Formatting
`UnifiedMFARegistrationFlowV8.tsx` lines 1013-1023

### Field Mapping (deviceName → nickname)
`UnifiedMFARegistrationFlowV8.tsx` lines 1004-1011

### Credentials Sync
`UnifiedMFARegistrationFlowV8.tsx` lines 171-212

### User Flow OAuth Check
`UnifiedMFARegistrationFlowV8.tsx` lines 1071-1087

### Device Status by Flow Type
`UnifiedMFARegistrationFlowV8.tsx` lines 993-1001

### SMS Config
`deviceFlowConfigs.ts` SMS_CONFIG constant (around line 121)
