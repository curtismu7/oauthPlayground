# MFA API Reference - Complete API Call Documentation

**Last Updated:** 2025-01-XX  
**Purpose:** Reference document for all MFA API calls with correct request/response formats  
**Usage:** Use this document to restore correct implementations when API calls break

---

## Table of Contents

1. [Device Authentication APIs](#device-authentication-apis)
2. [Device Registration APIs](#device-registration-apis)
3. [Device Selection APIs](#device-selection-apis)
4. [OTP Management APIs](#otp-management-apis)
5. [FIDO2/WebAuthn APIs](#fido2webauthn-apis)
6. [Reporting APIs](#reporting-apis)
7. [Token Management APIs](#token-management-apis)
8. [User Management APIs](#user-management-apis)

---

## Device Authentication APIs

### 1. Initialize Device Authentication

**Backend Endpoint:** `POST /api/pingone/mfa/initialize-device-authentication`  
**PingOne API:** `POST {authPath}/{environmentId}/deviceAuthentications`  
**Content-Type:** `application/json`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "username": "user@example.com",
  "userId": "user-xxx",  // Optional - backend resolves from username if not provided
  "deviceId": "device-xxx",  // Optional - omit to get list of devices
  "deviceAuthenticationPolicyId": "policy-xxx",
  "workerToken": "eyJhbGc...",
  "region": "us",  // **REQUIRED** for correct PingOne URL construction: "us" | "eu" | "ap" | "ca" | "na"
  "customDomain": "auth.example.com",  // Optional - overrides region if provided
  "customNotification": {  // Optional
    "message": "Custom message",
    "variables": {}
  }
}
```

**Notes:**
- `region` is **REQUIRED** - backend uses it to construct correct PingOne URL (`auth.pingone.com`, `auth.pingone.eu`, etc.)
- `customDomain` overrides region-based URL if provided
- Backend resolves `userId` from `username` if `userId` is not provided

**Request Body (Backend → PingOne):**
```json
{
  "user": {
    "id": "user-xxx"  // Backend resolves userId from username
  },
  "deviceAuthenticationPolicy": {
    "id": "policy-xxx"
  },
  "device": {  // Only if deviceId provided
    "id": "device-xxx"
  }
}
```

**Response:**
```json
{
  "id": "auth-xxx",
  "status": "DEVICE_SELECTION_REQUIRED" | "OTP_REQUIRED" | "ASSERTION_REQUIRED",
  "nextStep": "SELECTION_REQUIRED" | "OTP_REQUIRED" | "ASSERTION_REQUIRED",
  "_links": {
    "otp.check": { "href": "/deviceAuthentications/{id}/otp/check" },
    "challenge.poll": { "href": "/challenges/{challengeId}/poll" },
    "assertion.check": { "href": "/deviceAuthentications/{id}/assertion" }
  },
  "_embedded": {
    "devices": [
      {
        "id": "device-xxx",
        "type": "SMS" | "EMAIL" | "TOTP" | "FIDO2",
        "nickname": "My Device"
      }
    ]
  }
}
```

**Notes:**
- If `deviceId` is NOT provided, PingOne returns list of available devices in `_embedded.devices`
- Backend resolves `userId` from `username` automatically
- `region` and `customDomain` are used to construct correct PingOne URL

---

### 2. Read Device Authentication Status

**Backend Endpoint:** `GET /api/pingone/mfa/read-device-authentication`  
**PingOne API:** `GET {authPath}/{environmentId}/deviceAuthentications/{authenticationId}`

**Query Parameters:**
```
?environmentId=env-xxx&userId=user-xxx&authenticationId=auth-xxx&workerToken=eyJhbGc...
```

**Response:**
```json
{
  "id": "auth-xxx",
  "status": "DEVICE_SELECTION_REQUIRED" | "OTP_REQUIRED" | "ASSERTION_REQUIRED" | "COMPLETED",
  "nextStep": "SELECTION_REQUIRED" | "OTP_REQUIRED" | "ASSERTION_REQUIRED" | "COMPLETE",
  "_links": {
    "otp.check": { "href": "/deviceAuthentications/{id}/otp/check" },
    "challenge.poll": { "href": "/challenges/{challengeId}/poll" },
    "assertion.check": { "href": "/deviceAuthentications/{id}/assertion" },
    "complete": { "href": "/deviceAuthentications/{id}/complete" }
  },
  "_embedded": {
    "devices": [
      {
        "id": "device-xxx",
        "type": "SMS" | "EMAIL" | "TOTP" | "FIDO2",
        "nickname": "My Device"
      }
    ]
  }
}
```

---

### 3. Select Device for Authentication

**Backend Endpoint:** `POST /api/pingone/mfa/select-device`  
**PingOne API:** `POST {authPath}/{environmentId}/deviceAuthentications/{deviceAuthId}`  
**Content-Type:** `application/vnd.pingidentity.device.select+json`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "deviceAuthId": "auth-xxx",  // or "authenticationId"
  "deviceId": "device-xxx",
  "workerToken": "eyJhbGc...",
  "region": "us",  // Optional: "us" | "eu" | "ap" | "ca" | "na"
  "customDomain": "auth.example.com"  // Optional - overrides region
}
```

**Request Body (Backend → PingOne):**
```json
{
  "device": {
    "id": "device-xxx"
  },
  "compatibility": "FULL"
}
```

**Response:**
```json
{
  "id": "auth-xxx",
  "status": "OTP_REQUIRED" | "ASSERTION_REQUIRED" | "CHALLENGE_REQUIRED",
  "nextStep": "OTP_REQUIRED" | "ASSERTION_REQUIRED" | "CHALLENGE_REQUIRED",
  "challengeId": "challenge-xxx",  // For FIDO2
  "publicKeyCredentialRequestOptions": {  // For FIDO2
    "challenge": "base64-encoded-challenge",
    "rpId": "example.com",
    "allowCredentials": []
  },
  "_links": {
    "otp.check": { "href": "/deviceAuthentications/{id}/otp/check" },
    "challenge.poll": { "href": "/challenges/{challengeId}/poll" },
    "assertion.check": { "href": "/deviceAuthentications/{id}/assertion" }
  },
  "selectedDevice": {
    "id": "device-xxx"
  }
}
```

**Notes:**
- Backend accepts both `deviceAuthId` and `authenticationId` (uses first provided)
- `region` and `customDomain` are required to construct correct PingOne URL
- Worker token must be cleaned (no "Bearer " prefix)

---

## Device Registration APIs

### 4. Register MFA Device

**Backend Endpoint:** `POST /api/pingone/mfa/register-device`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "userId": "user-xxx",
  "type": "SMS" | "EMAIL" | "TOTP" | "FIDO2",
  "phone": "+12345678900",  // Required for SMS
  "email": "user@example.com",  // Required for EMAIL
  "name": "My Device",
  "nickname": "My Phone",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",  // For OTP devices
  "policy": {
    "id": "policy-xxx"
  },
  "rp": {  // For FIDO2
    "id": "example.com",
    "name": "Example App"
  },
  "workerToken": "eyJhbGc...",
  "userToken": "eyJhbGc...",  // Optional - alternative to workerToken
  "tokenType": "worker" | "user",
  "region": "us",  // Optional
  "customDomain": "api.example.com"  // Optional
}
```

**Request Body (Backend → PingOne):**
```json
{
  "type": "SMS" | "EMAIL" | "TOTP" | "FIDO2",
  "phone": "+12345678900",  // For SMS
  "email": "user@example.com",  // For EMAIL
  "name": "My Device",
  "nickname": "My Phone",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",  // For OTP devices
  "policy": {
    "id": "policy-xxx"
  },
  "rp": {  // For FIDO2
    "id": "example.com",
    "name": "Example App"
  }
}
```

**Response:**
```json
{
  "id": "device-xxx",
  "type": "SMS" | "EMAIL" | "TOTP" | "FIDO2",
  "status": "ACTIVE" | "ACTIVATION_REQUIRED",
  "phone": "+12345678900",  // For SMS
  "email": "user@example.com",  // For EMAIL
  "name": "My Device",
  "nickname": "My Phone",
  "createdAt": "2025-01-XXT...",
  "qrCode": "data:image/png;base64,...",  // For TOTP
  "secret": "JBSWY3DPEHPK3PXP",  // For TOTP
  "publicKeyCredentialCreationOptions": {  // For FIDO2
    "rp": { "id": "example.com", "name": "Example App" },
    "user": { "id": "base64-user-id", "name": "user@example.com", "displayName": "User" },
    "challenge": "base64-challenge",
    "pubKeyCredParams": [],
    "authenticatorSelection": {},
    "timeout": 60000,
    "attestation": "none"
  }
}
```

**Notes:**
- Backend uses `workerToken` or `userToken` based on `tokenType`
- For TOTP, `qrCode` and `secret` are returned for activation
- For FIDO2, `publicKeyCredentialCreationOptions` is returned for WebAuthn registration

---

## OTP Management APIs

### 5. Send OTP Code

**Backend Endpoint:** `POST /api/pingone/mfa/send-otp`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/otp`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "userId": "user-xxx",
  "deviceId": "device-xxx",
  "workerToken": "eyJhbGc...",
  "region": "us",  // Optional
  "customDomain": "api.example.com"  // Optional
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

**Notes:**
- OTP is sent to the device (SMS/EMAIL)
- No response body for success
- Backend uses `region`/`customDomain` to construct correct API URL

---

### 6. Validate OTP Code

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
  "region": "us",  // Optional
  "customDomain": "api.example.com"  // Optional
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

**Notes:**
- OTP length is configurable (6-10 digits)
- `attemptsRemaining` indicates how many attempts left before lockout

---

### 7. Validate OTP via Device Authentication (MFA v1)

**Backend Endpoint:** `POST /api/pingone/mfa/validate-otp-for-device` (if using backend proxy)  
**PingOne API:** `POST {authPath}/{environmentId}/deviceAuthentications/{deviceAuthId}/otp`  
**API Reference:** https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-validate-otp-for-device  
**Content-Type:** `application/vnd.pingidentity.otp.check+json` (when using `_links.otp.check` URL)  
**Content-Type:** `application/json` (when constructing endpoint manually)

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "deviceAuthId": "auth-xxx",
  "otp": "123456",
  "workerToken": "eyJhbGc...",
  "region": "us",  // Optional
  "customDomain": "auth.example.com"  // Optional
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

**Notes:**
- This is the MFA v1 API endpoint (uses `authPath`)
- Returns access token if authentication is completed
- Use `otpCheckUrl` from `_links['otp.check']` if available

---

## FIDO2/WebAuthn APIs

### 8. Check FIDO2 Assertion

**Backend Endpoint:** `POST /api/pingone/mfa/check-fido2-assertion`  
**PingOne API:** `POST {authPath}/{environmentId}/deviceAuthentications/{deviceAuthId}`  
**Content-Type:** `application/vnd.pingidentity.assertion.check+json`  
**Note:** The Content-Type header indicates this is an assertion check operation, not the URL path

**Request Body (Frontend → Backend):**
```json
{
  "deviceAuthId": "auth-xxx",
  "environmentId": "env-xxx",
  "assertion": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "type": "public-key",
    "response": {
      "clientDataJSON": "base64-client-data",
      "authenticatorData": "base64-authenticator-data",
      "signature": "base64-signature",
      "userHandle": "base64-user-handle"  // Optional
    }
  },
  "region": "us",  // Optional
  "customDomain": "auth.example.com"  // Optional
}
```

**Request Body (Backend → PingOne):**
```json
{
  "origin": "https://localhost:3000",
  "assertion": "{\"id\":\"credential-id\",\"rawId\":\"base64url-raw-id\",\"type\":\"public-key\",\"response\":{\"clientDataJSON\":\"base64url-client-data\",\"authenticatorData\":\"base64url-authenticator-data\",\"signature\":\"base64url-signature\",\"userHandle\":\"base64url-user-handle\"}}",
  "compatibility": "FULL"
}
```

**Important Notes:**
- `assertion` must be a **JSON string** (stringified object), not an object
- `origin` is **required** and should match the application's origin (e.g., `https://localhost:3000`)
- `compatibility` is **required** and should be `"FULL"` (or `"SECURITY_KEY_ONLY"` or `"NONE"`)
- All base64 values should be in **base64url format** (WebAuthn standard), NOT standard base64
- The assertion object structure matches the WebAuthn `PublicKeyCredential` format

**Response:**
```json
{
  "id": "auth-xxx",
  "status": "COMPLETED" | "ASSERTION_REQUIRED",
  "nextStep": "COMPLETE" | "ASSERTION_REQUIRED",
  "access_token": "eyJhbGc...",  // If completed
  "token_type": "Bearer",
  "expires_in": 3600,
  "_links": {
    "complete": { "href": "/deviceAuthentications/{id}/complete" }
  }
}
```

**Notes:**
- Assertion must be a **JSON string** (not an object) - stringify the assertion object before sending
- Assertion values should remain in **base64url format** (WebAuthn standard) - do NOT convert to standard base64
- Worker token is sent in `Authorization: Bearer {token}` header
- Content-Type header must be `application/vnd.pingidentity.assertion.check+json`
- `origin` and `compatibility` are **required** fields in the request body
- `region` and `customDomain` are required to construct correct PingOne URL

---

## Reporting APIs

### 9. Create SMS Devices Report

**Backend Endpoint:** `POST /api/pingone/mfa/reports/create-sms-devices-report`  
**PingOne API:** `POST {apiBase}/v1/environments/{environmentId}/reports/smsDevices`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "workerToken": "eyJhbGc...",
  "dataExplorationTemplateId": "template-xxx",  // Optional
  "fields": [  // Optional - defaults to standard fields
    { "name": "userId" },
    { "name": "username" },
    { "name": "phone" },
    { "name": "deviceStatus" },
    { "name": "deviceId" }
  ],
  "filter": "(deviceType eq \"SMS\")",  // Optional SCIM filter
  "sync": "true" | "false",  // Optional - default "true"
  "deliverAs": "ENTRIES" | "FILE",  // Optional - default "ENTRIES"
  "region": "us",  // Optional
  "customDomain": "api.example.com"  // Optional
}
```

**Request Body (Backend → PingOne):**
```json
{
  "dataExplorationTemplate": {  // Optional
    "id": "template-xxx"
  },
  "fields": [
    { "name": "userId" },
    { "name": "username" },
    { "name": "phone" },
    { "name": "deviceStatus" },
    { "name": "deviceId" }
  ],
  "filter": "(deviceType eq \"SMS\")",  // Optional
  "sync": "true",
  "deliverAs": "ENTRIES"
}
```

**Response:**
```json
{
  "id": "report-xxx",
  "status": "COMPLETED" | "PROCESSING",
  "_embedded": {
    "entries": [  // If deliverAs="ENTRIES"
      {
        "userId": "user-xxx",
        "username": "user@example.com",
        "phone": "+12345678900",
        "deviceStatus": "ACTIVE",
        "deviceId": "device-xxx"
      }
    ]
  },
  "_links": {
    "self": { "href": "/reports/{id}" },
    "entries": { "href": "/reports/{id}/entries" }
  }
}
```

**Notes:**
- Worker token must be cleaned (no "Bearer " prefix)
- `region` defaults to "na" if not provided
- Backend uses `apiBase` (not `authPath`) for reporting APIs

---

## Token Management APIs

### 10. Get Worker Token

**Backend Endpoint:** `POST /api/pingone/token`  
**PingOne API:** `POST {authPath}/{environmentId}/as/token`  
**Content-Type:** `application/x-www-form-urlencoded`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "clientId": "client-xxx",
  "clientSecret": "secret-xxx",
  "scopes": "mfa:device:manage mfa:device:read",
  "tokenEndpointAuthMethod": "client_secret_post" | "client_secret_basic" | "none",
  "region": "us",  // Optional
  "customDomain": "auth.example.com"  // Optional
}
```

**Request Body (Backend → PingOne):**
```
grant_type=client_credentials
&client_id=client-xxx
&client_secret=secret-xxx
&scope=mfa:device:manage mfa:device:read
```

**OR (for client_secret_basic):**
```
grant_type=client_credentials
&scope=mfa:device:manage mfa:device:read
```
**Headers:**
```
Authorization: Basic base64(clientId:clientSecret)
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "mfa:device:manage mfa:device:read"
}
```

**Notes:**
- Token endpoint uses `authPath` (not `apiBase`)
- `region` and `customDomain` are required to construct correct URL
- Scopes must be space-separated string

---

## User Management APIs

### 11. Lookup User by Username

**Backend Endpoint:** `POST /api/pingone/mfa/lookup-user`  
**PingOne API:** `GET {apiBase}/v1/environments/{environmentId}/users?filter=username eq \"{username}\"`

**Request Body (Frontend → Backend):**
```json
{
  "environmentId": "env-xxx",
  "username": "user@example.com",
  "workerToken": "eyJhbGc...",
  "region": "us",  // Optional
  "customDomain": "api.example.com"  // Optional
}
```

**Response:**
```json
{
  "_embedded": {
    "users": [
      {
        "id": "user-xxx",
        "username": "user@example.com",
        "email": "user@example.com",
        "name": {
          "given": "John",
          "family": "Doe"
        }
      }
    ]
  }
}
```

**Notes:**
- Backend constructs SCIM filter: `username eq "{username}"`
- Returns first user from `_embedded.users` array

---

## Common Patterns

### Region and Custom Domain Handling

**Region Mapping:**
- `"us"` → `https://auth.pingone.com` or `https://api.pingone.com`
- `"eu"` → `https://auth.pingone.eu` or `https://api.pingone.eu`
- `"ap"` or `"asia"` → `https://auth.pingone.asia` or `https://api.pingone.asia`
- `"ca"` → `https://auth.pingone.ca` or `https://api.pingone.ca`
- `"na"` → `https://auth.pingone.com` or `https://api.pingone.com` (alias for us)

**Custom Domain:**
- If `customDomain` is provided, use `https://{customDomain}` instead of region-based URL
- For auth endpoints: `https://{customDomain}`
- For API endpoints: `https://{customDomain}` (usually same domain)

### Worker Token Format

**Always clean worker token before sending:**
```javascript
const cleanToken = workerToken.trim().replace(/^Bearer\s+/i, '');
```

**Token must be valid JWT (3 dot-separated parts):**
```javascript
const tokenParts = cleanToken.split('.');
if (tokenParts.length !== 3) {
  throw new Error('Invalid token format');
}
```

### Error Handling

**Common Error Responses:**
```json
{
  "error": "NO_USABLE_DEVICES",
  "message": "No usable devices found for authentication",
  "unavailableDevices": [
    { "id": "device-xxx" }
  ]
}
```

```json
{
  "error": "INVALID_VALUE",
  "message": "Device selection failed: Could not find suitable content.",
  "details": [
    {
      "code": "INVALID_VALUE",
      "message": "Could not find suitable content."
    }
  ]
}
```

---

## Testing Checklist

When testing a flow, add the API calls to this document:

- [ ] Device Authentication Initialization
- [ ] Device Selection
- [ ] OTP Validation
- [ ] FIDO2 Assertion Check
- [ ] Device Registration
- [ ] Reporting APIs

**Template for adding new API calls:**
```markdown
### X. [API Name]

**Backend Endpoint:** `[METHOD] /api/pingone/mfa/[endpoint]`  
**PingOne API:** `[METHOD] {basePath}/[path]`  
**Content-Type:** `[content-type]`

**Request Body (Frontend → Backend):**
```json
{
  // Request body
}
```

**Request Body (Backend → PingOne):**
```json
{
  // Request body
}
```

**Response:**
```json
{
  // Response body
}
```

**Notes:**
- Important implementation details
- Common errors
- Required parameters
```

---

## Version History

- **2025-01-XX**: Initial documentation created
- Add entries here as flows are tested and verified

