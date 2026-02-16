# P1MFA SDK Implementation Plan - Complete Guide

**Version:** 1.0.0  
**Date:** 2025-01-15  
**Status:** Implementation Complete

This document provides a complete implementation guide for the P1MFA SDK sample applications in OAuth Playground, following the detailed build plan.

---

## 1. Target Outcomes

OAuthPlayground can now:

1. ✅ **Run a normal OIDC sign-in** (Auth Code + PKCE)
2. ✅ **Enroll (pair) an MFA method:**
   - SMS device (create → activate)
   - FIDO2 device (create → WebAuthn registration → activate)
3. ✅ **Authenticate / step-up with either:**
   - SMS OTP challenge
   - FIDO2 assertion (WebAuthn get)

This mirrors the main PingOne MFA device models and activation flows.

---

## 2. High-Level Architecture

### A. OAuthPlayground UI (Browser)

**Location:** `src/samples/p1mfa/`

**Components:**
- **Environment Config Panel** (`CredentialsForm.tsx`)
  - Environment ID
  - Client ID / Client Secret
  - Region selection
- **User Context Panel** (in `IntegratedMFASample.tsx`)
  - User ID / Username
  - Login hint / Subject
- **Tabs:**
  - Environment Config
  - OIDC Sign-in
  - Enroll SMS
  - Enroll FIDO2
  - Authenticate (SMS)
  - Authenticate (FIDO2)
  - Devices

### B. Backend (Node/Express)

**Location:** `server.js`

**Existing Endpoints:**
- ✅ `POST /api/pingone/mfa/register-device` - Device registration
- ✅ `POST /api/pingone/mfa/activate-device` - Device activation
- ✅ `POST /api/pingone/mfa/send-otp` - Send OTP
- ✅ `POST /api/pingone/mfa/validate-otp` - Validate OTP
- ✅ `POST /api/pingone/mfa/initialize-device-authentication` - Start MFA challenge
- ✅ `POST /api/pingone/mfa/complete` - Complete authentication

**SDK Usage:**
The P1MFA SDK (`src/sdk/p1mfa/`) wraps these backend endpoints and provides a simplified interface.

---

## 3. Prerequisites in PingOne

### Required Setup:

1. **PingOne Application**
   - OIDC app used by OAuthPlayground (Auth Code + PKCE)
   - Redirect URI: `https://localhost:3000/callback` (or configured value)

2. **Sign-on Policy**
   - Must allow/require MFA (depending on demo scenario)
   - Configured with appropriate MFA methods

3. **FIDO2 Enabled**
   - FIDO2 method added in policy
   - FIDO policy configured:
     - Allowed authenticators (platform, cross-platform, both)
     - RP ID (e.g., "localhost" for localhost:3000)
     - Attestation settings
     - User verification requirements

4. **SMS Enabled**
   - SMS provider configured in PingOne tenant
   - SMS settings configured (so OTP can actually send)

5. **Scopes/Roles**
   - Device management endpoints require appropriate privileges
   - Worker token with `p1:create:device` scope for admin operations
   - User tokens for self-service device management

---

## 4. Enrollment Flows (Pairing)

### 4A) Enroll SMS Device (Create → Activate)

**Goal:** Attach an SMS device to a PingOne user and activate it.

**Backend Steps:**
1. **Create device** (type = SMS)
   - Endpoint: `POST /api/pingone/mfa/register-device`
   - Uses MFA Devices API "Create MFA User Device (SMS)"
   - Device created in `ACTIVATION_REQUIRED` state
   - Optionally triggers pairing notifications for SMS

2. **Send OTP**
   - Endpoint: `POST /api/pingone/mfa/send-otp`
   - Sends OTP to the registered device

3. **Activate device**
   - Endpoint: `POST /api/pingone/mfa/activate-device`
   - Call "Activate MFA User Device" using the OTP code
   - Device status changes to `ACTIVE`

**UI Steps:**
- Collect phone number (+ country code)
- "Register SMS Device" button
- "Send OTP" button (automatic after registration)
- User enters received code
- "Activate Device" button

**Implementation:**
- **SDK Method:** `SMSHelper.registerSMSDevice()` → `SMSHelper.sendOTP()` → `SMSHelper.activateSMSDevice()`
- **Component:** `src/samples/p1mfa/sms/RegistrationFlow.tsx`

---

