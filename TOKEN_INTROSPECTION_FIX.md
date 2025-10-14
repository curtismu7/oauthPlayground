# Token Introspection 400 Error - Missing introspection_endpoint

## Problem

User getting 400 Bad Request when trying to introspect tokens:

```
POST https://localhost:3000/api/introspect-token 400 (Bad Request)
```

## Root Cause

**Backend requires `introspection_endpoint` parameter but frontend is not sending it.**

### Backend Requirement (server.js:560)

```javascript
if (!token || !client_id || !introspection_endpoint) {
    return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: token, client_id, introspection_endpoint',
    });
}
```

### Frontend Call (OAuthAuthorizationCodeFlowV6.tsx:1204)

```typescript
const result = await TokenIntrospectionService.introspectToken(
    request,
    'authorization-code',
    '/api/introspect-token'
    // ❌ Missing 4th parameter: introspectionEndpoint
);
```

### Function Signature

```typescript
static async introspectToken(
    request: IntrospectionRequest,
    flowType: IntrospectionApiCallData['flowType'],
    baseUrl: string = '/api/introspect-token',
    introspectionEndpoint?: string  // <-- THIS IS MISSING
)
```

## Solution

Pass the introspection endpoint from OIDC discovery data as the 4th parameter.

### Fix for OAuthAuthorizationCodeFlowV6.tsx

**Before** ❌:
```typescript
const result = await TokenIntrospectionService.introspectToken(
    request,
    'authorization-code',
    '/api/introspect-token'
);
```

**After** ✅:
```typescript
const result = await TokenIntrospectionService.introspectToken(
    request,
    'authorization-code',
    '/api/introspect-token',
    controller.discoveryData?.introspection_endpoint  // Add this!
);
```

## Where to Get introspection_endpoint

The introspection endpoint comes from OIDC Discovery:

```typescript
// From OIDC Discovery response
{
    "issuer": "https://auth.pingone.com/...",
    "authorization_endpoint": "https://auth.pingone.com/.../as/authorize",
    "token_endpoint": "https://auth.pingone.com/.../as/token",
    "introspection_endpoint": "https://auth.pingone.com/.../as/introspect",  // <-- THIS ONE
    // ... other endpoints
}
```

## Files to Fix

1. ✅ `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` (line 1204)
2. ⚠️ Check other flows that use token introspection

## Testing

After fix:
1. Complete OAuth Authorization Code Flow
2. Get access token
3. Click "Introspect Token"
4. Should see: ✅ Success (200 OK) with token metadata

## Related Files

- `src/services/tokenIntrospectionService.ts` - Frontend service
- `server.js` (line 537-663) - Backend endpoint
- `src/hooks/useAuthorizationCodeFlowController.ts` - Has discoveryData

## Error Details

**Backend logs would show**:
```
[Introspect Token] Received request: {
  hasToken: true,
  hasClientId: true,
  hasClientSecret: true,
  hasIntrospectionEndpoint: false,  // ❌ FALSE!
  ...
}
```

**Backend responds with**:
```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameters: token, client_id, introspection_endpoint"
}
```

