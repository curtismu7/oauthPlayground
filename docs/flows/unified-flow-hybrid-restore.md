# Unified Flow - Hybrid Flow Restore & Persistence Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Flow Type:** Hybrid Flow (OAuth 2.0 / OIDC)  
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

The Hybrid Flow uses multiple storage mechanisms to persist credentials, tokens, authorization codes, and state across page refreshes, navigation, and browser sessions. This document details what is stored where, when, and how it's restored.

### Storage Strategy

The Hybrid Flow uses a **hierarchical persistence strategy**:

1. **Credentials**: `localStorage` (persists across sessions)
2. **Tokens**: `sessionStorage` (persists only for browser session)
3. **Authorization Code**: Component state (ephemeral, not persisted)
4. **URL State**: Route parameters and query/fragment (ephemeral)
5. **Component State**: React state (in-memory, lost on unmount)

### Key Principles

- ✅ **Credentials persist** across browser sessions (localStorage)
- ✅ **Tokens persist** only for the browser session (sessionStorage)
- ✅ **URL state** is used for navigation and restoration
- ✅ **Fragment parameters** are ephemeral (lost on navigation)
- ⚠️ **Authorization codes** are single-use and expire quickly
- ⚠️ **Tokens in fragment** must be extracted immediately

---

## Storage Locations

### 1. Credentials Storage (`localStorage`)

**Purpose**: Persist OAuth credentials across browser sessions.

**Storage Key Format**:
```
credentials_hybrid-v8u_{specVersion}
```

**Examples**:
- `credentials_hybrid-v8u_oauth2.0`
- `credentials_hybrid-v8u_oidc`

**Stored Data Structure**:
```typescript
{
  environmentId: string;
  clientId: string;
  clientSecret: string;  // Required for hybrid flow
  scopes: string;  // Must include 'openid'
  redirectUri: string;
  responseType: 'code id_token' | 'code token' | 'code token id_token';
  responseMode: 'fragment' | 'query' | 'form_post' | 'pi.flow';
  clientAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
  usePKCE?: boolean;
  pkceEnforcement?: 'REQUIRED' | 'OPTIONAL' | 'DISABLED';
  prompt?: 'none' | 'login' | 'consent';
  loginHint?: string;
  maxAge?: number;
  display?: 'page' | 'popup' | 'touch' | 'wap';
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
v8u_tokens
```

**Note**: Shared storage key with other flows (authorization code, implicit).

**Stored Data Structure**:
```typescript
{
  accessToken: string;
  refreshToken?: string;  // If offline_access scope
  idToken?: string;  // OIDC only
  expiresIn: number;  // seconds
  tokenType: 'Bearer';
  scope?: string;
  timestamp: number;  // Unix timestamp when stored
}
```

**Storage Triggers**:
- After successful fragment parsing (Step 2, if tokens in fragment)
- After successful code exchange (Step 3)
- When tokens are extracted from callback URL
- After state restoration from URL

**Retrieval**:
- On Step 2 mount (if fragment not detected)
- On Step 3 mount (to restore display)
- On Step 4 mount (to restore display)
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

**Purpose**: Persist flow execution state (authorization URL, state, nonce, PKCE codes).

**Storage Keys**:
```
v8u_hybrid_state
v8u_hybrid_authorizationUrl
v8u_hybrid_nonce
v8u_hybrid_codeVerifier  // If PKCE enabled
v8u_hybrid_codeChallenge  // If PKCE enabled
```

**Stored Data**:
```typescript
// State parameter
state: string;  // Prefixed: "v8u-hybrid-{random}"

// Authorization URL
authorizationUrl: string;  // Full authorization URL

// Nonce (OIDC only)
nonce?: string;  // Random UUID for OIDC nonce validation

// PKCE codes (if enabled)
codeVerifier?: string;  // PKCE code verifier
codeChallenge?: string;  // PKCE code challenge
codeChallengeMethod?: 'S256' | 'plain';  // PKCE method
```

**Storage Triggers**:
- After authorization URL generation (Step 1)
- When state parameter is created
- When nonce is generated (OIDC)
- When PKCE codes are generated (if enabled)

