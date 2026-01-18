# Unified Flow - Client Credentials Flow UI Contract

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** Client Credentials Flow (OAuth 2.0 / OAuth 2.1)  
**Component:** `UnifiedOAuthFlowV8U` → `UnifiedFlowSteps` → `CredentialsFormV8U`

## Overview

The Client Credentials Flow is an OAuth 2.0 flow designed for server-to-server communication where there is no user involved. The application authenticates using its own credentials (client ID and client secret) to obtain an access token for API access.

### Available Spec Versions

- ✅ **OAuth 2.0**: Supported (RFC 6749)
- ✅ **OAuth 2.1**: Fully supported
- ❌ **OIDC**: Not supported (no user identity in client credentials flow)

## Flow Steps

The Client Credentials Flow consists of **4 steps** (0-indexed):

1. **Step 0**: Configure Credentials
2. **Step 1**: Request Token
3. **Step 2**: Display Tokens
4. **Step 3**: Introspection & UserInfo

## Step-by-Step Contract

### Step 0: Configure Credentials

**Component:** `CredentialsFormV8U`  
**Purpose:** Collect and validate OAuth credentials for client credentials flow

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `environmentId` | `string` | PingOne Environment ID | Required, non-empty |
| `clientId` | `string` | OAuth Client ID | Required, non-empty |
| `clientSecret` | `string` | Client Secret | Required, non-empty (confidential client) |
| `scopes` | `string` | Space-separated scopes | Required, non-empty |

#### Optional Fields

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `clientAuthMethod` | `'client_secret_basic' \| 'client_secret_post' \| 'client_secret_jwt' \| 'private_key_jwt'` | Client Auth Method | `'client_secret_basic'` | How to authenticate with token endpoint |
| `audience` | `string` | Resource server identifier | `undefined` | Optional, for resource-based scopes |
| `resource` | `string` | Resource identifier | `undefined` | Optional, for token audience |

#### Field Visibility Rules