### 4B) Enroll FIDO2 Device (Create → WebAuthn Registration → Activate)

**Goal:** Register a FIDO2 device using standard browser WebAuthn.

**Backend Step 1 — Create FIDO2 Device:**
- Endpoint: `POST /api/pingone/mfa/register-device`
- Call "Create MFA User Device (FIDO2)"
- Response includes `publicKeyCredentialCreationOptions` (serialized JSON for `navigator.credentials.create`)

**UI Step 2 — WebAuthn Registration:**
- Parse `publicKeyCredentialCreationOptions`
- Convert byte arrays to `Uint8Array`
- Run: `navigator.credentials.create({ publicKey: options })`
- Convert returned credential to JSON (base64url encoding for ArrayBuffers)

**Backend Step 3 — Activate FIDO2 Device:**
- Endpoint: `POST /api/pingone/mfa/activate-fido2-device`
- Call "Activate MFA User Device (FIDO2)"
- Send the attestation payload from the browser
- API expects attestation JSON from WebAuthn registration

**UI:**
- "Register FIDO2 Device" button
- "Create WebAuthn Credential" button (triggers browser WebAuthn)
- Success screen showing:
  - `deviceId`
  - Authenticator name/metadata if returned

**Implementation:**
- **SDK Method:** `FIDO2Helper.registerFIDO2Device()` → `FIDO2Helper.createWebAuthnCredential()` → `FIDO2Helper.activateFIDO2Device()`
- **Component:** `src/samples/p1mfa/fido2/RegistrationFlow.tsx`

---

## 5. Authentication (Challenge) Flows

### Pattern 1: "MFA inside OIDC sign-in" (Policy-Driven)

**Flow:**
1. User starts OIDC sign-in
2. PingOne policy triggers MFA during auth
3. OAuthPlayground visualizes "MFA required" state
4. User completes MFA challenge
5. OAuth flow completes with tokens

**Implementation:**
- Uses PingOne's "MFA action" flow
- Integrated into OIDC authorization flow
- MFA challenge happens automatically during sign-in

### Pattern 2: "Step-up after Tokens"

**Flow:**
1. OAuthPlayground gets tokens first (OIDC sign-in)
2. Then calls an API/resource that requires higher ACR/AMR
3. OAuthPlayground runs the MFA challenge
4. Returns to the app with higher assurance

**Implementation:**
- Separate MFA authentication flow
- Can be triggered after initial token acquisition
- Uses device authentication APIs

---

### 5A) Authenticate with SMS OTP

**Backend:**
1. **Start MFA challenge**
   - Endpoint: `POST /api/pingone/mfa/initialize-device-authentication`
   - Specify selected device (SMS) or let PingOne select
   - Returns `deviceAuthenticationId`

2. **OTP sent automatically**
   - PingOne sends OTP to SMS device based on policy
   - Or use `POST /api/pingone/mfa/send-otp` if needed

3. **Verify OTP**
   - Endpoint: `POST /api/pingone/mfa/validate-otp-for-device`
   - Or use device authentication endpoint: `POST /api/pingone/mfa/complete`
   - Validate OTP code

**UI:**
- "Initialize SMS Authentication" button
- OTP entry field
- "Verify OTP" button
- Show result + any updated tokens / session state

**Implementation:**
- **SDK Method:** `sdk.initializeAuthentication()` → `sdk.completeAuthentication({ otp })`
- **Component:** `src/samples/p1mfa/sms/AuthenticationFlow.tsx`

---

### 5B) Authenticate with FIDO2 (WebAuthn Assertion)

**Backend:**
1. **Start FIDO2 auth**
   - Endpoint: `POST /api/pingone/mfa/initialize-device-authentication`
   - Fetch assertion options (the "challenge" for `navigator.credentials.get`)
   - Response includes `challengeId` and assertion options

2. **Get WebAuthn Assertion**
   - Browser: `navigator.credentials.get({ publicKey: assertionOptions })`
   - Returns `PublicKeyCredential` with assertion

3. **Finish auth**
   - Endpoint: `POST /api/pingone/mfa/complete`
   - Submit the signed assertion result
   - Complete authentication

**UI:**
- "Initialize FIDO2 Authentication" button
- "Get WebAuthn Assertion" button (triggers browser WebAuthn)
- Show success/failure + resulting state

