# Unified Flow - Implicit Flow UI Contract

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** Implicit Flow (OAuth 2.0 / OIDC)  
**Component:** `UnifiedOAuthFlowV8U` → `UnifiedFlowSteps` → `CredentialsFormV8U`

## Overview

The Implicit Flow is an OAuth 2.0 / OIDC flow where tokens are returned directly in the URL fragment after user authorization. This flow is deprecated in OAuth 2.1 but supported in OAuth 2.0 and OIDC specifications.

### Available Spec Versions

- ✅ **OAuth 2.0**: Supported (RFC 6749)
- ❌ **OAuth 2.1**: Not supported (Implicit flow deprecated)
- ✅ **OIDC**: Supported (with `openid` scope)

## Flow Steps

The Implicit Flow consists of **5 steps** (0-indexed):

1. **Step 0**: Configure Credentials
2. **Step 1**: Generate Authorization URL
3. **Step 2**: Parse Callback Fragment
4. **Step 3**: Display Tokens
5. **Step 4**: Introspection & UserInfo

## Step-by-Step Contract

### Step 0: Configure Credentials

**Component:** `CredentialsFormV8U`  
**Purpose:** Collect and validate OAuth credentials

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `environmentId` | `string` | PingOne Environment ID | Required, non-empty |
| `clientId` | `string` | OAuth Client ID | Required, non-empty |
| `scopes` | `string` | Space-separated scopes | Required, non-empty |
| `redirectUri` | `string` | OAuth Redirect URI | Required, must match registered URI |

#### Optional Fields

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `clientSecret` | `string` | Client Secret | `undefined` | **NOT USED** in implicit flow (public client) |
| `clientAuthMethod` | `'none'` | Client Auth Method | `'none'` | Always `'none'` for implicit (public client) |
| `responseType` | `string` | Response Type | `'token id_token'` | Auto-set for implicit flow |
| `responseMode` | `'fragment'` | Response Mode | `'fragment'` | Always `'fragment'` for implicit |
| `prompt` | `'none' \| 'login' \| 'consent'` | Prompt parameter | `undefined` | Optional OIDC parameter |
| `loginHint` | `string` | Login Hint | `undefined` | Optional OIDC parameter |
| `maxAge` | `number` | Max Age (seconds) | `undefined` | Optional OIDC parameter |
| `display` | `'page' \| 'popup' \| 'touch' \| 'wap'` | Display mode | `undefined` | Optional OIDC parameter |
| `nonce` | `string` | Nonce | Auto-generated | Required for OIDC implicit flow |

#### Field Visibility Rules

- **Client Secret**: Hidden (implicit flow is public client only)
- **PKCE Configuration**: Hidden (PKCE not supported for implicit flow)
- **Token Endpoint Auth Method**: Always shows `'none'` (disabled)
- **Response Type**: Auto-set to `'token id_token'` (read-only)
- **Response Mode**: Auto-set to `'fragment'` (read-only)

#### Validation Rules

```typescript
// Validation logic
const isValid = 
  credentials.environmentId?.trim() &&
  credentials.clientId?.trim() &&
  credentials.scopes?.trim() &&
  credentials.redirectUri?.trim();
```

#### Output

- **State**: Updated `credentials` object
- **Persistence**: Saved to `localStorage` under flow key: `implicit-v8u`
- **Next Step**: Enabled when all required fields are present

---

### Step 1: Generate Authorization URL

**Component:** `renderStep1AuthUrl()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.generateAuthorizationUrl()`  
**Purpose:** Build and display authorization URL

#### Inputs

- `credentials`: Full credentials object from Step 0
- `flowType`: `'implicit'`
- `specVersion`: `'oauth2.0'` or `'oidc'`

#### Processing

1. **Generate Nonce** (OIDC only):
   ```typescript
   const nonce = crypto.randomUUID(); // Auto-generated if OIDC
   ```

2. **Generate State**:
   ```typescript
   const state = `state-${Date.now()}`;
   const prefixedState = `v8u-implicit-${state}`;
   ```

3. **Build Authorization URL**:
   ```
   https://auth.pingone.com/{environmentId}/as/authorize?
     client_id={clientId}
     &response_type=token id_token
     &redirect_uri={redirectUri}
     &scope={scopes}
     &state={prefixedState}
     &nonce={nonce}  // OIDC only
     &response_mode=fragment
     &prompt={prompt}  // Optional
     &login_hint={loginHint}  // Optional
     &max_age={maxAge}  // Optional
     &display={display}  // Optional
   ```

#### Output

