# Unified Flow - Device Authorization Flow UI Contract

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** Device Authorization Flow (RFC 8628)  
**Component:** `UnifiedOAuthFlowV8U` → `UnifiedFlowSteps` → `CredentialsFormV8U`

## Overview

The Device Authorization Flow (RFC 8628) is an OAuth 2.0 / OIDC flow designed for devices with limited input capabilities, such as smart TVs, IoT devices, or command-line tools. The user authorizes the device on a separate device with a browser, while the constrained device polls for tokens.

### Available Spec Versions

- ✅ **OAuth 2.0**: Supported (RFC 6749 + RFC 8628)
- ✅ **OAuth 2.1**: Supported (RFC 8628)
- ✅ **OIDC**: Supported (with `openid` scope)

### RFC 8628 Compliance

- ✅ Uses server-provided `interval` from device authorization response
- ✅ Respects `slow_down` error with interval adjustment (minimum 5 seconds increase)
- ✅ Handles all RFC 8628 error codes (`authorization_pending`, `slow_down`, `expired_token`, `access_denied`)
- ✅ Supports `verification_uri_complete` (QR code with pre-filled user code)
- ✅ No PKCE (Device Authorization Flow does not use PKCE)

## Flow Steps

The Device Authorization Flow consists of **5 steps** (0-indexed):

1. **Step 0**: Configure Credentials
2. **Step 1**: Request Device Authorization
3. **Step 2**: Poll for Tokens
4. **Step 3**: Display Tokens
5. **Step 4**: Introspection & UserInfo

## Step-by-Step Contract

### Step 0: Configure Credentials

**Component:** `CredentialsFormV8U`  
**Purpose:** Collect and validate OAuth credentials for device authorization

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `environmentId` | `string` | PingOne Environment ID | Required, non-empty |
| `clientId` | `string` | OAuth Client ID | Required, non-empty |
| `scopes` | `string` | Space-separated scopes | Required, non-empty |

#### Optional Fields

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `clientSecret` | `string` | Client Secret | `undefined` | Required if app requires client authentication |
| `clientAuthMethod` | `'client_secret_basic' \| 'client_secret_post' \| 'none'` | Client Auth Method | `'client_secret_basic'` if secret provided, `'none'` otherwise | Device flow supports only basic auth methods |
| `redirectUri` | `string` | Redirect URI | Auto-generated | Not used in device flow, but stored for consistency |

#### Field Visibility Rules