**Retrieval**:
- On Step 2 mount (to validate state)
- On callback parsing (to validate state/nonce)
- On restoration from URL

**Lifespan**: Session-only (same as tokens)

---

### 4. URL State (Route Parameters)

**Purpose**: Enable deep linking, restoration, and navigation.

**Route Format**:
```
/v8u/unified/hybrid/{step}
```

**Examples**:
- `/v8u/unified/hybrid/0` - Step 0 (Configure)
- `/v8u/unified/hybrid/1` - Step 1 (Authorization URL)
- `/v8u/unified/hybrid/2` - Step 2 (Handle Callback)
- `/v8u/unified/hybrid/3` - Step 3 (Exchange Code for Tokens)
- `/v8u/unified/hybrid/4` - Step 4 (Display Tokens)
- `/v8u/unified/hybrid/5` - Step 5 (Introspection & UserInfo)

**Query Parameters**:
- `spec`: Spec version (`oauth2.0` or `oidc`)
  - Example: `/v8u/unified/hybrid/0?spec=oidc`
- `step`: Step number (redundant with route)
  - Example: `/v8u/unified/hybrid/1?step=1`

**URL State Restoration**:
- **Step Detection**: Route path determines current step
- **Spec Detection**: Query parameter determines spec version
- **Flow Detection**: Route path indicates `hybrid` flow

**Navigation**:
- Step navigation updates URL route
- Browser back/forward works with URL state
- Deep links work (e.g., bookmark to specific step)

---

### 5. Fragment Parameters (Ephemeral)

**Purpose**: Receive tokens from PingOne authorization server (if `response_type` includes tokens).

**Fragment Format** (varies by `response_type`):

**`code id_token`**:
```
#id_token={idToken}
&token_type=Bearer
&expires_in=3600
&scope=openid profile email
&state={state}
&session_state={sessionState}  // OIDC only
```

**`code token`**:
```
#access_token={accessToken}
&token_type=Bearer
&expires_in=3600
&scope=openid profile email
&state={state}
&session_state={sessionState}  // OIDC only
```

**`code token id_token`**:
```
#access_token={accessToken}
&token_type=Bearer
&expires_in=3600
&id_token={idToken}
&scope=openid profile email
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

### 6. Query Parameters (Callback - Authorization Code)

**Purpose**: Receive authorization code from PingOne authorization server.

**Query Format**:
```
?code={authorizationCode}
&state={state}
```

**Query Location**:
- **Callback URL**: `http://localhost:3000/unified-callback?code=...&state=...`
- **Not persisted**: Query parameters are ephemeral (lost on navigation)
- **Extracted immediately**: Must be parsed on callback

**Query Handling**:
1. **Detection**: `window.location.search` contains query parameters
2. **Extraction**: Parsed on Step 2 mount
3. **Validation**: State validated against stored values
4. **Storage**: Authorization code saved to component state (not persisted)
5. **Cleanup**: Query parameters cleared after extraction (security)

**Important Notes**:
- ⚠️ **Ephemeral**: Query parameters are not stored
- ⚠️ **Single-use**: Authorization codes expire quickly (typically 10 minutes)
- ⚠️ **Must extract**: Code must be extracted before navigation
- ⚠️ **Security**: Query parameters cleared after extraction

---

## Credential Persistence

### Saving Credentials

**Trigger**: User modifies credential fields in Step 0 (Configure).

**Process**:
1. User changes a field (e.g., `environmentId`)
2. Field value is updated in React state
3. Change event triggers debounced save (500ms delay)
4. Full credentials object serialized to JSON
5. Saved to `localStorage` under key: `credentials_hybrid-v8u_{specVersion}`

**Save Conditions**:
- ✅ Field value changed (debounced)
- ✅ Form validation passed (all required fields present)
- ✅ Flow type is `hybrid`
- ✅ Spec version is valid (`oauth2.0` or `oidc`)
- ✅ Scopes include `openid` (required for hybrid)

**Save Exclusions**:
- ❌ PKCE codes (stored separately in sessionStorage)
- ❌ Private keys (not stored, used only for signing)

### Loading Credentials