- **Client Secret**: Visible and required (client credentials flow uses confidential clients)
- **PKCE Configuration**: Hidden (PKCE not applicable to client credentials flow)
- **Response Type**: Hidden (client credentials flow doesn't use authorization endpoint)
- **Response Mode**: Hidden (client credentials flow doesn't use redirects)
- **Redirect URI**: Hidden (not used in client credentials flow)
- **Token Endpoint Auth Method**: Shows all methods (basic, post, JWT)

#### Validation Rules

```typescript
// Validation logic
const isValid = 
  credentials.environmentId?.trim() &&
  credentials.clientId?.trim() &&
  credentials.clientSecret?.trim() &&
  credentials.scopes?.trim();
```

#### Output

- **State**: Updated `credentials` object
- **Persistence**: Saved to `localStorage` under flow key: `client-credentials-v8u`
- **Next Step**: Enabled when all required fields are present

---

### Step 1: Request Token

**Component:** `renderStep2RequestToken()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.requestToken()`  
**Purpose:** Request access token using client credentials

#### Pre-Flight Validation

Before requesting tokens, the system performs comprehensive pre-flight validation:

**Service:** `PreFlightValidationServiceV8.validateBeforeAuthUrl()`

**Validation Checks:**
- ✅ Client secret requirements
- ✅ Token endpoint authentication method compatibility
- ✅ Scope requirements
- ✅ Client credentials flow compatibility

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
- **Passed**: Continue with token request

#### Inputs

- `credentials`: Full credentials object from Step 0
- `flowType`: `'client-credentials'`

#### API Endpoint

**Backend Proxy:** `POST /api/token-exchange`

**Request Body:**
```json
{
  "grant_type": "client_credentials",
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",
  "scope": "{scopes}",
  "audience": "{audience}",  // Optional
  "resource": "{resource}",  // Optional
  "environment_id": "{environment_id}",
  "client_auth_method": "{client_auth_method}"
}
```

**Authentication Methods**:

1. **`client_secret_basic`** (HTTP Basic Auth):
   - Header: `Authorization: Basic {base64(client_id:client_secret)}`
   - Secret not in request body

2. **`client_secret_post`**:
   - Client ID and secret in POST body
   - Simpler but less secure

3. **`client_secret_jwt`**:
   - Client secret used to sign JWT assertion (HS256)
   - JWT assertion in `client_assertion` parameter
   - More secure (no secret in headers/body)

4. **`private_key_jwt`**:
   - Private key used to sign JWT assertion (RS256)
   - Most secure method (asymmetric cryptography)
   - Requires private key configuration

**Response (Success - 200 OK):**
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "string"
}
```

**Note**: Client credentials flow does NOT return:
- ❌ Refresh tokens
- ❌ ID tokens
- ❌ ID tokens

#### Processing

1. **Validate Credentials**: Check all required fields are present
2. **Build Request**: Include grant type, client ID, secret, scopes
3. **Apply Auth Method**: Use selected authentication method
4. **Send Request**: POST to token endpoint via backend proxy
5. **Handle Response**: Extract access token from response

#### Output

- **State Updates**:
  ```typescript
  {
    tokens: {
      accessToken: string,
      expiresIn: number,
      tokenType: 'Bearer',
      scope: string
    }
  }
  ```
- **Persistence**: Tokens saved to `sessionStorage` under key: `v8u_client_credentials_tokens`
- **Next Step**: Enabled automatically when token received

#### Error Handling

- **Invalid Credentials**: Error message, check client ID and secret
- **Invalid Scope**: Error message, check scope is allowed
- **Client Auth Failed**: Error message, check authentication method
- **Grant Type Not Enabled**: Error message, enable in PingOne

---

### Step 2: Display Tokens

**Component:** `renderStep3Tokens()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenDisplayServiceV8`  
**Purpose:** Display received access token with decode and copy options

#### Inputs

- `flowState.tokens`: Token object from Step 1
- `specVersion`: Filter tokens based on spec version

#### Display Fields

| Token | Display | Decode | Copy | Notes |
|-------|---------|--------|------|-------|
| Access Token | ✅ | ✅ (if JWT) | ✅ | Always present |
| Refresh Token | ❌ | N/A | N/A | **Not issued** in client credentials flow |
| ID Token | ❌ | N/A | N/A | **Not issued** (no user identity) |

#### Token Display Component

- **Access Token**:
  - Full token value (truncated for display)
  - "Copy" button
  - "Decode" button (if JWT)
  - Token type (always `Bearer`)
  - Expiration time
  - Granted scopes

#### Educational Content

- Explains why refresh tokens are not issued
- Explains why ID tokens are not available
- Shows token expiration information
- Provides next steps (Introspection)

#### Next Step

- Enabled when token is displayed
- Proceeds to Step 3 (Introspection)

---

### Step 3: Introspection & UserInfo

**Component:** `renderStep4Introspection()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenOperationsServiceV8`  
**Purpose:** Token introspection (UserInfo not available)

#### Token Introspection

**Available Tokens for Introspection:**

| Token Type | Available | Reason |
|------------|-----------|--------|
| Access Token | ✅ | Can be introspected |
| Refresh Token | ❌ | Not issued in client credentials flow |
| ID Token | ❌ | Not issued (no user identity) |

**Introspection Service:**
- Endpoint: `/api/introspect-token` (proxy)
- PingOne Endpoint: `https://auth.pingone.com/{environmentId}/as/introspect`
- Auth Method: `client_secret_post` (requires client secret)

**Note:** Client credentials flow uses confidential clients (has client secret), so introspection is fully supported.

#### UserInfo Endpoint

**Availability:**
- ❌ **Not Available**: UserInfo endpoint requires user context
- ❌ **Client Credentials Flow**: No user involved, so no UserInfo

**Why Not Available**:
- Client credentials flow is for machine-to-machine authentication
- No user is authenticated, so there's no user information to retrieve
- UserInfo endpoint requires an access token tied to a user identity

#### UI Components

1. **Introspection Section**:
   - Token type selector (Access Token only)
   - "Introspect Token" button
   - Results display (active, scope, client_id, sub, exp, iat, etc.)

2. **UserInfo Section**:
   - Not shown (not available for client credentials flow)

3. **Educational Content**:
   - Why refresh tokens aren't available
   - Why ID tokens aren't available
   - Why UserInfo isn't available
   - How to use introspection to validate tokens

---

## State Management

### Flow State Interface

```typescript
interface FlowState {
  // Tokens (from token request)
  tokens?: {
    accessToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
    scope: string;
  };
}
```

### Persistence

#### Credentials Storage

- **Location**: `localStorage`
- **Key Format**: `credentials_client-credentials-v8u_{specVersion}`
- **Storage Trigger**: On field change or form blur
- **Restoration**: Auto-restored on component mount

#### Token Storage

- **Location**: `sessionStorage`
- **Key**: `v8u_client_credentials_tokens`
- **Storage Trigger**: After successful token request
- **Expiration**: Browser session only (cleared on tab close)
- **Format**:
  ```json
  {
    "accessToken": "...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "scope": "api:read api:write",
    "timestamp": 1234567890
  }
  ```

#### State Restoration

- **URL Parameters**: Route and query parameters for step/spec
- **Session Restoration**: Tokens restored from `sessionStorage` if available

---

## URL Parameters

### Route

```
/v8u/unified/client-credentials/{step}
```

**Step Values:**
- `0` = Configure
- `1` = Request Token
- `2` = Display Tokens
- `3` = Introspection

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `spec` | `'oauth2.0' \| 'oauth2.1'` | No | Spec version | `?spec=oauth2.1` |
| `step` | `number` | No | Step number | `?step=1` |

---

## Error Handling

### Configuration Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing Environment ID | Required field empty | Enter Environment ID |
| Missing Client ID | Required field empty | Enter Client ID |
| Missing Client Secret | Required field empty | Enter Client Secret |
| Missing Scopes | Required field empty | Enter scopes |

### Token Request Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `invalid_client` | Client ID/secret incorrect | Check credentials |
| `invalid_scope` | Scope not allowed | Use allowed scopes |
| `unauthorized_client` | Grant type not enabled | Enable in PingOne |
| `invalid_grant` | Grant type invalid | Check PingOne configuration |
| `server_error` | PingOne server error | Retry or check status |

### Authentication Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Client Auth Failed | Authentication method mismatch | Check auth method setting |
| JWT Invalid | JWT assertion malformed | Check JWT signing |
| Private Key Invalid | Private key incorrect | Verify private key |

---

## Compliance Rules

### OAuth 2.0

- ✅ Client credentials flow supported (RFC 6749 Section 4.4)
- ✅ Confidential clients (requires client secret)
- ✅ No user context (machine-to-machine)
- ✅ No refresh tokens
- ✅ No ID tokens

### OAuth 2.1

- ✅ Client credentials flow fully supported
- ✅ Same behavior as OAuth 2.0

### OIDC

- ❌ **Not supported** - Client credentials flow has no user identity
- ⚠️ Flow will not be shown in OIDC spec selector

---

## API Endpoints Used

### PingOne Endpoints

1. **Token Endpoint**:
   ```
   POST https://auth.pingone.com/{environmentId}/as/token
   ```

2. **Introspection Endpoint**:
   ```
   POST https://auth.pingone.com/{environmentId}/as/introspect
   ```

### Backend Proxy Endpoints

1. **Token Exchange Proxy**:
   ```
   POST /api/token-exchange
   Body: {
     grant_type: "client_credentials",
     client_id: string,
     client_secret: string,
     scope: string,
     audience: string,  // Optional
     resource: string,  // Optional
     environment_id: string,
     client_auth_method: string
   }
   ```

2. **Introspection Proxy**:
   ```
   POST /api/introspect-token
   Body: {
     token: string,
     token_type_hint: 'access_token',
     client_id: string,
     client_secret: string,
     introspection_endpoint: string,
     token_auth_method: string
   }
   ```

---

## Testing Checklist

### Configuration Step

- [ ] Environment ID field accepts valid UUID format
- [ ] Client ID field accepts valid string
- [ ] Client Secret field accepts valid string (required)
- [ ] Scopes field accepts space-separated values
- [ ] Client Auth Method selector shows all methods
- [ ] Redirect URI field is hidden
- [ ] PKCE options are hidden
- [ ] Form validation shows errors for missing fields
- [ ] Credentials persist to localStorage

### Token Request Step

- [ ] Token request includes all required parameters
- [ ] Client authentication works for all methods
- [ ] JWT-based auth methods work correctly
- [ ] Token is received successfully
- [ ] Errors are displayed for invalid requests
- [ ] Tokens are saved to sessionStorage

### Token Display Step

- [ ] Access token is displayed
- [ ] Refresh token is not shown (not available)
- [ ] ID token is not shown (not available)
- [ ] Token copy works
- [ ] Token decode works (JWT)
- [ ] Expiration time is shown
- [ ] Educational content is shown

### Introspection Step

- [ ] Access token can be introspected
- [ ] Refresh token button is disabled (not available)
- [ ] ID token button is disabled (not available)
- [ ] Introspection results are displayed
- [ ] UserInfo button is not shown (not available)
- [ ] Error handling works for failed requests

---

## Implementation Notes

### Key Characteristics

1. **No User Context**: Flow represents the application, not a user
2. **No Refresh Tokens**: Must re-request token when expired
3. **No ID Tokens**: No user identity information
4. **Confidential Client**: Always requires client secret
5. **Direct Token Request**: No authorization step (direct to token endpoint)

### Security Considerations

1. **Client Secret Security**: Must be kept secure (never expose in client-side code)
2. **JWT Auth Methods**: More secure than basic auth (no secret in headers/body)
3. **Private Key JWT**: Most secure (asymmetric cryptography)
4. **Token Expiration**: Plan for token re-request strategy

### Best Practices

1. ✅ Use JWT-based authentication methods when possible
2. ✅ Cache tokens until expiration
3. ✅ Re-request tokens proactively (before expiration)
4. ✅ Never expose client secrets in client-side code
5. ✅ Use appropriate scopes (principle of least privilege)

---

## Step 4: API Documentation

**Component:** `UnifiedFlowDocumentationPageV8U`  
**Purpose:** Display comprehensive API documentation for the flow

### Download Options

The documentation page provides three download options:

1. **Download Markdown** (`handleDownloadMarkdown`)
   - Icon: `FiFileText`
   - Background: `#3b82f6` (blue)
   - Generates markdown file with all API calls

2. **Download PDF** (`handleDownloadPDF`)
   - Icon: `FiDownload`
   - Background: `#10b981` (green)
   - Generates PDF file with all API calls

3. **Download Postman Collection** (`handleDownloadPostman`)
   - Icon: `FiPackage`
   - Background: `#8b5cf6` (purple)
   - Generates Postman collection JSON file
   - Format: `{{authPath}}/{{envID}}/path` (matches PingOne documentation format)
   - Variables included: `authPath`, `envID`, `client_id`, `client_secret`, `workerToken`
   - Reference: [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)

### Postman Collection Format

The generated Postman collection uses the following format:
- **URL Format**: `{{authPath}}/{{envID}}/as/token`
- **Variables**:
  - `authPath`: `https://auth.pingone.com` (includes protocol)
  - `envID`: Environment ID from credentials
  - `client_id`: Client ID from credentials
  - `client_secret`: Client Secret from credentials (type: `secret`)
  - `workerToken`: Empty (user fills in)

### Button Styling

All download buttons:
- Padding: `12px 24px`
- Border radius: `8px`
- Font size: `16px`
- Font weight: `600`
- Display: `flex`
- Align items: `center`
- Gap: `8px`

---

## References

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 6749 Section 4.4 - Client Credentials Grant](https://tools.ietf.org/html/rfc6749#section-4.4)
- [OAuth 2.1 Best Current Practices](https://oauth.net/2.1/)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/main/v1/api/)
- [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)
- [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)

