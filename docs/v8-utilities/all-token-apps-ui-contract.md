# V8 Utility - All Token Apps UI Contract

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Utility Type:** Token Management & Clearing Utility  
**Components:** `TokenManagement.tsx`, `clearAllTokens()` utility

## Overview

The All Token Apps utility refers to the comprehensive token management and clearing functionality available in the OAuth Playground. This includes the Token Management page for viewing and analyzing tokens, and the `clearAllTokens()` utility function for clearing all OAuth/OIDC tokens from browser storage.

### Key Characteristics

- ✅ **Token Management**: View, analyze, and manage OAuth/OIDC tokens
- ✅ **Token Clearing**: Clear all tokens from browser storage
- ✅ **Token History**: Track token history across flows
- ✅ **Token Analysis**: Analyze token security and validity
- ✅ **Multiple Storage Locations**: Clears tokens from localStorage and sessionStorage

## Token Management Page

### Page Structure

The Token Management page consists of **4 main sections**:

1. **Token Input Section**: Enter or load tokens
2. **Token Analysis Section**: Analyze token security and validity
3. **Token History Section**: View token history
4. **Token Actions Section**: Clear, revoke, or manage tokens

## Section-by-Section Contract

### Section 1: Token Input

**Component:** Token input form  
**Purpose:** Enter or load OAuth/OIDC tokens for analysis

#### Input Methods

| Method | Description | Source |
|--------|-------------|--------|
| **Manual Entry** | Paste token directly | User clipboard |
| **Load from Storage** | Load from browser storage | `localStorage` / `sessionStorage` |
| **Load from History** | Load from token history | Token history storage |
| **Auto-load from Flow** | Automatically loaded from flow | Flow navigation state |

#### Token Input Field

**Field Type**: `textarea` (multi-line)

**Validation**:
- Format: JWT (JSON Web Token)
- Structure: `header.payload.signature`
- Required: Yes (for analysis)

**Auto-detection**:
- Detects token type (access token, ID token, refresh token)
- Validates JWT structure
- Decodes token header and payload

#### Token Source Tracking

**Source Information**:
- Flow name (e.g., "Authorization Code Flow")
- Timestamp
- Description

**Display**:
- Token source badge
- Source description
- Timestamp

---

### Section 2: Token Analysis

**Component:** Token analysis display  
**Purpose:** Analyze token security, validity, and structure

#### Analysis Features

| Feature | Description | Output |
|---------|-------------|--------|
| **Token Decoding** | Decode JWT header and payload | JSON display |
| **Security Score** | Calculate security score (0-100) | Score display |
| **Expiration Status** | Check if token is expired | Status indicator |
| **Critical Issues** | Identify security issues | Issue list |
| **Validation Errors** | Check token validity | Error list |
| **Token Type Detection** | Detect token type | Type badge |

#### Display Fields

| Field | Display | Format | Notes |
|-------|---------|--------|-------|
| Token Header | ✅ | JSON | Decoded JWT header |
| Token Payload | ✅ | JSON | Decoded JWT payload |
| Security Score | ✅ | Number (0-100) | Color-coded (red/yellow/green) |
| Expiration Status | ✅ | Status | Valid/Expired/Expiring Soon |
| Critical Issues | ✅ | List | Security issues found |
| Validation Errors | ✅ | List | Token validation errors |
| Token Type | ✅ | Badge | Access Token, ID Token, etc. |

#### Analysis Results

**Security Score Breakdown**:
- **90-100**: Excellent (green)
- **70-89**: Good (yellow)
- **50-69**: Fair (orange)
- **0-49**: Poor (red)

**Critical Issues Examples**:
- No signature algorithm (`alg: "none"`)
- Expired token
- Weak nonce
- Missing required claims
- Invalid issuer

---

### Section 3: Token History

**Component:** Token history list  
**Purpose:** Track tokens from previous flows

#### History Entry Structure

