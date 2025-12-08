# SMS Register Flow Analysis

## Overview
This document analyzes the Register SMS flow logic and the PingOne API calls executed when using `ACTIVE` or `ACTIVATION_REQUIRED` status.

## Step 0: Flow Selection and Configuration

Before device registration, users must select the **Registration Flow Type** on the configuration page (Step 0):

### Admin Flow
- **Token Type:** Worker Token (Client Credentials Grant)
- **Status Options:** User can choose `ACTIVE` or `ACTIVATION_REQUIRED`
- **Use Case:** Administrative device provisioning
- **Token Source:** Obtained via `POST /api/pingone/worker-token` (Client Credentials)

### User Flow
- **Token Type:** User Token (Access Token from Authorization Code Flow)
- **Status Options:** Always `ACTIVATION_REQUIRED` (security requirement)
- **Use Case:** User self-service device registration
- **Token Source:** Obtained from Authorization Code Flow (user logs in to PingOne)

**Key Rule:** User tokens can ONLY set device status to `ACTIVATION_REQUIRED`. Worker tokens can set either `ACTIVE` or `ACTIVATION_REQUIRED`.

## Flow Logic Diagram

```mermaid
flowchart TD
    Start([Step 0: Configuration]) --> SelectFlow{Select Registration Flow Type}
    
    SelectFlow -->|Admin Flow| AdminConfig[Admin Flow Selected<br/>Token: Worker Token<br/>Status: Choose ACTIVE or ACTIVATION_REQUIRED]
    SelectFlow -->|User Flow| UserConfig[User Flow Selected<br/>Token: User Token from Auth Code Flow<br/>Status: Always ACTIVATION_REQUIRED]
    
    AdminConfig --> GetWorkerToken[Get Worker Token<br/>POST /api/pingone/worker-token<br/>Client Credentials Grant]
    UserConfig --> GetUserToken[Get User Token<br/>Authorization Code Flow<br/>User Logs In to PingOne]
    
    GetWorkerToken --> Step2[Step 2: Register Device]
    GetUserToken --> Step2
    
    Step2 --> Validate[Validate Credentials]
    Validate -->|Missing Fields| Error1[Show Error]
    Validate -->|Valid| DetermineToken{Token Type?}
    
    DetermineToken -->|Worker Token| AdminPath[Admin Flow Path]
    DetermineToken -->|User Token| UserPath[User Flow Path]
    
    AdminPath --> CheckAdminStatus{Admin Selected Status?}
    CheckAdminStatus -->|ACTIVE| ActivePath[Status: ACTIVE]
    CheckAdminStatus -->|ACTIVATION_REQUIRED| ActivationPath[Status: ACTIVATION_REQUIRED]
    
    UserPath --> ActivationPath
    
    ActivePath --> LookupUser[Lookup User by Username<br/>GET /users?filter=username<br/>Authorization: Bearer {token}]
    ActivationPath --> LookupUser
    
    LookupUser -->|User Not Found| Error2[Show Error: User Not Found]
    LookupUser -->|User Found| BuildPayload[Build Device Registration Payload<br/>Include status in JSON]
    
    BuildPayload --> RegisterDevice[POST /devices<br/>Authorization: Bearer {workerToken or userToken}<br/>Body includes status]
    
    RegisterDevice --> CheckResponse{API Response}
    
    CheckResponse -->|Status: ACTIVE<br/>No deviceActivateUri| SuccessActive[✅ Device ACTIVE<br/>Show Success Screen<br/>No OTP Required]
    
    CheckResponse -->|Status: ACTIVATION_REQUIRED<br/>Has deviceActivateUri| AutoOTP[PingOne Auto-Sends OTP<br/>to Phone Number]
    
    AutoOTP --> NavigateValidation[Navigate to Step 4<br/>Validation Screen]
    
    NavigateValidation --> UserEntersOTP[User Enters OTP Code]
    UserEntersOTP --> ActivateDevice[POST device.activate URI<br/>Authorization: Bearer {token}<br/>Content-Type: device.activate+json<br/>Body: otp]
    
    ActivateDevice -->|OTP Valid| SuccessActivation[✅ Device Activated<br/>Show Success Screen]
    ActivateDevice -->|OTP Invalid| ErrorOTP[Show Error: Invalid OTP]
    
    Error1 --> End([End])
    Error2 --> End
    ErrorOTP --> End
    SuccessActive --> End
    SuccessActivation --> End
    
    style AdminConfig fill:#3b82f6,color:#fff
    style UserConfig fill:#3b82f6,color:#fff
    style ActivePath fill:#10b981,color:#fff
    style ActivationPath fill:#f59e0b,color:#fff
    style SuccessActive fill:#10b981,color:#fff
    style SuccessActivation fill:#10b981,color:#fff
    style Error1 fill:#ef4444,color:#fff
    style Error2 fill:#ef4444,color:#fff
    style ErrorOTP fill:#ef4444,color:#fff
```

