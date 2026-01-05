# MFA FIDO2 Master Document

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0  
**Purpose:** Comprehensive reference for FIDO2 registration and authentication implementation  
**Usage:** Use this document to restore correct implementations when FIDO2 flows break or regress

---

## Table of Contents

1. [Overview](#overview)
2. [Related Documentation](#related-documentation)
3. [FIDO2 Registration Flow](#fido2-registration-flow)
4. [FIDO2 Authentication Flow](#fido2-authentication-flow)
5. [Critical JSON Request Bodies](#critical-json-request-bodies)
6. [Errors Fixed and Solutions](#errors-fixed-and-solutions)
7. [Implementation Files](#implementation-files)
8. [Testing and Verification](#testing-and-verification)

---

## Overview

This document provides a comprehensive reference for FIDO2 (WebAuthn) device registration and authentication flows in the MFA system. It includes:

- Correct JSON request body formats for all FIDO2 API calls
- Detailed error fixes and solutions
- Step-by-step implementation guidance
- Reference to UI documentation and contracts

**Key Principle:** All FIDO2 API calls must use base64url encoding (WebAuthn standard), NOT standard base64. The assertion must be sent as a JSON string to PingOne, not as an object.

---

## Related Documentation

- **UI Documentation:** [`docs/MFA_FIDO2_UI_DOC.md`](./MFA_FIDO2_UI_DOC.md) - Complete UI structure and components
- **UI Contract:** [`docs/MFA_FIDO2_UI_CONTRACT.md`](./MFA_FIDO2_UI_CONTRACT.md) - UI behavior contracts and requirements
- **API Reference:** [`docs/MFA_API_REFERENCE.md`](./MFA_API_REFERENCE.md) - Complete API endpoint documentation
- **State Preservation:** [`docs/MFA_STATE_PRESERVATION_UI_CONTRACT.md`](./MFA_STATE_PRESERVATION_UI_CONTRACT.md) - State preservation contract

---

## FIDO2 Registration Flow

### Flow Overview

1. **Configuration Page** → User configures FIDO2 settings (attestation, authenticator attachment, etc.)
2. **Step 0** → User enters credentials (environment ID, username, policy)
3. **Step 1** → System checks for existing FIDO2 devices (only one allowed per user)
4. **Step 2** → User registers FIDO2 device via WebAuthn API
5. **Step 3** → Device activation confirmed
6. **Success Page** → Registration complete

### Step-by-Step Implementation

#### Step 1: Pre-Registration Check

**Location:** `src/v8/flows/types/FIDO2FlowV8.tsx`

**Critical:** Must check for existing FIDO2 devices before allowing registration.

```typescript
// Load existing devices
const existingDevices = await controller.loadExistingDevices();

// Check if user already has a FIDO2 device
if (existingDevices.length > 0 && existingDevices.some(d => d.deviceType === 'FIDO2')) {
  // Show modal informing user they can only have one FIDO2 device
  setShowFIDODeviceExistsModal(true);
  return; // Prevent registration
}
```

**Error Fixed:** Previously, users could attempt to register multiple FIDO2 devices, causing API errors. Now we check before registration and show a user-friendly modal.

#### Step 2: Device Registration

**Location:** `src/v8/flows/types/FIDO2FlowV8.tsx` → `handleRegisterDevice()`

**Process:**
1. Call `MFAServiceV8.registerFIDO2Device()` to create device in PingOne
2. Receive `publicKeyCredentialCreationOptions` (JSON string)
3. Parse JSON string to object
4. Convert byte arrays to `Uint8Array` for WebAuthn API
5. Call `navigator.credentials.create()`
6. Extract `PublicKeyCredential` response
7. Activate device with PingOne

**Critical Code:**
```typescript
// 1. Register device in PingOne
const deviceResponse = await MFAServiceV8.registerFIDO2Device({
  environmentId: credentials.environmentId,
  userId: credentials.userId,
  deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
  rp: {
    id: fido2Config.rpId,
    name: fido2Config.rpName,
  },
  name: credentials.deviceName || 'FIDO2',
  workerToken: await MFAServiceV8.getWorkerToken(),
  region: credentials.region,
  customDomain: credentials.customDomain,
});

// 2. Parse publicKeyCredentialCreationOptions (JSON string)
const optionsString = deviceResponse.publicKeyCredentialCreationOptions;
const opts = JSON.parse(optionsString);

// 3. Convert byte arrays to Uint8Array
opts.challenge = new Uint8Array(opts.challenge);
opts.user.id = new Uint8Array(opts.user.id);
if (Array.isArray(opts.excludeCredentials)) {
  opts.excludeCredentials = opts.excludeCredentials.map((cred: any) => ({
    ...cred,
    id: new Uint8Array(cred.id),
  }));
}

// 4. Call WebAuthn API
const credential = await navigator.credentials.create({
  publicKey: opts,
}) as PublicKeyCredential | null;

if (!credential) {
  throw new Error('WebAuthn registration cancelled or failed');
}

// 5. Extract response
const response = credential.response as AuthenticatorAttestationResponse;
const attestationObject = response.attestationObject;
const clientDataJSON = response.clientDataJSON;

// 6. Convert ArrayBuffer to base64url
const base64url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const attestation = {
  id: base64url(credential.rawId),
  rawId: base64url(credential.rawId),
  type: credential.type,
  response: {
    clientDataJSON: base64url(clientDataJSON),
    attestationObject: base64url(attestationObject),
  },
};

// 7. Activate device
await MFAServiceV8.activateFIDO2Device({
  deviceId: deviceResponse.id,
  attestation,
  origin: window.location.origin,
  environmentId: credentials.environmentId,
  workerToken: await MFAServiceV8.getWorkerToken(),
  region: credentials.region,
  customDomain: credentials.customDomain,
});
```

**Error Fixed:** Previously, byte arrays were not converted to `Uint8Array`, causing WebAuthn API errors. Now we properly convert all byte arrays before calling `navigator.credentials.create()`.

---

## FIDO2 Authentication Flow

### Flow Overview

1. **Device Selection** → User enters username, selects FIDO2 device
2. **WebAuthn Prompt** → Browser shows WebAuthn authentication
3. **Assertion Check** → System checks assertion with PingOne
4. **Success** → Authentication complete, access token returned

### Step-by-Step Implementation

#### Step 1: Initialize Device Authentication

**Location:** `src/v8/services/mfaAuthenticationServiceV8.ts` → `initializeDeviceAuthentication()`

**Critical:** Must include `region` and `customDomain` in request body for correct PingOne URL construction.

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

#### Step 2: Get WebAuthn Assertion

**Location:** `src/v8/flows/MFAAuthenticationMainPageV8.tsx`

**Process:**
1. Initialize device authentication
2. Receive `publicKeyCredentialRequestOptions` from PingOne
3. Parse and convert byte arrays to `Uint8Array`
4. Call `navigator.credentials.get()`
5. Extract `PublicKeyCredential` response
6. Check assertion with PingOne

**Critical Code:**
```typescript
// 1. Initialize authentication
const authResponse = await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
  environmentId: credentials.environmentId,
  username: credentials.username,
  deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
  deviceId: selectedDeviceId, // Optional - omit to get list
  workerToken: await MFAServiceV8.getWorkerToken(),
  region: credentials.region,
  customDomain: credentials.customDomain,
});

// 2. Parse publicKeyCredentialRequestOptions (if FIDO2 device)
if (authResponse.publicKeyCredentialRequestOptions) {
  const optionsString = authResponse.publicKeyCredentialRequestOptions;
  const opts = JSON.parse(optionsString);

  // 3. Convert byte arrays to Uint8Array
  opts.challenge = new Uint8Array(opts.challenge);
  if (Array.isArray(opts.allowCredentials)) {
    opts.allowCredentials = opts.allowCredentials.map((cred: any) => ({
      ...cred,
      id: new Uint8Array(cred.id),
    }));
  }

  // 4. Call WebAuthn API
  const credential = await navigator.credentials.get({
    publicKey: opts,
  }) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('WebAuthn authentication cancelled or failed');
  }

  // 5. Extract response
  const response = credential.response as AuthenticatorAssertionResponse;
  const clientDataJSON = response.clientDataJSON;
  const authenticatorData = response.authenticatorData;
  const signature = response.signature;
  const userHandle = response.userHandle; // Optional

  // 6. Convert ArrayBuffer to base64url
  const base64url = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const assertion = {
    id: base64url(credential.rawId),
    rawId: base64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: base64url(clientDataJSON),
      authenticatorData: base64url(authenticatorData),
      signature: base64url(signature),
      ...(userHandle && { userHandle: base64url(userHandle) }),
    },
  };

  // 7. Check assertion with PingOne
  await MfaAuthenticationServiceV8.checkFIDO2Assertion(
    authResponse.id, // deviceAuthId
    assertion,
    credentials.environmentId,
    credentials.region,
    credentials.customDomain,
    window.location.origin,
  );
}
```

**Error Fixed:** Previously, byte arrays were not converted to `Uint8Array`, causing WebAuthn API errors. Now we properly convert all byte arrays before calling `navigator.credentials.get()`.

---

## Critical JSON Request Bodies

### 1. Register FIDO2 Device

**Backend Endpoint:** `POST /api/pingone/mfa/register-device`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "userId": "user-xxx",
  "type": "FIDO2",
  "name": "My FIDO2 Device",
  "nickname": "My FIDO2 Device",
  "policy": {
    "id": "policy-xxx"
  },
  "rp": {
    "id": "example.com",
    "name": "Example App"
  },
  "workerToken": "eyJhbGc...",
  "region": "us",
  "customDomain": "api.example.com"
}
```

**Request Body (Backend → PingOne):**
```json
{
  "type": "FIDO2",
  "name": "My FIDO2 Device",
  "nickname": "My FIDO2 Device",
  "policy": {
    "id": "policy-xxx"
  },
  "rp": {
    "id": "example.com",
    "name": "Example App"
  }
}
```

**Response:**
```json
{
  "id": "device-xxx",
  "type": "FIDO2",
  "status": "ACTIVATION_REQUIRED",
  "publicKeyCredentialCreationOptions": "{\"rp\":{\"id\":\"example.com\",\"name\":\"Example App\"},\"user\":{\"id\":[1,2,3,...],\"name\":\"user@example.com\",\"displayName\":\"User\"},\"challenge\":[4,5,6,...],\"pubKeyCredParams\":[...],\"authenticatorSelection\":{...},\"timeout\":60000,\"attestation\":\"none\"}"
}
```

**Critical Notes:**
- `publicKeyCredentialCreationOptions` is a **JSON string** (not an object)
- Must parse JSON string before using with WebAuthn API
- Byte arrays (`challenge`, `user.id`) must be converted to `Uint8Array`

---

### 2. Activate FIDO2 Device

**Backend Endpoint:** `POST /api/pingone/mfa/activate-fido2-device`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}`

**Request Body (Frontend → Backend):**
```json
{
  "deviceId": "device-xxx",
  "environmentId": "env-xxx",
  "attestation": {
    "id": "credential-id-base64url",
    "rawId": "base64url-raw-id",
    "type": "public-key",
    "response": {
      "clientDataJSON": "base64url-client-data",
      "attestationObject": "base64url-attestation-object"
    }
  },
  "origin": "https://localhost:3000",
  "region": "us",
  "customDomain": "api.example.com"
}
```

**Request Body (Backend → PingOne):**
```json
{
  "attestation": {
    "id": "credential-id-base64url",
    "rawId": "base64url-raw-id",
    "type": "public-key",
    "response": {
      "clientDataJSON": "base64url-client-data",
      "attestationObject": "base64url-attestation-object"
    }
  },
  "origin": "https://localhost:3000"
}
```

**Critical Notes:**
- All base64 values must be in **base64url format** (WebAuthn standard)
- Do NOT convert base64url to standard base64
- `origin` must match the application's origin

---

### 3. Check FIDO2 Assertion (Authentication)

**Backend Endpoint:** `POST /api/pingone/mfa/check-fido2-assertion`  
**PingOne API:** `POST {authPath}/{environmentId}/deviceAuthentications/{deviceAuthId}/assertion`  
**Content-Type:** `application/vnd.pingidentity.assertion.check+json`

**Request Body (Frontend → Backend):**
```json
{
  "deviceAuthId": "auth-xxx",
  "environmentId": "env-xxx",
  "assertion": {
    "id": "credential-id-base64url",
    "rawId": "base64url-raw-id",
    "type": "public-key",
    "response": {
      "clientDataJSON": "base64url-client-data",
      "authenticatorData": "base64url-authenticator-data",
      "signature": "base64url-signature",
      "userHandle": "base64url-user-handle"
    }
  },
  "region": "us",
  "customDomain": "auth.example.com"
}
```

**Request Body (Backend → PingOne):**
```json
{
  "origin": "https://localhost:3000",
  "assertion": "{\"id\":\"credential-id-base64url\",\"rawId\":\"base64url-raw-id\",\"type\":\"public-key\",\"response\":{\"clientDataJSON\":\"base64url-client-data\",\"authenticatorData\":\"base64url-authenticator-data\",\"signature\":\"base64url-signature\",\"userHandle\":\"base64url-user-handle\"}}",
  "compatibility": "FULL"
}
```

**Headers (Backend → PingOne):**
```
Authorization: Bearer {workerToken}
Content-Type: application/vnd.pingidentity.assertion.check+json
Accept: application/json
```

**Critical Notes:**
- `assertion` must be a **JSON string** (stringified object), NOT an object
- `origin` is **REQUIRED** and must match the application's origin
- `compatibility` is **REQUIRED** and should be `"FULL"` (or `"SECURITY_KEY_ONLY"` or `"NONE"`)
- All base64 values must be in **base64url format** (WebAuthn standard)
- Do NOT convert base64url to standard base64
- Content-Type header must be `application/vnd.pingidentity.assertion.check+json`
- Endpoint must include `/assertion` at the end: `.../deviceAuthentications/{deviceAuthId}/assertion`

---

## Errors Fixed and Solutions

### Error 1: Assertion as Object Instead of JSON String

**Problem:**
- PingOne API expects `assertion` as a JSON string, but we were sending it as an object
- This caused 400 Bad Request errors

**Solution:**
```typescript
// ❌ WRONG - Sending assertion as object
const requestBody = {
  origin: window.location.origin,
  assertion: assertionObject, // Object, not string
  compatibility: 'FULL',
};

// ✅ CORRECT - Stringify assertion before sending
const requestBody = {
  origin: window.location.origin,
  assertion: JSON.stringify(assertionObject), // JSON string
  compatibility: 'FULL',
};
```

**Location:** `src/v8/services/mfaAuthenticationServiceV8.ts` → `checkFIDO2Assertion()`

**Fixed:** Assertion is now stringified before being sent to PingOne.

---

### Error 2: Converting Base64url to Standard Base64

**Problem:**
- WebAuthn API returns base64url-encoded values (WebAuthn standard)
- We were converting them to standard base64, causing validation errors

**Solution:**
```typescript
// ❌ WRONG - Converting base64url to standard base64
const toStandardBase64 = (value: string) => {
  return value.replace(/_/g, '/').replace(/-/g, '+');
};

// ✅ CORRECT - Keep base64url format (WebAuthn standard)
// No conversion needed - use values directly from WebAuthn API
const assertion = {
  id: base64url(credential.rawId), // Already base64url
  rawId: base64url(credential.rawId), // Already base64url
  response: {
    clientDataJSON: base64url(clientDataJSON), // Already base64url
    authenticatorData: base64url(authenticatorData), // Already base64url
    signature: base64url(signature), // Already base64url
  },
};
```

**Location:** `server.js` → `/api/pingone/mfa/check-fido2-assertion`

**Fixed:** Removed `toStandardBase64` conversion function. All values remain in base64url format.

---

### Error 3: Missing `origin` and `compatibility` Fields

**Problem:**
- PingOne API requires `origin` and `compatibility` fields in the request body
- We were not including them, causing 400 Bad Request errors

**Solution:**
```typescript
// ❌ WRONG - Missing required fields
const requestBody = {
  assertion: JSON.stringify(assertionObject),
};

// ✅ CORRECT - Include required fields
const requestBody = {
  origin: window.location.origin, // REQUIRED
  assertion: JSON.stringify(assertionObject), // REQUIRED
  compatibility: 'FULL', // REQUIRED
};
```

**Location:** `src/v8/services/mfaAuthenticationServiceV8.ts` → `checkFIDO2Assertion()`

**Fixed:** `origin` and `compatibility` are now always included in the request body.

---

### Error 4: Incorrect Endpoint URL

**Problem:**
- Endpoint URL was missing `/assertion` at the end
- This caused 404 Not Found errors

**Solution:**
```typescript
// ❌ WRONG - Missing /assertion
const endpoint = `${authPath}/${environmentId}/deviceAuthentications/${deviceAuthId}`;

// ✅ CORRECT - Include /assertion
const endpoint = `${authPath}/${environmentId}/deviceAuthentications/${deviceAuthId}/assertion`;
```

**Location:** `server.js` → `/api/pingone/mfa/check-fido2-assertion`

**Fixed:** Endpoint now correctly includes `/assertion` at the end.

---

### Error 5: Missing `region` and `customDomain` Parameters

**Problem:**
- `region` and `customDomain` were not being passed to API calls
- This caused incorrect PingOne URL construction

**Solution:**
```typescript
// ❌ WRONG - Missing region and customDomain
await MFAServiceV8.registerFIDO2Device({
  environmentId,
  userId,
  // region and customDomain missing
});

// ✅ CORRECT - Include region and customDomain
await MFAServiceV8.registerFIDO2Device({
  environmentId,
  userId,
  region: credentials.region, // REQUIRED
  customDomain: credentials.customDomain, // Optional
});
```

**Location:** Multiple files - all FIDO2 API calls

**Fixed:** `region` and `customDomain` are now always included in API calls.

---

### Error 6: Byte Arrays Not Converted to Uint8Array

**Problem:**
- WebAuthn API requires `Uint8Array` for byte arrays
- We were passing raw arrays, causing WebAuthn API errors

**Solution:**
```typescript
// ❌ WRONG - Not converting byte arrays
const opts = JSON.parse(optionsString);
// opts.challenge is still an array of numbers

// ✅ CORRECT - Convert to Uint8Array
const opts = JSON.parse(optionsString);
opts.challenge = new Uint8Array(opts.challenge);
opts.user.id = new Uint8Array(opts.user.id);
if (Array.isArray(opts.excludeCredentials)) {
  opts.excludeCredentials = opts.excludeCredentials.map((cred: any) => ({
    ...cred,
    id: new Uint8Array(cred.id),
  }));
}
```

**Location:** `src/v8/flows/types/FIDO2FlowV8.tsx` → `handleRegisterDevice()`

**Fixed:** All byte arrays are now converted to `Uint8Array` before calling WebAuthn API.

---

### Error 7: Missing Content-Type Header

**Problem:**
- PingOne API requires `Content-Type: application/vnd.pingidentity.assertion.check+json`
- We were not setting this header, causing 400 Bad Request errors

**Solution:**
```typescript
// ❌ WRONG - Missing Content-Type header
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(requestBody),
});

// ✅ CORRECT - Include Content-Type header
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/vnd.pingidentity.assertion.check+json',
    'Accept': 'application/json',
  },
  body: JSON.stringify(requestBody),
});
```

**Location:** `server.js` → `/api/pingone/mfa/check-fido2-assertion`

**Fixed:** Content-Type header is now always set correctly.

---

### Error 8: FIDO2 Device Limit Not Enforced

**Problem:**
- Users could attempt to register multiple FIDO2 devices
- PingOne only allows one FIDO2 device per user
- This caused API errors without user-friendly messaging

**Solution:**
```typescript
// ✅ CORRECT - Check for existing devices before registration
const existingDevices = await controller.loadExistingDevices();
if (existingDevices.length > 0 && existingDevices.some(d => d.deviceType === 'FIDO2')) {
  setShowFIDODeviceExistsModal(true);
  return; // Prevent registration
}
```

**Location:** `src/v8/flows/types/FIDO2FlowV8.tsx` → `handleRegisterDevice()`

**Fixed:** System now checks for existing FIDO2 devices and shows a user-friendly modal if one exists.

---

## Implementation Files

### Frontend Files

**Flow Components:**
- `src/v8/flows/types/FIDO2FlowV8.tsx` - Main FIDO2 registration flow
- `src/v8/flows/FIDO2ConfigurationPageV8.tsx` - FIDO2 configuration page
- `src/v8/flows/MFAAuthenticationMainPageV8.tsx` - FIDO2 authentication page

**UI Components:**
- `src/v8/components/FIDODeviceExistsModalV8.tsx` - Error modal for existing device

**Services:**
- `src/v8/services/mfaServiceV8.ts` - FIDO2 device registration and activation
- `src/v8/services/mfaAuthenticationServiceV8.ts` - FIDO2 authentication and assertion check
- `src/v8/flows/controllers/FIDO2FlowController.ts` - FIDO2 flow controller

**Configuration:**
- `src/v8/services/mfaConfigurationServiceV8.ts` - FIDO2 configuration storage

### Backend Files

**API Endpoints:**
- `server.js` → `/api/pingone/mfa/register-device` - Device registration
- `server.js` → `/api/pingone/mfa/activate-fido2-device` - Device activation
- `server.js` → `/api/pingone/mfa/check-fido2-assertion` - Assertion check

---

## Testing and Verification

### Manual Testing Checklist

**Registration Flow:**
- [ ] Configuration page loads and saves settings
- [ ] Step 0 validates inputs correctly
- [ ] Step 1 checks for existing devices
- [ ] Step 2 registers device via WebAuthn
- [ ] Step 3 confirms activation
- [ ] Success page displays correctly

**Authentication Flow:**
- [ ] Device selection works correctly
- [ ] WebAuthn prompt appears
- [ ] Assertion check succeeds
- [ ] Access token returned on success

**Error Scenarios:**
- [ ] Existing device modal shows correctly
- [ ] WebAuthn cancellation handled gracefully
- [ ] Invalid token errors show user-friendly messages
- [ ] Network errors handled gracefully

### API Testing

**Test Assertion Check Request:**
```bash
curl -X POST https://auth.pingone.com/{envId}/deviceAuthentications/{deviceAuthId}/assertion \
  -H "Authorization: Bearer {workerToken}" \
  -H "Content-Type: application/vnd.pingidentity.assertion.check+json" \
  -d '{
    "origin": "https://localhost:3000",
    "assertion": "{\"id\":\"...\",\"rawId\":\"...\",\"type\":\"public-key\",\"response\":{\"clientDataJSON\":\"...\",\"authenticatorData\":\"...\",\"signature\":\"...\"}}",
    "compatibility": "FULL"
  }'
```

**Verify:**
- Request body has `assertion` as JSON string (not object)
- All base64 values are in base64url format
- `origin` and `compatibility` are included
- Content-Type header is correct
- Endpoint includes `/assertion`

---

## Quick Reference: Correct Request Body Format

### Check FIDO2 Assertion (Most Critical)

**Frontend → Backend:**
```json
{
  "deviceAuthId": "auth-xxx",
  "environmentId": "env-xxx",
  "assertion": { /* WebAuthn assertion object */ },
  "region": "us",
  "customDomain": "auth.example.com"
}
```

**Backend → PingOne:**
```json
{
  "origin": "https://localhost:3000",
  "assertion": "{\"id\":\"...\",\"rawId\":\"...\",\"type\":\"public-key\",\"response\":{\"clientDataJSON\":\"...\",\"authenticatorData\":\"...\",\"signature\":\"...\"}}",
  "compatibility": "FULL"
}
```

**Headers:**
```
Authorization: Bearer {workerToken}
Content-Type: application/vnd.pingidentity.assertion.check+json
Accept: application/json
```

**Endpoint:**
```
POST {authPath}/{environmentId}/deviceAuthentications/{deviceAuthId}/assertion
```

---

## Version History

- **v1.0.0** (2025-01-XX): Initial comprehensive FIDO2 master document with all error fixes and correct JSON request bodies

---

## Notes

- **Base64url vs Base64:** WebAuthn uses base64url encoding (URL-safe base64). Do NOT convert to standard base64. Use values directly from WebAuthn API.
- **Assertion Format:** Assertion must be a JSON string when sent to PingOne, not an object. Stringify the assertion object before sending.
- **Required Fields:** `origin` and `compatibility` are REQUIRED in the assertion check request body.
- **Endpoint Path:** The assertion check endpoint must include `/assertion` at the end.
- **Content-Type:** Must be `application/vnd.pingidentity.assertion.check+json` for assertion check.
- **Device Limit:** Only one FIDO2 device is allowed per user. Check before registration.

