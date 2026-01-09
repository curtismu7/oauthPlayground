# Unified Flow - Hybrid Flow UI Contract

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** Hybrid Flow (OAuth 2.0 / OIDC)  
**Component:** `UnifiedOAuthFlowV8U` → `UnifiedFlowSteps` → `CredentialsFormV8U`

## Overview

The Hybrid Flow is an OpenID Connect flow that combines the Authorization Code flow with the Implicit flow. It returns both an authorization code (for secure token exchange) and tokens directly in the URL fragment (for immediate use). This flow provides the security of authorization code exchange while also providing immediate access to tokens.

### Available Spec Versions

- ✅ **OAuth 2.0**: Supported (with OIDC extensions)
- ❌ **OAuth 2.1**: Not supported (hybrid flow not in OAuth 2.1)
- ✅ **OIDC**: Fully supported (recommended)

## Flow Steps

The Hybrid Flow consists of **6 steps** (0-indexed):

1. **Step 0**: Configure Credentials
2. **Step 1**: Generate Authorization URL
3. **Step 2**: Handle Callback
4. **Step 3**: Exchange Code for Tokens
5. **Step 4**: Display Tokens
6. **Step 5**: Introspection & UserInfo

## Step-by-Step Contract

### Step 0: Configure Credentials

**Component:** `CredentialsFormV8U`  
**Purpose:** Collect and validate OAuth credentials for hybrid flow

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `environmentId` | `string` | PingOne Environment ID | Required, non-empty |
| `clientId` | `string` | OAuth Client ID | Required, non-empty |
| `clientSecret` | `string` | Client Secret | Required, non-empty (confidential client) |
| `scopes` | `string` | Space-separated scopes | Required, must include `openid` |
| `redirectUri` | `string` | OAuth Redirect URI | Required, must match registered URI |

#### Optional Fields

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `clientAuthMethod` | `'client_secret_basic' \| 'client_secret_post' \| 'client_secret_jwt' \| 'private_key_jwt'` | Client Auth Method | `'client_secret_basic'` | Used for token exchange |
| `responseType` | `'code id_token' \| 'code token' \| 'code token id_token'` | Response Type | `'code id_token'` | What to receive in callback |
| `responseMode` | `'fragment' \| 'query' \| 'form_post' \| 'pi.flow'` | Response Mode | `'fragment'` | How tokens are returned |
| `usePKCE` | `boolean` | Enable PKCE | `false` | Recommended for security |
| `pkceEnforcement` | `'REQUIRED' \| 'OPTIONAL' \| 'DISABLED'` | PKCE Enforcement | `'OPTIONAL'` | PingOne application setting |
| `prompt` | `'none' \| 'login' \| 'consent'` | Prompt parameter | `undefined` | Optional OIDC parameter |
| `loginHint` | `string` | Login Hint | `undefined` | Optional OIDC parameter |
| `maxAge` | `number` | Max Age (seconds) | `undefined` | Optional OIDC parameter |
| `display` | `'page' \| 'popup' \| 'touch' \| 'wap'` | Display mode | `undefined` | Optional OIDC parameter |
| `nonce` | `string` | Nonce | Auto-generated | Required for OIDC hybrid flow |

#### Field Visibility Rules

- **Client Secret**: Visible and required (hybrid flow uses confidential clients)
- **PKCE Configuration**: Visible (PKCE supported for hybrid flow)
- **Response Type**: Visible, options: `code id_token`, `code token`, `code token id_token`
- **Response Mode**: Visible, options: `fragment`, `query`, `form_post`, `pi.flow`
- **Token Endpoint Auth Method**: Shows all methods (basic, post, JWT)

#### Validation Rules

```typescript
// Validation logic
const isValid = 
  credentials.environmentId?.trim() &&
  credentials.clientId?.trim() &&
  credentials.clientSecret?.trim() &&
  credentials.scopes?.trim() &&
  credentials.scopes.includes('openid') &&  // Required for hybrid
  credentials.redirectUri?.trim();
```

#### Output