- **State Updates**:
  ```typescript
  {
    authorizationUrl: string,  // Full authorization URL
    state: string,            // Prefixed state value
    nonce?: string            // OIDC nonce
  }
  ```
- **UI Display**: 
  - Authorization URL (read-only input)
  - "Open in New Tab" button
  - Educational content about implicit flow
  - Copy URL button

#### User Actions

- **Generate URL**: Automatically generated when step loads
- **Open URL**: Opens authorization URL in new tab/window
- **Copy URL**: Copies URL to clipboard

#### Next Step

- Enabled when `authorizationUrl` is present
- User must complete authorization in PingOne
- Redirects to callback URL with fragment

---

### Step 2: Parse Callback Fragment

**Component:** `renderStep2Fragment()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.parseCallbackFragment()`  
**Purpose:** Extract tokens from URL fragment after redirect

#### Inputs

- **URL Fragment**: From `window.location.hash` after redirect
- **Expected State**: From `flowState.state`
- **Expected Nonce**: From `flowState.nonce` (OIDC)

#### Fragment Format

```
#access_token={accessToken}
&token_type=Bearer
&expires_in=3600
&id_token={idToken}  // OIDC only
&scope={scopes}
&state={state}
&session_state={sessionState}  // OIDC only
```

#### Processing

1. **Auto-Detection**: Automatically detects fragment when step loads
2. **Parse Fragment**:
   ```typescript
   const fragment = window.location.hash.substring(1);
   const params = new URLSearchParams(fragment);
   ```

3. **Validate State**:
   ```typescript
   const receivedState = params.get('state');
   if (receivedState !== flowState.state) {
     throw new Error('State mismatch');
   }
   ```

4. **Validate Nonce** (OIDC):
   ```typescript
   if (specVersion === 'oidc' && flowState.nonce) {
     // Validate nonce in ID token (done during token parsing)
   }
   ```

5. **Extract Tokens**:
   ```typescript
   const tokens = {
     accessToken: params.get('access_token'),
     idToken: params.get('id_token'),  // OIDC only
     expiresIn: parseInt(params.get('expires_in') || '3600'),
     tokenType: params.get('token_type') || 'Bearer'
   };
   ```

#### Output

- **State Updates**:
  ```typescript
  {
    tokens: {
      accessToken: string,
      idToken?: string,      // OIDC only
      expiresIn: number
    },
    callbackDetails: {
      url: string,
      state: string,
      sessionState?: string,
      allParams: Record<string, string>
    }
  }
  ```
- **Persistence**: Tokens saved to `sessionStorage` under key: `v8u_implicit_tokens`
- **Success Modal**: Shows callback success with token details

#### Error Handling

- **Missing Fragment**: Shows input field for manual entry
- **State Mismatch**: Error message, prevents token extraction
- **Missing Tokens**: Error message, allows retry
- **Invalid Format**: Error message with guidance

#### Next Step

- Enabled when `tokens.accessToken` is present
- Automatically proceeds to Step 3 (Display Tokens)

---

### Step 3: Display Tokens

**Component:** `renderStep3Tokens()` in `UnifiedFlowSteps.tsx`  
**Purpose:** Display received tokens with decode/copy functionality

#### Inputs

- `flowState.tokens`: Token object from Step 2

#### Display Fields

| Token | Display | Decode | Copy | Notes |
|-------|---------|--------|------|-------|
| Access Token | ✅ | ✅ (if JWT) | ✅ | Always present |
| ID Token | ✅ (OIDC) | ✅ (JWT) | ✅ | Only if `openid` scope |
| Refresh Token | ❌ | N/A | N/A | **Not issued** in implicit flow |

#### Token Display Component

- **Access Token**:
  - Full token value (truncated for display)
  - "Copy" button
  - "Decode" button (if JWT)
  - Token type (always `Bearer`)
  - Expiration time

- **ID Token** (OIDC):
  - Full token value (truncated for display)
  - "Copy" button
  - "Decode" button (shows JWT payload)
  - Claims display (sub, aud, iss, exp, iat, nonce, etc.)

#### Educational Content

- Explains why refresh tokens are not issued
- Shows token expiration information
- Provides next steps (Introspection & UserInfo)

#### Next Step

- Enabled when tokens are displayed
- Proceeds to Step 4 (Introspection & UserInfo)

---

### Step 4: Introspection & UserInfo

**Component:** `renderStep6IntrospectionUserInfo()` in `UnifiedFlowSteps.tsx`  
**Purpose:** Token introspection and UserInfo endpoint access

#### Token Introspection