## Decision Logic Table

| Condition | Requested Status | API Returned Status | Has deviceActivateUri? | Result |
|-----------|------------------|---------------------|------------------------|--------|
| 1 | ACTIVE | ACTIVE | No | ✅ Device ACTIVE - Show Success (No OTP) |
| 2 | ACTIVE | ACTIVE | Yes | ⚠️ Unexpected - Treat as ACTIVE |
| 3 | ACTIVATION_REQUIRED | ACTIVATION_REQUIRED | Yes | 🔄 Auto-send OTP → Navigate to Validation |
| 4 | ACTIVATION_REQUIRED | ACTIVE | No | ✅ Device ACTIVE - Show Success (No OTP) |
| 5 | ACTIVATION_REQUIRED | ACTIVE | Yes | ⚠️ Unexpected - Treat as ACTIVATION_REQUIRED |

## PingOne API Calls

### Common API Calls (Both ACTIVE and ACTIVATION_REQUIRED)

#### 1. User Lookup
**Endpoint:** `GET https://api.pingone.com/v1/environments/{environmentId}/users?filter=username eq "{username}"`

**Purpose:** Find the user by username to get the user ID

**Request:**
```http
GET /v1/environments/{environmentId}/users?filter=username eq "john.doe"
Authorization: Bearer {workerToken or userToken}
```

**Token Type Determination:**
- **Admin Flow:** Uses Worker Token (obtained via Client Credentials Grant)
- **User Flow:** Uses User Token (access token from Authorization Code Flow)

**Response:**
```json
{
  "_embedded": {
    "users": [
      {
        "id": "user-id-123",
        "username": "john.doe",
        "email": "john.doe@example.com",
        "name": "John Doe"
      }
    ]
  }
}
```

**Backend Endpoint:** `POST /api/pingone/mfa/lookup-user`

---

#### 2. Device Registration
**Endpoint:** `POST https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/devices`