**Trigger**: Component mount, spec version change, flow type change.

**Process**:
1. Determine storage key: `credentials_hybrid-v8u_{specVersion}`
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
  scopes: 'openid profile email',  // Must include 'openid'
  redirectUri: 'http://localhost:3000/unified-callback',
  responseType: 'code id_token',  // Default hybrid response type
  responseMode: 'fragment',
  clientAuthMethod: 'client_secret_basic',
  usePKCE: false
}
```

### Credential Migration

**Cross-Spec Migration**:
- If user switches spec version (e.g., `oauth2.0` → `oidc`):
  - Credentials from old spec are loaded
  - Missing fields are filled with defaults
  - Scope is adjusted if needed (`openid` added if missing)

**Cross-Flow Migration**:
- If user switches from hybrid to another flow:
  - Shared fields are preserved (environmentId, clientId, clientSecret)
  - Flow-specific fields are reset (responseType, responseMode)
  - Credentials saved to new flow key

---

## Token Persistence

### Saving Tokens

**Trigger**: Successful fragment parsing (Step 2) or code exchange (Step 3).

**Process**:
1. **From Fragment** (Step 2):
   - Fragment parsed from URL: `window.location.hash`
   - Tokens extracted: `access_token`, `id_token`
   - Token object created

2. **From Exchange** (Step 3):
   - Code exchange response received
   - Tokens extracted: `access_token`, `refresh_token`, `id_token`
   - Token object created

3. **Token Object**:
   ```typescript
   {
     accessToken: string,
     refreshToken?: string,  // If offline_access scope
     idToken?: string,        // OIDC only
     expiresIn: number,
     tokenType: 'Bearer',
     scope?: string,
     timestamp: Date.now()
   }
   ```

4. Serialized to JSON
5. Saved to `sessionStorage` under key: `v8u_tokens`
6. Fragment/query cleared from URL (security)

**Save Conditions**:
- ✅ Fragment parsing successful OR code exchange successful
- ✅ State validation passed
- ✅ Nonce validation passed (OIDC, if ID token in fragment)
- ✅ Access token present

**Storage Location**: `sessionStorage` (NOT `localStorage`)
- **Reason**: Security - tokens should not persist across sessions
- **Impact**: Tokens lost when browser tab/window closes

### Loading Tokens

**Trigger**: Step 2/3/4 mount, page refresh, restoration.

**Process**:
1. Check `sessionStorage` for key: `v8u_tokens`
2. Deserialize JSON
3. Validate token structure
4. Check token expiration (if timestamp present)
5. Update React state
6. Restore token display (Step 4)

**Load Priority**:
1. **Fragment** (if present in URL - highest priority)
2. **Query** (authorization code - for exchange)
3. **SessionStorage** (if no fragment/query)
4. **Component state** (if already in React state)

**Token Expiration Check**:
```typescript
const storedTimestamp = tokens.timestamp || 0;
const expiresIn = tokens.expiresIn || 3600;
const expirationTime = storedTimestamp + (expiresIn * 1000);
const isExpired = Date.now() > expirationTime;