```typescript
interface TokenHistoryEntry {
  id: string;
  flowName: string;
  timestamp: number;
  timestampFormatted: string;
  tokens: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
  };
}
```

#### History Features

| Feature | Description | Action |
|---------|-------------|--------|
| **View History** | Display all token history entries | List display |
| **Load from History** | Load token from history | Load action |
| **Remove Entry** | Remove specific history entry | Delete action |
| **Clear History** | Clear all history entries | Clear action |

#### History Display

**Display Fields**:
- Flow name
- Timestamp
- Token type (access token, ID token, etc.)
- Actions (load, remove)

**History Actions**:
- **Load Token**: Load token into analysis section
- **Remove Entry**: Remove specific history entry
- **Clear All**: Clear entire history

---

### Section 4: Token Actions

**Component:** Token action buttons  
**Purpose:** Perform actions on tokens

#### Available Actions

| Action | Description | Result |
|--------|-------------|--------|
| **Clear Token** | Clear current token from input | Input cleared |
| **Clear History** | Clear all token history | History cleared |
| **Revoke Token** | Revoke token (if supported) | Token revoked |
| **Clear All Tokens** | Clear all tokens from storage | All tokens cleared |

#### Clear All Tokens Action

**Function**: `clearAllTokens()`

**What Gets Cleared**:
- All OAuth/OIDC tokens from `localStorage`
- All OAuth/OIDC tokens from `sessionStorage`
- Token cache entries
- Flow-specific token storage
- Token history (optional)

**Storage Keys Cleared**:
- `oauth_tokens`
- `client_credentials_tokens`
- `device_flow_tokens`
- `auth_tokens`
- `pingone_tokens`
- `access_token`
- `id_token`
- `refresh_token`
- `token_to_analyze`
- `token_type`
- `flow_source`
- `tokenManagementFlowContext`
- `pingone_secure_tokens`
- Flow-specific tokens (V5, V6, etc.)
- Token cache entries (`token_cache_*`)

**Result**:
```typescript
interface TokenCleanupResult {
  success: boolean;
  clearedCount: number;
  errors: string[];
}
```

---

## Token Clearing Utility

### `clearAllTokens()` Function

**Location**: `src/utils/tokenCleaner.ts`

**Purpose**: Comprehensive token cleanup utility

**Function Signature**:
```typescript
export function clearAllTokens(): TokenCleanupResult
```

**Process**:
1. **Define Token Keys**: List of all known token storage keys
2. **Clear localStorage**: Remove all token keys from localStorage
3. **Clear sessionStorage**: Remove all token keys from sessionStorage
4. **Clear Token Cache**: Remove all `token_cache_*` entries
5. **Clear Flow Data**: Remove flow-specific session storage
6. **Return Results**: Return success status and cleared count

**Token Keys Cleared**:

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

**Flow-Specific Tokens (V5)**:
- `worker_token_v5_step_manager-step`
- `authorization_code_v5-tokens`
- `hybrid_flow_v5-tokens`
- `implicit_flow_v5-tokens`

**Flow-Specific Tokens (V6)**:
- `oauth-authorization-code-v6-tokens`
- `oidc-authorization-code-v6-tokens`
- `worker-token-v6-tokens`
- `client-credentials-v6-tokens`
- `implicit-flow-v6-tokens`
- `device-flow-v6-tokens`
- `par-flow-v6-tokens`
- `rar-flow-v6-tokens`
- `redirectless-flow-v6-tokens`
- `jwt-bearer-v6-tokens`
- `saml-bearer-v6-tokens`

**Generic Flow Tokens**:
- `current-flow-tokens`
- `flow-tokens`
- `tokens`

**CIBA Flow Tokens**:
- `ciba_flow_tokens`
- `ciba_flow_config`
- `ciba_auth_request`

**Session Flags**:
- `oauth-implicit-v6-flow-active`
- `oidc-implicit-v6-flow-active`
- `implicit-v6-active`
- `flow-active`