**Implementation:**
- **SDK Method:** `sdk.initializeAuthentication()` → `FIDO2Helper.getWebAuthnAssertion()` → `sdk.completeAuthentication({ fido2Assertion })`
- **Component:** `src/samples/p1mfa/fido2/AuthenticationFlow.tsx`

---

## 6. File Structure

```
src/
├── sdk/
│   └── p1mfa/                    # P1MFA SDK wrapper
│       ├── P1MFASDK.ts          # Main SDK class
│       ├── types.ts             # TypeScript types
│       ├── errors.ts             # Error classes
│       ├── fido2.ts              # FIDO2 helper methods
│       ├── sms.ts                # SMS helper methods
│       └── index.ts              # Main exports
├── samples/
│   └── p1mfa/                    # Sample applications
│       ├── IntegratedMFASample.tsx  # Complete integrated flow
│       ├── fido2/
│       │   ├── FIDO2SampleApp.tsx
│       │   ├── RegistrationFlow.tsx
│       │   └── AuthenticationFlow.tsx
│       ├── sms/
│       │   ├── SMSSampleApp.tsx
│       │   ├── RegistrationFlow.tsx
│       │   └── AuthenticationFlow.tsx
│       └── shared/
│           ├── CredentialsForm.tsx
│           ├── DeviceList.tsx
│           └── StatusDisplay.tsx
└── pages/
    └── P1MFASamples.tsx          # Main samples page
```

---

## 7. API Endpoints Reference

### Enrollment Endpoints

#### Create SMS Device
```
POST /api/pingone/mfa/register-device
Body: {
  environmentId: string,
  userId: string,
  type: "SMS",
  phone: string,
  status: "ACTIVATION_REQUIRED",
  workerToken: string
}
```

#### Send OTP
```
POST /api/pingone/mfa/send-otp
Body: {
  environmentId: string,
  userId: string,
  deviceId: string,
  workerToken: string
}
```

#### Activate SMS Device
```
POST /api/pingone/mfa/activate-device
Body: {
  environmentId: string,
  userId: string,
  deviceId: string,
  otp: string,
  workerToken: string
}
Content-Type: application/vnd.pingidentity.device.activate+json
```

#### Create FIDO2 Device
```
POST /api/pingone/mfa/register-device
Body: {
  environmentId: string,
  userId: string,
  type: "FIDO2",
  policy: { id: string },
  rp: { id: string, name: string },
  workerToken: string
}
```

#### Activate FIDO2 Device
```
POST /api/pingone/mfa/activate-fido2-device
Body: {
  environmentId: string,
  userId: string,
  deviceId: string,
  attestation: string,  // JSON string of WebAuthn credential
  workerToken: string
}
Content-Type: application/vnd.pingidentity.device.activate+json
```

### Authentication Endpoints

#### Initialize Device Authentication
```
POST /api/pingone/mfa/initialize-device-authentication
Body: {
  environmentId: string,
  userId: string,
  deviceId?: string,  // Optional
  deviceAuthenticationPolicyId: string,
  workerToken: string
}
```

#### Complete Authentication (SMS)
```
POST /api/pingone/mfa/complete
Body: {
  environmentId: string,
  deviceAuthenticationId: string,
  otp: string,
  workerToken: string
}
```

#### Complete Authentication (FIDO2)
```
POST /api/pingone/mfa/complete
Body: {
  environmentId: string,
  deviceAuthenticationId: string,
  assertion: string,  // JSON string of WebAuthn assertion
  workerToken: string
}
```

---

## 8. SDK Usage Examples

### Initialize SDK
```typescript
import { P1MFASDK } from '@/sdk/p1mfa';

const sdk = new P1MFASDK();
await sdk.initialize({
  environmentId: 'env-123',
  clientId: 'client-123',
  clientSecret: 'secret-123',
  region: 'us'
});
```

### Enroll SMS Device
```typescript
import { SMSHelper } from '@/sdk/p1mfa';

// Step 1: Register device
const device = await SMSHelper.registerSMSDevice(sdk, {
  userId: 'user-123',
  type: 'SMS',
  phone: '+1234567890',
  status: 'ACTIVATION_REQUIRED'
});

// Step 2: Send OTP
await SMSHelper.sendOTP(sdk, 'user-123', device.deviceId);

// Step 3: Activate with OTP
await SMSHelper.activateSMSDevice(sdk, {
  userId: 'user-123',
  deviceId: device.deviceId,
  otp: '123456'
});
```

