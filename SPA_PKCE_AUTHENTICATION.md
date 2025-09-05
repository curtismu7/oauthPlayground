# SPA PKCE Authentication - Critical Configuration Guide

## ⚠️ CRITICAL: This configuration MUST NOT be changed

This document explains the **correct** authentication method for SPA applications using PKCE with PingOne. Any deviation from this configuration will result in authentication failures.

## The Problem We Solved

PingOne was rejecting OAuth token requests with:
```
error: 'invalid_client'
error_description: 'Request denied: Unsupported authentication method'
```

## The Solution

For SPA applications with PKCE, PingOne requires:

### 1. Token Endpoint Authentication Method = None
- **NO** Authorization header should be sent
- **NO** client_secret should be included
- **NO** JWT assertions should be used

### 2. Request Format
```
POST https://auth.pingone.com/<ENV_ID>/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=<CLIENT_ID>&
code=<AUTH_CODE>&
redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fcallback&
code_verifier=<PKCE_VERIFIER>
```

### 3. Key Points
- `client_id` goes in the **request body**, not headers
- **No** `Authorization: Basic` header
- **No** `client_secret` parameter
- Content-Type must be `application/x-www-form-urlencoded`

## Backend Implementation

The backend server (`server.js`) has been configured with:

### Correct Logic
```javascript
if (!finalConfig.authenticationMethod || finalConfig.authenticationMethod === 'pkce') {
  // For SPA with PKCE, client_id goes in the body, no Authorization header
  tokenParams.append('client_id', finalConfig.clientId);
  console.log('🔄 [Backend] Using PKCE authentication (no client secret, client_id in body)');
}
```

### Safeguards Added
The backend now includes validation to prevent incorrect configurations:

```javascript
// WARNING: Do NOT use this for SPA applications with PKCE
if (finalConfig.applicationType === 'spa' && finalConfig.usePKCE) {
  console.error('❌ [Backend] ERROR: Cannot use Client Secret Basic with SPA + PKCE. Use no authentication method instead.');
  throw new Error('Invalid configuration: SPA applications with PKCE must use no authentication method');
}
```

## What NOT to Do

❌ **NEVER** use these authentication methods for SPA + PKCE:
- `client_secret_basic` (Authorization: Basic header)
- `client_secret_post` (client_secret in body)
- `client_secret_jwt` (JWT assertion)
- `private_key_jwt` (Private key JWT)

## Verification

The correct configuration is verified by:
1. **Log message**: `🔄 [Backend] Using PKCE authentication (no client secret, client_id in body)`
2. **Response status**: `200` from PingOne
3. **Success message**: `✅ [Backend] Token exchange successful`

## Testing

To verify the configuration is working:
```bash
# Test the backend directly
curl -s -X POST http://localhost:3001/api/token-exchange \
  -H "Content-Type: application/json" \
  -d '{"code": "test", "redirect_uri": "https://localhost:3000/callback", "code_verifier": "test", "config": {"environmentId": "test", "clientId": "test", "authenticationMethod": "pkce", "applicationType": "spa"}}'

# Should return validation error (not authentication error)
```

## Maintenance

- **DO NOT** modify the authentication logic without understanding this document
- **DO NOT** add Authorization headers for PKCE flows
- **DO NOT** include client_secret for SPA applications
- **ALWAYS** test with real PingOne credentials after any changes

## Related Files

- `server.js` - Backend authentication logic
- `src/contexts/NewAuthContext.tsx` - Frontend OAuth context
- `vite.config.ts` - Proxy configuration

---

**Last Updated**: September 4, 2025  
**Status**: ✅ Working correctly  
**Tested**: ✅ Verified with PingOne



