# MFA OTP/TOTP Master Document

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Purpose:** Comprehensive reference for OTP (SMS/Email/WhatsApp) and TOTP device registration and authentication implementation  
**Usage:** Use this document to restore correct implementations when OTP/TOTP flows break or regress

---

## Table of Contents

1. [Overview](#overview)
2. [Related Documentation](#related-documentation)
3. [OTP Registration Flow](#otp-registration-flow)
4. [TOTP Registration Flow](#totp-registration-flow)
5. [OTP Authentication Flow](#otp-authentication-flow)
6. [Critical JSON Request Bodies](#critical-json-request-bodies)
7. [Errors Fixed and Solutions](#errors-fixed-and-solutions)
8. [Implementation Files](#implementation-files)
9. [Testing and Verification](#testing-and-verification)

---

## Overview

This document provides a comprehensive reference for OTP (SMS/Email/WhatsApp) and TOTP device registration and authentication flows in the MFA system. It includes:

- Correct JSON request body formats for all OTP/TOTP API calls
- Detailed error fixes and solutions
- Step-by-step implementation guidance
- Reference to UI documentation and contracts

**Key Principle:** OTP flows support both Admin (worker token) and User (OAuth) flows. TOTP supports Admin/User flow selection. Device names default to device type on Step 2. OTP validation errors are normalized to user-friendly messages.

---

## Related Documentation

- **UI Contract:** [`docs/MFA_STATE_PRESERVATION_UI_CONTRACT.md`](./MFA_STATE_PRESERVATION_UI_CONTRACT.md) - UI structure, state preservation, and modal contracts
- **API Reference:** [`docs/MFA_API_REFERENCE.md`](./MFA_API_REFERENCE.md) - Complete API endpoint documentation

---

## OTP Registration Flow

### Flow Overview

**SMS/Email/WhatsApp Flows:**
1. **Configuration Page** → User configures OTP settings
2. **Step 0** → User selects Admin/User flow, enters credentials
3. **Step 1** → Device selection (if multiple devices available)
4. **Step 2** → Device registration (phone number/email/WhatsApp)
5. **Step 3** → OTP sent, user enters OTP code
6. **Step 4** → OTP validation
7. **Success Page** → Registration complete

### Step-by-Step Implementation

#### Step 0: Configuration and Flow Selection

**Location:** `src/v8/flows/types/SMSFlowV8.tsx`, `EmailFlowV8.tsx`, `WhatsAppFlowV8.tsx`

**Critical:** Must support both Admin and User flows.

```typescript
// Admin Flow: Uses worker token
const registrationFlowType = 'admin';
const tokenType = 'worker';

// User Flow: Uses OAuth authentication
const registrationFlowType = 'user';
const tokenType = 'user';
```

**Error Fixed:** Previously, flows only supported admin flow. Now all OTP flows support both admin and user flows with proper OAuth integration.

#### Step 2: Device Registration

**Location:** `src/v8/flows/types/SMSFlowV8.tsx` → `renderStep2Register()`

**Critical:** Device name must default to device type, not previous value.

```typescript
// ✅ CORRECT - Reset device name to device type on Step 2
const step2DeviceNameResetRef = useRef<{ step: number; deviceType: string } | null>(null);

const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
  const { credentials, setCredentials } = props;
  
  // Reset device name to device type when entering Step 2
  if (step2DeviceNameResetRef.current?.step !== nav.currentStep || 
      step2DeviceNameResetRef.current?.deviceType !== validDeviceType) {
    setCredentials((prev) => ({
      ...prev,
      deviceName: validDeviceType, // SMS, EMAIL, or WHATSAPP
    }));
    step2DeviceNameResetRef.current = {
      step: nav.currentStep,
      deviceType: validDeviceType,
    };
  }
  
  // ... rest of registration UI
}, [nav.currentStep, validDeviceType]);
```

**Error Fixed:** Previously, device name persisted from previous registrations, causing confusion. Now device name always defaults to device type (SMS, EMAIL, or WHATSAPP) when entering Step 2.

#### Step 3: OTP Sent

**Location:** `src/v8/flows/types/SMSFlowV8.tsx` → `renderStep3OtpSent()`

**Critical:** Must handle both `ACTIVE` and `ACTIVATION_REQUIRED` device statuses.

```typescript
// For ACTIVE devices: Show success page immediately
if (mfaState.deviceStatus === 'ACTIVE' && deviceRegisteredActive) {
  return <MFASuccessPageV8 ... />;
}

// For ACTIVATION_REQUIRED devices: Show OTP input
if (mfaState.deviceStatus === 'ACTIVATION_REQUIRED') {
  return (
    <div>
      <OTPInput ... />
      <button onClick={handleValidateOTP}>Validate OTP</button>
    </div>
  );
}
```

**Error Fixed:** Previously, ACTIVE devices still showed OTP input. Now ACTIVE devices show success page immediately.

#### Step 4: OTP Validation

**Location:** `src/v8/flows/types/SMSFlowV8.tsx` → `createRenderStep4()`

**Critical:** Must normalize error messages and handle resend correctly.

```typescript
// ✅ CORRECT - Normalize error messages
const validateOTP = async () => {
  try {
    const result = await controller.validateOTP(...);
    if (result.valid || result.status === 'COMPLETED') {
      // Success
      return true;
    } else {
      // Normalize error message
      const errorMsg = result.message || 'Invalid OTP code';
      const userFriendlyError = 
        errorMsg.toLowerCase().includes('invalid') ||
        errorMsg.toLowerCase().includes('incorrect') ||
        errorMsg.toLowerCase().includes('wrong') ||
        errorMsg.toLowerCase().includes('400') ||
        errorMsg.toLowerCase().includes('bad request')
          ? 'OTP code invalid'
          : errorMsg;
      
      setValidationState({
        validationAttempts: validationState.validationAttempts + 1,
        lastValidationError: userFriendlyError,
      });
      return false;
    }
  } catch (error) {
    // Handle errors
  }
};

// ✅ CORRECT - Resend OTP based on device status
const handleResendOTP = async () => {
  if (mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && mfaState.deviceId) {
    // Use resendPairingCode for ACTIVATION_REQUIRED devices
    await MFAServiceV8.resendPairingCode({
      environmentId: credentials.environmentId,
      username: credentials.username,
      deviceId: mfaState.deviceId,
      region: credentials.region,
      customDomain: credentials.customDomain,
    });
  } else {
    // Use sendOTP for ACTIVE devices (device authentication flow)
    await controller.sendOTP(...);
  }
};
```

**Error Fixed:** 
1. Previously, error messages were not normalized, showing technical errors to users. Now all invalid OTP errors show "OTP code invalid".
2. Previously, resend used wrong API for ACTIVATION_REQUIRED devices. Now resend uses `resendPairingCode` for ACTIVATION_REQUIRED and `sendOTP` for ACTIVE devices.

---

## TOTP Registration Flow

### Flow Overview

1. **Configuration Page** → User configures TOTP settings
2. **Step 0** → User selects Admin/User flow, enters credentials
3. **Step 1** → Device selection (if multiple devices available)
4. **Step 2** → Device registration (device name)
5. **Step 3** → QR code display and OTP activation (if ACTIVATION_REQUIRED)
6. **Step 4** → OTP validation (if ACTIVATION_REQUIRED)
7. **Success Page** → Registration complete

### Step-by-Step Implementation

#### Step 0: Configuration and Flow Selection

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx`

**Critical:** Must support both Admin and User flows with device status selection.

```typescript
const [registrationFlowType, setRegistrationFlowType] = useState<'admin' | 'user'>('admin');
const [adminDeviceStatus, setAdminDeviceStatus] = useState<'ACTIVE' | 'ACTIVATION_REQUIRED'>('ACTIVATION_REQUIRED');

// Determine device status based on flow type
const deviceStatus = registrationFlowType === 'admin' 
  ? adminDeviceStatus 
  : 'ACTIVATION_REQUIRED'; // User flows always require activation
```

**Error Fixed:** Previously, TOTP only supported admin flow. Now TOTP supports both admin and user flows with proper device status handling.

#### Step 2: Device Registration

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep2Register()`

**Critical:** Device name must default to "TOTP", not previous value.

```typescript
// ✅ CORRECT - Reset device name to "TOTP" on Step 2
const step2DeviceNameResetRef = useRef<{ step: number; deviceType: string } | null>(null);

const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
  const { credentials, setCredentials } = props;
  
  // Reset device name to "TOTP" when entering Step 2
  if (step2DeviceNameResetRef.current?.step !== nav.currentStep) {
    setCredentials((prev) => ({
      ...prev,
      deviceName: 'TOTP',
    }));
    step2DeviceNameResetRef.current = {
      step: nav.currentStep,
      deviceType: 'TOTP',
    };
  }
  
  // ... rest of registration UI
}, [nav.currentStep]);
```

**Error Fixed:** Previously, device name persisted from previous registrations. Now device name always defaults to "TOTP" when entering Step 2.

#### Step 3: QR Code Display

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep3QrCode()`

**Critical:** Must handle both `ACTIVE` and `ACTIVATION_REQUIRED` device statuses.

```typescript
// For ACTIVE devices: Show success page immediately
if (mfaState.deviceStatus === 'ACTIVE' && deviceRegisteredActive) {
  return <MFASuccessPageV8 ... />;
}

// For ACTIVATION_REQUIRED devices: Show QR code and OTP input
if (mfaState.deviceStatus === 'ACTIVATION_REQUIRED') {
  return (
    <div>
      <QRCodeDisplay qrCode={mfaState.qrCode} secret={mfaState.secret} />
      <OTPInput 
        value={activationOtp}
        onChange={setActivationOtp}
        maxLength={config.otpCodeLength} // Configurable (6-10 digits)
      />
      <button onClick={handleValidateActivationOTP}>Validate OTP</button>
    </div>
  );
}
```

**Error Fixed:** Previously, ACTIVE devices still showed QR code and OTP input. Now ACTIVE devices show success page immediately.

#### Step 4: OTP Validation

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx` → `renderStep4Validate()`

**Critical:** Must use configurable OTP length and normalize error messages.

```typescript
// ✅ CORRECT - Use configurable OTP length
const config = MFAConfigurationServiceV8.loadConfiguration();
const otpCodeLength = config.otpCodeLength; // 6, 7, 8, 9, or 10

// ✅ CORRECT - Normalize error messages
const validateOTP = async () => {
  try {
    const result = await controller.validateOTP(...);
    if (result.valid || result.status === 'COMPLETED') {
      // Success
      return true;
    } else {
      // Normalize error message
      const userFriendlyError = 'OTP code invalid';
      setValidationState({
        validationAttempts: validationState.validationAttempts + 1,
        lastValidationError: userFriendlyError,
      });
      return false;
    }
  } catch (error) {
    // Handle errors
  }
};
```

**Error Fixed:** Previously, OTP length was hardcoded to 6. Now OTP length is configurable (6-10 digits) and error messages are normalized.

---

## OTP Authentication Flow

### Flow Overview

1. **Device Selection** → User enters username, selects device
2. **OTP Sent** → System sends OTP to device
3. **OTP Input** → User enters OTP code
4. **OTP Validation** → System validates OTP
5. **Success** → Authentication complete, access token returned

### Step-by-Step Implementation

#### Step 1: Initialize Device Authentication

**Location:** `src/v8/services/mfaAuthenticationServiceV8.ts` → `initializeDeviceAuthentication()`

**Critical:** Must include `region` and `customDomain` in request body.

```typescript
const requestBody = {
  environmentId,
  username: username || userId, // Backend resolves userId from username
  // deviceId: undefined, // Omit to get list of devices
  deviceAuthenticationPolicyId,
  workerToken,
  region, // REQUIRED for correct PingOne URL
  customDomain, // Optional - overrides region if provided
  customNotification: customNotification || undefined,
};
```

**Error Fixed:** Previously, `region` and `customDomain` were missing, causing incorrect PingOne URL construction. Now we always include these parameters.

#### Step 2: Send OTP

**Location:** `src/v8/services/mfaServiceV8.ts` → `sendOTP()`

**Critical:** Must include `region` and `customDomain` in request body.

```typescript
const initRequestBody = {
  environmentId: params.environmentId,
  username: params.username,
  deviceId: params.deviceId,
  deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
  workerToken: accessToken.trim(),
  region: params.region, // REQUIRED
  customDomain: params.customDomain, // Optional
};
```

**Error Fixed:** Previously, `region` and `customDomain` were missing, causing incorrect PingOne URL construction. Now we always include these parameters.

#### Step 3: Validate OTP

**Location:** `src/v8/services/mfaAuthenticationServiceV8.ts` → `validateOTP()`

**Critical:** Must normalize error messages and use correct endpoint.

```typescript
// ✅ CORRECT - Normalize error messages
const result = await validateOTP(...);
if (!result.valid && result.status !== 'COMPLETED') {
  const errorMsg = result.message || 'Invalid OTP code';
  const userFriendlyError = 
    errorMsg.toLowerCase().includes('invalid') ||
    errorMsg.toLowerCase().includes('incorrect') ||
    errorMsg.toLowerCase().includes('wrong') ||
    errorMsg.toLowerCase().includes('400') ||
    errorMsg.toLowerCase().includes('bad request')
      ? 'OTP code invalid'
      : errorMsg;
  
  throw new Error(userFriendlyError);
}
```

**Error Fixed:** Previously, error messages were not normalized, showing technical errors to users. Now all invalid OTP errors show "OTP code invalid".

---

## Critical JSON Request Bodies

### 1. Register OTP Device (SMS/Email/WhatsApp)

**Backend Endpoint:** `POST /api/pingone/mfa/register-device`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "userId": "user-xxx",
  "type": "SMS" | "EMAIL" | "WHATSAPP",
  "phone": "+12345678900",  // For SMS/WhatsApp
  "email": "user@example.com",  // For EMAIL
  "name": "My Device",
  "nickname": "My Phone",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",  // For Admin flow
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
  "type": "SMS" | "EMAIL" | "WHATSAPP",
  "phone": "+12345678900",  // For SMS/WhatsApp
  "email": "user@example.com",  // For EMAIL
  "name": "My Device",
  "nickname": "My Phone",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",  // For Admin flow
  "policy": {
    "id": "policy-xxx"
  }
}
```

**Response:**
```json
{
  "id": "device-xxx",
  "type": "SMS" | "EMAIL" | "WHATSAPP",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",
  "phone": "+12345678900",  // For SMS/WhatsApp
  "email": "user@example.com",  // For EMAIL
  "name": "My Device",
  "nickname": "My Phone"
}
```

**Critical Notes:**
- `status` field is only used for Admin flow (ACTIVE or ACTIVATION_REQUIRED)
- User flows always create devices with ACTIVATION_REQUIRED status
- `region` and `customDomain` are required for correct PingOne URL construction

---

### 2. Register TOTP Device

**Backend Endpoint:** `POST /api/pingone/mfa/register-device`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "userId": "user-xxx",
  "type": "TOTP",
  "name": "TOTP",
  "nickname": "TOTP Device",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",  // For Admin flow
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
  "name": "TOTP",
  "nickname": "TOTP Device",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",  // For Admin flow
  "policy": {
    "id": "policy-xxx"
  }
}
```

**Response:**
```json
{
  "id": "device-xxx",
  "type": "TOTP",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",
  "name": "TOTP",
  "nickname": "TOTP Device",
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Critical Notes:**
- `status` field is only used for Admin flow (ACTIVE or ACTIVATION_REQUIRED)
- User flows always create devices with ACTIVATION_REQUIRED status
- `qrCode` and `secret` are returned for activation

---

### 3. Send OTP Code

**Backend Endpoint:** `POST /api/pingone/mfa/send-otp`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/otp`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "userId": "user-xxx",
  "deviceId": "device-xxx",
  "workerToken": "eyJhbGc...",
  "region": "us",
  "customDomain": "api.example.com"
}
```

**Request Body (Backend → PingOne):**
```json
{}
```

**Response:**
```
204 No Content
```

**Critical Notes:**
- Request body to PingOne is empty (`{}`)
- No Content-Type header needed (PingOne API requirement)
- `region` and `customDomain` are required for correct PingOne URL construction

---

### 4. Resend Pairing Code (ACTIVATION_REQUIRED devices)

**Backend Endpoint:** `POST /api/pingone/mfa/resend-pairing-code`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}`  
**Content-Type:** `application/vnd.pingidentity.device.resend-pairing-code+json`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "username": "user@example.com",
  "deviceId": "device-xxx",
  "region": "us",
  "customDomain": "api.example.com"
}
```

**Request Body (Backend → PingOne):**
```json
{}
```

**Response:**
```
204 No Content
```

**Critical Notes:**
- This endpoint is ONLY for ACTIVATION_REQUIRED devices
- Request body to PingOne is empty (`{}`)
- Content-Type header must be `application/vnd.pingidentity.device.resend-pairing-code+json`
- Backend resolves `userId` from `username` automatically
- `region` and `customDomain` are required for correct PingOne URL construction

**Error Fixed:** Previously, resend used `sendOTP` endpoint for ACTIVATION_REQUIRED devices, causing 400 Bad Request errors. Now we use the dedicated `resend-pairing-code` endpoint.

---

### 5. Validate OTP Code

**Backend Endpoint:** `POST /api/pingone/mfa/validate-otp`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/otp/check`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "userId": "user-xxx",
  "deviceId": "device-xxx",
  "otp": "123456",
  "workerToken": "eyJhbGc...",
  "region": "us",
  "customDomain": "api.example.com"
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
  "status": "VALID" | "INVALID",
  "message": "OTP verified successfully" | "Invalid OTP code",
  "attemptsRemaining": 3
}
```

**Critical Notes:**
- OTP length is configurable (6-10 digits)
- `attemptsRemaining` indicates how many attempts left before lockout
- Error messages are normalized to "OTP code invalid" for user-friendly display

---

### 6. Validate OTP via Device Authentication (MFA v1)

**Backend Endpoint:** `POST /api/pingone/mfa/complete`  
**PingOne API:** `POST {authPath}/{environmentId}/deviceAuthentications/{deviceAuthId}/otp/check`  
**Content-Type:** `application/vnd.pingidentity.otp.check+json`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "deviceAuthId": "auth-xxx",
  "otp": "123456",
  "workerToken": "eyJhbGc...",
  "region": "us",
  "customDomain": "auth.example.com"
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
  "status": "COMPLETED" | "OTP_REQUIRED",
  "nextStep": "COMPLETE" | "OTP_REQUIRED",
  "access_token": "eyJhbGc...",  // If completed
  "token_type": "Bearer",
  "expires_in": 3600,
  "_links": {
    "complete": { "href": "/deviceAuthentications/{id}/complete" }
  }
}
```

**Critical Notes:**
- This is the MFA v1 API endpoint (uses `authPath`)
- Returns access token if authentication is completed
- Use `otpCheckUrl` from `_links['otp.check']` if available
- Content-Type header must be `application/vnd.pingidentity.otp.check+json`

---

## Errors Fixed and Solutions

### Error 1: Device Name Not Defaulting to Device Type

**Problem:**
- Device name persisted from previous registrations
- Users had to manually clear device name each time
- Caused confusion and extra clicks

**Solution:**
```typescript
// ✅ CORRECT - Reset device name to device type on Step 2
const step2DeviceNameResetRef = useRef<{ step: number; deviceType: string } | null>(null);

const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
  const { credentials, setCredentials } = props;
  
  // Reset device name when entering Step 2
  if (step2DeviceNameResetRef.current?.step !== nav.currentStep || 
      step2DeviceNameResetRef.current?.deviceType !== validDeviceType) {
    setCredentials((prev) => ({
      ...prev,
      deviceName: validDeviceType, // SMS, EMAIL, WHATSAPP, or TOTP
    }));
    step2DeviceNameResetRef.current = {
      step: nav.currentStep,
      deviceType: validDeviceType,
    };
  }
}, [nav.currentStep, validDeviceType]);
```

**Location:** `src/v8/flows/types/SMSFlowV8.tsx`, `EmailFlowV8.tsx`, `WhatsAppFlowV8.tsx`, `TOTPFlowV8.tsx`

**Fixed:** Device name now always defaults to device type (SMS, EMAIL, WHATSAPP, or TOTP) when entering Step 2.

---

### Error 2: Resend OTP Using Wrong API for ACTIVATION_REQUIRED Devices

**Problem:**
- Resend button used `sendOTP` endpoint for ACTIVATION_REQUIRED devices
- This caused 400 Bad Request errors
- Users couldn't resend activation codes

**Solution:**
```typescript
// ✅ CORRECT - Use resendPairingCode for ACTIVATION_REQUIRED devices
const handleResendOTP = async () => {
  if (mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && mfaState.deviceId) {
    // Use resendPairingCode endpoint for ACTIVATION_REQUIRED devices
    await MFAServiceV8.resendPairingCode({
      environmentId: credentials.environmentId,
      username: credentials.username,
      deviceId: mfaState.deviceId,
      region: credentials.region,
      customDomain: credentials.customDomain,
    });
    toastV8.success('OTP code resent successfully!');
  } else {
    // Use sendOTP for ACTIVE devices (device authentication flow)
    await controller.sendOTP(...);
    toastV8.success('OTP code resent successfully!');
  }
};
```

**Location:** `src/v8/flows/types/SMSFlowV8.tsx`, `EmailFlowV8.tsx`, `WhatsAppFlowV8.tsx`

**Fixed:** Resend now uses `resendPairingCode` endpoint for ACTIVATION_REQUIRED devices and `sendOTP` for ACTIVE devices.

---

### Error 3: OTP Validation Error Messages Not User-Friendly

**Problem:**
- Error messages showed technical details (e.g., "400 Bad Request", "Invalid OTP code")
- Users saw confusing error messages
- No consistent error messaging

**Solution:**
```typescript
// ✅ CORRECT - Normalize error messages
const validateOTP = async () => {
  try {
    const result = await controller.validateOTP(...);
    if (result.valid || result.status === 'COMPLETED') {
      // Success
      return true;
    } else {
      // Normalize error message
      const errorMsg = result.message || 'Invalid OTP code';
      const userFriendlyError = 
        errorMsg.toLowerCase().includes('invalid') ||
        errorMsg.toLowerCase().includes('incorrect') ||
        errorMsg.toLowerCase().includes('wrong') ||
        errorMsg.toLowerCase().includes('400') ||
        errorMsg.toLowerCase().includes('bad request')
          ? 'OTP code invalid'
          : errorMsg;
      
      setValidationState({
        validationAttempts: validationState.validationAttempts + 1,
        lastValidationError: userFriendlyError,
      });
      nav.setValidationErrors([userFriendlyError]);
      toastV8.error(userFriendlyError);
      return false;
    }
  } catch (error) {
    // Handle errors
  }
};
```

**Location:** `src/v8/flows/controllers/MFAFlowController.ts` → `validateOTP()`, `validateOTPForDevice()`

**Fixed:** All invalid OTP errors now show "OTP code invalid" for consistent, user-friendly messaging.

---

### Error 4: Missing `region` and `customDomain` Parameters

**Problem:**
- `region` and `customDomain` were not being passed to API calls
- This caused incorrect PingOne URL construction
- API calls failed with 404 Not Found errors

**Solution:**
```typescript
// ✅ CORRECT - Include region and customDomain in all API calls
const requestBody = {
  environmentId,
  username: username || userId,
  deviceId: params.deviceId,
  workerToken: accessToken.trim(),
  region: credentials.region, // REQUIRED
  customDomain: credentials.customDomain, // Optional
};
```

**Location:** Multiple files - all OTP/TOTP API calls

**Fixed:** `region` and `customDomain` are now always included in API calls.

---

### Error 5: ACTIVE Devices Showing OTP Input Instead of Success Page

**Problem:**
- ACTIVE devices (pre-activated) still showed OTP input
- Users had to click through unnecessary steps
- Confusing user experience

**Solution:**
```typescript
// ✅ CORRECT - Show success page immediately for ACTIVE devices
if (mfaState.deviceStatus === 'ACTIVE' && deviceRegisteredActive) {
  return <MFASuccessPageV8 ... />;
}

// Only show OTP input for ACTIVATION_REQUIRED devices
if (mfaState.deviceStatus === 'ACTIVATION_REQUIRED') {
  return (
    <div>
      <OTPInput ... />
      <button onClick={handleValidateOTP}>Validate OTP</button>
    </div>
  );
}
```

**Location:** `src/v8/flows/types/SMSFlowV8.tsx`, `EmailFlowV8.tsx`, `WhatsAppFlowV8.tsx`, `TOTPFlowV8.tsx`

**Fixed:** ACTIVE devices now show success page immediately, skipping OTP input step.

---

### Error 6: Hardcoded OTP Length

**Problem:**
- OTP length was hardcoded to 6 digits
- Configuration setting for OTP length was ignored
- Users couldn't use different OTP lengths

**Solution:**
```typescript
// ✅ CORRECT - Use configurable OTP length
const config = MFAConfigurationServiceV8.loadConfiguration();
const otpCodeLength = config.otpCodeLength; // 6, 7, 8, 9, or 10

<OTPInput 
  value={otpCode}
  onChange={setOtpCode}
  maxLength={otpCodeLength} // Use configurable length
  placeholder={`Enter ${otpCodeLength}-digit code`}
/>
```

**Location:** `src/v8/flows/types/SMSFlowV8.tsx`, `EmailFlowV8.tsx`, `WhatsAppFlowV8.tsx`, `TOTPFlowV8.tsx`

**Fixed:** OTP length is now configurable (6-10 digits) and used throughout all OTP flows.

---

### Error 7: WhatsApp Success Page Not Showing

**Problem:**
- WhatsApp admin-ACTIVE flow only showed toast message
- No success page displayed
- No documentation button available

**Solution:**
```typescript
// ✅ CORRECT - Set deviceRegisteredActive and show success page
const handleRegisterDevice = async () => {
  try {
    const result = await controller.registerDevice(...);
    if (result.status === 'ACTIVE') {
      setDeviceRegisteredActive(true);
      setShowRegisterModal(false);
      // Success page will be rendered automatically
    }
  } catch (error) {
    // Handle errors
  }
};

// In renderStep2Register:
if (mfaState.deviceStatus === 'ACTIVE' && deviceRegisteredActive) {
  return <MFASuccessPageV8 ... />;
}
```

**Location:** `src/v8/flows/types/WhatsAppFlowV8.tsx`

**Fixed:** WhatsApp ACTIVE devices now show full success page with documentation button.

---

### Error 8: TOTP Admin/User Flow Selection Missing

**Problem:**
- TOTP only supported admin flow
- No way to select user flow
- No device status selection for admin flow

**Solution:**
```typescript
// ✅ CORRECT - Add Admin/User flow selection
const [registrationFlowType, setRegistrationFlowType] = useState<'admin' | 'user'>('admin');
const [adminDeviceStatus, setAdminDeviceStatus] = useState<'ACTIVE' | 'ACTIVATION_REQUIRED'>('ACTIVATION_REQUIRED');

// Determine device status based on flow type
const deviceStatus = registrationFlowType === 'admin' 
  ? adminDeviceStatus 
  : 'ACTIVATION_REQUIRED'; // User flows always require activation
```

**Location:** `src/v8/flows/types/TOTPFlowV8.tsx`

**Fixed:** TOTP now supports both admin and user flows with device status selection.

---

## Implementation Files

### Frontend Files

**Flow Components:**
- `src/v8/flows/types/SMSFlowV8.tsx` - SMS registration flow
- `src/v8/flows/types/EmailFlowV8.tsx` - Email registration flow
- `src/v8/flows/types/WhatsAppFlowV8.tsx` - WhatsApp registration flow
- `src/v8/flows/types/TOTPFlowV8.tsx` - TOTP registration flow
- `src/v8/flows/MFAAuthenticationMainPageV8.tsx` - OTP authentication page

**Controllers:**
- `src/v8/flows/controllers/MFAFlowController.ts` - Base OTP flow controller
- `src/v8/flows/controllers/TOTPFlowController.ts` - TOTP-specific controller

**Services:**
- `src/v8/services/mfaServiceV8.ts` - OTP/TOTP device registration, send OTP, resend pairing code
- `src/v8/services/mfaAuthenticationServiceV8.ts` - OTP authentication and validation
- `src/v8/services/mfaConfigurationServiceV8.ts` - OTP/TOTP configuration storage

**Components:**
- `src/v8/components/MFAOTPInput.tsx` - Reusable OTP input component
- `src/v8/components/MFASuccessPageV8.tsx` - Unified success page

### Backend Files

**API Endpoints:**
- `server.js` → `/api/pingone/mfa/register-device` - Device registration
- `server.js` → `/api/pingone/mfa/send-otp` - Send OTP code
- `server.js` → `/api/pingone/mfa/resend-pairing-code` - Resend pairing code (ACTIVATION_REQUIRED)
- `server.js` → `/api/pingone/mfa/validate-otp` - Validate OTP code
- `server.js` → `/api/pingone/mfa/complete` - Validate OTP via device authentication (MFA v1)

---

## Testing and Verification

### Manual Testing Checklist

**Registration Flow:**
- [ ] Configuration page loads and saves settings
- [ ] Step 0 validates inputs correctly
- [ ] Step 1 checks for existing devices
- [ ] Step 2 device name defaults to device type
- [ ] Step 3 OTP sent correctly (or success page for ACTIVE)
- [ ] Step 4 OTP validation works
- [ ] Success page displays correctly

**Authentication Flow:**
- [ ] Device selection works correctly
- [ ] OTP sent correctly
- [ ] OTP validation succeeds
- [ ] Access token returned on success

**Error Scenarios:**
- [ ] Invalid OTP shows "OTP code invalid" message
- [ ] Resend works for ACTIVATION_REQUIRED devices
- [ ] Resend works for ACTIVE devices
- [ ] Device name resets correctly on Step 2
- [ ] ACTIVE devices show success page immediately

### API Testing

**Test Resend Pairing Code:**
```bash
curl -X POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices/{deviceId} \
  -H "Authorization: Bearer {workerToken}" \
  -H "Content-Type: application/vnd.pingidentity.device.resend-pairing-code+json" \
  -d '{}'
```

**Verify:**
- Request body is empty (`{}`)
- Content-Type header is correct
- Endpoint is correct (no `/otp` suffix)
- Backend resolves `userId` from `username`

---

## Quick Reference: Correct Request Body Formats

### Resend Pairing Code (Most Critical)

**Frontend → Backend:**
```json
{
  "environmentId": "env-xxx",
  "username": "user@example.com",
  "deviceId": "device-xxx",
  "region": "us",
  "customDomain": "api.example.com"
}
```

**Backend → PingOne:**
```json
{}
```

**Headers:**
```
Authorization: Bearer {workerToken}
Content-Type: application/vnd.pingidentity.device.resend-pairing-code+json
```

**Endpoint:**
```
POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}
```

**Critical Notes:**
- Request body to PingOne is empty (`{}`)
- Content-Type header must be `application/vnd.pingidentity.device.resend-pairing-code+json`
- Endpoint does NOT include `/otp` or `/resend` - it's the device update endpoint with special Content-Type
- Backend resolves `userId` from `username` automatically
- Only use for ACTIVATION_REQUIRED devices

---

## Version History

- **v1.0.0** (2025-01-XX): Initial comprehensive OTP/TOTP master document with all error fixes and correct JSON request bodies

---

## Notes

- **Device Name Default:** Device name always defaults to device type (SMS, EMAIL, WHATSAPP, or TOTP) when entering Step 2.
- **Resend OTP:** Use `resendPairingCode` for ACTIVATION_REQUIRED devices, `sendOTP` for ACTIVE devices.
- **Error Messages:** All invalid OTP errors are normalized to "OTP code invalid" for user-friendly display.
- **OTP Length:** OTP length is configurable (6-10 digits) via `MFAConfigurationServiceV8`.
- **ACTIVE Devices:** ACTIVE devices show success page immediately, skipping OTP input step.
- **Region/Custom Domain:** Always include `region` and `customDomain` in API calls for correct PingOne URL construction.
- **Admin/User Flows:** All OTP flows support both admin and user flows. TOTP supports device status selection for admin flow.

