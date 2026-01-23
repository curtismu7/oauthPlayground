# Unified Flow - Authorization Code Flow UI Contract V2

**Version:** 2.0  
**Last Updated:** 2026-01-23  
**Flow Type:** Authorization Code Flow (OAuth 2.0 / OIDC Core 1.0 / OAuth 2.1)  
**Component:** `UnifiedOAuthFlowV8U` → `UnifiedFlowSteps` → `CredentialsFormV8U`

## Overview

The Authorization Code Flow is the most secure and recommended OAuth 2.0 flow for web applications. It uses a two-step process: first obtaining an authorization code, then exchanging it for tokens. This flow supports PKCE (Proof Key for Code Exchange) for enhanced security, especially for public clients.

### Available Spec Versions

- ✅ **OAuth 2.0**: Supported (RFC 6749)
- ✅ **OIDC Core 1.0**: Fully supported (adds ID token and UserInfo)
- ✅ **OAuth 2.1**: Fully supported (PKCE recommended/required)

## Flow Steps

The Authorization Code Flow consists of **8 steps** (0-indexed):

1. **Step 0**: Configure Credentials
2. **Step 1**: Generate PKCE Codes (if PKCE enabled)
3. **Step 2**: Generate Authorization URL
4. **Step 3**: Handle Callback (extract authorization code)
5. **Step 4**: Exchange Code for Tokens
6. **Step 5**: Display Tokens
7. **Step 6**: Introspection & UserInfo
8. **Step 7**: API Documentation

**Note**: Step 1 (PKCE) is optional and only shown when PKCE is enabled in Advanced Options.

## Step-by-Step Contract

### Step 0: Configure Credentials

**Component:** `CredentialsFormV8U`  
**Purpose:** Collect and validate OAuth credentials for authorization code flow

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `environmentId` | `string` | PingOne Environment ID | Required, non-empty |
| `clientId` | `string` | OAuth Client ID | Required, non-empty |
| `redirectUri` | `string` | Redirect URI | Required, non-empty, must match PingOne config |
| `scopes` | `string` | Space-separated scopes | Required, non-empty |

#### Optional Fields

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `clientSecret` | `string` | Client Secret | `undefined` | Required for confidential clients |
| `clientAuthMethod` | `'client_secret_basic' \| 'client_secret_post' \| 'client_secret_jwt' \| 'private_key_jwt' \| 'none'` | Client Auth Method | `'client_secret_post'` | How to authenticate with token endpoint |
| `usePKCE` | `boolean` | Enable PKCE | `false` | Recommended for public clients |
| `responseType` | `string` | Response Type | `'code'` | Always `code` for authorization code flow |
| `responseMode` | `'query' \| 'fragment' \| 'form_post' \| 'pi.flow'` | Response Mode | `'query'` | How authorization response is returned |
| `prompt` | `'none' \| 'login' \| 'consent'` | Prompt | `undefined` | Force re-authentication or consent |
| `loginHint` | `string` | Login Hint | `undefined` | Pre-fill username/email |
| `maxAge` | `number` | Max Age | `undefined` | Maximum authentication age in seconds |
| `usePAR` | `boolean` | Enable PAR | `false` | Pushed Authorization Requests (RFC 9126) |

#### Field Visibility Rules

- **Client Secret**: Visible if `clientAuthMethod` requires it (basic, post, JWT methods)
- **PKCE Configuration**: Visible in Advanced Options, can be enabled/disabled
- **Response Type**: Hidden (always `code` for authorization code flow)
- **Response Mode**: Visible, defaults to `query`
- **Redirect URI**: Visible and required
- **Token Endpoint Auth Method**: Shows all methods (basic, post, JWT, none)

#### Validation Rules

```typescript
// Validation logic
const isValid = 
  credentials.environmentId?.trim() &&
  credentials.clientId?.trim() &&
  credentials.redirectUri?.trim() &&
  credentials.scopes?.trim() &&
  // Client secret required if auth method needs it
  (credentials.clientAuthMethod === 'none' || credentials.clientSecret?.trim());
```

#### Output