- **State**: Updated `credentials` object
- **Persistence**: Saved to `localStorage` under flow key: `hybrid-v8u`
- **Next Step**: Enabled when all required fields are present

---

### Step 1: Generate Authorization URL

**Component:** `renderStep1AuthUrl()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.generateAuthorizationUrl()`  
**Purpose:** Build and display authorization URL with hybrid response type

#### Inputs

- `credentials`: Full credentials object from Step 0
- `flowType`: `'hybrid'`
- `specVersion`: `'oauth2.0'` or `'oidc'`

#### Processing

1. **Generate Nonce** (OIDC):
   ```typescript
   const nonce = crypto.randomUUID(); // Auto-generated for OIDC
   ```

2. **Generate State**:
   ```typescript
   const state = `state-${Date.now()}`;
   const prefixedState = `v8u-hybrid-${state}`;
   ```

3. **Generate PKCE Codes** (if enabled):
   ```typescript
   const pkceCodes = PKCEService.generateCodes();
   // codeVerifier, codeChallenge, codeChallengeMethod
   ```

4. **Build Authorization URL**:
   ```
   https://auth.pingone.com/{environmentId}/as/authorize?
     client_id={clientId}
     &response_type={responseType}  // code id_token, code token, or code token id_token
     &redirect_uri={redirectUri}
     &scope={scopes}
     &state={prefixedState}
     &nonce={nonce}  // OIDC only
     &code_challenge={codeChallenge}  // If PKCE enabled
     &code_challenge_method={codeChallengeMethod}  // If PKCE enabled
     &response_mode={responseMode}  // fragment, query, form_post, pi.flow
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
    nonce?: string,           // OIDC nonce
    codeVerifier?: string,   // PKCE code verifier (if PKCE enabled)
    codeChallenge?: string,  // PKCE code challenge (if PKCE enabled)
    codeChallengeMethod?: 'S256' | 'plain'  // PKCE method (if PKCE enabled)
  }
  ```
- **UI Display**: 
  - Authorization URL (read-only input)
  - "Open in New Tab" button
  - Educational content about hybrid flow
  - Copy URL button

#### User Actions

- **Generate URL**: Automatically generated when step loads
- **Open URL**: Opens authorization URL in new tab/window
- **Copy URL**: Copies URL to clipboard

#### Next Step

- Enabled when `authorizationUrl` is present
- User must complete authorization in PingOne
- Redirects to callback URL with code (query) and tokens (fragment)

---

### Step 2: Handle Callback

**Component:** `renderStep2Callback()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.parseCallbackUrl()`, `UnifiedFlowIntegrationV8U.parseCallbackFragment()`  
**Purpose:** Extract authorization code from query string and tokens from fragment

#### Inputs

- **Callback URL**: From `window.location.href` after redirect
- **Expected State**: From `flowState.state`
- **Expected Nonce**: From `flowState.nonce` (OIDC)

#### Callback URL Format

**Query String** (authorization code):
```
?code={authorizationCode}
&state={state}
```

**URL Fragment** (tokens, if `response_type` includes tokens):
```
#access_token={accessToken}  // If code token or code token id_token
&token_type=Bearer
&expires_in=3600
&id_token={idToken}  // If code id_token or code token id_token
&scope={scopes}
&state={state}
&session_state={sessionState}  // OIDC only
```

#### Processing

1. **Auto-Detection**: Automatically detects callback when step loads
2. **Parse Query String**:
   ```typescript
   const urlParams = new URLSearchParams(window.location.search);
   const code = urlParams.get('code');
   const state = urlParams.get('state');
   ```

3. **Parse Fragment** (if present):
   ```typescript
   const fragment = window.location.hash.substring(1);
   const fragmentParams = new URLSearchParams(fragment);
   const accessToken = fragmentParams.get('access_token');
   const idToken = fragmentParams.get('id_token');
   ```

4. **Validate State**:
   ```typescript
   const receivedState = urlParams.get('state') || fragmentParams.get('state');
   if (receivedState !== flowState.state) {
     throw new Error('State mismatch');
   }
   ```

