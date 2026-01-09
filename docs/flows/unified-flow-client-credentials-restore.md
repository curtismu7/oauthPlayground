# Unified Flow - Client Credentials Flow Restore & Persistence Documentation

**Version:** 1.1  
**Last Updated:** 2025-01-27  
**Flow Type:** Client Credentials Flow (OAuth 2.0 / OAuth 2.1)  
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

---

## Overview

The Client Credentials Flow uses multiple storage mechanisms to persist credentials and tokens across page refreshes, navigation, and browser sessions. This document details what is stored where, when, and how it's restored.

### Storage Strategy

The Client Credentials Flow uses a **hierarchical persistence strategy**:

1. **Credentials**: `localStorage` (persists across sessions)
2. **Tokens**: `sessionStorage` (persists only for browser session)
3. **URL State**: Route parameters (ephemeral)
4. **Component State**: React state (in-memory, lost on unmount)

### Key Principles

- ✅ **Credentials persist** across browser sessions (localStorage)
- ✅ **Tokens persist** only for the browser session (sessionStorage)
- ✅ **URL state** is used for navigation and restoration
- ⚠️ **No user context**: Tokens represent the application, not a user
- ⚠️ **No refresh tokens**: Must re-request token when expired

---

## Storage Locations

### 1. Credentials Storage (`localStorage`)

**Purpose**: Persist OAuth credentials across browser sessions.

**Storage Key Format**:
```
credentials_client-credentials-v8u_{specVersion}
```

**Examples**:
- `credentials_client-credentials-v8u_oauth2.0`
- `credentials_client-credentials-v8u_oauth2.1`

**Stored Data Structure**:
```typescript
{
  environmentId: string;
  clientId: string;
  clientSecret: string;  // Required for client credentials flow
  scopes: string;
  clientAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
  audience?: string;  // Optional, for resource-based scopes
  resource?: string;  // Optional, for token audience
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
v8u_client_credentials_tokens
```

**Stored Data Structure**:
```typescript
{
  accessToken: string;
  expiresIn: number;  // seconds
  tokenType: 'Bearer';
  scope?: string;
  timestamp: number;  // Unix timestamp when stored
}
```

**Storage Triggers**:
- After successful token request (Step 1)
- When tokens are received from token endpoint
- After state restoration from URL

**Retrieval**:
- On Step 1 mount (to restore display)
- On Step 2 mount (to restore display)
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
- ⚠️ **No refresh tokens**: Client credentials flow doesn't issue refresh tokens

---

### 3. URL State (Route Parameters)

**Purpose**: Enable deep linking, restoration, and navigation.

**Route Format**:
```
/v8u/unified/client-credentials/{step}
```

**Examples**:
- `/v8u/unified/client-credentials/0` - Step 0 (Configure)
- `/v8u/unified/client-credentials/1` - Step 1 (Request Token)
- `/v8u/unified/client-credentials/2` - Step 2 (Display Tokens)
- `/v8u/unified/client-credentials/3` - Step 3 (Introspection)

**Query Parameters**:
- `spec`: Spec version (`oauth2.0` or `oauth2.1`)
  - Example: `/v8u/unified/client-credentials/0?spec=oauth2.1`
- `step`: Step number (redundant with route)
  - Example: `/v8u/unified/client-credentials/1?step=1`

**URL State Restoration**:
- **Step Detection**: Route path determines current step
- **Spec Detection**: Query parameter determines spec version
- **Flow Detection**: Route path indicates `client-credentials` flow

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
5. Saved to `localStorage` under key: `credentials_client-credentials-v8u_{specVersion}`

**Save Conditions**:
- ✅ Field value changed (debounced)
- ✅ Form validation passed (all required fields present)
- ✅ Flow type is `client-credentials`
- ✅ Spec version is valid (`oauth2.0` or `oauth2.1`)

**Save Exclusions**:
- ❌ Private keys (not stored, used only for signing JWT assertions)
- ❌ Tokens (stored separately in sessionStorage)

### Loading Credentials

**Trigger**: Component mount, spec version change, flow type change.