**Available Tokens for Introspection:**

| Token Type | Available | Reason |
|------------|-----------|--------|
| Access Token | ✅ | Can be introspected |
| Refresh Token | ❌ | Not issued in implicit flow |
| ID Token | ❌ | Should be validated locally, not introspected |

**Introspection Service:**
- Endpoint: `/api/introspect-token` (proxy)
- PingOne Endpoint: `https://auth.pingone.com/{environmentId}/as/introspect`
- Auth Method: `client_secret_post` (requires client secret - **Note: Implicit flow typically uses public clients**)

**Note:** Introspection requires client authentication. Public clients (implicit flow) may not be able to introspect unless configured with a client secret.

#### UserInfo Endpoint

**Availability:**
- ✅ **OIDC with `openid` scope**: Available
- ❌ **Pure OAuth 2.0**: Not available

**UserInfo Service:**
- Endpoint: `/api/pingone/userinfo` (proxy)
- PingOne Endpoint: `https://auth.pingone.com/{environmentId}/as/userinfo`
- Auth: Access Token in `Authorization` header

**Response Fields:**
- `sub` (Subject)
- `email`
- `email_verified`
- `name`
- `given_name`
- `family_name`
- `picture`
- Additional claims based on scopes

#### UI Components

1. **Introspection Section**:
   - Token type selector (Access Token only)
   - "Introspect Token" button
   - Results display (active, scope, client_id, sub, exp, iat, etc.)

2. **UserInfo Section** (OIDC only):
   - "Fetch UserInfo" button
   - Results display (user profile information)

3. **Educational Content**:
   - Why refresh tokens aren't available
   - Why ID tokens should be validated locally
   - When UserInfo is available

---

## State Management

### Flow State Interface

```typescript
interface FlowState {
  // Authorization URL generation
  authorizationUrl?: string;
  state?: string;           // Prefixed: "v8u-implicit-{random}"
  nonce?: string;           // OIDC only
  
  // Tokens (from fragment)
  tokens?: {
    accessToken: string;
    idToken?: string;       // OIDC only
    expiresIn: number;
  };
  
  // UserInfo (OIDC)
  userInfo?: Record<string, unknown>;
}
```

### Persistence

#### Credentials Storage

- **Location**: `localStorage`
- **Key Format**: `credentials_implicit-v8u_{specVersion}`
- **Storage Trigger**: On field change or form blur
- **Restoration**: Auto-restored on component mount

#### Token Storage

- **Location**: `sessionStorage`
- **Key**: `v8u_implicit_tokens`
- **Storage Trigger**: After successful fragment parsing
- **Expiration**: Browser session only (cleared on tab close)
- **Format**:
  ```json
  {
    "accessToken": "...",
    "idToken": "...",
    "expiresIn": 3600,
    "timestamp": 1234567890
  }
  ```

#### State Restoration