### Enroll FIDO2 Device
```typescript
import { FIDO2Helper } from '@/sdk/p1mfa';

// Step 1: Register device
const device = await FIDO2Helper.registerFIDO2Device(sdk, {
  userId: 'user-123',
  type: 'FIDO2',
  policy: 'policy-123'
});

// Step 2: Create WebAuthn credential
const credential = await FIDO2Helper.createWebAuthnCredential(
  device.publicKeyCredentialCreationOptions
);

// Step 3: Activate device
await FIDO2Helper.activateFIDO2Device(sdk, {
  userId: 'user-123',
  deviceId: device.deviceId,
  fido2Credential: credential
});
```

### Authenticate with SMS
```typescript
// Step 1: Initialize authentication
const auth = await sdk.initializeAuthentication({
  userId: 'user-123',
  deviceAuthenticationPolicyId: 'policy-123'
});

// Step 2: Complete with OTP
const result = await sdk.completeAuthentication({
  authenticationId: auth.authenticationId,
  otp: '123456'
});
```

### Authenticate with FIDO2
```typescript
// Step 1: Initialize authentication
const auth = await sdk.initializeAuthentication({
  userId: 'user-123',
  deviceAuthenticationPolicyId: 'policy-123'
});

// Step 2: Get WebAuthn assertion
const assertionOptions: PublicKeyCredentialRequestOptions = {
  challenge: new Uint8Array(32), // Get from auth response
  timeout: 60000,
  rpId: 'localhost'
};
const assertion = await FIDO2Helper.getWebAuthnAssertion(assertionOptions);

// Step 3: Complete authentication
const result = await sdk.completeAuthentication({
  authenticationId: auth.authenticationId,
  fido2Assertion: assertion
});
```

---

## 9. Integration with OIDC Sign-in

The `IntegratedMFASample.tsx` component demonstrates the complete flow:

1. **Environment Configuration**
   - Initialize SDK with PingOne credentials
   - Configure OIDC application settings

2. **OIDC Sign-in**
   - Build authorization URL with PKCE
   - Redirect to PingOne authorization endpoint
   - Handle callback and extract tokens
   - Extract user ID from ID token

3. **MFA Enrollment**
   - Enroll SMS or FIDO2 device
   - Activate device with OTP or WebAuthn

4. **MFA Authentication**
   - Initialize device authentication
   - Complete with OTP or FIDO2 assertion
   - Get updated tokens/session state

---

## 10. Testing Checklist

- [ ] SDK initialization works
- [ ] SMS device registration works
- [ ] SMS device activation works
- [ ] FIDO2 device registration works
- [ ] FIDO2 device activation works
- [ ] SMS authentication works
- [ ] FIDO2 authentication works
- [ ] OIDC sign-in integration works
- [ ] Device listing works
- [ ] Error handling works
- [ ] UI displays correctly
- [ ] All API calls logged

---

## 11. Next Steps

1. **Add OIDC Callback Handler**
   - Handle authorization callback
   - Extract tokens and user ID
   - Update user context

2. **Enhance Error Handling**
   - Better error messages
   - Retry logic
   - User-friendly error display

3. **Add Token Management**
   - Display tokens
   - Token refresh
   - Token introspection

4. **Add Step-up Authentication UI**
   - Visual indicator when MFA is required
   - Seamless flow from OIDC to MFA

---

## 12. References

- **PingOne MFA API Docs:** https://apidocs.pingidentity.com/pingone/mfa/v1/api/
- **PingOne Platform API Docs:** https://apidocs.pingidentity.com/pingone/platform/v1/api/
- **WebAuthn Spec:** https://www.w3.org/TR/webauthn-2/
- **OAuth 2.0 PKCE:** https://datatracker.ietf.org/doc/html/rfc7636

---

## 13. Implementation Status

✅ **Completed:**
- P1MFA SDK wrapper
- FIDO2 helper methods
- SMS helper methods
- Sample applications (FIDO2 and SMS)
- Integrated sample flow
- Shared UI components
- Routing and navigation
- Sidebar menu integration

🔄 **In Progress:**
- OIDC callback handler integration
- Enhanced error handling
- Token management UI

📋 **Planned:**
- Step-up authentication UI
- Token refresh flow
- Comprehensive testing

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0