5. **Validate Nonce** (OIDC, if ID token in fragment):
   ```typescript
   if (idToken && flowState.nonce) {
     const idTokenPayload = decodeJWT(idToken);
     if (idTokenPayload.nonce !== flowState.nonce) {
       throw new Error('Nonce mismatch');
     }
   }
   ```

6. **Extract Both**:
   ```typescript
   const updates = {
     authorizationCode: code,
     tokens: accessToken || idToken ? {
       accessToken: accessToken || '',
       idToken: idToken,
       expiresIn: parseInt(fragmentParams.get('expires_in') || '3600')
     } : undefined
   };
   ```

#### Response Type Variations

**`code id_token`**:
- ✅ Authorization code in query string
- ✅ ID token in fragment
- ⚠️ Access token NOT in fragment (must exchange code)

**`code token`**:
- ✅ Authorization code in query string
- ✅ Access token in fragment
- ⚠️ ID token NOT in fragment

**`code token id_token`**:
- ✅ Authorization code in query string
- ✅ Access token in fragment
- ✅ ID token in fragment

#### Output

- **State Updates**:
  ```typescript
  {
    authorizationCode: string,  // From query string
    tokens?: {                   // From fragment (if present)
      accessToken?: string,
      idToken?: string,
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
- **Persistence**: 
  - Authorization code saved to component state
  - Tokens (if in fragment) saved to `sessionStorage` under key: `v8u_implicit_tokens`
- **Success Modal**: Shows callback success with code and token details

#### Error Handling

- **Missing Code**: Shows input field for manual entry
- **State Mismatch**: Error message, prevents extraction
- **Missing Tokens** (if expected): Warning message (tokens may come from exchange)
- **Invalid Format**: Error message with guidance

#### Next Step

- If tokens in fragment: Proceed to Step 4 (Display Tokens)
- If only code: Proceed to Step 3 (Exchange Code for Tokens)
- Enabled when `authorizationCode` is present

---

### Step 3: Exchange Code for Tokens

**Component:** `renderStep3TokenExchange()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.exchangeCodeForTokens()`  
**Purpose:** Exchange authorization code for access token and refresh token

#### Inputs

- `flowState.authorizationCode`: Authorization code from Step 2
- `credentials`: Full credentials object
- `flowState.codeVerifier`: PKCE code verifier (if PKCE enabled)

#### API Endpoint

**Backend Proxy:** `POST /api/token-exchange`

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "code": "{authorization_code}",
  "redirect_uri": "{redirect_uri}",
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",
  "code_verifier": "{code_verifier}",  // If PKCE enabled
  "environment_id": "{environment_id}",
  "client_auth_method": "{client_auth_method}"
}
```