**Token Cache Entries**:
- All keys starting with `token_cache_`

**Flow-Specific Session Storage**:
- All keys containing `token`, `flow`, or `oauth`

---

## State Management

### Token Management State

```typescript
interface TokenManagementState {
  tokenString: string;
  jwtHeader: string;
  jwtPayload: string;
  tokenStatus: 'none' | 'valid' | 'expired';
  tokenSource: {
    source: string;
    description: string;
    timestamp: string;
  } | null;
  tokenHistory: TokenHistoryEntry[];
  introspectionResults: TokenIntrospectionResult | null;
  currentAnalysis: TokenAnalysis | null;
  error: string | null;
}
```

### Token History Storage

**Location**: `localStorage`

**Storage Key**: `token_history`

**Storage Structure**:
```typescript
Array<TokenHistoryEntry>
```

**Storage Triggers**:
- After successful token flow completion
- When token is loaded from flow

**Retrieval**:
- On component mount
- When history section is displayed

---

## URL Parameters

### Route

```
/token-management
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `token` | `string` | No | Pre-fill token from URL | `?token=eyJhbGc...` |
| `flow` | `string` | No | Set flow source | `?flow=oauth-authz` |

---

## Error Handling

### Token Input Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid JWT Format | Token not in JWT format | Enter valid JWT token |
| Missing Token | Token input empty | Enter token |
| Decode Error | Token cannot be decoded | Check token format |

### Token Analysis Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Analysis Failed | Token analysis error | Check token validity |
| Expired Token | Token has expired | Generate new token |
| Invalid Token | Token is invalid | Check token source |

### Token Clearing Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Clear Failed | Storage error | Check browser storage |
| Partial Clear | Some tokens not cleared | Check errors array |
| Storage Disabled | Browser storage disabled | Enable browser storage |

---

## API Endpoints Used

### Token Introspection (Optional)

**Endpoint**: `POST /api/pingone/introspect-token`

**Request Body**:
```json
{
  "token": "string",
  "environmentId": "string",
  "clientId": "string",
  "clientSecret": "string"
}
```

**Response**:
```json
{
  "active": true,
  "scope": "string",
  "client_id": "string",
  "username": "string",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## Testing Checklist

### Token Input Section

- [ ] Token input accepts JWT format
- [ ] Token auto-detection works
- [ ] Load from storage works
- [ ] Load from history works
- [ ] Token source tracking works

### Token Analysis Section

- [ ] Token decoding works correctly
- [ ] Security score calculation is accurate
- [ ] Expiration status detection works
- [ ] Critical issues are identified
- [ ] Validation errors are shown

### Token History Section

- [ ] History entries are displayed
- [ ] Load from history works
- [ ] Remove entry works
- [ ] Clear history works
- [ ] History persists across sessions

### Token Actions Section

- [ ] Clear token works
- [ ] Clear history works
- [ ] Clear all tokens works
- [ ] Revoke token works (if supported)
- [ ] Results are displayed correctly

---

## Implementation Notes

### Key Characteristics

1. **Comprehensive Clearing**: Clears all known token storage locations
2. **Multiple Storage Types**: Handles localStorage, sessionStorage, and cache
3. **Flow-Agnostic**: Works across all OAuth/OIDC flows
4. **Error Resilient**: Continues clearing even if some keys fail
5. **Result Reporting**: Returns detailed results with counts and errors

### Security Considerations

1. **Token Security**: Tokens are cleared from browser storage
2. **No Persistence**: Token clearing is immediate and permanent
3. **Error Handling**: Errors are captured but don't stop clearing
4. **User Confirmation**: Clear all tokens should require confirmation

### Best Practices

1. ✅ Clear tokens when switching environments
2. ✅ Clear tokens before sharing browser
3. ✅ Use token clearing for security cleanup
4. ✅ Review token history before clearing
5. ✅ Confirm before clearing all tokens

---

## References

- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [OAuth 2.0 Token Management](https://oauth.net/2/)
- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN - Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