- **State**: Updated `credentials` object
- **Persistence**: Saved to `localStorage` under flow key: `oauth-authz-{specVersion}-v8u`
- **Next Step**: Enabled when all required fields are present

---

### Step 1: Generate PKCE Codes (Optional)

**Component:** `renderStep1PKCE()` in `UnifiedFlowSteps.tsx`  
**Service:** `PKCEServiceV8.generatePKCECodes()`  
**Purpose:** Generate PKCE code verifier and challenge (if PKCE enabled)

#### Visibility

- **Only shown** when PKCE is enabled in Step 0 Advanced Options
- **Hidden** when PKCE is disabled or not applicable

#### PKCE Generation

**Method**: SHA256 hash of code verifier

**Output**:
```typescript
{
  codeVerifier: string;  // 43-128 character random string
  codeChallenge: string; // Base64URL(SHA256(codeVerifier))
  codeChallengeMethod: 'S256';
}
```

#### Processing

1. Generate random code verifier (43-128 characters, URL-safe)
2. Compute SHA256 hash of code verifier
3. Base64URL encode the hash → code challenge
4. Store both in flow state

#### Output

- **State Updates**:
  ```typescript
  {
    codeVerifier: string,
    codeChallenge: string,
    codeChallengeMethod: 'S256'
  }
  ```
- **Persistence**: Stored in component state (not persisted to storage for security)
- **Next Step**: Enabled automatically when codes are generated

---

### Step 2: Generate Authorization URL

**Component:** `renderStep1AuthUrl()` or `renderStep2AuthUrl()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.generateAuthorizationUrl()`  
**Purpose:** Generate the authorization URL to redirect user to PingOne

#### Pre-Flight Validation

Before generating the authorization URL, the system performs comprehensive pre-flight validation:

**Service:** `PreFlightValidationServiceV8.validateBeforeAuthUrl()`

**Validation Checks:**
- ✅ Redirect URI matches PingOne configuration
- ✅ PKCE requirements (spec version and PingOne policy)
- ✅ Client secret requirements
- ✅ Token endpoint authentication method compatibility
- ✅ PAR (Pushed Authorization Requests) support
- ✅ Response type validity
- ✅ Scope requirements (OIDC requires `openid` scope)
- ✅ HTTPS requirements (OAuth 2.1)

**UI Feedback:**
- **Small Inline Spinner**: Shows during validation with message "🔍 Validating Configuration against PingOne..."
- **Toast Messages**:
  - ✅ Success: "Pre-flight validation passed!" (if no errors/warnings)
  - ⚠️ Warning: "Pre-flight validation warnings - check details below" (if warnings only)
  - ❌ Error: "Pre-flight validation failed - check error details below" (if errors found)

**Auto-Fix Functionality:**
- If fixable errors are detected, user is prompted to auto-fix them
- Fixable errors include:
  - Redirect URI mismatch (can update to match PingOne)
  - Missing PKCE (can enable if required)
  - Auth method mismatch (can update to match PingOne)
  - Missing `openid` scope (can add automatically)
  - Invalid response type (can correct)
- After auto-fix, validation is re-run automatically
- Toast message shows: "Fixed {count} error(s): {list of fixes}"

**Validation Result:**
- **Errors**: Block progression, must be fixed before continuing
- **Warnings**: Allow continuation, but user should be aware
- **Passed**: Continue with authorization URL generation

#### Inputs

- `credentials`: Full credentials object from Step 0
- `flowType`: `'oauth-authz'`
- `specVersion`: `'oauth2.0'`, `'oidc'`, or `'oauth2.1'`
- `pkceCodes`: Optional PKCE codes from Step 1 (if PKCE enabled)

#### API Endpoint

**Service Method:** `UnifiedFlowIntegrationV8U.generateAuthorizationUrl()`

**Authorization Endpoint:**
```
https://auth.pingone.com/{environmentId}/as/authorize
```