**Process**:
1. Determine storage key: `credentials_client-credentials-v8u_{specVersion}`
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
  scopes: 'api:read api:write',  // Example scopes
  clientAuthMethod: 'client_secret_basic',
  audience: undefined,
  resource: undefined
}
```

### Credential Migration

**Cross-Spec Migration**:
- If user switches spec version (e.g., `oauth2.0` → `oauth2.1`):
  - Credentials from old spec are loaded
  - Missing fields are filled with defaults
  - No scope adjustments needed (no `openid` requirement)

**Cross-Flow Migration**:
- If user switches from client credentials to another flow:
  - Shared fields are preserved (environmentId, clientId, clientSecret)
  - Flow-specific fields are reset (responseType, redirectUri, etc.)
  - Credentials saved to new flow key

---

## Token Persistence

### Saving Tokens

**Trigger**: Successful token request (Step 1).

**Process**:
1. Token request sent to token endpoint
2. Token response received
3. Token object created:
   ```typescript
   {
     accessToken: tokens.access_token,
     expiresIn: tokens.expires_in,
     tokenType: tokens.token_type || 'Bearer',
     scope: tokens.scope,
     timestamp: Date.now()
   }
   ```
4. Serialized to JSON
5. Saved to `sessionStorage` under key: `v8u_client_credentials_tokens`
6. Component state updated

**Save Conditions**:
- ✅ Token request successful
- ✅ Access token present in response
- ✅ Token response valid

**Storage Location**: `sessionStorage` (NOT `localStorage`)
- **Reason**: Security - tokens should not persist across sessions
- **Impact**: Tokens lost when browser tab/window closes

**Note**: Client credentials flow does NOT return:
- ❌ Refresh tokens (must re-request when expired)
- ❌ ID tokens (no user identity)

### Loading Tokens

**Trigger**: Step 1/2 mount, page refresh, restoration.

**Process**:
1. Check `sessionStorage` for key: `v8u_client_credentials_tokens`
2. Deserialize JSON
3. Validate token structure
4. Check token expiration (if timestamp present)
5. Update React state
6. Restore token display (Step 2)

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
  sessionStorage.removeItem('v8u_client_credentials_tokens');
  // Prompt user to re-request token
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

**Scenario**: User navigates to `/v8u/unified/client-credentials/{step}` or refreshes page.

**Restoration Process**:

1. **Route Detection**:
   - Parse URL route: `/v8u/unified/client-credentials/{step}`
   - Extract step number from route
   - Extract spec version from query parameter

2. **Credential Restoration**:
   - Load credentials from `localStorage`
   - Key: `credentials_client-credentials-v8u_{specVersion}`
   - Merge with defaults
   - Populate credentials form

3. **Token Restoration**:
   - Load tokens from `sessionStorage`
   - Key: `v8u_client_credentials_tokens`
   - Validate token expiration
   - Restore token display if valid

4. **Step Restoration**:
   - Navigate to step from URL route
   - Mark completed steps based on available data
   - Update stepper UI

### Session Restoration

**Scenario**: User refreshes page or navigates back during flow.

**Restoration Priority**:

1. **SessionStorage Tokens**:
   - Check sessionStorage for tokens
   - Restore tokens if valid
   - Check expiration before restoring

2. **localStorage Credentials**:
   - Always restored on mount
   - Merge with current state
   - Validate required fields

**Restoration Failures**:
- **Missing Credentials**: Show error, prompt to configure
- **Expired Tokens**: Clear tokens, prompt to re-request
- **Invalid Token Format**: Clear tokens, prompt to re-request

---

## URL Parameter Handling

### Route Parameters

**Route Structure**:
```
/v8u/unified/{flowType}/{step}
```

**Flow Type**: `client-credentials`  
**Step Values**: `0`, `1`, `2`, `3`

**Route Parameter Extraction**:
```typescript
// React Router
const { flowType, step } = useParams<{
  flowType: 'client-credentials';
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
- `spec`: Spec version (`oauth2.0` or `oauth2.1`)
  - Example: `?spec=oauth2.1`
  - Default: `oauth2.0` (if not specified)

**Query Parameter Handling**:
```typescript
const [searchParams] = useSearchParams();
const specVersion = (searchParams.get('spec') || 'oauth2.0') as SpecVersion;
```

**Query Parameter Updates**:
- Spec version selector updates query parameter
- URL changes when user selects spec version
- Browser back/forward preserves query parameters

### URL State Priority

1. **Route Parameter** (`/v8u/unified/client-credentials/{step}`):
   - Determines current step
   - Highest priority for step navigation

2. **Query Parameter** (`?spec=oauth2.1`):
   - Determines spec version
   - Overrides default spec version

---

## Reset Semantics

### Reset Flow Action

**Trigger**: User clicks "Reset Flow" button or starts new flow.

**What Gets Reset**:
- ✅ **Component State**: All React state cleared
- ✅ **SessionStorage Tokens**: Tokens removed
- ✅ **URL State**: Reset to default route
- ❌ **localStorage Credentials**: **NOT cleared** (preserved)

**Reset Process**:
```typescript
// Clear sessionStorage
sessionStorage.removeItem('v8u_client_credentials_tokens');

// Clear React state
setFlowState({
  tokens: undefined
});

// Navigate to Step 0
navigate('/v8u/unified/client-credentials/0');
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
localStorage.removeItem(`credentials_client-credentials-v8u_${specVersion}`);

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

**Conflict Resolution**:
- If user opens multiple tabs with same flow:
  - Each tab has independent token state
  - Last tab to request token wins
  - Credentials are shared (last save wins)

### Session Expiration

**Token Expiration**:
```typescript
const storedTokens = JSON.parse(sessionStorage.getItem('v8u_client_credentials_tokens'));
const expirationTime = storedTokens.timestamp + (storedTokens.expiresIn * 1000);
const isExpired = Date.now() > expirationTime;

if (isExpired) {
  // Clear expired tokens
  sessionStorage.removeItem('v8u_client_credentials_tokens');
  // Show expiration message
  // Prompt to re-request token
}
```

**Session Expiration Handling**:
- **Automatic Cleanup**: Expired tokens cleared on load
- **User Notification**: Show expiration message
- **Re-request**: Prompt to request new token

**Note**: Client credentials flow does NOT have refresh tokens, so tokens must be re-requested when expired.

---

## Postman Collection Downloads

### Overview

The documentation page (final step) provides a **Postman Collection** download feature that generates a complete Postman collection JSON file with all API calls from the flow.

### Collection Format

The generated Postman collection follows the [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template) format:

- **URL Format**: `{{authPath}}/{{envID}}/as/token`
- **Variables**: Pre-configured with values from credentials
- **Headers**: Automatically set (Content-Type, Authorization)
- **Request Bodies**: Pre-filled with example data

### Variables Included

| Variable | Value | Type | Source |
|----------|-------|------|--------|
| `authPath` | `https://auth.pingone.com` | `string` | Default (includes protocol) |
| `envID` | Environment ID | `string` | From credentials |
| `client_id` | Client ID | `string` | From credentials |
| `client_secret` | Client Secret | `secret` | From credentials |
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
-   `client_secret`: Pre-filled from `clientSecret` in credentials (marked as secret type)
-   `workerToken`: Empty (user fills in)
-   `redirect_uri`: Default value `http://localhost:3000/oauth-callback`
-   `scopes`: Default value `openid profile email`
-   `state`: Empty (generated per request)
-   `authorization_code`: Empty (filled after authorization)
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
   [localStorage] credentials_client-credentials-v8u_{spec}
   
2. Request Token (Step 1)
   ↓
   [API] POST /api/token-exchange (grant_type=client_credentials)
   ↓
   [sessionStorage] v8u_client_credentials_tokens
   
3. Display Tokens (Step 2)
   ↓
   [Read] v8u_client_credentials_tokens from sessionStorage
   
4. Introspection (Step 3)
   ↓
   [Read] v8u_client_credentials_tokens from sessionStorage
```

### Restoration Flow

```
Page Load / Navigation
   ↓
[Route Detection] /v8u/unified/client-credentials/{step}
[Query Detection] ?spec={specVersion}
   ↓
[localStorage] Load credentials
   ↓
[sessionStorage] Load tokens (if available)
   ↓
[Restore Step] Navigate to step from route
   ↓
[Restore UI] Populate forms, display tokens
```

### Error Recovery Flow

```
Error Detected (e.g., invalid credentials, expired token)
   ↓
[Clear Invalid State] sessionStorage.removeItem(...)
   ↓
[Show Error Message] User notification
   ↓
[Offer Recovery Options]
   - Retry current step
   - Start from Step 0
   - Reset entire flow
   ↓
[User Action] → Recovery path
```

---

## Best Practices

### For Developers

1. ✅ **Cache tokens**: Store tokens in memory/cache until expiration
2. ✅ **Monitor expiration**: Track token expiration and re-request before expiry
3. ✅ **Use appropriate scopes**: Request only the scopes you need
4. ✅ **Secure storage**: Never expose client secrets in client-side code
5. ✅ **Use JWT auth methods**: More secure than basic auth (no secret in headers/body)
6. ✅ **Handle restoration gracefully**: Support page refresh and navigation

### For Users

1. ✅ **Complete flow in one session**: Avoid closing tabs mid-flow
2. ✅ **Re-request when expired**: Tokens expire after 1 hour
3. ✅ **Use browser back/forward carefully**: May lose token state
4. ✅ **Clear browser data periodically**: For security
5. ✅ **Keep client secret secure**: Never share or expose client secret

---

## Troubleshooting

### Tokens Not Restored After Refresh

**Problem**: Tokens lost after page refresh.

**Causes**:
- SessionStorage cleared (tab closed/reopened)
- Token expiration
- Browser session ended

**Solutions**:
- Complete flow in one session
- Re-request token if expired
- Check browser sessionStorage settings

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

### Token Expiration

**Problem**: Token expired and needs to be re-requested.

**Causes**:
- Token lifetime expired (typically 1 hour)
- No refresh tokens available (client credentials flow limitation)

**Solutions**:
- Re-request token using Step 1
- Cache token and re-request proactively (before expiration)
- Monitor token expiration time

---

## References

- [MDN - Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React Router - URL Parameters](https://reactrouter.com/en/main/route/route)
- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 6749 Section 4.4 - Client Credentials Grant](https://tools.ietf.org/html/rfc6749#section-4.4)