if (isExpired) {
  // Clear expired tokens
  sessionStorage.removeItem('v8u_tokens');
  // Prompt user to re-authenticate
}
```

### Token Cleanup

**Automatic Cleanup**:
- Expired tokens are removed from sessionStorage
- Fragment is cleared after extraction
- Query parameters are cleared after extraction
- Tokens cleared on "Reset Flow" action

**Manual Cleanup**:
- User can manually clear sessionStorage
- Browser settings can clear sessionStorage
- "Reset Flow" button clears all token storage

---

## State Restoration

### Initial Load Restoration

**Scenario**: User navigates to `/v8u/unified/hybrid/{step}` or refreshes page.

**Restoration Process**:

1. **Route Detection**:
   - Parse URL route: `/v8u/unified/hybrid/{step}`
   - Extract step number from route
   - Extract spec version from query parameter

2. **Credential Restoration**:
   - Load credentials from `localStorage`
   - Key: `credentials_hybrid-v8u_{specVersion}`
   - Merge with defaults
   - Populate credentials form

3. **State Restoration**:
   - Load flow state from `sessionStorage`:
     - `v8u_hybrid_state`
     - `v8u_hybrid_authorizationUrl`
     - `v8u_hybrid_nonce` (OIDC only)
     - `v8u_hybrid_codeVerifier` (if PKCE enabled)
     - `v8u_hybrid_codeChallenge` (if PKCE enabled)

4. **Token Restoration**:
   - Check URL fragment first (highest priority)
   - Check URL query (authorization code)
   - If no fragment/query, load from `sessionStorage`
   - Key: `v8u_tokens`
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

2. **Query Detection**:
   - Check `window.location.search`
   - Detect `code` parameter
   - Parse query parameters

3. **State Validation**:
   - Extract `state` from fragment or query
   - Load stored state from `sessionStorage`
   - Compare: `fragment.state === stored.state` OR `query.state === stored.state`
   - If mismatch: Error, prevent extraction

4. **Nonce Validation** (OIDC, if ID token in fragment):
   - Extract `nonce` from ID token (decoded)
   - Load stored nonce from `sessionStorage`
   - Compare: `idToken.nonce === stored.nonce`
   - If mismatch: Error, prevent extraction

5. **Token Extraction**:
   - Extract `access_token` from fragment (if present)
   - Extract `id_token` from fragment (if present)
   - Extract `expires_in` from fragment
   - Create token object
   - Save to `sessionStorage`

6. **Code Extraction**:
   - Extract `code` from query string
   - Save to component state (not persisted)
   - Note: Code expires quickly, must exchange immediately

7. **Fragment/Query Cleanup**:
   - Clear fragment from URL: `window.location.hash = ''`
   - Clear query from URL: `window.location.search = ''`
   - Navigate to appropriate step (Step 3 if code, Step 4 if tokens)
   - Update URL route (remove fragment/query)

### Session Restoration

**Scenario**: User refreshes page or navigates back during flow.

**Restoration Priority**:

1. **URL Fragment** (if present):
   - Highest priority - tokens directly in URL
   - Parse immediately
   - Save to sessionStorage

2. **URL Query** (if present):
   - Authorization code in query string
   - Extract immediately
   - Use for token exchange

3. **SessionStorage Tokens**:
   - If no fragment, check sessionStorage
   - Restore tokens if valid
   - Check expiration before restoring

4. **SessionStorage State**:
   - Restore authorization URL
   - Restore state parameter
   - Restore nonce (OIDC)
   - Restore PKCE codes (if enabled)

5. **localStorage Credentials**:
   - Always restored on mount
   - Merge with current state
   - Validate required fields

**Restoration Failures**:
- **Missing Credentials**: Show error, prompt to configure
- **Expired Tokens**: Clear tokens, prompt to re-authenticate
- **State Mismatch**: Clear state, prompt to start over
- **Missing Fragment/Query**: If on Step 2, allow manual entry
- **Expired Authorization Code**: Clear code, prompt to re-authorize

---

## URL Parameter Handling

### Route Parameters

**Route Structure**:
```
/v8u/unified/{flowType}/{step}
```

**Flow Type**: `hybrid`  
**Step Values**: `0`, `1`, `2`, `3`, `4`, `5`

**Route Parameter Extraction**:
```typescript
// React Router
const { flowType, step } = useParams<{
  flowType: 'hybrid';
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

1. **Route Parameter** (`/v8u/unified/hybrid/{step}`):
   - Determines current step
   - Highest priority for step navigation

2. **Query Parameter** (`?spec=oidc`):
   - Determines spec version
   - Overrides default spec version

3. **Fragment** (`#access_token=...&id_token=...`):
   - Contains tokens (ephemeral)
   - Used for token extraction
   - Cleared after extraction

4. **Query** (`?code=...&state=...`):
   - Contains authorization code (ephemeral)
   - Used for code extraction
   - Cleared after extraction

---

## Fragment Handling

### Fragment Structure

**Format** (varies by `response_type`):

**`code id_token`**:
```
#id_token={idToken}
&token_type=Bearer
&expires_in=3600
&scope=openid profile email
&state={state}
&session_state={sessionState}  // OIDC only
```

**`code token`**:
```
#access_token={accessToken}
&token_type=Bearer
&expires_in=3600
&scope=openid profile email
&state={state}
&session_state={sessionState}  // OIDC only
```

**`code token id_token`**:
```
#access_token={accessToken}
&token_type=Bearer
&expires_in=3600
&id_token={idToken}
&scope=openid profile email
&state={state}
&session_state={sessionState}  // OIDC only
```

### Fragment Extraction

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
const storedState = sessionStorage.getItem('v8u_hybrid_state');

// Extract state from fragment
const fragmentState = params.get('state');

// Validate
if (fragmentState !== storedState) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

**Nonce Validation** (OIDC, if ID token in fragment):
```typescript
// Get stored nonce from sessionStorage
const storedNonce = sessionStorage.getItem('v8u_hybrid_nonce');

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
navigate('/v8u/unified/hybrid/4', { replace: true });
```

**Security Reasons**:
- ⚠️ **Prevent History Exposure**: Remove tokens from browser history
- ⚠️ **Prevent Logging**: Remove tokens from server logs
- ⚠️ **Prevent Sharing**: Remove tokens from shareable URLs

---

## Query Parameter Handling (Authorization Code)

### Query Structure

**Format**:
```
?code={authorizationCode}
&state={state}
```

### Query Extraction

```typescript
// Get query from URL
const query = window.location.search.substring(1);  // Remove '?'
const params = new URLSearchParams(query);

// Extract authorization code
const code = params.get('code');
const state = params.get('state');
```

### Query Validation

**State Validation**:
```typescript
// Get stored state from sessionStorage
const storedState = sessionStorage.getItem('v8u_hybrid_state');

// Extract state from query
const queryState = params.get('state');

// Validate
if (queryState !== storedState) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

### Query Cleanup

**After Extraction**:
```typescript
// Clear query from URL
window.history.replaceState(
  null,
  '',
  window.location.pathname + window.location.hash
);

// Or navigate to clean URL
navigate('/v8u/unified/hybrid/3', { replace: true });
```

**Security Reasons**:
- ⚠️ **Prevent History Exposure**: Remove authorization code from browser history
- ⚠️ **Prevent Logging**: Remove code from server logs
- ⚠️ **Prevent Sharing**: Remove code from shareable URLs

---

## Reset Semantics

### Reset Flow Action

**Trigger**: User clicks "Reset Flow" button or starts new flow.

**What Gets Reset**:
- ✅ **Component State**: All React state cleared
- ✅ **SessionStorage Tokens**: Tokens removed
- ✅ **SessionStorage State**: Flow state removed
- ✅ **URL Fragment**: Fragment cleared (if present)
- ✅ **URL Query**: Query cleared (if present)
- ❌ **localStorage Credentials**: **NOT cleared** (preserved)

**Reset Process**:
```typescript
// Clear sessionStorage
sessionStorage.removeItem('v8u_tokens');
sessionStorage.removeItem('v8u_hybrid_state');
sessionStorage.removeItem('v8u_hybrid_authorizationUrl');
sessionStorage.removeItem('v8u_hybrid_nonce');
sessionStorage.removeItem('v8u_hybrid_codeVerifier');
sessionStorage.removeItem('v8u_hybrid_codeChallenge');

// Clear React state
setFlowState({
  authorizationUrl: undefined,
  state: undefined,
  nonce: undefined,
  codeVerifier: undefined,
  codeChallenge: undefined,
  authorizationCode: undefined,
  tokens: undefined,
  userInfo: undefined
});

// Clear URL fragment and query
window.history.replaceState(null, '', window.location.pathname);

// Navigate to Step 0
navigate('/v8u/unified/hybrid/0');
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
localStorage.removeItem(`credentials_hybrid-v8u_${specVersion}`);

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
- ❌ **PKCE Codes**: Isolated per tab (sessionStorage)

**Conflict Resolution**:
- If user opens multiple tabs with same flow:
  - Each tab has independent token state
  - Last tab to extract fragment/query wins
  - Credentials are shared (last save wins)

### Session Expiration

**Token Expiration**:
```typescript
const storedTokens = JSON.parse(sessionStorage.getItem('v8u_tokens'));
const expirationTime = storedTokens.timestamp + (storedTokens.expiresIn * 1000);
const isExpired = Date.now() > expirationTime;

if (isExpired) {
  // Clear expired tokens
  sessionStorage.removeItem('v8u_tokens');
  // Show expiration message
  // Prompt to re-authenticate
}
```

**Authorization Code Expiration**:
- Authorization codes expire quickly (typically 10 minutes)
- Codes are single-use (cannot be reused)
- If code expires, user must re-authorize

**Session Expiration Handling**:
- **Automatic Cleanup**: Expired tokens cleared on load
- **User Notification**: Show expiration message
- **Re-authentication**: Prompt to start flow again

---

## Data Flow

### Complete Flow Sequence

```
1. User Configures Credentials (Step 0)
   ↓
   [localStorage] credentials_hybrid-v8u_{spec}
   
2. Generate Authorization URL (Step 1)
   ↓
   [sessionStorage] v8u_hybrid_state
   [sessionStorage] v8u_hybrid_authorizationUrl
   [sessionStorage] v8u_hybrid_nonce (OIDC)
   [sessionStorage] v8u_hybrid_codeVerifier (if PKCE)
   
3. User Authorizes (PingOne)
   ↓
   [URL Query] ?code=...&state=...
   [URL Fragment] #access_token=...&id_token=...&state=... (if response_type includes tokens)
   
4. Handle Callback (Step 2)
   ↓
   [Component State] authorizationCode (from query)
   [sessionStorage] v8u_tokens (from fragment, if present)
   [URL] Fragment/query cleared
   
5. Exchange Code for Tokens (Step 3, if needed)
   ↓
   [sessionStorage] v8u_tokens (updated with exchange tokens)
   
6. Display Tokens (Step 4)
   ↓
   [Read] v8u_tokens from sessionStorage
   
7. Introspection & UserInfo (Step 5)
   ↓
   [Read] v8u_tokens from sessionStorage
```

### Restoration Flow

```
Page Load / Navigation
   ↓
[Route Detection] /v8u/unified/hybrid/{step}
[Query Detection] ?spec={specVersion}
   ↓
[localStorage] Load credentials
   ↓
[sessionStorage] Load flow state (state, authorizationUrl, nonce, PKCE codes)
   ↓
[Check URL Fragment] If present, parse immediately
[Check URL Query] If present, parse immediately
   ↓
[sessionStorage] Load tokens (if no fragment/query)
   ↓
[Restore Step] Navigate to step from route
   ↓
[Restore UI] Populate forms, display tokens
```

### Error Recovery Flow

```
Error Detected (e.g., state mismatch, expired code)
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
2. ✅ **Clear fragments/queries immediately**: Remove tokens/codes from URL after extraction
3. ✅ **Check token expiration**: Validate before using tokens
4. ✅ **Use sessionStorage for tokens**: Never store tokens in localStorage
5. ✅ **Handle restoration gracefully**: Support page refresh and navigation
6. ✅ **Handle authorization code expiration**: Codes expire quickly, must exchange immediately

### For Users

1. ✅ **Complete flow in one session**: Avoid closing tabs mid-flow
2. ✅ **Don't share URLs with fragments/queries**: Tokens/codes are in the URL
3. ✅ **Re-authenticate when expired**: Tokens expire after 1 hour
4. ✅ **Use browser back/forward carefully**: May lose fragment/query state
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

**Problem**: "State mismatch" error on callback parsing.

**Causes**:
- State not persisted to sessionStorage
- State cleared before callback parsing
- User navigated away and back

**Solutions**:
- Start flow from Step 1 again
- Complete authorization in one session
- Don't manually edit URLs

### Authorization Code Expired

**Problem**: "Invalid grant" error during code exchange.

**Causes**:
- Authorization code expired (typically 10 minutes)
- Code already used (single-use)
- Code not extracted in time

**Solutions**:
- Exchange code immediately after receiving
- Don't wait too long between Step 2 and Step 3
- Re-authorize if code expired

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
- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