**URL Parameters:**
```
?response_type=code
&client_id={client_id}
&redirect_uri={redirect_uri}
&scope={scopes}
&state={state}
&code_challenge={code_challenge}  // If PKCE enabled
&code_challenge_method=S256       // If PKCE enabled
&nonce={nonce}                    // If OIDC
&prompt={prompt}                  // Optional
&login_hint={login_hint}          // Optional
&max_age={max_age}                // Optional
```

#### Processing

1. **Generate State**: Random state parameter for CSRF protection
2. **Generate Nonce**: Random nonce (if OIDC mode)
3. **Build URL**: Construct authorization URL with all parameters
4. **Include PKCE**: Add `code_challenge` and `code_challenge_method` if PKCE enabled
5. **Store State**: Save state and PKCE codes in flow state

#### Output

- **State Updates**:
  ```typescript
  {
    authorizationUrl: string,
    state: string,
    nonce?: string,  // If OIDC
    codeVerifier?: string,  // If PKCE
    codeChallenge?: string  // If PKCE
  }
  ```
- **Persistence**: Authorization URL stored in component state
- **Next Step**: User must click "Authenticate on PingOne" button to proceed

#### User Actions

1. **"Generate Authorization URL"** button: Generates and displays URL
2. **"Authenticate on PingOne"** button: Opens authorization URL in new window/tab
3. **"Copy URL"** button: Copies authorization URL to clipboard

---

### Step 3: Handle Callback

**Component:** `renderStep2Callback()` in `UnifiedFlowSteps.tsx`  
**Service:** `UnifiedFlowIntegrationV8U.processCallback()`  
**Purpose:** Extract authorization code from callback URL

#### Inputs

- `flowState.state`: State parameter from Step 2
- `flowState.authorizationUrl`: Authorization URL from Step 2
- URL query parameters: `code`, `state` (from PingOne redirect)

#### Callback URL Format

**Standard Mode (query):**
```
{redirectUri}?code={authorization_code}&state={state}
```

**Fragment Mode:**
```
{redirectUri}#code={authorization_code}&state={state}
```

**Form POST Mode:**
```
POST {redirectUri}
Body: code={authorization_code}&state={state}
```

#### Processing

1. **Extract Parameters**: Parse `code` and `state` from URL
2. **Validate State**: Compare with stored state (CSRF protection)
3. **Extract Code**: Get authorization code from URL
4. **Store Code**: Save authorization code in flow state

#### Validation

```typescript
// State validation
if (urlState !== flowState.state) {
  throw new Error('State mismatch - possible CSRF attack');
}

// Code validation
if (!authorizationCode) {
  throw new Error('Authorization code not found in callback');
}
```

#### Output

- **State Updates**:
  ```typescript
  {
    authorizationCode: string
  }
  ```
- **Persistence**: Authorization code stored in component state
- **Next Step**: Enabled automatically when code is extracted

#### Error Handling

- **State Mismatch**: Error message, restart flow
- **Missing Code**: Error message, check callback URL
- **Invalid Callback**: Error message, verify redirect URI matches PingOne config

---

### Step 4: Exchange Code for Tokens

**Component:** `renderStep3ExchangeTokens()` in `UnifiedFlowSteps.tsx`  
**Service:** `OAuthIntegrationServiceV8.exchangeCodeForTokens()`  
**Purpose:** Exchange authorization code for access token, ID token, and refresh token

#### Inputs

- `flowState.authorizationCode`: Authorization code from Step 3
- `flowState.codeVerifier`: Code verifier (if PKCE enabled)
- `credentials`: Full credentials object

#### API Endpoint

**Backend Proxy:** `POST /api/token-exchange`

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "code": "{authorization_code}",
  "redirect_uri": "{redirect_uri}",
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",  // If required
  "code_verifier": "{code_verifier}",  // If PKCE enabled
  "environment_id": "{environment_id}"
}
```

**Authentication Methods**:

1. **`client_secret_basic`** (HTTP Basic Auth):
   - Header: `Authorization: Basic {base64(client_id:client_secret)}`
   - Secret not in request body

2. **`client_secret_post`**:
   - Client ID and secret in POST body
   - Most common method

3. **`client_secret_jwt`**:
   - Client secret used to sign JWT assertion (HS256)
   - JWT assertion in `client_assertion` parameter

4. **`private_key_jwt`**:
   - Private key used to sign JWT assertion (RS256)
   - Most secure method

5. **`none`**:
   - No client authentication (public clients with PKCE)

**Response (Success - 200 OK):**
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "string",  // If refresh tokens enabled
  "id_token": "string",       // If OIDC mode
  "scope": "string"
}
```