- **URL Parameters**: Not used (implicit flow doesn't use URL params)
- **Fragment Parsing**: Auto-detected on Step 2 mount
- **Session Restoration**: Tokens restored from `sessionStorage` if available

---

## URL Parameters

### Route

```
/v8u/unified/implicit/{step}
```

**Step Values:**
- `0` = Configure
- `1` = Authorization URL
- `2` = Parse Fragment
- `3` = Display Tokens
- `4` = Introspection & UserInfo

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `spec` | `'oauth2.0' \| 'oidc'` | No | Spec version | `?spec=oidc` |
| `step` | `number` | No | Step number | `?step=2` |

### Fragment Parameters (Callback)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `access_token` | `string` | Access token | `#access_token=eyJ...` |
| `token_type` | `string` | Token type | `&token_type=Bearer` |
| `expires_in` | `number` | Expiration (seconds) | `&expires_in=3600` |
| `id_token` | `string` | ID token (OIDC) | `&id_token=eyJ...` |
| `scope` | `string` | Granted scopes | `&scope=openid profile` |
| `state` | `string` | State parameter | `&state=v8u-implicit-...` |
| `session_state` | `string` | Session state (OIDC) | `&session_state=...` |

---

## Error Handling

### Configuration Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing Environment ID | Required field empty | Enter Environment ID |
| Missing Client ID | Required field empty | Enter Client ID |
| Missing Scopes | Required field empty | Enter scopes (e.g., "openid profile") |
| Missing Redirect URI | Required field empty | Enter Redirect URI |
| Invalid Redirect URI | URI not registered | Register URI in PingOne application |

### Authorization Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `invalid_client` | Client ID not found | Check Client ID |
| `invalid_redirect_uri` | Redirect URI mismatch | Match registered URI |
| `invalid_scope` | Scope not allowed | Use allowed scopes |
| `access_denied` | User denied authorization | User must authorize |
| `server_error` | PingOne server error | Retry or check status |

### Fragment Parsing Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing Fragment | No fragment in URL | Check callback URL |
| State Mismatch | State doesn't match | Retry authorization |
| Missing Access Token | Token not in fragment | Check fragment parameters |
| Invalid Token Format | Malformed token | Contact support |

---

## Compliance Rules

### OAuth 2.0

- ✅ Implicit flow supported
- ✅ Public clients only (no client secret)
- ❌ No refresh tokens
- ✅ Tokens in URL fragment
- ⚠️ HTTPS recommended (not required)

### OAuth 2.1

- ❌ **Implicit flow deprecated** - Not available in OAuth 2.1
- ⚠️ Flow will not be shown in OAuth 2.1 spec selector

### OIDC

- ✅ Implicit flow supported
- ✅ Requires `openid` scope
- ✅ ID token required
- ✅ Nonce required (auto-generated)
- ✅ UserInfo endpoint available

---

## API Endpoints Used

### PingOne Endpoints

1. **Authorization Endpoint**:
   ```
   GET https://auth.pingone.com/{environmentId}/as/authorize
   ```

2. **Introspection Endpoint**:
   ```
   POST https://auth.pingone.com/{environmentId}/as/introspect
   ```

3. **UserInfo Endpoint** (OIDC):
   ```
   GET https://auth.pingone.com/{environmentId}/as/userinfo
   ```

### Backend Proxy Endpoints

1. **Introspection Proxy**:
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

2. **UserInfo Proxy** (OIDC):
   ```
   POST /api/pingone/userinfo
   Body: {
     userInfoEndpoint: string,
     accessToken: string
   }
   ```

---

## Testing Checklist

### Configuration Step

- [ ] Environment ID field accepts valid UUID format
- [ ] Client ID field accepts valid string
- [ ] Scopes field accepts space-separated values
- [ ] Redirect URI field validates format
- [ ] Client Secret field is hidden
- [ ] PKCE options are hidden
- [ ] Form validation shows errors for missing fields
- [ ] Credentials persist to localStorage

### Authorization URL Step

- [ ] URL is generated with correct parameters
- [ ] State is prefixed with "v8u-implicit-"
- [ ] Nonce is generated for OIDC
- [ ] URL opens in new tab correctly
- [ ] URL can be copied to clipboard

### Fragment Parsing Step

- [ ] Fragment is auto-detected from URL
- [ ] Tokens are extracted correctly
- [ ] State validation works
- [ ] Nonce validation works (OIDC)
- [ ] Errors are displayed for invalid fragments
- [ ] Manual entry works if auto-detection fails

### Token Display Step

- [ ] Access token is displayed
- [ ] ID token is displayed (OIDC)
- [ ] Token copy works
- [ ] Token decode works (JWT)
- [ ] Expiration time is shown
- [ ] Educational content is shown

### Introspection Step

- [ ] Access token can be introspected
- [ ] Refresh token button is disabled (not available)
- [ ] ID token button is disabled (not recommended)
- [ ] Introspection results are displayed
- [ ] UserInfo can be fetched (OIDC)
- [ ] Error handling works for failed requests

---

## Implementation Notes

### Key Differences from Authorization Code Flow

1. **No Token Exchange**: Tokens come directly in fragment (no `/token` endpoint call)
2. **No Refresh Tokens**: Not issued in implicit flow
3. **No PKCE**: PKCE not applicable to implicit flow
4. **Public Client**: Always uses `clientAuthMethod: 'none'`
5. **Fragment Response**: Tokens in URL fragment, not query parameters

### Security Considerations

1. **Token Exposure**: Tokens visible in browser history, server logs
2. **No Refresh Tokens**: Must re-authenticate when token expires
3. **State Validation**: Critical to prevent CSRF attacks
4. **Nonce Validation**: Required for OIDC to prevent replay attacks

### Best Practices

1. ⚠️ **Use Authorization Code + PKCE** instead of implicit flow (recommended by OAuth 2.1)
2. ✅ Always validate state parameter
3. ✅ Always validate nonce in ID token (OIDC)
4. ✅ Use HTTPS in production
5. ✅ Clear tokens from fragment after extraction
6. ✅ Set appropriate token expiration times

---

## References

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [OAuth 2.1 Draft](https://oauth.net/2.1/)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/main/v1/api/)

