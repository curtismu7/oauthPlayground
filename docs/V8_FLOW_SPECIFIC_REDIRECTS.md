# V8 Flow-Specific Redirect URIs - Complete

## Overview

Implemented flow-specific redirect URIs so each OAuth/OIDC flow redirects to its own unique callback endpoint, preventing conflicts and enabling proper flow handling.

## Problem Solved

Previously, all flows used generic `/callback` endpoints. This caused issues:
- ❌ Couldn't distinguish which flow initiated the callback
- ❌ All flows shared the same redirect URI
- ❌ Difficult to handle flow-specific logic
- ❌ Potential security issues with shared endpoints

## Solution

Created `RedirectUriServiceV8` that generates flow-specific redirect URIs automatically.

## Flow-Specific Redirect URIs

### OAuth 2.0 Flows
| Flow | Redirect URI | Post-Logout URI |
|------|--------------|-----------------|
| Authorization Code | `/callback/oauth-authorization-code` | `/callback/logout` |
| Implicit | `/callback/implicit` | `/callback/logout` |
| PKCE | `/callback/pkce` | `/callback/logout` |
| Client Credentials | N/A (no redirect) | N/A |
| Device Code | N/A (no redirect) | N/A |
| ROPC | N/A (no redirect) | N/A |

### OIDC Flows
| Flow | Redirect URI | Post-Logout URI |
|------|--------------|-----------------|
| Authorization Code | `/callback/oidc-authorization-code` | `/callback/logout` |
| Implicit | `/callback/oidc-implicit` | `/callback/logout` |
| Hybrid | `/callback/oidc-hybrid` | `/callback/logout` |

## Features

### Auto-Population
When a flow loads, redirect URIs are automatically set if not already configured:
```typescript
// On component mount
useEffect(() => {
  if (!credentials.redirectUri) {
    const uri = RedirectUriServiceV8.getRedirectUriForFlow(flowKey);
    onChange({ ...credentials, redirectUri: uri });
  }
}, [flowKey]);
```

### Flow-Specific Placeholders
Input fields show the correct placeholder for each flow:
```typescript
placeholder={RedirectUriServiceV8.getRedirectUriPlaceholder(flowKey)}
// Shows: https://localhost:3000/callback/oauth-authorization-code
```

### Dynamic Base URL
Service detects the current application URL:
```typescript
const baseUrl = `${window.location.protocol}//${window.location.host}`;
// Production: https://oauth-playground.example.com
// Local: http://localhost:3000
```

## Service API

### RedirectUriServiceV8

**getRedirectUriForFlow(flowKey: string): string**
- Returns flow-specific redirect URI
- Example: `getRedirectUriForFlow('oauth-authz-v8')` → `http://localhost:3000/callback/oauth-authorization-code`

**getPostLogoutRedirectUriForFlow(flowKey: string): string**
- Returns flow-specific post-logout redirect URI
- Example: `getPostLogoutRedirectUriForFlow('oidc-authz-v8')` → `http://localhost:3000/callback/logout`

**getRedirectUriPlaceholder(flowKey: string): string**
- Returns placeholder text for input field
- Used in form placeholders

**getPostLogoutRedirectUriPlaceholder(flowKey: string): string**
- Returns placeholder text for post-logout input field
- Used in form placeholders

**initializeRedirectUris(flowKey, currentRedirectUri?, currentPostLogoutUri?): object**
- Initializes both URIs for a flow
- Preserves existing values if already set
- Returns: `{ redirectUri, postLogoutRedirectUri }`

## Worker Token Configuration

### OAuth Expert Analysis

Worker tokens use the **Client Credentials grant** (OAuth 2.0 RFC 6749 Section 4.4), which is a server-to-server flow.

**Key Characteristics:**
- ✅ No user interaction required
- ✅ No redirect URIs needed (direct token endpoint call)
- ✅ No authorization code exchange
- ✅ Client authenticates directly with credentials

**Required Configuration:**
1. **Environment ID** - PingOne environment UUID
2. **Client ID** - Application client identifier
3. **Client Secret** - Application secret (confidential client)
4. **Region** - PingOne region (US, EU, AP, CA)
5. **Token Endpoint Auth Method** - How client authenticates (default: `client_secret_post`)

**Optional Configuration:**
- **Scopes** - Requested permissions (though worker tokens primarily use roles)
- **Save Credentials** - Store for reuse

**NOT Needed for Worker Tokens:**
- ❌ Redirect URI (no user redirect)
- ❌ Post-Logout Redirect URI (no user session)
- ❌ Login Hint (no user login)
- ❌ Response Type (direct token request)
- ❌ PKCE (no authorization code)

### Current Implementation

The Worker Token Modal V8 correctly implements all necessary options:
- ✅ Environment ID input
- ✅ Client ID input
- ✅ Client Secret input (with visibility toggle)
- ✅ Region selector (US, EU, AP, CA)
- ✅ Save credentials checkbox
- ✅ Educational information
- ✅ Token endpoint auth method (hardcoded to `client_secret_post`)

**Token Request:**
```http
POST https://auth.pingone.{region}/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={clientId}
&client_secret={clientSecret}
```

## Benefits

✅ **Flow Isolation** - Each flow has its own callback endpoint  
✅ **Better Security** - Prevents cross-flow attacks  
✅ **Easier Debugging** - Know which flow initiated callback  
✅ **Auto-Configuration** - URIs set automatically  
✅ **Production Ready** - Works with any domain  
✅ **User Friendly** - Clear placeholders show expected format  

## Usage Example

### In a Flow Component
```typescript
import { RedirectUriServiceV8 } from '@/v8/services/redirectUriServiceV8';

// Get redirect URI for current flow
const redirectUri = RedirectUriServiceV8.getRedirectUriForFlow('oauth-authz-v8');
// Returns: http://localhost:3000/callback/oauth-authorization-code

// Initialize both URIs
const { redirectUri, postLogoutRedirectUri } = 
  RedirectUriServiceV8.initializeRedirectUris('oidc-authz-v8');
```

### In PingOne Configuration
When configuring your application in PingOne, add these redirect URIs:

**For OAuth Authorization Code Flow:**
```
http://localhost:3000/callback/oauth-authorization-code
https://your-domain.com/callback/oauth-authorization-code
```

**For OIDC Authorization Code Flow:**
```
http://localhost:3000/callback/oidc-authorization-code
https://your-domain.com/callback/oidc-authorization-code
```

**For Logout:**
```
http://localhost:3000/callback/logout
https://your-domain.com/callback/logout
```

## Implementation Details

### Auto-Initialization
The CredentialsFormV8 automatically initializes redirect URIs when:
1. Component mounts
2. Flow key changes
3. Redirect URI is empty

### Preservation
If a user has manually entered a redirect URI, it's preserved and not overwritten.

### Logging
All redirect URI operations are logged with the module tag `[🔗 REDIRECT-URI-V8]` for debugging.

---

**Version**: 8.0.0  
**Status**: Complete  
**Last Updated**: 2024-11-16