#### Processing

1. **Validate Inputs**: Check authorization code and credentials
2. **Build Request**: Include grant type, code, redirect URI, client credentials
3. **Apply Auth Method**: Use selected authentication method
4. **Include PKCE**: Add `code_verifier` if PKCE enabled
5. **Send Request**: POST to token endpoint via backend proxy
6. **Handle Response**: Extract tokens from response

#### Output

- **State Updates**:
  ```typescript
  {
    tokens: {
      accessToken: string,
      idToken?: string,      // If OIDC
      refreshToken?: string, // If refresh tokens enabled
      expiresIn: number,
      tokenType: 'Bearer',
      scope: string
    },
    authorizationCode: string  // Preserved from Step 3
  }
  ```
- **Persistence**: Tokens saved to `sessionStorage` under key: `v8u_oauth_authz_tokens`
- **Next Step**: Enabled automatically when tokens received

#### Error Handling

- **Invalid Code**: Error message, code may be expired or already used
- **Invalid Client**: Error message, check client ID and secret
- **PKCE Mismatch**: Error message, code verifier doesn't match challenge
- **Redirect URI Mismatch**: Error message, redirect URI must match exactly

---

### Step 5: Display Tokens

**Component:** `renderStep3Tokens()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenDisplayServiceV8`  
**Purpose:** Display received tokens with decode and copy options

#### Inputs

- `flowState.tokens`: Token object from Step 4
- `specVersion`: Filter tokens based on spec version

#### Display Fields

| Token | Display | Decode | Copy | Notes |
|-------|---------|--------|------|-------|
| Access Token | ✅ | ✅ (if JWT) | ✅ | Always present |
| Refresh Token | ✅ | N/A | ✅ | If refresh tokens enabled |
| ID Token | ✅ | ✅ (always JWT) | ✅ | If OIDC mode |

#### Token Display Component

- **Access Token**:
  - Full token value (truncated for display)
  - "Copy" button
  - "Decode" button (if JWT)
  - Token type (always `Bearer`)
  - Expiration time
  - Granted scopes

- **ID Token** (OIDC only):
  - Full JWT token
  - "Copy" button
  - "Decode" button (shows JWT payload)
  - Claims display (sub, aud, iss, exp, iat, nonce, etc.)

- **Refresh Token** (if enabled):
  - Full token value
  - "Copy" button
  - Usage instructions

#### Educational Content

- Explains token types and their purposes
- Shows token expiration information
- Provides next steps (Introspection, UserInfo)
- Explains refresh token usage

#### Next Step

- Enabled when tokens are displayed
- Proceeds to Step 6 (Introspection & UserInfo)

---

### Step 6: Introspection & UserInfo

**Component:** `renderStep6IntrospectionUserInfo()` in `UnifiedFlowSteps.tsx`  
**Service:** `TokenOperationsServiceV8`  
**Purpose:** Token introspection and UserInfo endpoint access

#### Token Introspection

**Available Tokens for Introspection:**

| Token Type | Available | Reason |
|------------|-----------|--------|
| Access Token | ✅ | Can be introspected |
| Refresh Token | ✅ | Can be introspected (if available) |
| ID Token | ❌ | ID tokens are self-contained (JWT) |

**Introspection Service:**
- Endpoint: `/api/introspect-token` (proxy)
- PingOne Endpoint: `https://auth.pingone.com/{environmentId}/as/introspect`
- Auth Method: `client_secret_post` (requires client secret)

#### UserInfo Endpoint (OIDC only)

**Availability:**
- ✅ **Available**: UserInfo endpoint requires OIDC mode and access token
- ✅ **Authorization Code Flow**: Fully supported with OIDC