**Response (Success - 200 OK):**
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "string (optional)",
  "id_token": "string (optional, if not in fragment)",
  "scope": "string"
}
```

#### Processing

1. **Validate Authorization Code**: Check code is present and not expired
2. **Build Request**: Include code, redirect URI, client credentials
3. **Add PKCE** (if enabled): Include `code_verifier` in request
4. **Send Request**: POST to token endpoint via backend proxy
5. **Handle Response**: Extract tokens from response

#### Output

- **State Updates**:
  ```typescript
  {
    tokens: {
      accessToken: string,
      refreshToken?: string,  // If offline_access scope
      idToken?: string,       // If not in fragment
      expiresIn: number
    }
  }
  ```
- **Persistence**: Tokens saved to `sessionStorage` under key: `v8u_tokens`
- **Next Step**: Enabled automatically when tokens received

#### Error Handling

- **Invalid Code**: Error message, code may have expired
- **Client Auth Failed**: Error message, check client secret
- **PKCE Mismatch**: Error message, code verifier doesn't match
- **Missing Refresh Token**: Warning (if `offline_access` scope not included)

---

### Step 4: Display Tokens

**Component:** `renderStep4Tokens()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenDisplayServiceV8`  
**Purpose:** Display received tokens with decode and copy options

#### Inputs

- `flowState.tokens`: Token object from Step 2 (fragment) or Step 3 (exchange)
- `specVersion`: Filter tokens based on spec version

#### Token Sources

Tokens can come from:
1. **URL Fragment** (Step 2): If `response_type` includes tokens
2. **Token Exchange** (Step 3): If code was exchanged

#### Display Fields

| Token | Display | Decode | Copy | Notes |
|-------|---------|--------|------|-------|
| Access Token | ✅ | ✅ (if JWT) | ✅ | Always present |
| ID Token | ✅ (OIDC) | ✅ (JWT) | ✅ | From fragment or exchange |
| Refresh Token | ✅ (if available) | ✅ (if JWT) | ✅ | Only from code exchange |

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

- **Refresh Token** (if available):
  - Full token value (truncated for display)
  - "Copy" button
  - "Decode" button (if JWT)
  - Usage instructions

#### Educational Content

- Explains hybrid flow benefits (immediate + secure)
- Shows token expiration information
- Explains refresh token usage
- Provides next steps (Introspection & UserInfo)

#### Next Step

- Enabled when tokens are displayed
- Proceeds to Step 5 (Introspection & UserInfo)

---

### Step 5: Introspection & UserInfo

**Component:** `renderStep5IntrospectionUserInfo()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenOperationsServiceV8`, `OidcDiscoveryServiceV8`  
**Purpose:** Token introspection and UserInfo endpoint access

#### Token Introspection

**Available Tokens for Introspection:**

| Token Type | Available | Reason |
|------------|-----------|--------|
| Access Token | ✅ | Can be introspected |
| Refresh Token | ✅ | Can be introspected (if available) |
| ID Token | ❌ | Should be validated locally, not introspected |

**Introspection Service:**
- Endpoint: `/api/introspect-token` (proxy)
- PingOne Endpoint: `https://auth.pingone.com/{environmentId}/as/introspect`
- Auth Method: `client_secret_post` (requires client secret)

**Note:** Hybrid flow uses confidential clients (has client secret), so introspection is fully supported.

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
   - Token type selector (Access Token, Refresh Token)
   - "Introspect Token" button
   - Results display (active, scope, client_id, sub, exp, iat, etc.)

2. **UserInfo Section** (OIDC only):
   - "Fetch UserInfo" button
   - Results display (user profile information)

3. **Educational Content**:
   - Why refresh tokens are available (hybrid flow advantage)
   - Why ID tokens should be validated locally
   - When UserInfo is available

---

## State Management

### Flow State Interface

```typescript
interface FlowState {
  // Authorization URL generation
  authorizationUrl?: string;
  state?: string;           // Prefixed: "v8u-hybrid-{random}"
  nonce?: string;           // OIDC only
  
  // PKCE (if enabled)
  codeVerifier?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  
  // Callback handling
  authorizationCode?: string;  // From query string
  tokens?: {                   // From fragment or exchange
    accessToken: string;
    refreshToken?: string;
    idToken?: string;          // OIDC only
    expiresIn: number;
  };
  
  // UserInfo (OIDC)
  userInfo?: Record<string, unknown>;
}
```

### Persistence

#### Credentials Storage

- **Location**: `localStorage`
- **Key Format**: `credentials_hybrid-v8u_{specVersion}`
- **Storage Trigger**: On field change or form blur
- **Restoration**: Auto-restored on component mount

#### Token Storage

- **Location**: `sessionStorage`
- **Key**: `v8u_tokens` (shared with other flows)
- **Storage Trigger**: After successful fragment parsing or code exchange
- **Expiration**: Browser session only (cleared on tab close)
- **Format**:
  ```json
  {
    "accessToken": "...",
    "refreshToken": "...",
    "idToken": "...",
    "expiresIn": 3600,
    "timestamp": 1234567890
  }
  ```

#### State Restoration

- **URL Parameters**: Route and query parameters for step/spec
- **Fragment Parsing**: Auto-detected on Step 2 mount
- **Session Restoration**: Tokens restored from `sessionStorage` if available