- **PKCE Configuration**: Hidden (PKCE not supported for device authorization flow)
- **Response Type**: Hidden (device flow doesn't use authorization endpoint)
- **Response Mode**: Hidden (device flow doesn't use redirects)
- **Token Endpoint Auth Method**: Shows only basic methods (`client_secret_basic`, `client_secret_post`, `none`)
  - JWT-based methods (`client_secret_jwt`, `private_key_jwt`) are not supported

#### Validation Rules

```typescript
// Validation logic
const isValid = 
  credentials.environmentId?.trim() &&
  credentials.clientId?.trim() &&
  credentials.scopes?.trim();
```

#### Output

- **State**: Updated `credentials` object
- **Persistence**: Saved to `localStorage` under flow key: `device-code-v8u`
- **Next Step**: Enabled when all required fields are present

---

### Step 1: Request Device Authorization

**Component:** `renderStep1DeviceAuth()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.requestDeviceAuthorization()`  
**Purpose:** Request device authorization and receive device code, user code, and verification URI

#### Pre-Flight Validation

Before requesting device authorization, the system performs comprehensive pre-flight validation:

**Service:** `PreFlightValidationServiceV8.validateBeforeAuthUrl()`

**Validation Checks:**
- ✅ Client secret requirements
- ✅ Token endpoint authentication method compatibility
- ✅ Scope requirements
- ✅ Device code flow compatibility

**UI Feedback:**
- **Small Inline Spinner**: Shows during validation with message "🔍 Validating Configuration against PingOne..."
- **Toast Messages**:
  - ✅ Success: "Pre-flight validation passed!" (if no errors/warnings)
  - ⚠️ Warning: "Pre-flight validation warnings - check details below" (if warnings only)
  - ❌ Error: "Pre-flight validation failed - check error details below" (if errors found)

**Auto-Fix Functionality:**
- If fixable errors are detected, user is prompted to auto-fix them
- Fixable errors include:
  - Auth method mismatch (can update to match PingOne)
- After auto-fix, validation is re-run automatically
- Toast message shows: "Fixed {count} error(s): {list of fixes}"

**Validation Result:**
- **Errors**: Block progression, must be fixed before continuing
- **Warnings**: Allow continuation, but user should be aware
- **Passed**: Continue with device authorization request

**Note:** The spinner does not block the UI during device authorization. Once the QR code is displayed, the spinner is hidden to allow users to scan the QR code.

#### Inputs

- `credentials`: Full credentials object from Step 0
- `flowType`: `'device-code'`

#### API Endpoint

**Backend Proxy:** `POST /api/device-authorization`

**Request Body:**
```json
{
  "environment_id": "string",
  "client_id": "string",
  "client_secret": "string (optional)",
  "client_auth_method": "client_secret_basic | client_secret_post | none",
  "scope": "string (space-separated)"
}
```

**Response (Success - 200 OK):**
```json
{
  "device_code": "string",
  "user_code": "string",
  "verification_uri": "string",
  "verification_uri_complete": "string (optional, RFC 8628 Section 3.2)",
  "expires_in": 900,
  "interval": 5
}
```

**Response Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_code` | `string` | ✅ | Code used for polling token endpoint |
| `user_code` | `string` | ✅ | Short code displayed to user for verification |
| `verification_uri` | `string` | ✅ | URL where user enters user code |
| `verification_uri_complete` | `string` | ❌ | Full URL with user code pre-filled (for QR codes) |
| `expires_in` | `number` | ✅ | Device code expiration time in seconds (typically 900 = 15 minutes) |
| `interval` | `number` | ❌ | Polling interval in seconds (typically 5, RFC 8628 Section 3.2) |

**Error Responses:**

| Status | Error Code | Description | Handling |
|--------|------------|-------------|----------|
| 403 | `unauthorized_client` | Grant type not enabled or missing client auth | Show configuration instructions |
| 400 | Various | Invalid request parameters | Display error message |

#### Processing

1. **Validate Required Fields**:
   - Check `environmentId`, `clientId`, `scopes` are present
   - Validate client authentication method is supported

2. **Build Request**:
   - Include `environment_id`, `client_id`
   - Include `client_secret` and `client_auth_method` if provided
   - Include `scope` if provided

3. **Send Request** via backend proxy (avoids CORS)

4. **Handle Response**:
   - Store `device_code`, `user_code`, `verification_uri`, `verification_uri_complete`
   - Store `expires_in` and calculate expiration timestamp
   - **CRITICAL**: Store `interval` from response (defaults to 5 if not provided)
   - Store expiration timestamp: `deviceCodeExpiresAt = Date.now() + expires_in * 1000`

5. **Display Results**:
   - Show user code prominently
   - Display verification URI
   - Show QR code if `verification_uri_complete` is provided
   - Display expiration countdown timer
   - Show polling interval

#### State Updates

```typescript
flowState = {
  deviceCode: result.device_code,
  userCode: result.user_code,
  verificationUri: result.verification_uri,
  verificationUriComplete: result.verification_uri_complete,
  deviceCodeExpiresIn: result.expires_in,
  deviceCodeExpiresAt: Date.now() + result.expires_in * 1000,
  deviceCodeInterval: result.interval || 5, // RFC 8628 compliance
  pollingStatus: {
    isPolling: false,
    pollCount: 0
  }
}
```

#### Output

- **State**: Updated `flowState` with device authorization response
- **Persistence**: Saved to `sessionStorage` under key: `v8u_device_code_data`
- **Next Step**: Enabled automatically
- **UI**: Displays user code, verification URI, QR code, and instructions

---

### Step 2: Poll for Tokens

**Component:** `renderStep2Poll()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.pollForTokens()` → `DeviceCodeIntegrationServiceV8.pollForTokens()`  
**Purpose:** Poll token endpoint until user authorizes the device

#### Inputs

- `flowState.deviceCode`: Device code from Step 1
- `flowState.deviceCodeInterval`: Polling interval from Step 1 (RFC 8628 compliance)
- `flowState.deviceCodeExpiresAt`: Expiration timestamp

#### API Endpoint

**Backend Proxy:** `POST /api/token-exchange`

**Request Body:**
```json
{
  "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
  "client_id": "string",
  "device_code": "string",
  "environment_id": "string",
  "client_secret": "string (optional)",
  "client_auth_method": "client_secret_basic | client_secret_post"
}
```

**Response (Success - 200 OK):**
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "string (optional)",
  "id_token": "string (optional, OIDC only)",
  "scope": "string"
}
```

**Error Response (Expected - 400 Bad Request):**

| Error Code | Description | Handling |
|------------|-------------|----------|
| `authorization_pending` | User hasn't authorized yet | Continue polling (normal behavior) |
| `slow_down` | Server requests slower polling | Increase interval by minimum 5 seconds (RFC 8628 Section 3.5) |
| `expired_token` | Device code expired | Stop polling, show error, request new code |
| `access_denied` | User denied authorization | Stop polling, show error |
| `invalid_grant` | Device code invalid | Stop polling, show error |

**RFC 8628 Error Response Format:**
```json
{
  "error": "authorization_pending | slow_down | expired_token | access_denied",
  "error_description": "string (optional)",
  "interval": 10 // Only present with slow_down
}
```

#### Processing

1. **Auto-Start Polling** (when step 2 loads):
   - Check if `deviceCode` exists
   - Check if tokens already received
   - Start polling automatically

2. **Polling Loop** (RFC 8628 Section 3.5):
   - **First Poll**: May happen immediately
   - **Subsequent Polls**: Wait `deviceCodeInterval` seconds between polls
   - **On `slow_down`**: Update `deviceCodeInterval` to `Math.max(errorData.interval, currentInterval + 5)`
   - **Maximum Attempts**: Calculated as `Math.ceil(expires_in / interval) + 10` (adds buffer)

3. **Polling Behavior**:
   - Track poll count
   - Update `pollingStatus` after each poll
   - Display real-time feedback (poll count, last poll time, current interval)
   - Handle abort (user can stop polling)

4. **Success Handling**:
   - Store tokens in `flowState.tokens`
   - Stop polling
   - Mark step as complete
   - Auto-fetch UserInfo if OIDC

5. **Error Handling**:
   - `authorization_pending`: Continue polling (not an error)
   - `slow_down`: Adjust interval, continue polling
   - `expired_token`: Stop polling, show expiration message
   - `access_denied`: Stop polling, show denial message
   - Other errors: Stop polling, show error message

#### State Updates

**During Polling:**
```typescript
flowState.pollingStatus = {
  isPolling: true,
  pollCount: number,
  lastPolled: Date.now()
}
```

**On Success:**
```typescript
flowState.tokens = {
  accessToken: tokens.access_token,
  tokenType: tokens.token_type,
  expiresIn: tokens.expires_in,
  refreshToken: tokens.refresh_token,
  idToken: tokens.id_token
}
flowState.pollingStatus = {
  isPolling: false,
  pollCount: number
}
```

**On `slow_down`:**
```typescript
flowState.deviceCodeInterval = Math.max(errorData.interval, currentInterval + 5)
```

#### Output

- **State**: Updated `flowState.tokens` on success
- **Persistence**: Tokens saved to `sessionStorage` under key: `v8u_tokens`
- **Next Step**: Enabled automatically when tokens received
- **UI**: Real-time polling status, progress indicators, stop button

---

### Step 3: Display Tokens

**Component:** `renderStep3Tokens()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenDisplayServiceV8`  
**Purpose:** Display received tokens with decode and copy options

#### Inputs

- `flowState.tokens`: Token response from Step 2
- `specVersion`: Filter tokens based on spec version

#### Token Filtering (by Spec Version)

| Spec Version | Access Token | ID Token | Refresh Token |
|--------------|--------------|----------|---------------|
| OAuth 2.0 | ✅ | ❌ | ✅ (if `offline_access` scope) |
| OAuth 2.1 | ✅ | ❌ | ✅ (if `offline_access` scope) |
| OIDC | ✅ | ✅ (if `openid` scope) | ✅ (if `offline_access` scope) |

#### Output

- **Display**: Token cards with copy/decode buttons
- **Actions**: Copy to clipboard, decode JWT, view token details
- **Next Step**: Enabled automatically

---

### Step 4: Introspection & UserInfo

**Component:** `renderStep4Introspection()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenOperationsServiceV8`, `OidcDiscoveryServiceV8`  
**Purpose:** Allow token introspection and UserInfo calls

#### Inputs

- `flowState.tokens`: Tokens from Step 3
- `credentials`: Credentials from Step 0
- `specVersion`: Determines available operations

#### Available Operations

| Operation | OAuth 2.0 | OAuth 2.1 | OIDC | Notes |
|-----------|-----------|-----------|------|-------|
| Introspect Access Token | ✅ | ✅ | ✅ | Requires `introspect-access` scope |
| Introspect Refresh Token | ✅ | ✅ | ✅ | Requires `introspect-refresh` scope |
| Introspect ID Token | ❌ | ❌ | ❌ | ID tokens should be validated locally, not introspected |
| Call UserInfo | ❌ | ❌ | ✅ | Requires `openid` scope and access token |

#### Output

- **Display**: Operation buttons with results
- **Actions**: Introspect tokens, call UserInfo endpoint
- **Results**: Displayed in modals or inline cards

---

## State Management

### FlowState Interface

```typescript
interface FlowState {
  // Device Code flow
  deviceCode?: string;
  userCode?: string;
  verificationUri?: string;
  verificationUriComplete?: string;
  deviceCodeExpiresIn?: number;
  deviceCodeExpiresAt?: number;
  deviceCodeInterval?: number; // RFC 8628: Server-provided polling interval
  pollingStatus?: {
    isPolling: boolean;
    pollCount: number;
    lastPolled?: number;
    error?: string;
  };

  // Tokens (all flows)
  tokens?: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  };

  // UserInfo (OIDC)
  userInfo?: Record<string, unknown>;
}
```

### Persistence

**Device Code Data:**
- **Storage**: `sessionStorage`
- **Key**: `v8u_device_code_data`
- **Contents**: `deviceCode`, `userCode`, `verificationUri`, `verificationUriComplete`, `deviceCodeExpiresIn`, `deviceCodeInterval`, `savedAt`

**Tokens:**
- **Storage**: `sessionStorage`
- **Key**: `v8u_tokens`
- **Contents**: Full token response

**Credentials:**
- **Storage**: `localStorage`
- **Key**: `device-code-v8u`
- **Contents**: Full credentials object

---

## URL Parameters

### Route Parameters

- `/v8u/unified/device-code/:specVersion/:step`
  - `specVersion`: `oauth2.0` | `oauth2.1` | `oidc`
  - `step`: `0` | `1` | `2` | `3` | `4`

### Query Parameters

None (device flow doesn't use redirects)

### Fragment Parameters

None (device flow doesn't use redirects)

---

## Error Handling

### API Errors

| Error Code | HTTP Status | User Message | Action |
|------------|-------------|--------------|--------|
| `unauthorized_client` | 403 | Grant type not enabled | Show configuration instructions |
| `invalid_client` | 401 | Invalid client credentials | Check client ID/secret |
| `authorization_pending` | 400 | User hasn't authorized yet | Continue polling (normal) |
| `slow_down` | 400 | Server requests slower polling | Increase interval, continue polling |
| `expired_token` | 400 | Device code expired | Request new device code |
| `access_denied` | 400 | User denied authorization | Show denial message |
| `invalid_grant` | 400 | Device code invalid | Request new device code |

### UI Error States

- **Missing Required Fields**: Show validation errors, disable next step
- **API Failure**: Show error message with retry button
- **Polling Timeout**: Show timeout message, allow new device code request
- **Expired Device Code**: Show expiration message, allow new device code request

---

## Compliance Rules

### RFC 8628 Compliance

1. **Interval Handling** (Section 3.5):
   - ✅ Use server-provided `interval` from device authorization response
   - ✅ Default to 5 seconds if `interval` not provided
   - ✅ On `slow_down`, increase interval by minimum 5 seconds
   - ✅ Store adjusted interval in state

2. **Polling Behavior** (Section 3.5):
   - ✅ First poll may happen immediately
   - ✅ Subsequent polls wait `interval` seconds
   - ✅ Maximum polling duration should align with `expires_in`
   - ✅ Stop polling on `expired_token`, `access_denied`, or timeout

3. **Error Handling** (Section 3.5):
   - ✅ `authorization_pending`: Continue polling (not an error)
   - ✅ `slow_down`: Increase interval, continue polling
   - ✅ `expired_token`: Stop polling, show error
   - ✅ `access_denied`: Stop polling, show error

4. **Verification URI** (Section 3.2):
   - ✅ Support `verification_uri_complete` for QR codes
   - ✅ Display user code prominently
   - ✅ Provide copy buttons for user code and verification URI

### Spec Version Compliance

| Spec Version | Grant Type | ID Token | Refresh Token | PKCE |
|--------------|------------|----------|---------------|------|
| OAuth 2.0 | `urn:ietf:params:oauth:grant-type:device_code` | ❌ | ✅ | ❌ |
| OAuth 2.1 | `urn:ietf:params:oauth:grant-type:device_code` | ❌ | ✅ | ❌ |
| OIDC | `urn:ietf:params:oauth:grant-type:device_code` | ✅ | ✅ | ❌ |

---

## Testing Checklist

### Step 0: Configure Credentials

- [ ] Environment ID validation
- [ ] Client ID validation
- [ ] Scopes validation
- [ ] Client authentication method selection
- [ ] Credentials persistence

### Step 1: Request Device Authorization

- [ ] Successful device authorization request
- [ ] Device code received
- [ ] User code received
- [ ] Verification URI received
- [ ] `verification_uri_complete` received (if provided by server)
- [ ] `interval` stored from response
- [ ] Expiration timestamp calculated correctly
- [ ] QR code displayed (if `verification_uri_complete` available)
- [ ] Error handling (403, 400, network errors)

### Step 2: Poll for Tokens

- [ ] Auto-start polling when step 2 loads
- [ ] Polling uses server-provided `interval`
- [ ] `authorization_pending` handled correctly (continues polling)
- [ ] `slow_down` handled correctly (increases interval by minimum 5s)
- [ ] `expired_token` handled correctly (stops polling, shows error)
- [ ] `access_denied` handled correctly (stops polling, shows error)
- [ ] Success response stores tokens correctly
- [ ] Polling status updates in real-time
- [ ] Stop polling button works
- [ ] Request new code button works

### Step 3: Display Tokens

- [ ] Access token displayed
- [ ] ID token displayed (OIDC only)
- [ ] Refresh token displayed (if present)
- [ ] Token copy buttons work
- [ ] Token decode buttons work
- [ ] Token filtering by spec version works

### Step 4: Introspection & UserInfo

- [ ] Introspect access token works
- [ ] Introspect refresh token works
- [ ] ID token introspection disabled (correctly)
- [ ] UserInfo call works (OIDC only)
- [ ] Results displayed correctly

### RFC 8628 Compliance

- [ ] Server-provided `interval` is used for polling
- [ ] `slow_down` increases interval correctly
- [ ] All error codes handled per RFC 8628
- [ ] Verification URI displayed correctly
- [ ] QR code works with `verification_uri_complete`

### Persistence & Restoration

- [ ] Device code data persists across page refresh
- [ ] Polling state restores correctly
- [ ] Tokens persist across page refresh
- [ ] Credentials persist across page refresh
- [ ] Expired device codes handled on restore