**Purpose:** Create a new SMS device for the user

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {workerToken or userToken}
```

**Token in Authorization Header:**
- **Admin Flow:** `Authorization: Bearer {workerToken}` - Worker token from Client Credentials Grant
- **User Flow:** `Authorization: Bearer {userToken}` - User access token from Authorization Code Flow

**Important:** The token type is determined by the Registration Flow Type selected in Step 0:
- Admin Flow → Worker Token
- User Flow → User Token (access token)

**Request Body (ACTIVE):**
```json
{
  "type": "SMS",
  "phone": {
    "number": "+1.5125201234"
  },
  "nickname": "My SMS Device",
  "status": "ACTIVE",
  "policy": {
    "id": "device-authentication-policy-id"
  }
}
```

**Request Body (ACTIVATION_REQUIRED):**
```json
{
  "type": "SMS",
  "phone": {
    "number": "+1.5125201234"
  },
  "nickname": "My SMS Device",
  "status": "ACTIVATION_REQUIRED",
  "policy": {
    "id": "device-authentication-policy-id"
  }
}
```

**Response (ACTIVE):**
```json
{
  "id": "device-id-123",
  "type": "SMS",
  "status": "ACTIVE",
  "nickname": "My SMS Device",
  "phone": {
    "number": "+1.5125201234"
  },
  "environment": {
    "id": "environment-id-123"
  },
  "user": {
    "id": "user-id-123"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
  // Note: NO _links.device.activate when status is ACTIVE
}
```

**Response (ACTIVATION_REQUIRED):**
```json
{
  "id": "device-id-123",
  "type": "SMS",
  "status": "ACTIVATION_REQUIRED",
  "nickname": "My SMS Device",
  "phone": {
    "number": "+1.5125201234"
  },
  "environment": {
    "id": "environment-id-123"
  },
  "user": {
    "id": "user-id-123"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "_links": {
    "device.activate": {
      "href": "https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}"
    }
  }
}
```

**Backend Endpoint:** `POST /api/pingone/mfa/register-device`

**Key Differences:**
- **ACTIVE:** Device is immediately ready to use. No `device.activate` link in response.
- **ACTIVATION_REQUIRED:** PingOne automatically sends OTP to phone. `device.activate` link is present in `_links`.

---

### API Calls Specific to ACTIVATION_REQUIRED

#### 3. Device Activation (OTP Verification)
**Endpoint:** `POST {deviceActivateUri}` or `POST https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}`

**Purpose:** Activate the device by verifying the OTP code sent to the phone

**Request Headers:**
```http
Content-Type: application/vnd.pingidentity.device.activate+json
Authorization: Bearer {workerToken or userToken}
```

**Token in Authorization Header:**
- Uses the same token type as the registration call (Worker Token for Admin Flow, User Token for User Flow)

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "id": "device-id-123",
  "type": "SMS",
  "status": "ACTIVE",
  "nickname": "My SMS Device",
  "phone": {
    "number": "+1.5125201234"
  },
  "environment": {
    "id": "environment-id-123"
  },
  "user": {
    "id": "user-id-123"
  },
  "updatedAt": "2024-01-15T10:35:00Z"
  // Note: Status changed from ACTIVATION_REQUIRED to ACTIVE
  // Note: NO _links.device.activate after activation
}
```

**Response (Invalid OTP):**
```json
{
  "error": "INVALID_OTP",
  "message": "The OTP code provided is invalid or has expired"
}
```

**Backend Endpoint:** `POST /api/pingone/mfa/activate-device`

**Important Notes:**
- OTP is automatically sent by PingOne when device is created with `ACTIVATION_REQUIRED` status
- No separate "Send OTP" API call is needed
- The `deviceActivateUri` from the registration response should be used (hypermedia-first approach)
- If `deviceActivateUri` is not provided, construct the URL using the pattern: `/v1/environments/{envId}/users/{userId}/devices/{deviceId}`

---

## Flow Selection and Status Determination

### Step 0: Configuration Page

**Location:** `src/v8/flows/types/SMSFlowV8.tsx` (lines 303-715)

**Flow Selection UI:**
1. User selects **Admin Flow** or **User Flow** via radio buttons
2. **Admin Flow Selection:**
   - Shows device status options: `ACTIVE` or `ACTIVATION_REQUIRED`
   - User can choose either status
   - Automatically sets `tokenType: 'worker'`
   - Uses worker token from Client Credentials Grant
3. **User Flow Selection:**
   - Always uses `ACTIVATION_REQUIRED` status (enforced)
   - Automatically sets `tokenType: 'user'`
   - Opens UserLoginModal if no valid user token exists
   - Uses access token from Authorization Code Flow

**Code Reference:**
```typescript
// From SMSFlowV8.tsx:1143
const deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED' = 
  registrationFlowType === 'admin' ? adminDeviceStatus : 'ACTIVATION_REQUIRED';
```

### Token Type Determination

**Location:** `src/v8/flows/types/SMSFlowV8.tsx` (lines 1071-1075)

```typescript
const effectiveTokenType = registrationFlowType === 'admin' ? 'worker' 
  : registrationFlowType === 'user' ? 'user'
  : credentials.tokenType || 'worker';
```

**Token Retrieval:**
- **Worker Token:** `src/v8/services/mfaServiceV8.ts:269-338` - Calls `getWorkerToken()`
- **User Token:** `src/v8/services/mfaServiceV8.ts:248-263` - Uses `credentials.userToken` (from Authorization Code Flow)

**Token Usage in API Calls:**
- All PingOne API calls use: `Authorization: Bearer {accessToken}`
- The `accessToken` is either:
  - Worker Token (for Admin Flow)
  - User Token (for User Flow)

## Code Flow Summary

### Step-by-Step Execution

#### For ACTIVE Status (Admin Flow Only):

1. **Flow Selection** (Step 0 - `SMSFlowV8.tsx:303-715`)
   - User selects **Admin Flow**
   - User chooses device status: **ACTIVE**
   - System sets `tokenType: 'worker'`
   - System sets `registrationFlowType: 'admin'`
   - System sets `adminDeviceStatus: 'ACTIVE'`

2. **Token Acquisition** (`mfaServiceV8.ts:248-263`)
   - Admin Flow → Get Worker Token via Client Credentials Grant
   - Token stored in credentials for API calls

3. **Validation** (`SMSFlowV8.tsx:1058-1118`)
   - Validate environmentId, username, deviceAuthenticationPolicyId
   - Validate phone number format
   - Check token validity (worker token for Admin Flow)

4. **User Lookup** (`mfaServiceV8.ts:346-427`)
   - Call `lookupUserByUsername()`
   - Backend: `POST /api/pingone/mfa/lookup-user`
   - PingOne: `GET /v1/environments/{envId}/users?filter=username eq "{username}"`
   - **Authorization Header:** `Bearer {workerToken}`

5. **Build Registration Params** (`SMSFlowController.ts:80-105`)
   - Set `status: 'ACTIVE'` (from `adminDeviceStatus`)
   - Include phone, nickname, policy
   - Include `tokenType: 'worker'` and `userToken: undefined`

6. **Register Device** (`mfaServiceV8.ts:434-736`)
   - Get token: `getToken()` returns worker token
   - Backend: `POST /api/pingone/mfa/register-device`
   - **Request includes:** `workerToken: {workerToken}`, `tokenType: 'worker'`
   - PingOne: `POST /v1/environments/{envId}/users/{userId}/devices`
   - **Authorization Header:** `Bearer {workerToken}`
   - Payload includes `status: "ACTIVE"`

7. **Process Response** (`SMSFlowV8.tsx:1215-1340`)
   - Check if `status === 'ACTIVE'` and no `deviceActivateUri`
   - Show success screen immediately
   - No OTP required

---

#### For ACTIVATION_REQUIRED Status (Admin Flow or User Flow):

**Admin Flow Path:**

1. **Flow Selection** (Step 0)
   - User selects **Admin Flow**
   - User chooses device status: **ACTIVATION_REQUIRED**
   - System sets `tokenType: 'worker'`
   - System sets `registrationFlowType: 'admin'`
   - System sets `adminDeviceStatus: 'ACTIVATION_REQUIRED'`

2. **Token Acquisition**
   - Get Worker Token via Client Credentials Grant

3. **Validation** (Same as ACTIVE)

4. **User Lookup** (Same as ACTIVE, uses Worker Token)

5. **Build Registration Params**
   - Set `status: 'ACTIVATION_REQUIRED'` (from `adminDeviceStatus`)
   - Include phone, nickname, policy
   - Include `tokenType: 'worker'`

6. **Register Device**
   - **Authorization Header:** `Bearer {workerToken}`
   - Payload includes `status: "ACTIVATION_REQUIRED"`

**User Flow Path:**

1. **Flow Selection** (Step 0)
   - User selects **User Flow**
   - System automatically sets `status: 'ACTIVATION_REQUIRED'` (enforced)
   - System sets `tokenType: 'user'`
   - System sets `registrationFlowType: 'user'`
   - Opens UserLoginModal if no valid user token exists

2. **Token Acquisition**
   - User logs in via Authorization Code Flow
   - Access token obtained from OAuth callback
   - Token stored in `credentials.userToken`

3. **Validation** (Same as ACTIVE, but checks for user token)

4. **User Lookup**
   - **Authorization Header:** `Bearer {userToken}` (access token from Auth Code Flow)

5. **Build Registration Params**
   - Set `status: 'ACTIVATION_REQUIRED'` (always, enforced)
   - Include phone, nickname, policy
   - Include `tokenType: 'user'` and `userToken: {userToken}`

6. **Register Device**
   - Get token: `getToken()` returns user token from `credentials.userToken`
   - Backend: `POST /api/pingone/mfa/register-device`
   - **Request includes:** `userToken: {userToken}`, `tokenType: 'user'`
   - **Authorization Header:** `Bearer {userToken}` (access token from Authorization Code Flow)
   - Payload includes `status: "ACTIVATION_REQUIRED"`

**Common Steps (Both Admin and User Flow):**

7. **Process Response** (`SMSFlowV8.tsx:1276-1305`)
   - Check if `status === 'ACTIVATION_REQUIRED'` and `deviceActivateUri` exists
   - PingOne automatically sends OTP to phone (no manual API call needed)
   - Navigate to Step 4 (Validation screen)
   - Store `deviceActivateUri` in state

8. **User Enters OTP** (`SMSFlowV8.tsx:2709-2750`)
   - User enters OTP code received via SMS

9. **Activate Device** (`mfaServiceV8.ts:1528-1600`)
   - Backend: `POST /api/pingone/mfa/activate-device`
   - PingOne: `POST {deviceActivateUri}` with `Content-Type: application/vnd.pingidentity.device.activate+json`
   - **Authorization Header:** `Bearer {token}` (same token type as registration: worker token for Admin Flow, user token for User Flow)
   - Body: `{ "otp": "123456" }`

10. **Process Activation Response**
    - If valid: Device status changes to `ACTIVE`, show success
    - If invalid: Show error, allow retry

---

## Key Code Locations

### Frontend
- **SMS Flow Component:** `src/v8/flows/types/SMSFlowV8.tsx`
  - Registration handler: `handleRegisterDevice()` (line 1058)
  - Status decision logic: Lines 1215-1370
  - OTP validation: Lines 2709-2750

- **SMS Controller:** `src/v8/flows/controllers/SMSFlowController.ts`
  - Registration params: `getDeviceRegistrationParams()` (line 80)

### Service Layer
- **MFA Service:** `src/v8/services/mfaServiceV8.ts`
  - User lookup: `lookupUserByUsername()` (line 346)
  - Device registration: `registerDevice()` (line 434)
  - Device activation: `activateDevice()` (line 1528)

### Backend
- **Server Endpoints:** `server.js`
  - User lookup: `POST /api/pingone/mfa/lookup-user` (line 6275)
  - Device registration: `POST /api/pingone/mfa/register-device` (line 7711)
  - Device activation: `POST /api/pingone/mfa/activate-device` (line 8596)

---

## Status Decision Logic

The code uses the following logic to determine the device state:

```typescript
// From SMSFlowV8.tsx:1227-1240
const requestedActivationRequired = deviceStatus === 'ACTIVATION_REQUIRED';
const requestedActive = deviceStatus === 'ACTIVE';
const apiConfirmedActive = actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;
const apiReturnedActiveWithoutUri = actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;

if (apiReturnedActiveWithoutUri) {
  // Device is already ACTIVE - show success screen
} else if (requestedActivationRequired && hasDeviceActivateUri) {
  // Device requires activation - navigate to validation
} else if (requestedActive && (apiConfirmedActive || actualDeviceStatus === 'ACTIVE')) {
  // Admin flow: Device is ACTIVE - show success screen
}
```

**Key Rules:**
1. If API returns `ACTIVE` and no `deviceActivateUri` → Device is ACTIVE (no OTP needed)
2. If API returns `ACTIVATION_REQUIRED` and has `deviceActivateUri` → Device needs activation (OTP required)
3. The presence of `deviceActivateUri` in `_links` is the definitive indicator that activation is required

---

## Token Types and Authorization Headers

### Worker Token (Admin Flow)
- **Source:** Client Credentials Grant (`POST /api/pingone/worker-token`)
- **Can set device status to:** Either `ACTIVE` or `ACTIVATION_REQUIRED`
- **Used in:** Admin Flow
- **Authorization Header Format:** `Authorization: Bearer {workerToken}`
- **Token Type in Request:** `tokenType: 'worker'`
- **Request Body Field:** `workerToken: {workerToken}`

### User Token (User Flow)
- **Source:** Authorization Code Flow (user logs in to PingOne)
- **Can set device status to:** Only `ACTIVATION_REQUIRED` (security requirement enforced by PingOne)
- **Used in:** User Flow
- **Authorization Header Format:** `Authorization: Bearer {userToken}` (access token from OAuth)
- **Token Type in Request:** `tokenType: 'user'`
- **Request Body Field:** `userToken: {userToken}` (access token from Authorization Code Flow)

**Important Notes:**
- The token type is determined by the Registration Flow Type selected in Step 0
- All PingOne API calls use the same token type throughout the flow:
  - User Lookup → Uses selected token type
  - Device Registration → Uses selected token type
  - Device Activation → Uses selected token type
- User tokens are obtained when the user completes the Authorization Code Flow (logs in to PingOne)
- Worker tokens are obtained via Client Credentials Grant (no user interaction)

---

## Summary

### ACTIVE Flow (Admin Flow Only)
1. **Flow Selection:** Admin Flow → Status: ACTIVE → Worker Token
2. **Token Acquisition:** Get Worker Token (Client Credentials Grant)
3. **User Lookup API:** `GET /users?filter=username` (Authorization: Bearer {workerToken})
4. **Device Registration API:** `POST /devices` with `status: "ACTIVE"` (Authorization: Bearer {workerToken})
5. ✅ **Success** - Device ready immediately

**Total API Calls: 3** (Token + User Lookup + Device Registration)

### ACTIVATION_REQUIRED Flow (Admin Flow or User Flow)

**Admin Flow Path:**
1. **Flow Selection:** Admin Flow → Status: ACTIVATION_REQUIRED → Worker Token
2. **Token Acquisition:** Get Worker Token (Client Credentials Grant)
3. **User Lookup API:** `GET /users?filter=username` (Authorization: Bearer {workerToken})
4. **Device Registration API:** `POST /devices` with `status: "ACTIVATION_REQUIRED"` (Authorization: Bearer {workerToken})
   - PingOne automatically sends OTP (no API call needed)
5. **Device Activation API:** `POST {deviceActivateUri}` with OTP (Authorization: Bearer {workerToken})
6. ✅ **Success** - Device activated

**User Flow Path:**
1. **Flow Selection:** User Flow → Status: ACTIVATION_REQUIRED (enforced) → User Token
2. **Token Acquisition:** User logs in via Authorization Code Flow → Access Token obtained
3. **User Lookup API:** `GET /users?filter=username` (Authorization: Bearer {userToken})
4. **Device Registration API:** `POST /devices` with `status: "ACTIVATION_REQUIRED"` (Authorization: Bearer {userToken})
   - PingOne automatically sends OTP (no API call needed)
5. **Device Activation API:** `POST {deviceActivateUri}` with OTP (Authorization: Bearer {userToken})
6. ✅ **Success** - Device activated

**Total API Calls: 4** (Token + User Lookup + Device Registration + Device Activation)
**Note:** OTP sending is automatic, not a separate API call

---

## References

- PingOne MFA API Docs: https://apidocs.pingidentity.com/pingone/mfa/v1/api/
- Device Registration: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms
- Device Activation: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device