---

## URL Parameters

### Route

```
/v8u/unified/hybrid/{step}
```

**Step Values:**
- `0` = Configure
- `1` = Authorization URL
- `2` = Handle Callback
- `3` = Exchange Code for Tokens
- `4` = Display Tokens
- `5` = Introspection & UserInfo

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
| `state` | `string` | State parameter | `&state=v8u-hybrid-...` |
| `session_state` | `string` | Session state (OIDC) | `&session_state=...` |

### Query Parameters (Callback)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `code` | `string` | Authorization code | `?code=abc123...` |
| `state` | `string` | State parameter | `&state=v8u-hybrid-...` |

---

## Error Handling

### Configuration Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| Missing Environment ID | Required field empty | Enter Environment ID |
| Missing Client ID | Required field empty | Enter Client ID |
| Missing Client Secret | Required field empty | Enter Client Secret |
| Missing Scopes | Required field empty | Enter scopes (must include `openid`) |
| Missing Redirect URI | Required field empty | Enter Redirect URI |
| Invalid Redirect URI | URI not registered | Register URI in PingOne application |
| Missing `openid` scope | Required for hybrid flow | Add `openid` to scopes |

### Authorization Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `invalid_client` | Client ID not found | Check Client ID |
| `invalid_redirect_uri` | Redirect URI mismatch | Match registered URI |
| `invalid_scope` | Scope not allowed | Use allowed scopes |
| `invalid_response_type` | Response type not supported | Check PingOne application configuration |
| `access_denied` | User denied authorization | User must authorize |
| `server_error` | PingOne server error | Retry or check status |

### Callback Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing Authorization Code | Code not in query string | Check callback URL |
| State Mismatch | State doesn't match | Retry authorization |
| Missing Tokens (if expected) | Tokens not in fragment | Check `response_type` setting |
| Invalid Token Format | Malformed token | Contact support |

### Token Exchange Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `invalid_grant` | Authorization code invalid/expired | Request new authorization |
| `invalid_client` | Client authentication failed | Check client secret |
| `invalid_code_verifier` | PKCE code verifier mismatch | Retry with correct verifier |
| `unauthorized_client` | Client not authorized for grant type | Enable grant type in PingOne |

---

## Compliance Rules

### OAuth 2.0

- ✅ Hybrid flow supported (OIDC extension)
- ✅ Confidential clients (requires client secret)
- ✅ PKCE supported (recommended)
- ✅ Refresh tokens available (via code exchange)
- ✅ Tokens in URL fragment (if `response_type` includes tokens)

### OAuth 2.1

- ❌ **Hybrid flow not supported** - Not part of OAuth 2.1 specification
- ⚠️ Flow will not be shown in OAuth 2.1 spec selector

### OIDC

- ✅ Hybrid flow fully supported
- ✅ Requires `openid` scope
- ✅ ID token required (in fragment or exchange)
- ✅ Nonce required (auto-generated)
- ✅ UserInfo endpoint available

---

## API Endpoints Used

### PingOne Endpoints

1. **Authorization Endpoint**:
   ```
   GET https://auth.pingone.com/{environmentId}/as/authorize
   ```

2. **Token Endpoint**:
   ```
   POST https://auth.pingone.com/{environmentId}/as/token
   ```

3. **Introspection Endpoint**:
   ```
   POST https://auth.pingone.com/{environmentId}/as/introspect
   ```

4. **UserInfo Endpoint** (OIDC):
   ```
   GET https://auth.pingone.com/{environmentId}/as/userinfo
   ```

### Backend Proxy Endpoints

1. **Token Exchange Proxy**:
   ```
   POST /api/token-exchange
   Body: {
     grant_type: "authorization_code",
     code: string,
     redirect_uri: string,
     client_id: string,
     client_secret: string,
     code_verifier: string,  // If PKCE enabled
     environment_id: string,
     client_auth_method: string
   }
   ```