**UserInfo Service:**
- Endpoint: `/api/userinfo` (proxy)
- PingOne Endpoint: `https://auth.pingone.com/{environmentId}/as/userinfo`
- Auth: Access Token in `Authorization: Bearer {token}` header

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
   - "Get UserInfo" button
   - Results display (user profile information)

3. **ID Token Validation** (OIDC only):
   - "🔐 Validate ID Token Locally" button
   - Comprehensive validation results modal
   - Shows signature verification status
   - Shows all claim validations (iss, aud, exp, iat, nonce, azp)
   - Educational content explaining local validation

4. **Educational Content**:
   - How to use introspection to validate tokens
   - How to use UserInfo to get user claims
   - How to validate ID tokens locally (not via introspection)
   - Token expiration and refresh information

#### ID Token Validation

**Feature:** Local ID Token Validation Modal  
**Component:** `IDTokenValidationModalV8U`  
**Service:** `IDTokenValidationServiceV8`

**Trigger:**
- Button: "🔐 Validate ID Token Locally"
- Location: Introspection section, below "What can be introspected"
- Visibility: Only shown when ID token is available

**Behavior:**
1. User clicks "Validate ID Token Locally" button
2. Modal opens with validation UI
3. Auto-validates ID token on open
4. Displays comprehensive validation results

**Validation Process:**
1. Fetch JWKS from PingOne: `https://auth.pingone.com/{envId}/as/.well-known/jwks.json`
2. Verify JWT signature using matching key (by kid)
3. Validate all required claims per OIDC Core 1.0
4. Display results with green checkmarks (valid) or red X (invalid)

**Critical for Authorization Code Flow:**
- Nonce validation is ESSENTIAL for authorization code flow security
- ID token from token exchange must be validated before trust
- Prevents token substitution attacks

**Result Display:**
- Overall status: Valid ✅ or Invalid ❌
- Individual check results for each validation
- Error messages for failures
- Warning messages for non-critical issues
- Link to OIDC specification

**State:**
```typescript
{
  idToken: string;  // From flowState.tokens.idToken
  clientId: string;  // From credentials
  environmentId: string;  // From credentials
  nonce?: string;  // From flowState.nonce
}
```

---

### Step 7: API Documentation

**Component:** `UnifiedFlowDocumentationPageV8U`  
**Purpose:** Display comprehensive API documentation for the flow

#### Download Options

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
   - Variables included: `authPath`, `envID`, `client_id`, `workerToken`
   - Reference: [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)

#### Postman Collection Format

The generated Postman collection uses the following format:
- **URL Format**: `{{authPath}}/{{envID}}/as/authorize`, `{{authPath}}/{{envID}}/as/token`
- **Variables**:
  - `authPath`: `https://auth.pingone.com` (includes protocol)
  - `envID`: Environment ID from credentials
  - `client_id`: Client ID from credentials
  - `workerToken`: Empty (user fills in)

#### Button Styling

All download buttons:
- Padding: `12px 24px`
- Border radius: `8px`
- Font size: `16px`
- Font weight: `600`
- Display: `flex`
- Align items: `center`
- Gap: `8px`

---

## State Management

### Flow State Interface

```typescript
interface FlowState {
  // Authorization URL (from Step 2)
  authorizationUrl?: string;
  state?: string;
  nonce?: string;  // OIDC only
  
  // PKCE (from Step 1, if enabled)
  codeVerifier?: string;
  codeChallenge?: string;
  
  // Authorization Code (from Step 3)
  authorizationCode?: string;
  
  // Tokens (from Step 4)
  tokens?: {
    accessToken: string;
    idToken?: string;      // OIDC only
    refreshToken?: string; // If refresh tokens enabled
    expiresIn: number;
    tokenType: 'Bearer';
    scope: string;
  };
  
  // UserInfo (from Step 6, OIDC only)
  userInfo?: Record<string, unknown>;
}
```

### Persistence

#### Credentials Storage

- **Location**: `localStorage`
- **Key Format**: `credentials_oauth-authz-{specVersion}-v8u`
- **Storage Trigger**: On field change or form blur
- **Restoration**: Auto-restored on component mount

