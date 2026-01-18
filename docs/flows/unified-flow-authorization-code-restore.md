# Unified Flow - Authorization Code Flow Restore & Persistence Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** Authorization Code Flow (OAuth 2.0 / OIDC Core 1.0 / OAuth 2.1)  
**Component:** `UnifiedOAuthFlowV8U` → `UnifiedFlowSteps`

## Table of Contents

1. [Overview](#overview)
2. [Storage Locations](#storage-locations)
3. [Credential Persistence](#credential-persistence)
4. [Token Persistence](#token-persistence)
5. [State Restoration](#state-restoration)
6. [URL Parameter Handling](#url-parameter-handling)
7. [Reset Semantics](#reset-semantics)
8. [Session Management](#session-management)
9. [Data Flow](#data-flow)
10. [File Locations](#file-locations)
11. [Common Issues & Fixes](#common-issues--fixes)

---

## Overview

The Authorization Code Flow uses multiple storage mechanisms to persist credentials and tokens across page refreshes, navigation, and browser sessions. This document details what is stored where, when, and how it's restored.

### Storage Strategy

The Authorization Code Flow uses a **hierarchical persistence strategy**:

1. **Credentials**: `localStorage` (persists across sessions)
2. **Tokens**: `sessionStorage` (persists only for browser session)
3. **PKCE Codes**: Component state only (not persisted for security)
4. **URL State**: Route parameters (ephemeral)
5. **Component State**: React state (in-memory, lost on unmount)

### Key Principles

- ✅ **Credentials persist** across browser sessions (localStorage)
- ✅ **Tokens persist** only for the browser session (sessionStorage)
- ✅ **PKCE codes never persist** (security best practice)
- ✅ **URL state** is used for navigation and restoration
- ✅ **User context**: Tokens represent a specific user
- ✅ **Refresh tokens**: Can be used to obtain new access tokens

---

## Storage Locations

### 1. Credentials Storage (`localStorage`)

**Purpose**: Persist OAuth credentials across browser sessions.

**Storage Key Format**:
```
credentials_oauth-authz-{specVersion}-v8u
```

**Examples**:
- `credentials_oauth-authz-oauth2.0-v8u`
- `credentials_oauth-authz-oidc-v8u`
- `credentials_oauth-authz-oauth2.1-v8u`

**Stored Data Structure**:
```typescript
{
  environmentId: string;
  clientId: string;
  clientSecret?: string;  // Required for confidential clients
  redirectUri: string;    // Required
  scopes: string;        // Required
  clientAuthMethod?: 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt' | 'none';
  usePKCE?: boolean;
  responseMode?: 'query' | 'fragment' | 'form_post' | 'pi.flow';
  prompt?: 'none' | 'login' | 'consent';
  loginHint?: string;
  maxAge?: number;
  usePAR?: boolean;
  // ... other optional fields
}
```

**Storage Triggers**:
- On field change (debounced)
- On form blur
- On "Save" button click (if present)
- When loading from PingOne App Picker

**Retrieval**:
- On component mount
- When spec version changes
- When flow type changes
- When credentials form initializes

**Lifespan**: Persists until:
- User manually clears browser data
- User explicitly clears credentials
- Application uninstalls

---

### 2. Token Storage (`sessionStorage`)

**Purpose**: Persist tokens for the current browser session only.

**Storage Key**:
```
v8u_oauth_authz_tokens
```

**Stored Data Structure**:
```typescript
{
  accessToken: string;
  idToken?: string;      // OIDC only
  refreshToken?: string; // If refresh tokens enabled
  expiresIn: number;     // seconds
  tokenType: 'Bearer';
  scope?: string;
  timestamp: number;     // Unix timestamp when stored
}
```

**Storage Triggers**:
- After successful token exchange (Step 4)
- When tokens are received from token endpoint
- After state restoration from URL

**Retrieval**:
- On Step 4 mount (to restore display)
- On Step 5 mount (to restore display)
- On page refresh (to restore tokens)

**Lifespan**: Persists until:
- Browser tab/window is closed
- Browser session ends
- User manually clears sessionStorage
- Explicitly cleared by "Reset Flow" action

**Important Notes**:
- ⚠️ **Session-only**: Tokens are lost when browser session ends
- ⚠️ **Tab-specific**: Each tab has its own sessionStorage
- ⚠️ **Not persisted**: Tokens are never saved to localStorage (security)
- ✅ **Refresh tokens**: Can be used to obtain new access tokens

---

### 3. PKCE Codes Storage

**Purpose**: PKCE code verifier and challenge (security).

**Storage Location**: Component state only (NOT persisted)

**Reason**: Security best practice - code verifier should never be persisted

**Stored Data Structure**:
```typescript
{
  codeVerifier: string;   // 43-128 character random string
  codeChallenge: string;  // Base64URL(SHA256(codeVerifier))
  codeChallengeMethod: 'S256';
}
```

**Storage Triggers**:
- When PKCE codes are generated (Step 1)
- When authorization URL is generated (Step 2)

**Retrieval**:
- From component state only
- Never from storage

**Lifespan**: Component lifecycle only (lost on unmount)

**Important Notes**:
- ⚠️ **Never persisted**: Code verifier is never saved to storage
- ⚠️ **Lost on refresh**: Codes must be regenerated if page refreshes
- ✅ **Security**: Prevents code verifier from being exposed in storage

---

### 4. URL State (Route Parameters)

**Purpose**: Enable deep linking, restoration, and navigation.

**Route Format**:
```
/v8u/unified/oauth-authz/{step}
```

**Examples**:
- `/v8u/unified/oauth-authz/0` - Step 0 (Configure)
- `/v8u/unified/oauth-authz/1` - Step 1 (PKCE, if enabled)
- `/v8u/unified/oauth-authz/2` - Step 2 (Authorization URL)
- `/v8u/unified/oauth-authz/3` - Step 3 (Callback)
- `/v8u/unified/oauth-authz/4` - Step 4 (Token Exchange)
- `/v8u/unified/oauth-authz/5` - Step 5 (Tokens)
- `/v8u/unified/oauth-authz/6` - Step 6 (Introspection)

**Query Parameters**:
- `spec`: Spec version (`oauth2.0`, `oidc`, or `oauth2.1`)
  - Example: `/v8u/unified/oauth-authz/0?spec=oidc`
- `step`: Step number (redundant with route)
  - Example: `/v8u/unified/oauth-authz/2?step=2`

**URL State Restoration**:
- **Step Detection**: Route path determines current step
- **Spec Detection**: Query parameter determines spec version
- **Flow Detection**: Route path indicates `oauth-authz` flow

**Navigation**:
- Step navigation updates URL route
- Browser back/forward works with URL state
- Deep links work (e.g., bookmark to specific step)

---

## Credential Persistence

### Saving Credentials

**Trigger**: User modifies credential fields in Step 0 (Configure).

**Process**:
1. User changes a field (e.g., `environmentId`)
2. Field value is updated in React state
3. Change event triggers debounced save (500ms delay)
4. Full credentials object serialized to JSON
5. Saved to `localStorage` under key: `credentials_oauth-authz-{specVersion}-v8u`

**Save Conditions**:
- ✅ Field value changed (debounced)
- ✅ Form validation passed (all required fields present)
- ✅ Flow type is `oauth-authz`
- ✅ Spec version is valid (`oauth2.0`, `oidc`, or `oauth2.1`)

**Save Exclusions**:
- ❌ PKCE codes (not stored, security)
- ❌ Tokens (stored separately in sessionStorage)

### Loading Credentials

**Trigger**: Component mount, spec version change, flow type change.

**Process**:
1. Determine storage key: `credentials_oauth-authz-{specVersion}-v8u`
2. Read from `localStorage`
3. Deserialize JSON
4. Validate required fields
5. Merge with defaults
6. Update React state

**Load Priority**:
1. **Saved credentials** (localStorage)
2. **App config** (from PingOne App Picker, if used)
3. **Default values** (empty strings, defaults)

**Default Values**:
```typescript
{
  environmentId: '',
  clientId: '',
  clientSecret: '',
  redirectUri: '',
  scopes: 'openid profile email',  // Example scopes
  clientAuthMethod: 'client_secret_post',
  usePKCE: false,
  responseMode: 'query',
  // ... other optional fields
}
```

### Credential Migration

**Cross-Spec Migration**:
- If user switches spec version (e.g., `oauth2.0` → `oidc`):
  - Credentials from old spec are loaded
  - Missing fields are filled with defaults
  - Scopes may be adjusted (OIDC requires `openid` scope)

**Cross-Flow Migration**:
- If user switches from authorization code to another flow:
  - Shared fields are preserved (environmentId, clientId, clientSecret)
  - Flow-specific fields are reset (responseType, redirectUri, etc.)
  - Credentials saved to new flow key

---

## Token Persistence

### Saving Tokens

**Trigger**: Successful token exchange (Step 4).

**Process**:
1. Token exchange sent to token endpoint
2. Token response received
3. Token object created:
   ```typescript
   {
     accessToken: tokens.access_token,
     idToken: tokens.id_token,        // If OIDC
     refreshToken: tokens.refresh_token, // If enabled
     expiresIn: tokens.expires_in,
     tokenType: tokens.token_type || 'Bearer',
     scope: tokens.scope,
     timestamp: Date.now()
   }
   ```
4. Serialized to JSON
5. Saved to `sessionStorage` under key: `v8u_oauth_authz_tokens`
6. Component state updated

**Save Conditions**:
- ✅ Token exchange successful
- ✅ Access token present in response
- ✅ Token response valid

**Storage Location**: `sessionStorage` (NOT `localStorage`)
- **Reason**: Security - tokens should not persist across sessions
- **Impact**: Tokens lost when browser tab/window closes

### Loading Tokens

**Trigger**: Step 4/5 mount, page refresh, restoration.

**Process**:
1. Check `sessionStorage` for key: `v8u_oauth_authz_tokens`
2. Deserialize JSON
3. Validate token structure
4. Check token expiration (if timestamp present)
5. Update React state
6. Restore token display (Step 5)

**Load Priority**:
1. **SessionStorage** (if available)
2. **Component state** (if already in React state)

**Token Expiration Check**:
```typescript
const storedTimestamp = tokens.timestamp || 0;
const expiresIn = tokens.expiresIn || 3600;
const expirationTime = storedTimestamp + (expiresIn * 1000);
const isExpired = Date.now() > expirationTime;

if (isExpired) {
  // Clear expired tokens
  sessionStorage.removeItem('v8u_oauth_authz_tokens');
  // Prompt user to use refresh token or restart flow
}
```

### Token Cleanup

**Automatic Cleanup**:
- Expired tokens are removed from sessionStorage
- Tokens cleared on "Reset Flow" action

**Manual Cleanup**:
- User can manually clear sessionStorage
- Browser settings can clear sessionStorage
- "Reset Flow" button clears all token storage

---

## State Restoration

### Initial Load Restoration

**Scenario**: User navigates to `/v8u/unified/oauth-authz/{step}` or refreshes page.

**Restoration Process**:

1. **Route Detection**:
   - Parse URL route: `/v8u/unified/oauth-authz/{step}`
   - Extract step number from route
   - Extract spec version from query parameter

2. **Credential Restoration**:
   - Load credentials from `localStorage`
   - Key: `credentials_oauth-authz-{specVersion}-v8u`
   - Merge with defaults
   - Populate credentials form

3. **Token Restoration**:
   - Load tokens from `sessionStorage`
   - Key: `v8u_oauth_authz_tokens`
   - Validate token expiration
   - Restore token display if valid

4. **Step Restoration**:
   - Navigate to step from URL route
   - Mark completed steps based on available data
   - Update stepper UI

### Session Restoration

**Scenario**: User refreshes page or navigates back to flow.

**Restoration Process**:

1. **Check SessionStorage**:
   - Look for tokens: `v8u_oauth_authz_tokens`
   - If found and valid, restore token display

2. **Check LocalStorage**:
   - Look for credentials: `credentials_oauth-authz-{specVersion}-v8u`
   - If found, restore credentials form

3. **Check URL**:
   - Parse route for step number
   - Navigate to appropriate step

4. **PKCE Codes**:
   - ⚠️ **Not restored**: PKCE codes are never persisted
   - User must regenerate PKCE codes if page refreshes
   - Flow will work without PKCE if disabled

---

## URL Parameter Handling

### Callback URL Processing

**Scenario**: User returns from PingOne authentication.

**Callback URL Format**:
```
{redirectUri}?code={authorization_code}&state={state}
```

**Processing**:
1. Extract `code` parameter from URL
2. Extract `state` parameter from URL
3. Validate state matches stored state (CSRF protection)
4. Store authorization code in component state
5. Navigate to Step 4 (Token Exchange)

**State Validation**:
```typescript
const urlState = new URLSearchParams(window.location.search).get('state');
const storedState = flowState.state;

if (urlState !== storedState) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

**Code Extraction**:
```typescript
const authorizationCode = new URLSearchParams(window.location.search).get('code');
if (!authorizationCode) {
  throw new Error('Authorization code not found in callback');
}
```

### URL Cleanup

**Scenario**: Malformed callback URLs with multiple parameters.

**Problem**: URLs like `?code=...&state=...?code=...&state=...`

**Solution**: Clean URL on component mount:
```typescript
useEffect(() => {
  const url = window.location.href;
  const cleanUrl = url.replace(/\?code=.*?&state=.*?(?=\?|$)/, (match) => {
    // Extract first valid code and state pair
    const firstMatch = match.match(/code=([^&]+)&state=([^&]+)/);
    return firstMatch ? `?code=${firstMatch[1]}&state=${firstMatch[2]}` : match;
  });
  
  if (cleanUrl !== url) {
    window.history.replaceState({}, '', cleanUrl);
  }
}, []);
```

---

## Reset Semantics

### "Reset Flow" Action

**Trigger**: User clicks "Reset Flow" button.

**Actions**:
1. Clear `sessionStorage` tokens: `v8u_oauth_authz_tokens`
2. Clear component state (authorization code, tokens, PKCE codes)
3. Navigate to Step 0
4. Keep credentials in `localStorage` (user may want to reuse)

### "Clear All" Action

**Trigger**: User explicitly clears all data.

**Actions**:
1. Clear `localStorage` credentials: `credentials_oauth-authz-{specVersion}-v8u`
2. Clear `sessionStorage` tokens: `v8u_oauth_authz_tokens`
3. Clear component state
4. Navigate to Step 0
5. Reset form to defaults

---

## Session Management

### Browser Session

**SessionStorage Lifespan**:
- Tokens persist for browser tab/window session
- Lost when tab/window closes
- Lost when browser is closed

### Cross-Tab Communication

**Not Supported**: Each tab has its own sessionStorage
- Tokens in one tab are not visible in another tab
- Each tab must complete its own flow

### Incognito Mode

**Behavior**:
- `localStorage` and `sessionStorage` cleared when incognito window closes
- Credentials and tokens are lost
- Use IndexedDB backup (if implemented) for better persistence

---

## Data Flow

### Credential Flow

```
User Input → React State → Debounced Save → localStorage → Persist
                                                              ↓
User Refresh → localStorage → Load → React State → Form Display
```

### Token Flow

```
Token Exchange → Token Response → sessionStorage → React State → Display
                                                              ↓
User Refresh → sessionStorage → Load → React State → Display (if valid)
```

### PKCE Code Flow

```
PKCE Generation → React State → Use in Auth URL → Use in Token Exchange
                                                              ↓
User Refresh → ❌ Lost (not persisted) → Must Regenerate
```

---

## File Locations

### Main Components

- **Unified Flow Container**: `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`
- **Flow Steps**: `src/v8u/components/UnifiedFlowSteps.tsx`
- **Credentials Form**: `src/v8u/components/CredentialsFormV8U.tsx`

### Services

- **Flow Integration**: `src/v8u/services/unifiedFlowIntegrationV8U.ts`
- **OAuth Integration**: `src/v8/services/oauthIntegrationServiceV8.ts`
- **PKCE Service**: `src/services/pkceService.tsx`
- **Credentials Service**: `src/v8/services/credentialsServiceV8.ts`
- **Token Display**: `src/v8/services/tokenDisplayServiceV8.ts`
- **Token Operations**: `src/v8/services/tokenOperationsServiceV8.ts`

### Storage Keys

- **Credentials**: `credentials_oauth-authz-{specVersion}-v8u` (localStorage)
- **Tokens**: `v8u_oauth_authz_tokens` (sessionStorage)

---

## Common Issues & Fixes

### Issue: Credentials Not Persisting

**Symptoms**: Credentials lost on page refresh.

**Causes**:
- localStorage disabled or full
- Incognito mode (cleared on window close)
- Browser settings blocking localStorage

**Fixes**:
1. Check browser console for localStorage errors
2. Check localStorage quota (typically 5-10MB)
3. Use IndexedDB backup (if implemented)
4. Check browser settings for storage permissions

### Issue: Tokens Lost on Refresh

**Symptoms**: Tokens disappear when page refreshes.

**Causes**:
- sessionStorage cleared
- Browser tab/window closed
- Incognito mode

**Fixes**:
1. Check sessionStorage is available
2. Verify tokens are saved after token exchange
3. Use refresh token to obtain new access token
4. Restart flow if refresh token not available

### Issue: PKCE Codes Lost on Refresh

**Symptoms**: PKCE codes must be regenerated after refresh.

**Expected Behavior**: This is by design for security.

**Fixes**:
1. Regenerate PKCE codes (automatic on Step 1)
2. Disable PKCE if not required
3. Complete flow in single session (don't refresh)

### Issue: State Mismatch Error

**Symptoms**: "State mismatch - possible CSRF attack" error.

**Causes**:
- Page refreshed between authorization and callback
- Multiple tabs/windows using same flow
- State parameter not persisted

**Fixes**:
1. Complete flow in single session
2. Don't refresh page between authorization and callback
3. Use one tab/window per flow
4. Restart flow if state is lost

### Issue: Authorization Code Expired

**Symptoms**: "Authorization code expired" error.

**Causes**:
- Code not exchanged immediately (codes expire quickly)
- Code already used (codes are single-use)
- Long delay between authorization and exchange

**Fixes**:
1. Exchange code immediately after receiving it
2. Don't refresh page between callback and exchange
3. Restart flow if code expired

### Issue: Redirect URI Mismatch

**Symptoms**: "Redirect URI mismatch" error.

**Causes**:
- Redirect URI doesn't match PingOne configuration
- Trailing slash mismatch
- Protocol mismatch (http vs https)

**Fixes**:
1. Check PingOne app configuration for exact redirect URI
2. Ensure redirect URI in Step 0 matches exactly
3. Use app lookup feature to auto-sync configuration
4. Check for trailing slash differences

---

## Postman Collection

### Download Postman Collection

**Location**: Header of Unified Flow page

**Button**: "Download Postman Collection"

**Contains**:
- Authorization Code Flow requests
- Token exchange request
- Token introspection request
- UserInfo request (OIDC)
- Environment variables

**Format**: Postman Collection v2.1

**Environment Variables**:
- `environmentId`
- `clientId`
- `clientSecret`
- `redirectUri`
- `scopes`
- `authorizationCode`
- `accessToken`
- `idToken`
- `refreshToken`

---

## References

- [UI Contract](./unified-flow-authorization-code-ui-contract.md) - Technical specification
- [UI Documentation](./unified-flow-authorization-code-ui-doc.md) - User guide
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [OIDC Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