2. **Introspection Proxy**:
   ```
   POST /api/introspect-token
   Body: {
     token: string,
     token_type_hint: 'access_token' | 'refresh_token',
     client_id: string,
     client_secret: string,
     introspection_endpoint: string,
     token_auth_method: string
   }
   ```

3. **UserInfo Proxy** (OIDC):
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
- [ ] Client Secret field accepts valid string (required)
- [ ] Scopes field accepts space-separated values
- [ ] Scopes validation requires `openid` scope
- [ ] Redirect URI field validates format
- [ ] Response Type selector shows hybrid options
- [ ] Response Mode selector shows available options
- [ ] PKCE checkbox is visible and functional
- [ ] Form validation shows errors for missing fields
- [ ] Credentials persist to localStorage

### Authorization URL Step

- [ ] URL is generated with correct parameters
- [ ] State is prefixed with "v8u-hybrid-"
- [ ] Nonce is generated for OIDC
- [ ] PKCE codes are generated if enabled
- [ ] Response type is correct (code id_token, code token, or code token id_token)
- [ ] URL opens in new tab correctly
- [ ] URL can be copied to clipboard

### Callback Handling Step

- [ ] Authorization code is extracted from query string
- [ ] Tokens are extracted from fragment (if present)
- [ ] State validation works
- [ ] Nonce validation works (OIDC, if ID token in fragment)
- [ ] Both code and tokens are stored correctly
- [ ] Errors are displayed for invalid callbacks
- [ ] Manual entry works if auto-detection fails

### Token Exchange Step

- [ ] Code exchange works correctly
- [ ] Client authentication works
- [ ] PKCE code verifier is included (if enabled)
- [ ] Refresh token is received (if `offline_access` scope)
- [ ] ID token is received (if not in fragment)
- [ ] Errors are handled correctly
- [ ] Tokens are saved to sessionStorage

### Token Display Step

- [ ] Access token is displayed
- [ ] ID token is displayed (OIDC)
- [ ] Refresh token is displayed (if available)
- [ ] Token copy works
- [ ] Token decode works (JWT)
- [ ] Expiration time is shown
- [ ] Educational content is shown

### Introspection Step

- [ ] Access token can be introspected
- [ ] Refresh token can be introspected (if available)
- [ ] ID token button is disabled (not recommended)
- [ ] Introspection results are displayed
- [ ] UserInfo can be fetched (OIDC)
- [ ] Error handling works for failed requests

---

## Implementation Notes

### Key Differences from Authorization Code Flow

1. **Tokens in Fragment**: Hybrid flow returns tokens in fragment (immediate access)
2. **Multiple Response Types**: Supports `code id_token`, `code token`, `code token id_token`
3. **Dual Token Source**: Tokens can come from fragment OR code exchange
4. **ID Token Immediate**: ID token available immediately (from fragment)

### Key Differences from Implicit Flow

1. **Authorization Code**: Hybrid flow includes authorization code (for secure exchange)
2. **Refresh Tokens**: Available via code exchange (not in implicit flow)
3. **Confidential Client**: Uses client secret (implicit uses public clients)
4. **PKCE Support**: PKCE supported (implicit doesn't support PKCE)

### Security Considerations

1. **State Validation**: Critical to prevent CSRF attacks
2. **Nonce Validation**: Required for OIDC to prevent replay attacks
3. **PKCE**: Recommended for additional security
4. **Fragment Security**: Tokens visible in browser history (clear after extraction)

### Best Practices

1. ✅ Always validate state parameter
2. ✅ Always validate nonce in ID token (OIDC)
3. ✅ Enable PKCE for additional security
4. ✅ Use HTTPS in production
5. ✅ Clear tokens from fragment after extraction
6. ✅ Use refresh tokens for long-lived sessions

---

## Step 7: API Documentation

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
- **URL Format**: `{{authPath}}/{{envID}}/as/authorize`, `{{authPath}}/{{envID}}/as/token`
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
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.1 Draft](https://oauth.net/2.1/)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/main/v1/api/)
- [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)
- [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)

