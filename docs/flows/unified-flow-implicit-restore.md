# Unified Flow - Implicit Flow Restore & Persistence Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** Implicit Flow (OAuth 2.0 / OIDC)  
**Component:** `UnifiedOAuthFlowV8U` → `UnifiedFlowSteps`

## Table of Contents

1. [Overview](#overview)
2. [Storage Locations](#storage-locations)
3. [Credential Persistence](#credential-persistence)
4. [Token Persistence](#token-persistence)
5. [State Restoration](#state-restoration)
6. [URL Parameter Handling](#url-parameter-handling)
7. [Fragment Handling](#fragment-handling)
8. [Reset Semantics](#reset-semantics)
9. [Session Management](#session-management)
10. [Data Flow](#data-flow)

---

## Overview

The Implicit Flow uses multiple storage mechanisms to persist credentials, tokens, and state across page refreshes, navigation, and browser sessions. This document details what is stored where, when, and how it's restored.

### Storage Strategy

The Implicit Flow uses a **hierarchical persistence strategy**:

1. **Credentials**: `localStorage` (persists across sessions)
2. **Tokens**: `sessionStorage` (persists only for browser session)
3. **URL State**: Route parameters and fragment (ephemeral)
4. **Component State**: React state (in-memory, lost on unmount)

### Key Principles

- ✅ **Credentials persist** across browser sessions (localStorage)
- ✅ **Tokens persist** only for the browser session (sessionStorage)
- ✅ **URL state** is used for navigation and restoration
- ✅ **Fragment parameters** are ephemeral (lost on navigation)
- ⚠️ **Tokens in fragment** must be extracted immediately

---

## Storage Locations

### 1. Credentials Storage (`localStorage`)

**Purpose**: Persist OAuth credentials across browser sessions.

**Storage Key Format**:
```
credentials_implicit-v8u_{specVersion}
```

**Examples**:
- `credentials_implicit-v8u_oauth2.0`
- `credentials_implicit-v8u_oidc`

**Stored Data Structure**:
```typescript
{
  environmentId: string;
  clientId: string;
  scopes: string;
  redirectUri: string;
  prompt?: 'none' | 'login' | 'consent';
  loginHint?: string;
  maxAge?: number;
  display?: 'page' | 'popup' | 'touch' | 'wap';
  responseMode: 'fragment';  // Always 'fragment' for implicit
  responseType: 'token id_token';  // Always 'token id_token'
  clientAuthMethod: 'none';  // Always 'none' for implicit (public client)
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
v8u_implicit_tokens
```

**Stored Data Structure**:
```typescript
{
  accessToken: string;
  idToken?: string;  // OIDC only
  expiresIn: number;  // seconds
  tokenType: 'Bearer';
  timestamp: number;  // Unix timestamp when stored
}
```

**Storage Triggers**:
- After successful fragment parsing (Step 2)
- When tokens are extracted from callback URL
- After state restoration from URL

**Retrieval**:
- On Step 2 mount (if fragment not detected)
- On Step 3 mount (to restore display)
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

---

### 3. Flow State Storage (`sessionStorage`)

**Purpose**: Persist flow execution state (authorization URL, state, nonce).

**Storage Keys**:
```
v8u_implicit_state
v8u_implicit_authorizationUrl
v8u_implicit_nonce
```

**Stored Data**:
```typescript
// State parameter
state: string;  // Prefixed: "v8u-implicit-{random}"

// Authorization URL
authorizationUrl: string;  // Full authorization URL

// Nonce (OIDC only)
nonce?: string;  // Random UUID for OIDC nonce validation
```

**Storage Triggers**:
- After authorization URL generation (Step 1)
- When state parameter is created
- When nonce is generated (OIDC)

**Retrieval**:
- On Step 2 mount (to validate state)
- On fragment parsing (to validate state/nonce)
- On restoration from URL

**Lifespan**: Session-only (same as tokens)

---

### 4. URL State (Route Parameters)

**Purpose**: Enable deep linking, restoration, and navigation.

**Route Format**:
```
/v8u/unified/implicit/{step}
```

**Examples**:
- `/v8u/unified/implicit/0` - Step 0 (Configure)
- `/v8u/unified/implicit/1` - Step 1 (Authorization URL)
- `/v8u/unified/implicit/2` - Step 2 (Parse Fragment)
- `/v8u/unified/implicit/3` - Step 3 (Display Tokens)
- `/v8u/unified/implicit/4` - Step 4 (Introspection & UserInfo)

**Query Parameters**:
- `spec`: Spec version (`oauth2.0` or `oidc`)
  - Example: `/v8u/unified/implicit/0?spec=oidc`
- `step`: Step number (redundant with route)
  - Example: `/v8u/unified/implicit/1?step=1`

**URL State Restoration**:
- **Step Detection**: Route path determines current step
- **Spec Detection**: Query parameter determines spec version
- **Flow Detection**: Route path indicates `implicit` flow

**Navigation**:
- Step navigation updates URL route
- Browser back/forward works with URL state
- Deep links work (e.g., bookmark to specific step)

---

### 5. Fragment Parameters (Ephemeral)

**Purpose**: Receive tokens from PingOne authorization server (RFC 6749).

**Fragment Format**:
```
#access_token={token}
&token_type=Bearer
&expires_in=3600
&id_token={idToken}  // OIDC only
&scope={scopes}
&state={state}
&session_state={sessionState}  // OIDC only
```

**Fragment Location**:
- **Callback URL**: `http://localhost:3000/unified-callback#...`
- **Not persisted**: Fragment is ephemeral (lost on navigation)
- **Extracted immediately**: Must be parsed on callback

**Fragment Handling**:
1. **Detection**: `window.location.hash` contains fragment
2. **Extraction**: Parsed on Step 2 mount
3. **Validation**: State/nonce validated against stored values
4. **Storage**: Tokens extracted and saved to sessionStorage
5. **Cleanup**: Fragment cleared after extraction (security)

**Important Notes**:
- ⚠️ **Ephemeral**: Fragment is not stored anywhere
- ⚠️ **One-time use**: Fragment is valid only once
- ⚠️ **Must extract**: Tokens must be extracted before navigation
- ⚠️ **Security**: Fragment cleared after extraction

---

## Credential Persistence

### Saving Credentials

**Trigger**: User modifies credential fields in Step 0 (Configure).

**Process**:
1. User changes a field (e.g., `environmentId`)
2. Field value is updated in React state
3. Change event triggers debounced save (500ms delay)
4. Full credentials object serialized to JSON
5. Saved to `localStorage` under key: `credentials_implicit-v8u_{specVersion}`

**Save Conditions**:
- ✅ Field value changed (debounced)
- ✅ Form validation passed (all required fields present)
- ✅ Flow type is `implicit`
- ✅ Spec version is valid (`oauth2.0` or `oidc`)

**Save Exclusions**:
- ❌ Client Secret (not used in implicit flow, never saved)
- ❌ PKCE codes (not applicable to implicit flow)
- ❌ Private keys (not applicable to implicit flow)

### Loading Credentials

**Trigger**: Component mount, spec version change, flow type change.

**Process**:
1. Determine storage key: `credentials_implicit-v8u_{specVersion}`
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
  scopes: 'openid profile email',  // OIDC default, 'profile email' for OAuth 2.0
  redirectUri: 'http://localhost:3000/unified-callback',
  responseMode: 'fragment',
  responseType: 'token id_token',
  clientAuthMethod: 'none'
}
```

### Credential Migration

**Cross-Spec Migration**:
- If user switches spec version (e.g., `oauth2.0` → `oidc`):
  - Credentials from old spec are loaded
  - Missing fields are filled with defaults
  - Scope is adjusted if needed (`openid` added for OIDC)

**Cross-Flow Migration**:
- If user switches from implicit to another flow:
  - Shared fields are preserved (environmentId, clientId)
  - Flow-specific fields are reset (responseType, responseMode)
  - Credentials saved to new flow key

---

## Token Persistence

### Saving Tokens

**Trigger**: Successful fragment parsing (Step 2).

**Process**:
1. Fragment parsed from URL: `window.location.hash`
2. Tokens extracted: `access_token`, `id_token`
3. Token object created:
   ```typescript
   {
     accessToken: string,
     idToken?: string,
     expiresIn: number,
     tokenType: 'Bearer',
     timestamp: Date.now()
   }
   ```
4. Serialized to JSON
5. Saved to `sessionStorage` under key: `v8u_implicit_tokens`
6. Fragment cleared from URL (security)

**Save Conditions**:
- ✅ Fragment parsing successful
- ✅ State validation passed
- ✅ Nonce validation passed (OIDC)
- ✅ Access token present

**Storage Location**: `sessionStorage` (NOT `localStorage`)
- **Reason**: Security - tokens should not persist across sessions
- **Impact**: Tokens lost when browser tab/window closes

### Loading Tokens

**Trigger**: Step 2/3 mount, page refresh, restoration.

**Process**:
1. Check `sessionStorage` for key: `v8u_implicit_tokens`
2. Deserialize JSON
3. Validate token structure
4. Check token expiration (if timestamp present)
5. Update React state
6. Restore token display (Step 3)

**Load Priority**:
1. **Fragment** (if present in URL - highest priority)
2. **SessionStorage** (if no fragment)
3. **Component state** (if already in React state)

**Token Expiration Check**:
```typescript
const storedTimestamp = tokens.timestamp || 0;
const expiresIn = tokens.expiresIn || 3600;
const expirationTime = storedTimestamp + (expiresIn * 1000);
const isExpired = Date.now() > expirationTime;

if (isExpired) {
  // Clear expired tokens
  sessionStorage.removeItem('v8u_implicit_tokens');
  // Prompt user to re-authenticate
}
```

### Token Cleanup

**Automatic Cleanup**:
- Expired tokens are removed from sessionStorage
- Fragment is cleared after extraction
- Tokens cleared on "Reset Flow" action

**Manual Cleanup**:
- User can manually clear sessionStorage
- Browser settings can clear sessionStorage
- "Reset Flow" button clears all token storage

---

## State Restoration

### Initial Load Restoration

**Scenario**: User navigates to `/v8u/unified/implicit/{step}` or refreshes page.

**Restoration Process**:

1. **Route Detection**:
   - Parse URL route: `/v8u/unified/implicit/{step}`
   - Extract step number from route
   - Extract spec version from query parameter

2. **Credential Restoration**:
   - Load credentials from `localStorage`
   - Key: `credentials_implicit-v8u_{specVersion}`
   - Merge with defaults
   - Populate credentials form

3. **State Restoration**:
   - Load flow state from `sessionStorage`:
     - `v8u_implicit_state`
     - `v8u_implicit_authorizationUrl`
     - `v8u_implicit_nonce` (OIDC only)

4. **Token Restoration**:
   - Check URL fragment first (highest priority)
   - If no fragment, load from `sessionStorage`
   - Key: `v8u_implicit_tokens`
   - Validate token expiration
   - Restore token display if valid

5. **Step Restoration**:
   - Navigate to step from URL route
   - Mark completed steps based on available data
   - Update stepper UI

### Fragment-Based Restoration

**Scenario**: User is redirected back from PingOne authorization.

**Restoration Process**:

1. **Fragment Detection**:
   - Check `window.location.hash`
   - Detect `access_token` or `id_token` presence
   - Parse fragment parameters

2. **State Validation**:
   - Extract `state` from fragment
   - Load stored state from `sessionStorage`
   - Compare: `fragment.state === stored.state`
   - If mismatch: Error, prevent token extraction

3. **Nonce Validation** (OIDC):
   - Extract `nonce` from ID token (decoded)
   - Load stored nonce from `sessionStorage`
   - Compare: `idToken.nonce === stored.nonce`
   - If mismatch: Error, prevent token extraction

4. **Token Extraction**:
   - Extract `access_token` from fragment
   - Extract `id_token` from fragment (OIDC)
   - Extract `expires_in` from fragment
   - Create token object
   - Save to `sessionStorage`

5. **Fragment Cleanup**:
   - Clear fragment from URL: `window.location.hash = ''`
   - Navigate to Step 3 (Display Tokens)
   - Update URL route (remove fragment)

### Session Restoration

**Scenario**: User refreshes page or navigates back during flow.

**Restoration Priority**:

1. **URL Fragment** (if present):
   - Highest priority - tokens directly in URL
   - Parse immediately
   - Save to sessionStorage

2. **SessionStorage Tokens**:
   - If no fragment, check sessionStorage
   - Restore tokens if valid
   - Check expiration before restoring

3. **SessionStorage State**:
   - Restore authorization URL
   - Restore state parameter
   - Restore nonce (OIDC)

4. **localStorage Credentials**:
   - Always restored on mount
   - Merge with current state
   - Validate required fields

**Restoration Failures**:
- **Missing Credentials**: Show error, prompt to configure
- **Expired Tokens**: Clear tokens, prompt to re-authenticate
- **State Mismatch**: Clear state, prompt to start over
- **Missing Fragment**: If on Step 2, allow manual entry

---

## URL Parameter Handling

### Route Parameters

**Route Structure**:
```
/v8u/unified/{flowType}/{step}
```

**Flow Type**: `implicit`  
**Step Values**: `0`, `1`, `2`, `3`, `4`

**Route Parameter Extraction**:
```typescript
// React Router
const { flowType, step } = useParams<{
  flowType: 'implicit';
  step: string;
}>();

// Convert step to number
const currentStep = parseInt(step || '0', 10);
```

**Route Updates**:
- Step navigation updates route parameter
- URL changes when user clicks "Next Step" / "Previous Step"
- Browser back/forward updates route

### Query Parameters

**Supported Parameters**:
- `spec`: Spec version (`oauth2.0` or `oidc`)
  - Example: `?spec=oidc`
  - Default: `oidc` (if not specified)

**Query Parameter Handling**:
```typescript
const [searchParams] = useSearchParams();
const specVersion = (searchParams.get('spec') || 'oidc') as SpecVersion;
```

**Query Parameter Updates**:
- Spec version selector updates query parameter
- URL changes when user selects spec version
- Browser back/forward preserves query parameters

### URL State Priority

1. **Route Parameter** (`/v8u/unified/implicit/{step}`):
   - Determines current step
   - Highest priority for step navigation

2. **Query Parameter** (`?spec=oidc`):
   - Determines spec version
   - Overrides default spec version

3. **Fragment** (`#access_token=...`):
   - Contains tokens (ephemeral)
   - Used for token extraction
   - Cleared after extraction

---

## Fragment Handling

### Fragment Structure

**Format**:
```
#access_token={token}
&token_type=Bearer
&expires_in=3600
&id_token={idToken}  // OIDC only
&scope=openid profile email
&state={state}
&session_state={sessionState}  // OIDC only
```

**Fragment Extraction**:
```typescript
// Get fragment from URL
const fragment = window.location.hash.substring(1);  // Remove '#'
const params = new URLSearchParams(fragment);

// Extract tokens
const accessToken = params.get('access_token');
const idToken = params.get('id_token');
const expiresIn = parseInt(params.get('expires_in') || '3600');
const state = params.get('state');
const sessionState = params.get('session_state');
```

### Fragment Validation

**State Validation**:
```typescript
// Get stored state from sessionStorage
const storedState = sessionStorage.getItem('v8u_implicit_state');

// Extract state from fragment
const fragmentState = params.get('state');

// Validate
if (fragmentState !== storedState) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

**Nonce Validation** (OIDC):
```typescript
// Get stored nonce from sessionStorage
const storedNonce = sessionStorage.getItem('v8u_implicit_nonce');

// Decode ID token
const idTokenPayload = decodeJWT(idToken);

// Extract nonce from ID token
const tokenNonce = idTokenPayload.nonce;

// Validate
if (tokenNonce !== storedNonce) {
  throw new Error('Nonce mismatch - possible replay attack');
}
```

### Fragment Cleanup

**After Extraction**:
```typescript
// Clear fragment from URL
window.history.replaceState(
  null,
  '',
  window.location.pathname + window.location.search
);

// Or navigate to clean URL
navigate('/v8u/unified/implicit/3', { replace: true });
```

**Security Reasons**:
- ⚠️ **Prevent History Exposure**: Remove tokens from browser history
- ⚠️ **Prevent Logging**: Remove tokens from server logs
- ⚠️ **Prevent Sharing**: Remove tokens from shareable URLs

---

## Reset Semantics

### Reset Flow Action

**Trigger**: User clicks "Reset Flow" button or starts new flow.

**What Gets Reset**:
- ✅ **Component State**: All React state cleared
- ✅ **SessionStorage Tokens**: Tokens removed
- ✅ **SessionStorage State**: Flow state removed
- ✅ **URL Fragment**: Fragment cleared (if present)
- ❌ **localStorage Credentials**: **NOT cleared** (preserved)

**Reset Process**:
```typescript
// Clear sessionStorage
sessionStorage.removeItem('v8u_implicit_tokens');
sessionStorage.removeItem('v8u_implicit_state');
sessionStorage.removeItem('v8u_implicit_authorizationUrl');
sessionStorage.removeItem('v8u_implicit_nonce');

// Clear React state
setFlowState({
  authorizationUrl: undefined,
  state: undefined,
  nonce: undefined,
  tokens: undefined,
  userInfo: undefined
});

// Clear URL fragment
window.history.replaceState(null, '', window.location.pathname);

// Navigate to Step 0
navigate('/v8u/unified/implicit/0');
```

### Clear Credentials Action

**Trigger**: User explicitly clears credentials (if action available).

**What Gets Cleared**:
- ✅ **localStorage Credentials**: Credentials removed
- ✅ **Component State**: All state cleared
- ✅ **SessionStorage**: All sessionStorage cleared
- ✅ **URL State**: Reset to default route

**Clear Process**:
```typescript
// Clear localStorage
localStorage.removeItem(`credentials_implicit-v8u_${specVersion}`);

// Clear sessionStorage
sessionStorage.clear();  // Or specific keys

// Reset component state
// Navigate to Step 0 with defaults
```

### Partial Reset

**Scenario**: User wants to retry a specific step.

**What Gets Preserved**:
- ✅ **Credentials**: Preserved in localStorage
- ✅ **Tokens** (if valid): Preserved in sessionStorage
- ✅ **Flow State**: Preserved in sessionStorage

**What Gets Reset**:
- ✅ **Current Step State**: Cleared
- ✅ **Error Messages**: Cleared
- ✅ **Loading State**: Reset

---

## Session Management

### Browser Session

**Session Boundaries**:
- **Start**: Browser tab/window opened
- **End**: Browser tab/window closed
- **Scope**: Per-tab (not shared across tabs)

**SessionStorage Behavior**:
- ✅ Persists during tab lifetime
- ✅ Shared across same-tab navigations
- ✅ Shared across page refreshes
- ❌ Lost on tab close
- ❌ Not shared across tabs

### Cross-Tab Behavior

**Isolation**:
- Each tab has its own `sessionStorage`
- Tokens in Tab A are not visible in Tab B
- Credentials (localStorage) are shared across tabs

**Shared State**:
- ✅ **Credentials**: Shared via localStorage
- ❌ **Tokens**: Isolated per tab (sessionStorage)
- ❌ **Flow State**: Isolated per tab (sessionStorage)

**Conflict Resolution**:
- If user opens multiple tabs with same flow:
  - Each tab has independent token state
  - Last tab to extract fragment wins
  - Credentials are shared (last save wins)

### Session Expiration

**Token Expiration**:
```typescript
const storedTokens = JSON.parse(sessionStorage.getItem('v8u_implicit_tokens'));
const expirationTime = storedTokens.timestamp + (storedTokens.expiresIn * 1000);
const isExpired = Date.now() > expirationTime;

if (isExpired) {
  // Clear expired tokens
  sessionStorage.removeItem('v8u_implicit_tokens');
  // Show expiration message
  // Prompt to re-authenticate
}
```

**Session Expiration Handling**:
- **Automatic Cleanup**: Expired tokens cleared on load
- **User Notification**: Show expiration message
- **Re-authentication**: Prompt to start flow again

---

## Postman Collection Downloads

### Overview

The documentation page (final step) provides a **Postman Collection** download feature that generates a complete Postman collection JSON file with all API calls from the flow.

### Collection Format

The generated Postman collection follows the [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template) format:

- **URL Format**: `{{authPath}}/{{envID}}/as/authorize`, `{{authPath}}/{{envID}}/as/token`
- **Variables**: Pre-configured with values from credentials
- **Headers**: Automatically set (Content-Type, Authorization)
- **Request Bodies**: Pre-filled with example data

### Variables Included

| Variable | Value | Type | Source |
|----------|-------|------|--------|
| `authPath` | `https://auth.pingone.com` | `string` | Default (includes protocol) |
| `envID` | Environment ID | `string` | From credentials |
| `client_id` | Client ID | `string` | From credentials |
| `workerToken` | Empty | `string` | User fills in |

### Storage

**Postman collections are NOT persisted** - they are generated on-demand when the user clicks "Download Postman Collection".

### Generation Process

1. **Source**: API calls tracked during flow execution via `apiCallTrackerService`
2. **Conversion**: Endpoints converted to Postman format: `{{authPath}}/{{envID}}/path`
3. **Variables**: Extracted from current credentials
4. **Collection Generation**: Postman collection JSON file created with all API requests
5. **Environment Generation**: Postman environment JSON file created with all variables pre-filled
6. **Download**: Both files downloaded:
    -   Collection: `pingone-{flowType}-{specVersion}-{date}-collection.json`
    -   Environment: `pingone-{flowType}-{specVersion}-{date}-environment.json`

### Environment Variables

The generated environment file includes all variables with pre-filled values from credentials:

-   `authPath`: `https://auth.pingone.com` (default, includes protocol)
-   `envID`: Pre-filled from `environmentId` in credentials
-   `client_id`: Pre-filled from `clientId` in credentials
-   `workerToken`: Empty (user fills in)
-   `redirect_uri`: Default value `http://localhost:3000/oauth-callback`
-   `scopes`: Default value `openid profile email`
-   `state`: Empty (generated per request)
-   `access_token`: Empty (filled after token exchange)

### Usage

1. User completes flow and reaches documentation page
2. User clicks "Download Postman Collection" button
3. Two JSON files are generated and downloaded:
    -   Collection file with all API requests
    -   Environment file with all variables
4. User imports both files into Postman:
    -   Import collection file → All API requests available
    -   Import environment file → All variables pre-configured
5. User selects the imported environment from Postman's environment dropdown
6. User updates environment variables with actual values if needed
7. User can test API calls directly in Postman (variables automatically substituted)

**Reference**: [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)

---

## Data Flow

### Complete Flow Sequence

```
1. User Configures Credentials (Step 0)
   ↓
   [localStorage] credentials_implicit-v8u_{spec}
   
2. Generate Authorization URL (Step 1)
   ↓
   [sessionStorage] v8u_implicit_state
   [sessionStorage] v8u_implicit_authorizationUrl
   [sessionStorage] v8u_implicit_nonce (OIDC)
   
3. User Authorizes (PingOne)
   ↓
   [URL Fragment] #access_token=...&id_token=...&state=...
   
4. Parse Fragment (Step 2)
   ↓
   [sessionStorage] v8u_implicit_tokens
   [URL] Fragment cleared
   
5. Display Tokens (Step 3)
   ↓
   [Read] v8u_implicit_tokens from sessionStorage
   
6. Introspection & UserInfo (Step 4)
   ↓
   [Read] v8u_implicit_tokens from sessionStorage
```

### Restoration Flow

```
Page Load / Navigation
   ↓
[Route Detection] /v8u/unified/implicit/{step}
[Query Detection] ?spec={specVersion}
   ↓
[localStorage] Load credentials
   ↓
[sessionStorage] Load flow state (state, authorizationUrl, nonce)
   ↓
[Check URL Fragment] If present, parse immediately
   ↓
[sessionStorage] Load tokens (if no fragment)
   ↓
[Restore Step] Navigate to step from route
   ↓
[Restore UI] Populate forms, display tokens
```

### Error Recovery Flow

```
Error Detected (e.g., state mismatch)
   ↓
[Clear Invalid State] sessionStorage.removeItem(...)
   ↓
[Show Error Message] User notification
   ↓
[Offer Recovery Options]
   - Retry current step
   - Start from Step 1
   - Reset entire flow
   ↓
[User Action] → Recovery path
```

---

## Best Practices

### For Developers

1. ✅ **Always validate state**: Never skip state validation
2. ✅ **Clear fragments immediately**: Remove tokens from URL after extraction
3. ✅ **Check token expiration**: Validate before using tokens
4. ✅ **Use sessionStorage for tokens**: Never store tokens in localStorage
5. ✅ **Handle restoration gracefully**: Support page refresh and navigation

### For Users

1. ✅ **Complete flow in one session**: Avoid closing tabs mid-flow
2. ✅ **Don't share URLs with fragments**: Tokens are in the URL
3. ✅ **Re-authenticate when expired**: Tokens expire after 1 hour
4. ✅ **Use browser back/forward carefully**: May lose fragment state
5. ✅ **Clear browser data periodically**: For security

---

## Troubleshooting

### Tokens Not Restored After Refresh

**Problem**: Tokens lost after page refresh.

**Causes**:
- SessionStorage cleared (tab closed/reopened)
- Fragment not extracted before navigation
- Token expiration

**Solutions**:
- Complete flow in one session
- Extract fragment immediately
- Re-authenticate if expired

### State Mismatch Error

**Problem**: "State mismatch" error on fragment parsing.

**Causes**:
- State not persisted to sessionStorage
- State cleared before fragment parsing
- User navigated away and back

**Solutions**:
- Start flow from Step 1 again
- Complete authorization in one session
- Don't manually edit URLs

### Credentials Not Saved

**Problem**: Credentials not persisting across sessions.

**Causes**:
- localStorage disabled
- Browser data cleared
- Storage quota exceeded

**Solutions**:
- Enable localStorage in browser
- Check browser storage settings
- Clear old data to free space

---

## References

- [MDN - Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React Router - URL Parameters](https://reactrouter.com/en/main/route/route)
- [RFC 6749 - OAuth 2.0 Fragment Response](https://tools.ietf.org/html/rfc6749#section-4.2.2)

