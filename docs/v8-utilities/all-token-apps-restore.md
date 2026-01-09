# V8 Utility - All Token Apps Restore & Persistence Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Utility Type:** Token Management & Clearing Utility  
**Components:** `TokenManagement.tsx`, `clearAllTokens()` utility

## Table of Contents

1. [Overview](#overview)
2. [Storage Locations](#storage-locations)
3. [State Persistence](#state-persistence)
4. [State Restoration](#state-restoration)
5. [Token History Persistence](#token-history-persistence)
6. [Token Clearing Behavior](#token-clearing-behavior)
7. [URL Parameter Handling](#url-parameter-handling)
8. [Reset Semantics](#reset-semantics)
9. [Session Management](#session-management)
10. [Data Flow](#data-flow)

---

## Overview

The All Token Apps utility (Token Management & Clearing) uses browser storage for token persistence and history tracking. This document details what is stored where, when, and how it's restored.

### Storage Strategy

The Token Management utility uses a **comprehensive persistence strategy**:

1. **Token Storage**: `localStorage` and `sessionStorage` (persists across sessions)
2. **Token History**: `localStorage` (persists across sessions)
3. **Flow Source**: `localStorage` and `sessionStorage` (persists across sessions)
4. **Token Analysis**: Component state (NOT persisted) - lost on refresh
5. **URL State**: Route parameters (ephemeral)

### Key Principles

- ✅ **Tokens persist** across browser sessions (localStorage/sessionStorage)
- ✅ **Token history persists** across browser sessions (localStorage)
- ✅ **Flow source persists** for token tracking (localStorage/sessionStorage)
- ❌ **Token analysis NOT persisted** (temporary, recalculated on load)
- ✅ **URL state** is used for navigation and pre-filling

---

## Storage Locations

### 1. Token Storage (`localStorage` and `sessionStorage`)

**Purpose**: Persist OAuth/OIDC tokens across browser sessions.

**Storage Keys** (multiple keys, examples):
- `oauth_tokens`
- `client_credentials_tokens`
- `device_flow_tokens`
- `auth_tokens`
- `pingone_tokens`
- `access_token`
- `id_token`
- `refresh_token`
- Flow-specific tokens (V5, V6, etc.)

**Stored Data Structure** (varies by token type):
```typescript
// OAuth tokens example
{
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}
```

**Storage Triggers**:
- After OAuth flow completion
- When tokens are obtained
- When tokens are refreshed

**Retrieval**:
- On component mount
- When "Load from Storage" is clicked
- Automatically from flow navigation

**Lifespan**: Persists until:
- User explicitly clears tokens
- User clears browser data
- Tokens expire (but remain in storage)
- `clearAllTokens()` is called

---

### 2. Token History Storage (`localStorage`)

**Purpose**: Track tokens from previous OAuth flows.

**Storage Key**: `token_history`

**Stored Data Structure**:
```typescript
Array<{
  id: string;
  flowName: string;
  timestamp: number;
  timestampFormatted: string;
  tokens: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
  };
}>
```

**Storage Triggers**:
- After successful OAuth flow completion
- When tokens are obtained from flows
- Automatically tracked by flow components

**Retrieval**:
- On component mount
- When history section is displayed
- When loading from history

**Lifespan**: Persists until:
- User explicitly clears history
- User clears browser data
- `clearAllTokens()` is called (if history clearing is enabled)

---

### 3. Flow Source Storage (`localStorage` and `sessionStorage`)

**Purpose**: Track which flow generated the current token.

**Storage Keys**:
- `flow_source` (localStorage)
- `tokenManagementFlowContext` (sessionStorage)

**Stored Data Structure**:
```typescript
// flow_source
string; // Flow name (e.g., "oauth-authorization-code-v7")

// tokenManagementFlowContext
{
  flow: string;
  timestamp: number;
  // ... other context
}
```

**Storage Triggers**:
- When navigating from OAuth flows to token management
- When tokens are loaded from flows

**Retrieval**:
- On component mount
- When determining token source
- When displaying token source information

**Lifespan**: Persists until:
- User navigates to new flow
- User clears browser data
- `clearAllTokens()` is called

---

### 4. Token Analysis (Component State - NOT Persisted)

**Purpose**: Temporary storage for token analysis results.

**Storage Location**: React component state (in-memory)

**Stored Data Structure**:
```typescript
{
  securityScore: number;
  expirationStatus: 'valid' | 'expired' | 'expiring_soon';
  criticalIssues: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
  }>;
  validationErrors: string[];
  decodedHeader: object;
  decodedPayload: object;
}
```

**Storage Triggers**:
- After token analysis completes
- When token is analyzed

**Retrieval**:
- From component state (not from storage)
- Lost on page refresh or navigation away

**Lifespan**: Persists only during:
- Current component mount
- Page session (until refresh)

**Why Not Persisted**:
- **Temporary**: Analysis is recalculated on token load
- **Dynamic**: Analysis depends on current token state
- **Best Practice**: Only persist tokens, not analysis results

---

### 5. URL State (Route Parameters)

**Purpose**: Enable navigation and pre-filling.

**Route Format**:
```
/token-management
```

**Query Parameters**:
- `token`: Pre-fill token from URL
  - Example: `/token-management?token=eyJhbGc...`
- `flow`: Set flow source
  - Example: `/token-management?flow=oauth-authz`

**URL State Restoration**:
- **Token**: Query parameter pre-fills token input field
- **Flow Source**: Query parameter sets flow source
- **Navigation**: Route updates when needed

---

## State Persistence

### Saving Tokens

**Trigger**: OAuth flow completion, token refresh, manual save.

**Process**:
1. Tokens obtained from OAuth flow
2. Tokens serialized to JSON
3. Saved to `localStorage` or `sessionStorage`
4. Storage key depends on flow type

**Save Conditions**:
- ✅ Tokens are valid
- ✅ Storage is available
- ✅ User has not disabled storage

**Save Locations**:
- **localStorage**: For tokens that should persist across sessions
- **sessionStorage**: For tokens that should only persist in current session

### Saving Token History

**Trigger**: OAuth flow completion, token obtained.

**Process**:
1. Token obtained from OAuth flow
2. History entry created with flow name and timestamp
3. Entry added to history array
4. History array saved to `localStorage` under key: `token_history`

**Save Conditions**:
- ✅ Token is valid
- ✅ Flow name is available
- ✅ Storage is available

**History Entry Structure**:
```typescript
{
  id: string; // Unique ID
  flowName: string; // OAuth flow name
  timestamp: number; // Unix timestamp
  timestampFormatted: string; // Human-readable timestamp
  tokens: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
  };
}
```

### Loading Tokens

**Trigger**: Component mount, "Load from Storage" click, flow navigation.

**Process**:
1. Check `localStorage` and `sessionStorage` for token keys
2. Load most recent token (if multiple available)
3. Deserialize JSON
4. Update component state
5. Begin token analysis

**Load Priority**:
1. **Query Parameter** (URL `token` parameter)
2. **Flow Navigation State** (from flow navigation)
3. **localStorage** (persisted tokens)
4. **sessionStorage** (session tokens)
5. **Token History** (if no other tokens available)

**Default Values**:
```typescript
{
  tokenString: '',
  jwtHeader: '',
  jwtPayload: '',
  tokenStatus: 'none',
  tokenSource: null
}
```

---

## State Restoration

### Initial Load Restoration

**Scenario**: User navigates to `/token-management` or refreshes page.

**Restoration Process**:

1. **Route Detection**:
   - Parse URL route: `/token-management`
   - Extract query parameters (`token`, `flow`)

2. **Token Restoration**:
   - Check query parameter for token
   - Check flow navigation state
   - Load from `localStorage` (if available)
   - Load from `sessionStorage` (if available)
   - Load from token history (if no other tokens)

3. **Token History Restoration**:
   - Load history from `localStorage`
   - Key: `token_history`
   - Display history entries

4. **Flow Source Restoration**:
   - Load flow source from `localStorage` or `sessionStorage`
   - Set token source information
   - Display flow name and timestamp

5. **Token Analysis Restoration**:
   - ❌ **NOT restored** (analysis is recalculated)
   - Token is analyzed on load
   - Analysis results are generated fresh

**Restoration Limitations**:
- ❌ **Token Analysis**: NOT restored (recalculated on load)
- ✅ **Tokens**: Restored from storage
- ✅ **Token History**: Restored from storage
- ✅ **Flow Source**: Restored from storage

### Session Restoration

**Scenario**: User refreshes page or navigates back during token management session.

**Restoration Priority**:

1. **Tokens**:
   - Always restored from localStorage/sessionStorage
   - Available across all sessions

2. **Token History**:
   - Restored from localStorage
   - Available across all sessions

3. **Flow Source**:
   - Restored from localStorage/sessionStorage
   - Available if not cleared

4. **Token Analysis**:
   - ❌ NOT restored (recalculated on load)
   - Analysis is performed automatically on token load

**Restoration Failures**:
- **Missing Tokens**: Show empty state, prompt to load tokens
- **Missing History**: Show empty history, prompt to complete flows
- **Missing Flow Source**: Show "Unknown Source" or no source

---

## Token History Persistence

### History Entry Lifecycle

**Creation**:
1. OAuth flow completes
2. Tokens obtained
3. History entry created
4. Entry added to history array
5. History saved to `localStorage`

**Retrieval**:
1. Component mounts
2. History loaded from `localStorage`
3. History entries displayed
4. User can load tokens from history

**Deletion**:
1. User clicks "Remove" on entry
2. Entry removed from history array
3. History saved to `localStorage`
4. UI updated

**Clear All**:
1. User clicks "Clear History"
2. History array cleared
3. `localStorage` cleared
4. UI updated

### History Storage Structure

**Storage Key**: `token_history`

**Storage Format**: JSON array

**Example**:
```json
[
  {
    "id": "entry-1",
    "flowName": "Authorization Code Flow",
    "timestamp": 1706380800000,
    "timestampFormatted": "2024-01-28 10:00:00",
    "tokens": {
      "access_token": "eyJhbGc...",
      "id_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc..."
    }
  }
]
```

---

## Token Clearing Behavior

### `clearAllTokens()` Function

**Purpose**: Comprehensive token cleanup utility.

**What Gets Cleared**:

**OAuth/OIDC Tokens**:
- `oauth_tokens`
- `client_credentials_tokens`
- `device_flow_tokens`
- `auth_tokens`
- `pingone_tokens`
- `access_token`
- `id_token`
- `refresh_token`

**Token Management**:
- `token_to_analyze`
- `token_type`
- `flow_source`
- `tokenManagementFlowContext`
- `pingone_secure_tokens`

**Flow-Specific Tokens**:
- All V5 flow tokens
- All V6 flow tokens
- All generic flow tokens
- CIBA flow tokens
- Session flags

**Token Cache**:
- All keys starting with `token_cache_`

**Flow-Specific Session Storage**:
- All keys containing `token`, `flow`, or `oauth`

**What's Preserved**:
- Application configuration
- Flow credentials (if stored separately)
- User preferences
- Other non-token data

### Clearing Process

**Trigger**: User clicks "Clear All Tokens" or function is called programmatically.

**Process**:
1. **Define Token Keys**: List of all known token storage keys
2. **Clear localStorage**: Remove all token keys from localStorage
3. **Clear sessionStorage**: Remove all token keys from sessionStorage
4. **Clear Token Cache**: Remove all `token_cache_*` entries
5. **Clear Flow Data**: Remove flow-specific session storage
6. **Return Results**: Return success status and cleared count

**Result Structure**:
```typescript
{
  success: boolean;
  clearedCount: number;
  errors: string[];
}
```

### Clearing Behavior

**Immediate Effects**:
- All tokens removed from browser storage
- Token input cleared
- Analysis section reset
- Token history cleared (if option selected)

**What's Lost**:
- All OAuth/OIDC tokens
- Token history (if cleared)
- Token analysis data
- Flow-specific token storage

**What's Preserved**:
- Application configuration
- Flow credentials (if stored separately)
- User preferences
- Other non-token data

---

## URL Parameter Handling

### Route Parameters

**Route Structure**:
```
/token-management
```

**No Route Parameters**: This utility uses a single route with no path parameters.

### Query Parameters

**Supported Parameters**:
- `token`: Pre-fill token from URL
  - Example: `/token-management?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Format: JWT token string
  - Default: None (if not specified)

- `flow`: Set flow source
  - Example: `/token-management?flow=oauth-authz`
  - Format: Flow name string
  - Default: None (if not specified)

**Query Parameter Handling**:
```typescript
const [searchParams] = useSearchParams();
const tokenParam = searchParams.get('token');
const flowParam = searchParams.get('flow');

if (tokenParam) {
  // Pre-fill token
  setTokenString(tokenParam);
  decodeJWT(tokenParam);
}

if (flowParam) {
  // Set flow source
  setFlowSourceState(flowParam);
}
```

**Query Parameter Updates**:
- Token can be pre-filled from query parameter
- Flow source can be set from query parameter
- Query parameters do not update automatically (read-only)

---

## Reset Semantics

### Reset Token Management Action

**Trigger**: User clicks "Clear Token" or starts new analysis.

**What Gets Reset**:
- ✅ **Token Input**: Cleared
- ✅ **Token Analysis**: Reset
- ✅ **JWT Header/Payload**: Cleared
- ✅ **Token Status**: Reset to 'none'
- ✅ **Token Source**: Cleared
- ❌ **Token History**: **NOT cleared** (preserved)
- ❌ **Stored Tokens**: **NOT cleared** (preserved in storage)

**Reset Process**:
```typescript
// Clear component state
setTokenString('');
setJwtHeader('');
setJwtPayload('');
setTokenStatus('none');
setTokenSource(null);
setCurrentAnalysis(null);

// Token history and stored tokens are preserved
```

### Clear History Action

**Trigger**: User clicks "Clear History".

**What Gets Cleared**:
- ✅ **Token History**: Cleared from localStorage
- ✅ **History Display**: Cleared from UI
- ❌ **Current Token**: **NOT cleared** (preserved)
- ❌ **Stored Tokens**: **NOT cleared** (preserved in storage)

**Clear Process**:
```typescript
// Clear history
clearTokenHistory();
setTokenHistory([]);

// Current token and stored tokens are preserved
```

### Clear All Tokens Action

**Trigger**: User clicks "Clear All Tokens" or `clearAllTokens()` is called.

**What Gets Cleared**:
- ✅ **All Tokens**: Cleared from localStorage and sessionStorage
- ✅ **Token Input**: Cleared
- ✅ **Token Analysis**: Reset
- ✅ **Token History**: Cleared (if option selected)
- ✅ **Flow Source**: Cleared

**Clear Process**:
```typescript
// Clear all tokens
const result = clearAllTokens();

// Clear component state
setTokenString('');
setJwtHeader('');
setJwtPayload('');
setTokenStatus('none');
setTokenSource(null);
setCurrentAnalysis(null);
setTokenHistory([]);
```

---

## Session Management

### Browser Session

**Session Boundaries**:
- **Start**: Browser tab/window opened
- **End**: Browser tab/window closed
- **Scope**: Per-tab (not shared across tabs)

**Component State Behavior**:
- ✅ Persists during tab lifetime
- ✅ Shared across same-tab navigations
- ❌ Lost on page refresh
- ❌ Lost on tab close
- ❌ Not shared across tabs

### Cross-Tab Behavior

**Isolation**:
- Each tab has its own component state
- Token analysis in Tab A is not visible in Tab B
- Tokens (localStorage) are shared across tabs
- Token history (localStorage) is shared across tabs

**Shared State**:
- ✅ **Tokens**: Shared via localStorage/sessionStorage
- ✅ **Token History**: Shared via localStorage
- ✅ **Flow Source**: Shared via localStorage/sessionStorage
- ❌ **Token Analysis**: Isolated per tab

**Conflict Resolution**:
- If user opens multiple tabs:
  - Each tab has independent token analysis
  - Tokens are shared (last save wins)
  - Token history is shared

### Session Expiration

**Component State Expiration**:
- Component state is lost on:
  - Page refresh
  - Tab close
  - Navigation away from token management

**Token Storage Expiration**:
- Tokens persist until:
  - User explicitly clears tokens
  - User clears browser data
  - Tokens expire (but remain in storage)
  - `clearAllTokens()` is called

**Token History Expiration**:
- Token history persists until:
  - User explicitly clears history
  - User clears browser data
  - `clearAllTokens()` is called (if history clearing is enabled)

---

## Data Flow

### Complete Token Management Sequence

```
1. OAuth Flow Completes
   ↓
   [Storage] Tokens saved to localStorage/sessionStorage
   [Storage] History entry added to token_history
   [Storage] Flow source saved
   
2. Navigate to Token Management
   ↓
   [Restore] Load tokens from storage
   [Restore] Load history from storage
   [Restore] Load flow source
   ↓
   [Analysis] Decode token
   [Analysis] Analyze token security
   [Analysis] Display results
   
3. User Actions
   ↓
   [Load from History] Load token from history
   [Clear Token] Clear current token
   [Clear History] Clear history
   [Clear All Tokens] Clear all tokens
```

### Restoration Flow

```
Page Load / Navigation
   ↓
[Route Detection] /token-management
[Query Detection] ?token={token}&flow={flow}
   ↓
[localStorage] Load tokens
[localStorage] Load history
[localStorage] Load flow source
   ↓
[Restore UI] Populate token input
[Restore UI] Display history
[Restore UI] Show flow source
   ↓
[Analysis] Decode and analyze token
```

### Token Clearing Flow

```
User Clicks "Clear All Tokens"
   ↓
[Confirmation] User confirms action
   ↓
[Clear] Remove all token keys from localStorage
[Clear] Remove all token keys from sessionStorage
[Clear] Remove token cache entries
[Clear] Remove flow-specific session storage
   ↓
[Result] Return success status and cleared count
[UI] Clear token input
[UI] Reset analysis section
[UI] Clear history (if option selected)
```

---

## Best Practices

### For Developers

1. ✅ **Persist Tokens**: Store tokens in localStorage for persistence
2. ✅ **Track History**: Automatically add tokens to history after flows
3. ✅ **Clear on Demand**: Provide clear all tokens functionality
4. ✅ **Handle Restoration**: Support token restoration on page load
5. ✅ **Validate Tokens**: Always validate tokens before analysis

### For Users

1. ✅ **Review Tokens**: Review tokens before clearing
2. ✅ **Use History**: Use token history to reload previous tokens
3. ✅ **Clear When Needed**: Clear tokens when switching environments
4. ✅ **Check Analysis**: Review token analysis for security issues
5. ✅ **Preserve History**: Don't clear history unless necessary

---

## Troubleshooting

### Tokens Lost After Refresh

**Problem**: Tokens lost after page refresh.

**Cause**: Tokens should persist, but may be lost if localStorage is disabled.

**Solution**: 
- Check browser localStorage settings
- Verify tokens are being saved (check browser DevTools)
- Re-obtain tokens from OAuth flows if needed

### Token History Lost After Refresh

**Problem**: Token history lost after page refresh.

**Cause**: History should persist, but may be lost if localStorage is disabled.

**Solution**:
- Check browser localStorage settings
- Verify history is being saved (check browser DevTools)
- History will be rebuilt as you complete OAuth flows

### Token Analysis Lost After Refresh

**Problem**: Token analysis lost after page refresh.

**Cause**: Analysis is not persisted (by design, recalculated on load).

**Solution**:
- This is expected behavior
- Token is automatically analyzed on load
- Analysis is recalculated from current token

### Clear All Tokens Not Working

**Problem**: Clear all tokens not clearing all tokens.

**Causes**:
- Some tokens may be in unexpected storage locations
- Browser storage may be disabled
- Some tokens may be in IndexedDB (not cleared)

**Solutions**:
- Check browser storage settings
- Verify `clearAllTokens()` function is working
- Check browser console for errors
- Manually clear browser data if needed

---

## References

- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN - Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [OAuth 2.0 Token Management](https://oauth.net/2/)
