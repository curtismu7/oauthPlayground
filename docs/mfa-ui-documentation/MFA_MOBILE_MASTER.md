# MFA Mobile Master Document

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Purpose:** Comprehensive reference for Mobile device registration and authentication implementation  
**Usage:** Use this document to restore correct implementations when Mobile flows break or regress  
**Reference:** Based on [PingOne Sample Login Application](https://github.com/pingidentity/pingone-sample-login)

---

## Table of Contents

1. [Overview](#overview)
2. [Related Documentation](#related-documentation)
3. [Mobile Registration Flow](#mobile-registration-flow)
4. [Mobile Authentication Flow](#mobile-authentication-flow)
5. [PingOne Flow APIs Integration](#pingone-flow-apis-integration)
6. [Critical JSON Request Bodies](#critical-json-request-bodies)
7. [Errors Fixed and Solutions](#errors-fixed-and-solutions)
8. [Implementation Files](#implementation-files)
9. [Testing and Verification](#testing-and-verification)

---

## Overview

This document provides a comprehensive reference for Mobile device registration and authentication flows in the MFA system. It is based on the [PingOne Sample Login Application](https://github.com/pingidentity/pingone-sample-login) which demonstrates:

- Username and Password authentication
- Passwordless authentication
- One Time Passcodes (OTP)
- Mobile Push Notifications
- Expired Password Changes
- External Identity Providers
- Account Linking
- Custom Domains

**Key Principles:**
1. **Mobile as OTP Device Type:** Mobile devices use SMS-based OTP delivery, similar to SMS flow but with mobile-specific UI/UX patterns
2. **Flow API Integration:** Mobile flows leverage PingOne for Customers Flow APIs (`/flows`) for authentication
3. **Single Page App Pattern:** Mobile flows follow SPA (Single Page App) OAuth patterns with PKCE
4. **Device Registration:** Mobile devices are registered using the same API as SMS devices (`type: "SMS"` or `type: "MOBILE"`)
5. **OTP Delivery:** OTP codes are sent via SMS to the mobile phone number associated with the device

---

## Related Documentation

- **PingOne Sample Login:** [https://github.com/pingidentity/pingone-sample-login](https://github.com/pingidentity/pingone-sample-login)
- **PingOne Flow APIs:** [https://apidocs.pingidentity.com/pingone/platform/v1/api/#flows-1](https://apidocs.pingidentity.com/pingone/platform/v1/api/#flows-1)
- **PingOne Custom Domains:** [https://apidocs.pingidentity.com/pingone/platform/v1/api/#custom-domains](https://apidocs.pingidentity.com/pingone/platform/v1/api/#custom-domains)
- **UI Contract:** [`docs/MFA_STATE_PRESERVATION_UI_CONTRACT.md`](./MFA_STATE_PRESERVATION_UI_CONTRACT.md) - UI structure, state preservation, and modal contracts
- **API Reference:** [`docs/MFA_API_REFERENCE.md`](./MFA_API_REFERENCE.md) - Complete API endpoint documentation
- **SMS Flow Reference:** [`docs/MFA_OTP_TOTP_MASTER.md`](./MFA_OTP_TOTP_MASTER.md) - OTP flow patterns (SMS/Email/WhatsApp)

---

## Mobile Registration Flow

### Flow Overview

**Mobile Registration follows the same pattern as SMS registration:**

1. **Configuration Page** → User configures Mobile settings (phone number, country code, policy)
2. **Step 0** → User selects Admin/User flow, enters credentials
3. **Step 1** → Device selection (skipped in registration flow, goes directly to Step 2)
4. **Step 2** → Device registration form (phone number, device name if `promptForNicknameOnPairing` is enabled)
5. **Step 3** → Device registered, pairing code sent via SMS
6. **Step 4** → OTP validation modal (user enters code received via SMS)
7. **Step 5** → Success page with device details
8. **Step 6** → Documentation page

### Step-by-Step Implementation

#### Step 0: Configuration and Credentials

**Purpose:** User enters environment ID, username, and selects flow type (Admin/User)

**Key Fields:**
- Environment ID
- Username
- Device Authentication Policy ID
- Flow Type: Admin (worker token) or User (OAuth access token)
- Device Status (Admin only): ACTIVE or ACTIVATION_REQUIRED

**Navigation:**
- From: `/v8/mfa/register/mobile` (MobileOTPConfigurationPageV8)
- To: `/v8/mfa/register/mobile/device` (MobileFlowV8)

#### Step 1: Device Selection (Skipped in Registration)

**Purpose:** In registration flow, device selection is skipped. User goes directly to Step 2.

**Implementation:**
```typescript
// In MobileFlowV8.tsx
if (isConfigured && nav.currentStep === 1) {
    // Skip device selection, go directly to registration
    nav.goToStep(2);
    return null;
}
```

#### Step 2: Device Registration Form

**Purpose:** User enters phone number and optional device name

**Key Fields:**
- Phone Number (with country code picker)
- Device Name (optional, shown if `promptForNicknameOnPairing` is enabled in policy)

**API Call:**
- **Endpoint:** `POST /api/pingone/mfa/register-device`
- **Method:** Worker Token (Admin) or User Token (User flow)
- **Request Body:** See [Critical JSON Request Bodies](#critical-json-request-bodies)

**Response:**
- Device ID
- Device Status (ACTIVE or ACTIVATION_REQUIRED)
- Pairing code sent via SMS (if ACTIVATION_REQUIRED)

#### Step 3: Pairing Code Sent

**Purpose:** Confirmation that pairing code was sent via SMS

**UI Elements:**
- Success message: "Pairing code sent to your mobile device"
- Instructions: "Check your phone for the verification code"
- Continue button to proceed to OTP validation

#### Step 4: OTP Validation Modal

**Purpose:** User enters OTP code received via SMS

**Key Fields:**
- OTP Input (6 digits, auto-focus, auto-submit if enabled)
- Resend Code button
- Validation error display

**API Call:**
- **Endpoint:** `POST /api/pingone/mfa/activate-device`
- **Method:** Worker Token or User Token
- **Request Body:**
```json
{
  "environmentId": "env-id",
  "userId": "user-id",
  "deviceId": "device-id",
  "otp": "123456",
  "workerToken": "token" // or user token
}
```

**Response:**
- Device Status: ACTIVE
- Device details

#### Step 5: Success Page

**Purpose:** Display successful device registration

**UI Elements:**
- Success message
- Device details (ID, type, status, phone number)
- Continue button to documentation

#### Step 6: Documentation Page

**Purpose:** Display API documentation for the registration flow

**Content:**
- API calls made during registration
- Request/response examples
- Links to PingOne API documentation

---

## Mobile Authentication Flow

### Flow Overview

**Mobile Authentication follows the same pattern as SMS authentication:**

1. **MFA Hub** → User selects Mobile as MFA method
2. **Step 0** → User enters username (if not already authenticated)
3. **Step 1** → Device selection (list of registered Mobile devices)
4. **Step 2** → Send OTP to selected device
5. **Step 3** → OTP validation modal
6. **Step 4** → Authentication complete

### Step-by-Step Implementation

#### Step 0: Username Entry (if needed)

**Purpose:** User enters username for authentication

**Key Fields:**
- Username
- Environment ID (from credentials)

**Navigation:**
- From: MFA Hub (`/v8/mfa-hub`)
- To: Step 1 (Device Selection)

#### Step 1: Device Selection

**Purpose:** User selects which Mobile device to use for authentication

**API Call:**
- **Endpoint:** `GET /api/pingone/mfa/get-device` (list devices)
- **Method:** Worker Token or User Token
- **Response:** List of Mobile devices for the user

**UI Elements:**
- Device list (phone number, device name, status)
- "Register New Device" option
- Device selection buttons

#### Step 2: Send OTP

**Purpose:** Send OTP code to selected Mobile device

**API Call:**
- **Endpoint:** `POST /api/pingone/mfa/select-device`
- **Method:** Worker Token or User Token
- **Request Body:**
```json
{
  "environmentId": "env-id",
  "username": "username",
  "deviceId": "device-id",
  "workerToken": "token"
}
```

**Response:**
- Device Authentication ID
- OTP sent confirmation
- `_links.otp.check` URL for validation

#### Step 3: OTP Validation Modal

**Purpose:** User enters OTP code received via SMS

**Key Fields:**
- OTP Input (6 digits)
- Resend Code button
- Validation error display

**API Call:**
- **Endpoint:** `POST /api/pingone/mfa/validate-otp` or use `_links.otp.check` URL
- **Method:** Worker Token or User Token
- **Request Body:**
```json
{
  "otp": "123456",
  "deviceAuthenticationId": "auth-id"
}
```

**Response:**
- Validation status: VERIFIED or COMPLETED
- Authentication complete

#### Step 4: Authentication Complete

**Purpose:** Display successful authentication

**UI Elements:**
- Success message
- Continue button to return to application

---

## PingOne Flow APIs Integration

### Overview

The [PingOne Sample Login Application](https://github.com/pingidentity/pingone-sample-login) demonstrates integration with PingOne for Customers Flow APIs. Mobile flows can leverage these APIs for:

1. **Flow Initiation:** Start authentication flows
2. **Flow State Management:** Track flow progress
3. **User Interaction:** Handle user inputs (username, password, OTP)
4. **Flow Completion:** Complete authentication and receive tokens

### Flow API Endpoints

#### 1. Start Flow (Authorize)

**Endpoint:** `POST /api/pingone/redirectless/authorize`

**Request:**
```json
{
  "environmentId": "env-id",
  "clientId": "client-id",
  "clientSecret": "client-secret",
  "redirectUri": "https://app.com/callback",
  "scopes": "openid profile email",
  "responseType": "code",
  "responseMode": "pi.flow"
}
```

**Response:**
```json
{
  "flowId": "flow-id",
  "flowUrl": "https://auth.pingone.com/env-id/flows/flow-id"
}
```

#### 2. Get Flow State

**Endpoint:** `GET /api/pingone/flows/{flowId}`

**Response:**
```json
{
  "id": "flow-id",
  "status": "IN_PROGRESS",
  "currentStep": {
    "id": "step-id",
    "type": "USERNAME_PASSWORD"
  }
}
```

#### 3. Submit Flow Step

**Endpoint:** `POST /api/pingone/flows/{flowId}/steps/{stepId}`

**Request (Username/Password):**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Request (OTP):**
```json
{
  "otp": "123456"
}
```

**Response:**
```json
{
  "id": "flow-id",
  "status": "COMPLETED",
  "tokens": {
    "access_token": "token",
    "id_token": "id-token",
    "refresh_token": "refresh-token"
  }
}
```

### Integration Pattern

```typescript
// 1. Start flow
const authResponse = await fetch('/api/pingone/redirectless/authorize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    environmentId,
    clientId,
    redirectUri,
    responseType: 'code',
    responseMode: 'pi.flow'
  })
});
const { flowId } = await authResponse.json();

// 2. Get flow state
const flowResponse = await fetch(`/api/pingone/flows/${flowId}`);
const flow = await flowResponse.json();

// 3. Submit step (e.g., username/password)
if (flow.currentStep.type === 'USERNAME_PASSWORD') {
  await fetch(`/api/pingone/flows/${flowId}/steps/${flow.currentStep.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
}

// 4. Submit OTP step
if (flow.currentStep.type === 'OTP') {
  await fetch(`/api/pingone/flows/${flowId}/steps/${flow.currentStep.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp })
  });
}
```

---

## Critical JSON Request Bodies

### Mobile Device Registration (Admin Flow)

**Client → Backend:**
```json
{
  "environmentId": "env-id",
  "username": "user@example.com",
  "deviceType": "MOBILE",
  "phone": "+1234567890",
  "countryCode": "+1",
  "deviceName": "My Mobile Device",
  "deviceStatus": "ACTIVATION_REQUIRED",
  "deviceAuthenticationPolicyId": "policy-id",
  "workerToken": "worker-token"
}
```

**Backend → PingOne:**
```json
{
  "type": "SMS",
  "status": "ACTIVATION_REQUIRED",
  "phone": "+1234567890",
  "policy": {
    "id": "policy-id"
  }
}
```

**Critical Notes:**
- `type` can be `"SMS"` or `"MOBILE"` (both are valid for mobile devices)
- `status` MUST be `"ACTIVATION_REQUIRED"` to receive pairing code
- `phone` must include country code
- `policy` object must contain only `id` (not `type`) when ID is provided

### Mobile Device Registration (User Flow)

**Client → Backend:**
```json
{
  "environmentId": "env-id",
  "username": "user@example.com",
  "deviceType": "MOBILE",
  "phone": "+1234567890",
  "countryCode": "+1",
  "deviceName": "My Mobile Device",
  "userToken": "user-access-token"
}
```

**Backend → PingOne:**
```json
{
  "type": "SMS",
  "status": "ACTIVATION_REQUIRED",
  "phone": "+1234567890",
  "policy": {
    "id": "policy-id"
  }
}
```

**Critical Notes:**
- User flow always creates devices with `ACTIVATION_REQUIRED` status
- User token is used instead of worker token
- Same request body format as Admin flow

### Activate Mobile Device (OTP Validation)

**Client → Backend:**
```json
{
  "environmentId": "env-id",
  "userId": "user-id",
  "deviceId": "device-id",
  "otp": "123456",
  "workerToken": "worker-token"
}
```

**Backend → PingOne:**
```json
{
  "otp": "123456"
}
```

**Content-Type:** `application/vnd.pingidentity.device.activate+json`

**Critical Notes:**
- OTP must be 6 digits
- Device must be in `ACTIVATION_REQUIRED` status
- Response includes updated device with `ACTIVE` status

### Select Device for Authentication

**Client → Backend:**
```json
{
  "environmentId": "env-id",
  "username": "user@example.com",
  "deviceId": "device-id",
  "workerToken": "worker-token"
}
```

**Backend → PingOne:**
```json
{
  "device": {
    "id": "device-id"
  }
}
```

**Response:**
```json
{
  "id": "device-authentication-id",
  "status": "OTP_REQUIRED",
  "_links": {
    "otp.check": {
      "href": "https://api.pingone.com/v1/environments/env-id/deviceAuthentications/auth-id/passcode"
    }
  }
}
```

### Validate OTP for Authentication

**Client → Backend:**
```json
{
  "environmentId": "env-id",
  "username": "user@example.com",
  "authenticationId": "device-authentication-id",
  "otp": "123456",
  "otpCheckUrl": "https://api.pingone.com/v1/environments/env-id/deviceAuthentications/auth-id/passcode"
}
```

**Backend → PingOne:**
```json
{
  "otp": "123456",
  "deviceAuthenticationId": "device-authentication-id"
}
```

**Response:**
```json
{
  "id": "device-authentication-id",
  "status": "VERIFIED",
  "user": {
    "id": "user-id"
  },
  "device": {
    "id": "device-id",
    "type": "SMS"
  }
}
```

---

## Errors Fixed and Solutions

### Error 1: Mobile Device Type Not Recognized

**Error:** `Device type 'MOBILE' is not supported`

**Solution:** Ensure `MOBILE` is registered in `MFAFlowControllerFactory` and `MFAFlowComponentFactory`:

```typescript
// In MFAFlowControllerFactory.ts
case 'MOBILE':
    return new SMSFlowController(callbacks); // Uses SMS controller

// In MFAFlowComponentFactory.ts
MFAFlowComponentFactory.register('MOBILE', MobileFlowV8);
```

### Error 2: Mobile Routes Not Found

**Error:** `404 Not Found: /v8/mfa/register/mobile`

**Solution:** Ensure routes are defined in `App.tsx`:

```typescript
<Route path="/v8/mfa/register/mobile" element={<MobileOTPConfigurationPageV8 />} />
<Route path="/v8/mfa/register/mobile/device" element={<MobileFlowV8 />} />
<Route path="/v8/mfa/register/mobile/docs" element={<MobileRegistrationDocsPageV8 />} />
```

### Error 3: Mobile Device Registration Fails

**Error:** `Device registration failed: Validation Error`

**Solution:** Ensure request body includes:
- `type: "SMS"` or `type: "MOBILE"` (both are valid)
- `status: "ACTIVATION_REQUIRED"` for pairing code
- `phone` with country code
- `policy.id` (not `policy.type`)

### Error 4: OTP Not Received on Mobile

**Error:** User doesn't receive OTP code

**Solution:**
1. Verify phone number format includes country code
2. Check device status is `ACTIVATION_REQUIRED`
3. Verify SMS delivery method is enabled in policy
4. Check for `LIMIT_EXCEEDED` errors (cooldown period)

### Error 5: Mobile Flow Uses Wrong Controller

**Error:** Mobile flow behaves differently than expected

**Solution:** Ensure Mobile flow uses `SMSFlowController` (they share the same logic):

```typescript
// Mobile is SMS-based, so it uses SMS controller
case 'MOBILE':
    return new SMSFlowController(callbacks);
```

---

## Implementation Files

### Frontend Components

1. **`src/v8/flows/types/MobileFlowV8.tsx`**
   - Main Mobile flow component
   - Handles registration and authentication flows
   - Uses `SMSFlowController` for logic

2. **`src/v8/flows/types/MobileOTPConfigurationPageV8.tsx`**
   - Mobile configuration page
   - User enters credentials and selects flow type
   - Navigates to Mobile flow

3. **`src/v8/pages/MobileRegistrationDocsPageV8.tsx`**
   - Mobile registration documentation page
   - Displays API calls and examples

### Controllers and Factories

1. **`src/v8/flows/factories/MFAFlowControllerFactory.ts`**
   - Creates `SMSFlowController` for `MOBILE` device type

2. **`src/v8/flows/factories/MFAFlowComponentFactory.ts`**
   - Registers `MobileFlowV8` component for `MOBILE` device type

### Services

1. **`src/v8/services/mfaServiceV8.ts`**
   - `registerDevice()` - Registers Mobile device
   - `activateDevice()` - Activates device with OTP
   - `getDevice()` - Retrieves device details
   - `selectDevice()` - Selects device for authentication
   - `validateOTP()` - Validates OTP code

2. **`src/v8/services/mfaAuthenticationServiceV8.ts`**
   - `validateOTP()` - Validates OTP for authentication
   - `sendOTP()` - Sends OTP to device

### Backend Endpoints

1. **`server.js`**
   - `POST /api/pingone/mfa/register-device` - Register Mobile device
   - `POST /api/pingone/mfa/activate-device` - Activate device with OTP
   - `GET /api/pingone/mfa/get-device` - Get device details
   - `POST /api/pingone/mfa/select-device` - Select device for authentication
   - `POST /api/pingone/mfa/validate-otp` - Validate OTP

---

## Testing and Verification

### Registration Flow Test

1. Navigate to `/v8/mfa/register/mobile`
2. Enter environment ID, username, policy ID
3. Select "Admin Flow" or "User Flow"
4. Click "Proceed to Registration"
5. Enter phone number with country code
6. Enter device name (if prompted)
7. Click "Register Mobile Device"
8. Verify pairing code is sent via SMS
9. Enter OTP code received
10. Verify device is activated and status is `ACTIVE`

### Authentication Flow Test

1. Navigate to `/v8/mfa-hub`
2. Select "Mobile" as MFA method
3. Enter username (if not authenticated)
4. Select Mobile device from list
5. Verify OTP is sent to device
6. Enter OTP code received
7. Verify authentication is successful

### API Verification

1. Check API Display shows correct request/response bodies
2. Verify `Content-Type` headers are correct:
   - `application/vnd.pingidentity.device.activate+json` for activation
   - `application/json` for other endpoints
3. Verify device status transitions:
   - `ACTIVATION_REQUIRED` → `ACTIVE` (after OTP validation)

---

## Version History

- **v1.0.0** (2025-01-27): Initial Mobile master document based on PingOne Sample Login Application

---

## Notes

- **Mobile vs SMS:** Mobile devices use the same API as SMS devices (`type: "SMS"` or `type: "MOBILE"`). The difference is primarily in UI/UX and user experience.
- **Flow APIs:** Mobile flows can leverage PingOne Flow APIs for more advanced authentication patterns (username/password, passwordless, etc.)
- **OTP Delivery:** OTP codes are always delivered via SMS to the mobile phone number
- **Device Status:** Mobile devices follow the same status lifecycle as SMS devices (`ACTIVATION_REQUIRED` → `ACTIVE`)
- **Policy Settings:** Mobile devices respect the same policy settings as SMS devices (`promptForNicknameOnPairing`, `otp.failure.coolDown`, etc.)