#### Token Storage

- **Location**: `sessionStorage`
- **Key**: `v8u_oauth_authz_tokens`
- **Storage Trigger**: After successful token exchange
- **Restoration**: Auto-restored on page refresh (if session still active)

#### PKCE Codes Storage

- **Location**: Component state only (not persisted)
- **Reason**: Security - code verifier should not be stored
- **Lifespan**: Component lifecycle only

---

## Error Handling

### Step 0: Configuration Errors

- **Missing Required Fields**: Red border, error message, "Next" button disabled
- **Invalid Redirect URI**: Warning message, must match PingOne config
- **Invalid Client ID**: Error on app lookup, manual entry required

### Step 2: Authorization URL Errors

- **Invalid Credentials**: Error message, check configuration
- **PKCE Generation Failed**: Error message, retry generation
- **URL Generation Failed**: Error message, check network/PingOne status

### Step 3: Callback Errors

- **State Mismatch**: Error message, possible CSRF attack, restart flow
- **Missing Code**: Error message, check callback URL
- **Invalid Callback**: Error message, verify redirect URI

### Step 4: Token Exchange Errors

- **Invalid Code**: Error message, code expired or already used
- **Invalid Client**: Error message, check client ID and secret
- **PKCE Mismatch**: Error message, code verifier doesn't match
- **Redirect URI Mismatch**: Error message, must match exactly
- **Unsupported Auth Method**: Error message, check PingOne app config

### Step 5: Token Display Errors

- **Missing Tokens**: Error message, restart flow
- **Token Decode Failed**: Warning message, token may not be JWT

### Step 6: Introspection Errors

- **Invalid Token**: Error message, token may be expired
- **Introspection Failed**: Error message, check token and credentials
- **UserInfo Failed**: Error message (OIDC only), check access token

---

## Testing Checklist

### Step 0: Configuration
- [ ] All required fields can be entered
- [ ] Validation works for missing fields
- [ ] PKCE can be enabled/disabled
- [ ] Client auth method can be selected
- [ ] Credentials persist on page refresh
- [ ] App lookup works (if available)

### Step 1: PKCE (if enabled)
- [ ] PKCE codes are generated
- [ ] Code verifier is 43-128 characters
- [ ] Code challenge is base64url encoded
- [ ] Codes are stored in state

### Step 2: Authorization URL
- [ ] Authorization URL is generated
- [ ] URL contains all required parameters
- [ ] PKCE parameters included (if enabled)
- [ ] State parameter is generated
- [ ] Nonce is generated (if OIDC)
- [ ] "Authenticate on PingOne" button works

### Step 3: Callback
- [ ] Authorization code is extracted from URL
- [ ] State is validated
- [ ] Error handling works for invalid state
- [ ] Error handling works for missing code

### Step 4: Token Exchange
- [ ] Token exchange succeeds
- [ ] Access token is received
- [ ] ID token is received (if OIDC)
- [ ] Refresh token is received (if enabled)
- [ ] PKCE code verifier is included (if enabled)
- [ ] Error handling works for invalid code
- [ ] Error handling works for PKCE mismatch

### Step 5: Token Display
- [ ] All tokens are displayed
- [ ] Token copy works
- [ ] Token decode works (for JWT tokens)
- [ ] Expiration time is shown
- [ ] Scopes are displayed

### Step 6: Introspection
- [ ] Token introspection works
- [ ] UserInfo works (if OIDC)
- [ ] Results are displayed correctly
- [ ] Error handling works for invalid tokens

---

## References

- **OAuth 2.0 Authorization Code Flow**: [RFC 6749 Section 4.1](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1)
- **PKCE (RFC 7636)**: [Proof Key for Code Exchange](https://datatracker.ietf.org/doc/html/rfc7636)
- **OpenID Connect Core 1.0**: [OIDC Core Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- **OAuth 2.1 Authorization Framework**: [draft-ietf-oauth-v2-1](https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-09.html)
- **PingOne API Documentation**: [Authorization Endpoint](https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-and-authentication-apis-authorize-authorization-code)
